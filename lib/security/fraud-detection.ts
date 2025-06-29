/**
 * Fraud Detection Service
 * Implements Stripe Radar rules and custom fraud detection
 */

import { kv } from '@vercel/kv';
import { logSecurityEvent } from '@/lib/security-config';

export interface FraudCheckResult {
  allow: boolean;
  riskScore: number; // 0-100
  reasons: string[];
  requiresManualReview: boolean;
  suggestedAction: 'allow' | 'block' | 'challenge' | 'review';
}

export interface TransactionContext {
  userId: string;
  email: string;
  amount: number;
  currency: string;
  ipAddress?: string;
  userAgent?: string;
  shippingAddress?: {
    country: string;
    city: string;
    postalCode: string;
  };
  billingAddress?: {
    country: string;
    city: string;
    postalCode: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  paymentMethod?: {
    type: string;
    last4?: string;
    brand?: string;
  };
}

export class FraudDetectionService {
  // Risk thresholds
  private static readonly RISK_THRESHOLDS = {
    LOW: 20,
    MEDIUM: 50,
    HIGH: 70,
    CRITICAL: 85,
  };

  // Velocity limits
  private static readonly VELOCITY_LIMITS = {
    HOURLY_TRANSACTIONS: 5,
    DAILY_TRANSACTIONS: 20,
    HOURLY_AMOUNT: 200000, // £2000
    DAILY_AMOUNT: 500000, // £5000
    UNIQUE_CARDS_PER_DAY: 3,
  };

  /**
   * Perform comprehensive fraud check
   */
  static async checkTransaction(context: TransactionContext): Promise<FraudCheckResult> {
    const checks = await Promise.all([
      this.checkVelocity(context),
      this.checkGeographicRisk(context),
      this.checkPaymentPatterns(context),
      this.checkDeviceFingerprint(context),
      this.checkEmailRisk(context),
      this.checkAddressMismatch(context),
    ]);

    // Aggregate results
    const totalRiskScore = Math.min(100, checks.reduce((sum, check) => sum + check.score, 0));
    const allReasons = checks.flatMap(check => check.reasons);

    // Determine action based on risk score
    let suggestedAction: FraudCheckResult['suggestedAction'] = 'allow';
    let requiresManualReview = false;

    if (totalRiskScore >= this.RISK_THRESHOLDS.CRITICAL) {
      suggestedAction = 'block';
    } else if (totalRiskScore >= this.RISK_THRESHOLDS.HIGH) {
      suggestedAction = 'review';
      requiresManualReview = true;
    } else if (totalRiskScore >= this.RISK_THRESHOLDS.MEDIUM) {
      suggestedAction = 'challenge'; // Require 3DS
    }

    // Log fraud check result
    logSecurityEvent('Fraud check completed', {
      userId: context.userId,
      riskScore: totalRiskScore,
      suggestedAction,
      reasons: allReasons,
      amount: context.amount,
    });

    return {
      allow: suggestedAction !== 'block',
      riskScore: totalRiskScore,
      reasons: allReasons,
      requiresManualReview,
      suggestedAction,
    };
  }

  /**
   * Check transaction velocity
   */
  private static async checkVelocity(
    context: TransactionContext
  ): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    const hourKey = `velocity:hour:${context.userId}:${new Date().getHours()}`;
    const dayKey = `velocity:day:${context.userId}:${new Date().toISOString().split('T')[0]}`;

    try {
      // Get current counts
      const [hourlyCount, dailyCount, hourlyAmount, dailyAmount] = await Promise.all([
        kv.get<number>(hourKey).then(v => v ?? 0),
        kv.get<number>(dayKey).then(v => v ?? 0),
        kv.get<number>(`${hourKey}:amount`).then(v => v ?? 0),
        kv.get<number>(`${dayKey}:amount`).then(v => v ?? 0),
      ]);

      // Check transaction count limits
      if (hourlyCount >= this.VELOCITY_LIMITS.HOURLY_TRANSACTIONS) {
        reasons.push(`High hourly transaction count: ${hourlyCount}`);
        score += 25;
      }

      if (dailyCount >= this.VELOCITY_LIMITS.DAILY_TRANSACTIONS) {
        reasons.push(`High daily transaction count: ${dailyCount}`);
        score += 30;
      }

      // Check amount limits
      if (hourlyAmount + context.amount > this.VELOCITY_LIMITS.HOURLY_AMOUNT) {
        reasons.push(`Hourly amount limit exceeded`);
        score += 20;
      }

      if (dailyAmount + context.amount > this.VELOCITY_LIMITS.DAILY_AMOUNT) {
        reasons.push(`Daily amount limit exceeded`);
        score += 25;
      }

      // Update velocity counters (with TTL)
      await Promise.all([
        kv.incr(hourKey),
        kv.expire(hourKey, 3600), // 1 hour TTL
        kv.incr(dayKey),
        kv.expire(dayKey, 86400), // 24 hour TTL
        kv.incrby(`${hourKey}:amount`, context.amount),
        kv.expire(`${hourKey}:amount`, 3600),
        kv.incrby(`${dayKey}:amount`, context.amount),
        kv.expire(`${dayKey}:amount`, 86400),
      ]);
    } catch (error) {
      logSecurityEvent('Velocity check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: context.userId,
      });
    }

    return { score, reasons };
  }

  /**
   * Check geographic risk factors
   */
  private static async checkGeographicRisk(
    context: TransactionContext
  ): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    // High-risk countries (simplified list)
    const HIGH_RISK_COUNTRIES = ['NG', 'PK', 'VN', 'ID', 'BD', 'GH'];
    const VERY_HIGH_RISK_COUNTRIES = ['KP', 'IR', 'SY', 'CU'];

    // Check shipping country
    if (context.shippingAddress?.country) {
      if (VERY_HIGH_RISK_COUNTRIES.includes(context.shippingAddress.country)) {
        reasons.push(`Very high risk shipping country: ${context.shippingAddress.country}`);
        score += 40;
      } else if (HIGH_RISK_COUNTRIES.includes(context.shippingAddress.country)) {
        reasons.push(`High risk shipping country: ${context.shippingAddress.country}`);
        score += 20;
      }
    }

    // Check billing country
    if (context.billingAddress?.country) {
      if (VERY_HIGH_RISK_COUNTRIES.includes(context.billingAddress.country)) {
        reasons.push(`Very high risk billing country: ${context.billingAddress.country}`);
        score += 40;
      } else if (HIGH_RISK_COUNTRIES.includes(context.billingAddress.country)) {
        reasons.push(`High risk billing country: ${context.billingAddress.country}`);
        score += 20;
      }
    }

    // Check for country mismatch
    if (
      context.shippingAddress?.country &&
      context.billingAddress?.country &&
      context.shippingAddress.country !== context.billingAddress.country
    ) {
      reasons.push('Shipping and billing country mismatch');
      score += 15;
    }

    // Check for impossible delivery (e.g., digital goods to sanctioned countries)
    if (context.shippingAddress?.country) {
      const lastOrderCountryKey = `last_country:${context.userId}`;
      const lastCountry = await kv.get<string>(lastOrderCountryKey);

      if (lastCountry && lastCountry !== context.shippingAddress.country) {
        // Rapid country changes can indicate account takeover
        const countryChangeKey = `country_changes:${context.userId}:${new Date().toISOString().split('T')[0]}`;
        const changes = await kv.incr(countryChangeKey);
        await kv.expire(countryChangeKey, 86400);

        if (changes > 2) {
          reasons.push('Multiple shipping country changes detected');
          score += 25;
        }
      }

      await kv.setex(lastOrderCountryKey, 2592000, context.shippingAddress.country); // 30 days
    }

    return { score, reasons };
  }

  /**
   * Check payment patterns for anomalies
   */
  private static async checkPaymentPatterns(
    context: TransactionContext
  ): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    // Check for testing card numbers (in production)
    if (context.paymentMethod?.last4) {
      const testCardPatterns = ['4242', '4000', '5555'];
      if (testCardPatterns.includes(context.paymentMethod.last4)) {
        reasons.push('Test card number detected');
        score += 30;
      }
    }

    // Check for unusual amount patterns
    const suspiciousAmounts = [
      99999, // Just under limits
      100000,
      111111, // Repeated digits
      123456,
    ];

    if (suspiciousAmounts.includes(context.amount)) {
      reasons.push('Suspicious amount pattern');
      score += 10;
    }

    // Check purchase history for anomalies
    const avgPurchaseKey = `avg_purchase:${context.userId}`;
    const avgPurchase = await kv.get<number>(avgPurchaseKey);

    if (avgPurchase && context.amount > avgPurchase * 5) {
      reasons.push('Purchase amount significantly higher than average');
      score += 20;
    }

    // Update average (simplified moving average)
    if (avgPurchase) {
      const newAvg = (avgPurchase * 0.8) + (context.amount * 0.2);
      await kv.setex(avgPurchaseKey, 2592000, newAvg); // 30 days
    } else {
      await kv.setex(avgPurchaseKey, 2592000, context.amount);
    }

    // Check for rapid succession of high-value orders
    if (context.amount > 50000) { // £500+
      const highValueKey = `high_value:${context.userId}:${new Date().toISOString().split('T')[0]}`;
      const highValueCount = await kv.incr(highValueKey);
      await kv.expire(highValueKey, 86400);

      if (highValueCount > 2) {
        reasons.push('Multiple high-value transactions in short period');
        score += 30;
      }
    }

    return { score, reasons };
  }

  /**
   * Check device fingerprint
   */
  private static async checkDeviceFingerprint(
    context: TransactionContext
  ): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    if (!context.userAgent) {
      reasons.push('Missing user agent');
      score += 15;
      return { score, reasons };
    }

    // Check for bot patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /headless/i,
      /phantom/i,
      /selenium/i,
    ];

    const userAgent = context.userAgent;
    if (userAgent) {
      if (botPatterns.some(pattern => pattern.test(userAgent))) {
        reasons.push('Bot or automated browser detected');
        score += 35;
      }
    }

    // Check for Tor or VPN (simplified - in production use proper detection)
    if (context.ipAddress) {
      // Check for common VPN/proxy patterns
      const vpnPatterns = ['vpn', 'proxy', 'tor'];
      if (vpnPatterns.some(pattern => context.ipAddress!.toLowerCase().includes(pattern))) {
        reasons.push('VPN or proxy detected');
        score += 20;
      }

      // Track device changes
      const deviceKey = `device:${context.userId}`;
      const lastDevice = await kv.get<string>(deviceKey);
      const currentDevice = `${context.userAgent}-${context.ipAddress}`;

      if (lastDevice && lastDevice !== currentDevice) {
        const deviceChangeKey = `device_changes:${context.userId}:${new Date().toISOString().split('T')[0]}`;
        const changes = await kv.incr(deviceChangeKey);
        await kv.expire(deviceChangeKey, 86400);

        if (changes > 3) {
          reasons.push('Multiple device changes detected');
          score += 20;
        }
      }

      await kv.setex(deviceKey, 604800, currentDevice); // 7 days
    }

    return { score, reasons };
  }

  /**
   * Check email risk indicators
   */
  private static async checkEmailRisk(
    context: TransactionContext
  ): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    const email = context.email.toLowerCase();

    // Check for disposable email domains
    const disposableEmailDomains = [
      'tempmail.com',
      'throwaway.email',
      'guerrillamail.com',
      'mailinator.com',
      '10minutemail.com',
      'trashmail.com',
    ];

    const emailParts = email.split('@');
    const emailDomain = emailParts[1];
    if (emailDomain && disposableEmailDomains.includes(emailDomain)) {
      reasons.push('Disposable email address detected');
      score += 30;
    }

    // Check for suspicious email patterns
    const emailUser = emailParts[0];
    
    // Random character sequences
    if (emailUser && /^[a-z0-9]{20,}$/.test(emailUser)) {
      reasons.push('Suspicious email pattern');
      score += 15;
    }

    // Check email age (if new email for this user)
    const emailKey = `email:${context.userId}`;
    const knownEmail = await kv.get<string>(emailKey);

    if (knownEmail && knownEmail !== email) {
      reasons.push('Email address changed recently');
      score += 10;
    }

    await kv.setex(emailKey, 2592000, email); // 30 days

    return { score, reasons };
  }

  /**
   * Check for address mismatches
   */
  private static async checkAddressMismatch(
    context: TransactionContext
  ): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    if (!context.shippingAddress || !context.billingAddress) {
      return { score, reasons };
    }

    // Check for PO Box on high-value orders
    if (context.amount > 50000) { // £500+
      const poBoxPattern = /p\.?o\.?\s*box/i;
      if (poBoxPattern.test(context.shippingAddress.city)) {
        reasons.push('PO Box shipping on high-value order');
        score += 20;
      }
    }

    // Check for freight forwarder addresses (simplified)
    const freightForwarders = ['freight', 'forwarder', 'reshipping'];
    const addressString = `${context.shippingAddress.city} ${context.shippingAddress.postalCode}`.toLowerCase();
    
    if (freightForwarders.some(term => addressString.includes(term))) {
      reasons.push('Possible freight forwarder address');
      score += 25;
    }

    // Check ZIP/postal code format
    if (context.shippingAddress.country === 'US') {
      if (!/^\d{5}(-\d{4})?$/.test(context.shippingAddress.postalCode)) {
        reasons.push('Invalid US ZIP code format');
        score += 15;
      }
    } else if (context.shippingAddress.country === 'GB') {
      if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(context.shippingAddress.postalCode)) {
        reasons.push('Invalid UK postcode format');
        score += 15;
      }
    }

    return { score, reasons };
  }

  /**
   * Create custom Stripe Radar rules
   */
  static async setupRadarRules() {
    try {
      // Note: These would be created in Stripe Dashboard
      // This is documentation of recommended rules

      const recommendedRules = [
        {
          name: 'Block high-risk countries',
          condition: 'country in ("NG", "PK", "VN") and amount > 10000',
          action: 'block',
        },
        {
          name: 'Review large transactions',
          condition: 'amount > 100000',
          action: 'review',
        },
        {
          name: 'Block suspicious card testing',
          condition: 'tried_amount_count > 3 in 1 hour',
          action: 'block',
        },
        {
          name: 'Review shipping/billing mismatch on high amounts',
          condition: 'shipping_country != billing_country and amount > 50000',
          action: 'review',
        },
        {
          name: 'Block known test cards in production',
          condition: 'card_number in ("4242424242424242", "4000000000000000") and livemode = true',
          action: 'block',
        },
        {
          name: 'Require 3DS for risky transactions',
          condition: 'risk_score > 65 or amount > 25000',
          action: 'request_3ds',
        },
      ];

      logSecurityEvent('Radar rules documentation', { rules: recommendedRules });
      
      return recommendedRules;
    } catch (error) {
      logSecurityEvent('Failed to document Radar rules', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}