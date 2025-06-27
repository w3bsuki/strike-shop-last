/**
 * Secure Refund Processing Module
 * PCI-compliant refund handling with fraud prevention
 */

import { stripe } from '@/lib/stripe-server';
import { kv } from '@vercel/kv';
import { logSecurityEvent } from '@/lib/security-config';
import { PaymentMonitoringService } from './payment-monitoring';
import Stripe from 'stripe';

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // If not provided, full refund
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
  metadata?: Record<string, string>;
  userId: string;
  adminUserId?: string; // For admin-initiated refunds
}

export interface RefundValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiresApproval: boolean;
  riskScore: number;
}

export class SecureRefundService {
  private static readonly REFUND_LIMITS = {
    MAX_REFUND_PERCENTAGE: 100, // Maximum 100% refund
    MAX_REFUND_AGE_DAYS: 180, // Maximum 180 days old
    MAX_REFUNDS_PER_ORDER: 3, // Maximum 3 partial refunds per order
    HIGH_VALUE_THRESHOLD: 50000, // £500+ requires approval
    SUSPICIOUS_REFUND_VELOCITY: 5, // 5 refunds in 24 hours
  };

  /**
   * Process a secure refund
   */
  static async processRefund(request: RefundRequest): Promise<{
    success: boolean;
    refund?: Stripe.Refund;
    error?: string;
    validationResult: RefundValidationResult;
  }> {
    try {
      // Validate refund request
      const validationResult = await this.validateRefund(request);

      if (!validationResult.isValid) {
        logSecurityEvent('Refund validation failed', {
          paymentIntentId: request.paymentIntentId,
          errors: validationResult.errors,
          userId: request.userId,
        });

        return {
          success: false,
          error: validationResult.errors.join(', '),
          validationResult,
        };
      }

      // Check if approval is required
      if (validationResult.requiresApproval && !request.adminUserId) {
        logSecurityEvent('Refund requires approval', {
          paymentIntentId: request.paymentIntentId,
          amount: request.amount,
          reason: request.reason,
          userId: request.userId,
        });

        // In production, create approval request
        await this.createApprovalRequest(request, validationResult);

        return {
          success: false,
          error: 'Refund requires manual approval',
          validationResult,
        };
      }

      // Retrieve payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(request.paymentIntentId);

      // Security check - verify ownership
      if (paymentIntent.metadata.userId !== request.userId && !request.adminUserId) {
        logSecurityEvent('Refund authorization failed', {
          paymentIntentId: request.paymentIntentId,
          requestUserId: request.userId,
          paymentUserId: paymentIntent.metadata.userId,
        });

        return {
          success: false,
          error: 'Unauthorized refund request',
          validationResult,
        };
      }

      // Get the charge ID
      const chargeId = paymentIntent.latest_charge as string;
      if (!chargeId) {
        return {
          success: false,
          error: 'No charge found for this payment',
          validationResult,
        };
      }

      // Create refund with enhanced metadata
      const refund = await stripe.refunds.create({
        charge: chargeId,
        amount: request.amount ? Math.round(request.amount) : undefined, // Convert to cents if provided
        reason: request.reason as Stripe.RefundCreateParams.Reason,
        metadata: {
          ...request.metadata,
          userId: request.userId,
          adminUserId: request.adminUserId || '',
          requestedAt: new Date().toISOString(),
          riskScore: validationResult.riskScore.toString(),
          paymentIntentId: request.paymentIntentId,
        },
      });

      // Log refund event
      await PaymentMonitoringService.logEvent({
        id: refund.id,
        type: 'charge.refunded',
        timestamp: new Date().toISOString(),
        userId: request.userId,
        amount: refund.amount,
        currency: refund.currency,
        metadata: {
          reason: request.reason,
          chargeId,
          adminInitiated: !!request.adminUserId,
          riskScore: validationResult.riskScore,
        },
      });

      // Track refund for velocity checks
      await this.trackRefund(request.userId, refund.amount);

      logSecurityEvent('Refund processed successfully', {
        refundId: refund.id,
        paymentIntentId: request.paymentIntentId,
        amount: refund.amount,
        reason: request.reason,
        userId: request.userId,
        adminUserId: request.adminUserId,
      });

      return {
        success: true,
        refund,
        validationResult,
      };
    } catch (error) {
      logSecurityEvent('Refund processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId: request.paymentIntentId,
        userId: request.userId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed',
        validationResult: {
          isValid: false,
          errors: ['Refund processing failed'],
          warnings: [],
          requiresApproval: false,
          riskScore: 0,
        },
      };
    }
  }

  /**
   * Validate refund request
   */
  private static async validateRefund(request: RefundRequest): Promise<RefundValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;
    let requiresApproval = false;

    try {
      // Retrieve payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(request.paymentIntentId);

      // Check payment status
      if (paymentIntent.status !== 'succeeded') {
        errors.push(`Payment not successful: ${paymentIntent.status}`);
        return { isValid: false, errors, warnings, requiresApproval, riskScore };
      }

      // Check payment age
      const paymentAge = Date.now() - (paymentIntent.created * 1000);
      const maxAge = this.REFUND_LIMITS.MAX_REFUND_AGE_DAYS * 24 * 60 * 60 * 1000;

      if (paymentAge > maxAge) {
        errors.push(`Payment too old for refund: ${Math.floor(paymentAge / (24 * 60 * 60 * 1000))} days`);
        riskScore += 30;
      }

      // Check refund amount
      if (request.amount) {
        const totalRefunded = await this.getTotalRefunded(paymentIntent.id);
        const remainingAmount = paymentIntent.amount - totalRefunded;

        if (request.amount > remainingAmount) {
          errors.push(`Refund amount exceeds remaining balance: ${remainingAmount}`);
        }

        if (request.amount > paymentIntent.amount) {
          errors.push('Refund amount exceeds original payment');
          riskScore += 50;
        }

        // High-value refund check
        if (request.amount >= this.REFUND_LIMITS.HIGH_VALUE_THRESHOLD) {
          warnings.push('High-value refund requires review');
          requiresApproval = true;
          riskScore += 20;
        }
      }

      // Check refund velocity
      const refundVelocity = await this.checkRefundVelocity(request.userId);
      if (refundVelocity >= this.REFUND_LIMITS.SUSPICIOUS_REFUND_VELOCITY) {
        warnings.push(`High refund velocity: ${refundVelocity} refunds in 24 hours`);
        riskScore += 30;
        requiresApproval = true;
      }

      // Check refund count for this payment
      const refundCount = await this.getRefundCount(paymentIntent.id);
      if (refundCount >= this.REFUND_LIMITS.MAX_REFUNDS_PER_ORDER) {
        errors.push(`Maximum refunds reached for this payment: ${refundCount}`);
      }

      // Check for fraud indicators
      if (request.reason === 'fraudulent') {
        requiresApproval = true;
        riskScore += 40;
        warnings.push('Fraud-related refund requires investigation');
      }

      // Check user history
      const userRisk = await this.assessUserRefundRisk(request.userId);
      riskScore += userRisk;

      if (userRisk > 30) {
        warnings.push('User has elevated refund risk profile');
        requiresApproval = true;
      }

    } catch (error) {
      errors.push('Failed to validate refund request');
      logSecurityEvent('Refund validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId: request.paymentIntentId,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiresApproval,
      riskScore: Math.min(100, riskScore),
    };
  }

  /**
   * Get total amount already refunded for a payment
   */
  private static async getTotalRefunded(paymentIntentId: string): Promise<number> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['charges.data.refunds'],
      });

      let totalRefunded = 0;
      if (paymentIntent.charges && paymentIntent.charges.data) {
        for (const charge of paymentIntent.charges.data) {
          if (charge.refunds && charge.refunds.data) {
            totalRefunded += charge.refunds.data.reduce((sum, refund) => sum + refund.amount, 0);
          }
        }
      }

      return totalRefunded;
    } catch (error) {
      logSecurityEvent('Failed to get total refunded', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId,
      });
      return 0;
    }
  }

  /**
   * Get refund count for a payment
   */
  private static async getRefundCount(paymentIntentId: string): Promise<number> {
    try {
      const countKey = `refund_count:${paymentIntentId}`;
      const count = await kv.get<number>(countKey);
      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check user refund velocity
   */
  private static async checkRefundVelocity(userId: string): Promise<number> {
    try {
      const velocityKey = `refund_velocity:${userId}:${new Date().toISOString().split('T')[0]}`;
      const velocity = await kv.get<number>(velocityKey);
      return velocity || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Track refund for velocity checks
   */
  private static async trackRefund(userId: string, amount: number): Promise<void> {
    try {
      const dayKey = `refund_velocity:${userId}:${new Date().toISOString().split('T')[0]}`;
      const monthKey = `refund_history:${userId}:${new Date().toISOString().substring(0, 7)}`;

      await Promise.all([
        kv.incr(dayKey),
        kv.expire(dayKey, 86400), // 24 hour TTL
        kv.hincrby(monthKey, 'count', 1),
        kv.hincrby(monthKey, 'total', amount),
        kv.expire(monthKey, 2592000), // 30 day TTL
      ]);
    } catch (error) {
      logSecurityEvent('Failed to track refund', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
    }
  }

  /**
   * Assess user refund risk
   */
  private static async assessUserRefundRisk(userId: string): Promise<number> {
    let riskScore = 0;

    try {
      // Check monthly refund history
      const monthKey = `refund_history:${userId}:${new Date().toISOString().substring(0, 7)}`;
      const history = await kv.hgetall(monthKey);

      if (history) {
        const count = Number(history.count || 0);
        const total = Number(history.total || 0);

        // High refund count
        if (count > 5) {
          riskScore += 20;
        }

        // High refund amount
        if (total > 200000) { // £2000+
          riskScore += 25;
        }
      }

      // Check for pattern of refunds after delivery
      // In production, correlate with order fulfillment data

    } catch (error) {
      logSecurityEvent('Failed to assess refund risk', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
    }

    return riskScore;
  }

  /**
   * Create approval request for high-risk refunds
   */
  private static async createApprovalRequest(
    request: RefundRequest,
    validationResult: RefundValidationResult
  ): Promise<void> {
    try {
      const approvalRequest = {
        id: `refund_approval_${Date.now()}`,
        paymentIntentId: request.paymentIntentId,
        userId: request.userId,
        amount: request.amount,
        reason: request.reason,
        riskScore: validationResult.riskScore,
        warnings: validationResult.warnings,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      };

      const approvalKey = `refund_approval:${approvalRequest.id}`;
      await kv.setex(approvalKey, 604800, approvalRequest); // 7 days TTL

      // Add to approval queue
      await kv.lpush('refund_approval_queue', approvalRequest.id);

      logSecurityEvent('Refund approval request created', {
        approvalId: approvalRequest.id,
        paymentIntentId: request.paymentIntentId,
        riskScore: validationResult.riskScore,
      });

      // In production, send notification to admin team
    } catch (error) {
      logSecurityEvent('Failed to create approval request', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId: request.paymentIntentId,
      });
    }
  }

  /**
   * Get refund history for a user
   */
  static async getRefundHistory(userId: string, limit: number = 10): Promise<{
    refunds: Array<{
      id: string;
      amount: number;
      currency: string;
      reason: string;
      status: string;
      created: Date;
    }>;
    summary: {
      totalRefunds: number;
      totalAmount: number;
      averageAmount: number;
      lastRefundDate?: Date;
    };
  }> {
    // In production, query from database
    // For now, return mock data structure
    return {
      refunds: [],
      summary: {
        totalRefunds: 0,
        totalAmount: 0,
        averageAmount: 0,
      },
    };
  }
}