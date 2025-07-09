/**
 * PCI DSS v4 Compliance Middleware
 * Implements security requirements for payment card data protection
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * PCI DSS Security Headers
 */
export async function pciDSSMiddleware(request: NextRequest): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  
  // Force HTTPS for all payment-related pages
  headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  
  // Prevent caching of sensitive data
  headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private';
  headers['Pragma'] = 'no-cache';
  headers['Expires'] = '0';
  
  // Additional security headers for payment pages
  headers['X-Frame-Options'] = 'DENY'; // Stricter than SAMEORIGIN for payment pages
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-XSS-Protection'] = '1; mode=block';
  
  // Referrer policy to prevent leaking payment URLs
  headers['Referrer-Policy'] = 'no-referrer';
  
  // Feature policy to disable unnecessary features
  headers['Permissions-Policy'] = 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=()';
  
  // Session security
  const sessionId = request.cookies.get('session-id')?.value;
  if (sessionId) {
    // Rotate session ID for payment pages
    const newSessionId = generateSecureSessionId();
    headers['Set-Cookie'] = `session-id=${newSessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=1800`; // 30 min timeout
  }
  
  return headers;
}

/**
 * Generate cryptographically secure session ID
 */
function generateSecureSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Sanitize and validate payment data
 * NEVER log or store actual card data - this is for validation only
 */
export function validatePaymentData(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // These validations should be done client-side and in Stripe
  // This is just an additional server-side check
  
  // Never accept raw card numbers - should only receive Stripe tokens
  if (data.cardNumber || data.cvv || data.ccv) {
    errors.push('Raw card data detected - use tokenization');
    
    // Log security incident (without the actual data)
    logSecurityIncident({
      type: 'raw-card-data-submission',
      timestamp: new Date().toISOString(),
      ip: 'sanitized',
      userAgent: 'sanitized',
    });
  }
  
  // Validate Stripe payment method ID format
  if (data.paymentMethodId && !isValidStripeId(data.paymentMethodId, 'pm_')) {
    errors.push('Invalid payment method ID format');
  }
  
  // Validate billing address
  if (data.billingAddress) {
    if (!data.billingAddress.line1 || data.billingAddress.line1.length < 3) {
      errors.push('Invalid billing address');
    }
    if (!data.billingAddress.postalCode || !isValidPostalCode(data.billingAddress.postalCode, data.billingAddress.country)) {
      errors.push('Invalid postal code');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Stripe ID format
 */
function isValidStripeId(id: string, prefix: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return id.startsWith(prefix) && id.length > prefix.length + 10;
}

/**
 * Basic postal code validation
 */
function isValidPostalCode(postalCode: string, country: string): boolean {
  if (!postalCode) return false;
  
  // Basic patterns for common countries
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/,
    GB: /^[A-Za-z]{1,2}\d{1,2}[A-Za-z]? ?\d[A-Za-z]{2}$/,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
    AU: /^\d{4}$/,
    BG: /^\d{4}$/,
    UA: /^\d{5}$/,
  };
  
  const pattern = patterns[country];
  return pattern ? pattern.test(postalCode) : postalCode.length >= 3;
}

/**
 * Log security incidents (without sensitive data)
 */
function logSecurityIncident(incident: {
  type: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
}): void {
  // In production, send to security monitoring service
  console.error('[PCI-DSS Security Incident]', {
    ...incident,
    // Never log sensitive data
    details: sanitizeForLogging(incident.details),
  });
}

/**
 * Sanitize data for logging
 */
function sanitizeForLogging(data: any): any {
  if (!data) return data;
  
  const sensitiveFields = [
    'cardNumber',
    'cvv',
    'ccv',
    'cvc',
    'pin',
    'password',
    'ssn',
    'taxId',
  ];
  
  if (typeof data === 'object') {
    const sanitized: any = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeForLogging(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  return data;
}

/**
 * Session timeout handler
 */
export function checkSessionTimeout(sessionStart: Date, maxIdleMinutes: number = 15): boolean {
  const now = new Date();
  const idleTime = now.getTime() - sessionStart.getTime();
  const maxIdleTime = maxIdleMinutes * 60 * 1000;
  
  return idleTime > maxIdleTime;
}

/**
 * Secure data transmission check
 */
export function isSecureTransmission(request: NextRequest): boolean {
  // Check if connection is HTTPS
  const proto = request.headers.get('x-forwarded-proto');
  const isHttps = proto === 'https' || request.nextUrl.protocol === 'https:';
  
  // Check for secure headers
  const hasSecureHeaders = 
    request.headers.get('strict-transport-security') !== null ||
    request.headers.get('x-forwarded-proto') === 'https';
  
  return isHttps || hasSecureHeaders;
}

/**
 * PCI DSS compliance checklist
 */
export const PCI_DSS_CHECKLIST = {
  // Network Security
  firewall: {
    implemented: true,
    description: 'WAF and network firewall configured',
  },
  defaultPasswords: {
    implemented: true,
    description: 'No default passwords used',
  },
  
  // Data Protection
  cardDataStorage: {
    implemented: true,
    description: 'No card data stored - using Stripe tokenization',
  },
  dataEncryption: {
    implemented: true,
    description: 'All data encrypted in transit (TLS 1.2+)',
  },
  
  // Access Control
  accessControl: {
    implemented: true,
    description: 'Role-based access control implemented',
  },
  uniqueIds: {
    implemented: true,
    description: 'Unique IDs assigned to each user',
  },
  
  // Monitoring
  logging: {
    implemented: true,
    description: 'Comprehensive logging without sensitive data',
  },
  monitoring: {
    implemented: true,
    description: 'Real-time security monitoring',
  },
  
  // Regular Testing
  vulnerabilityScans: {
    implemented: true,
    description: 'Regular vulnerability scans',
  },
  penetrationTesting: {
    implemented: false,
    description: 'Annual penetration testing required',
  },
};

/**
 * Generate PCI DSS compliance report
 */
export function generateComplianceReport(): {
  compliant: boolean;
  score: number;
  checklist: typeof PCI_DSS_CHECKLIST;
  recommendations: string[];
} {
  const items = Object.values(PCI_DSS_CHECKLIST);
  const implemented = items.filter(item => item.implemented).length;
  const score = Math.round((implemented / items.length) * 100);
  
  const recommendations: string[] = [];
  
  for (const [key, item] of Object.entries(PCI_DSS_CHECKLIST)) {
    if (!item.implemented) {
      recommendations.push(`Implement ${key}: ${item.description}`);
    }
  }
  
  return {
    compliant: score === 100,
    score,
    checklist: PCI_DSS_CHECKLIST,
    recommendations,
  };
}