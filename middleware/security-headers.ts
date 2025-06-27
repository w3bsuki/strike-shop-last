/**
 * Security Headers Middleware
 * Implements comprehensive security headers for maximum protection
 * Based on OWASP security best practices
 */

import { NextRequest, NextResponse } from 'next/server';

// Environment-specific configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Allowed origins based on environment
const ALLOWED_ORIGINS = {
  development: [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:9000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4000',
    'http://127.0.0.1:9000'
  ],
  production: [
    'https://strike-shop.com',
    'https://www.strike-shop.com',
    'https://strike-shop.vercel.app',
    'https://strike-shop.railway.app'
  ]
};

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Build Content Security Policy based on environment and nonce
 */
export function buildCSP(nonce: string): string {
  const policies = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      ...(isDevelopment ? ["'unsafe-eval'"] : []), // Only in dev for hot reload
      'https://js.stripe.com',
      'https://challenges.cloudflare.com',
      'https://accounts.google.com',
      'https://*.clerk.dev',
      'https://*.clerk.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind/styled-components
      'https://fonts.googleapis.com',
      'https://*.clerk.dev'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'https://cdn.sanity.io',
      'https://images.unsplash.com',
      'https://medusa-public-images.s3.eu-west-1.amazonaws.com',
      'https://*.clerk.dev',
      'https://*.clerk.com',
      'https://img.clerk.com'
    ],
    'connect-src': [
      "'self'",
      'https://api.stripe.com',
      'https://uploads.stripe.com',
      'https://*.clerk.dev',
      'https://*.clerk.com',
      'https://*.sanity.io',
      'https://*.railway.app',
      'https://vitals.vercel-insights.com',
      'https://o4504696819122176.ingest.sentry.io',
      ...(isDevelopment ? ['ws:', 'wss:', 'http://localhost:*'] : ['wss:'])
    ],
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://hooks.stripe.com',
      'https://challenges.cloudflare.com',
      'https://accounts.google.com',
      'https://*.clerk.dev',
      'https://*.clerk.com'
    ],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'", 'https://*.clerk.dev'],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'upgrade-insecure-requests': isProduction ? [] : undefined,
    'block-all-mixed-content': isProduction ? [] : undefined,
  };

  return Object.entries(policies)
    .filter(([_, values]) => values !== undefined)
    .map(([directive, values]) => {
      if (values.length === 0) return directive;
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Apply comprehensive security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest,
  nonce: string
): NextResponse {
  // Content Security Policy
  response.headers.set('Content-Security-Policy', buildCSP(nonce));
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (formerly Feature Policy)
  response.headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Opt out of FLoC
    'payment=(self)',
    'usb=()',
    'serial=()',
    'bluetooth=()',
    'accelerometer=()',
    'gyroscope=()',
    'magnetometer=()',
    'midi=()',
    'sync-xhr=()',
    'battery=()',
    'display-capture=()'
  ].join(', '));
  
  // Cross-Origin policies
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Additional security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  
  // HSTS (HTTP Strict Transport Security) - only in production
  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Remove server identification headers
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  
  // Set secure cache control for sensitive pages
  const path = request.nextUrl.pathname;
  if (path.includes('/account') || path.includes('/admin') || path.includes('/checkout')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  return response;
}

/**
 * Validate request origin
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // For same-origin requests
  if (!origin && !referer) {
    return true;
  }
  
  const allowedOrigins = ALLOWED_ORIGINS[isProduction ? 'production' : 'development'];
  
  // Check origin
  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check referer as fallback
  if (referer) {
    const refererUrl = new URL(referer);
    const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
    if (allowedOrigins.includes(refererOrigin)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate referer for state-changing requests
 */
export function validateReferer(request: NextRequest): boolean {
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return true;
  }
  
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  if (!referer || !host) {
    return false;
  }
  
  try {
    const refererUrl = new URL(referer);
    return refererUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Main security headers middleware
 */
export function securityHeadersMiddleware(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const nonce = generateNonce();
  
  // Add nonce to request headers for use in components
  response.headers.set('x-nonce', nonce);
  
  // Apply all security headers
  return applySecurityHeaders(response, request, nonce);
}

/**
 * Request validation middleware
 */
export function validateRequestMiddleware(request: NextRequest): {
  isValid: boolean;
  error?: string;
} {
  // Skip validation for static assets
  const path = request.nextUrl.pathname;
  if (path.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/)) {
    return { isValid: true };
  }
  
  // Validate origin for CORS
  if (!validateOrigin(request)) {
    return { isValid: false, error: 'Invalid origin' };
  }
  
  // Validate referer for state-changing requests
  if (!validateReferer(request)) {
    return { isValid: false, error: 'Invalid referer' };
  }
  
  // Check for suspicious patterns
  const url = request.nextUrl.pathname + request.nextUrl.search;
  const suspiciousPatterns = [
    /\.\./g, // Directory traversal
    /<script/gi, // XSS attempt
    /javascript:/gi, // JavaScript protocol
    /vbscript:/gi, // VBScript protocol
    /on\w+=/gi, // Event handlers
    /union.*select/gi, // SQL injection
    /or\s+1=1/gi, // SQL injection
    /exec\s*\(/gi, // Command injection
    /cmd\s*\(/gi, // Command injection
    /powershell/gi, // PowerShell attempt
    /\.env/gi, // Environment file access
    /\.git/gi, // Git directory access
    /wp-admin/gi, // WordPress admin (honeypot)
    /phpmyadmin/gi, // phpMyAdmin (honeypot)
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      return { isValid: false, error: 'Suspicious pattern detected' };
    }
  }
  
  return { isValid: true };
}