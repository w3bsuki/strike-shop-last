/**
 * Security Configuration for Strike Shop
 * Centralized security settings and validation utilities
 */

// Environment validation utilities
export function validateEnvironmentVariables() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
    'NEXT_PUBLIC_MEDUSA_BACKEND_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ];

  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Validate API key formats
  validateApiKeyFormats();
}

export function validateApiKeyFormats() {
  const {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY,
  } = process.env;

  // Validate Clerk keys
  if (
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')
  ) {

  }

  if (CLERK_SECRET_KEY && !CLERK_SECRET_KEY.startsWith('sk_')) {

  }

  // Validate Stripe keys
  if (
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    !NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')
  ) {

  }

  if (STRIPE_SECRET_KEY && !STRIPE_SECRET_KEY.startsWith('sk_')) {

  }

  // Check for exposed test keys in production
  if (process.env.NODE_ENV === 'production') {
    const testKeys = [
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('test'),
      CLERK_SECRET_KEY?.includes('test'),
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('test'),
      STRIPE_SECRET_KEY?.includes('test'),
    ].filter(Boolean);

    if (testKeys.length > 0) {

    }
  }
}

// Content Security Policy configuration
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Stripe Elements
    "'unsafe-eval'", // Required for some React dev tools
    'https://js.stripe.com',
    'https://challenges.cloudflare.com',
    'https://clerk.*.dev',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    'https://fonts.googleapis.com',
  ],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://uploads.stripe.com',
    'https://clerk.*.dev',
    'https://*.sanity.io',
    'https://*.railway.app',
    'wss:',
  ],
  'frame-src': [
    "'self'",
    'https://js.stripe.com',
    'https://hooks.stripe.com',
    'https://challenges.cloudflare.com',
  ],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
};

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// HSTS configuration (only for production HTTPS)
export const HSTS_HEADER = 'max-age=31536000; includeSubDomains; preload';

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// CSRF protection configuration
export const CSRF_CONFIG = {
  secret: process.env.CSRF_SECRET || 'your-csrf-secret-key',
  cookieName: '__csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Sensitive data patterns to detect in logs
export const SENSITIVE_PATTERNS = [
  /sk_test_[a-zA-Z0-9]{99}/g, // Stripe test secret key
  /sk_live_[a-zA-Z0-9]{99}/g, // Stripe live secret key
  /pk_test_[a-zA-Z0-9]{99}/g, // Stripe test publishable key
  /pk_live_[a-zA-Z0-9]{99}/g, // Stripe live publishable key
  /sk_test_[a-zA-Z0-9_]{44}/g, // Clerk test secret key
  /sk_live_[a-zA-Z0-9_]{44}/g, // Clerk live secret key
  /pk_test_[a-zA-Z0-9_]{44}/g, // Clerk test publishable key
  /pk_live_[a-zA-Z0-9_]{44}/g, // Clerk live publishable key
  /whsec_[a-zA-Z0-9]{32}/g, // Stripe webhook secret
];

// Sanitize sensitive data from logs
export function sanitizeLogData(data: any): any {
  if (typeof data === 'string') {
    let sanitized = data;
    SENSITIVE_PATTERNS.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '[REDACTED_API_KEY]');
    });
    return sanitized;
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {};
    for (const [key, value] of Object.entries(data)) {
      // Redact sensitive keys
      if (/secret|key|token|password/i.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(value);
      }
    }
    return sanitized;
  }

  return data;
}

// Security audit logger
export function logSecurityEvent(event: string, details?: any) {
  const timestamp = new Date().toISOString();
  const sanitizedDetails = details ? sanitizeLogData(details) : {};

  // In production, you might want to send this to a security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // await sendToSecurityMonitoring({ timestamp, event, details: sanitizedDetails })
  }
}

// Validate request origin
export function validateRequestOrigin(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:4000',
    'https://*.railway.app',
  ].filter(Boolean);

  return allowedOrigins.some((allowed) => {
    if (allowed?.includes('*')) {
      const pattern = allowed.replace('*', '.*');
      return new RegExp(pattern).test(origin);
    }
    return origin === allowed;
  });
}

// Initialize security configuration
export function initializeSecurity() {
  try {
    validateEnvironmentVariables();

  } catch (error) {

    if (process.env.NODE_ENV === 'production') {
      throw error; // Fail fast in production
    }
  }
}
