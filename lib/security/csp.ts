/**
 * Content Security Policy (CSP) Utilities
 * Implements strict CSP with nonce support for inline scripts
 * Different policies for different page types
 */

// Use Web Crypto API for edge runtime compatibility

/**
 * Generate a cryptographically secure nonce
 */
export function generateCSPNonce(): string {
  // Generate random values for the nonce
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Convert to base64
  return btoa(String.fromCharCode(...array));
}

/**
 * CSP directives for different contexts
 */
const CSP_POLICIES = {
  // Base policy (shared across all contexts)
  base: {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", 'https://checkout.shopify.com'],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    // Only upgrade to HTTPS in production
    ...(process.env.NODE_ENV === 'production' ? { 'upgrade-insecure-requests': [] } : {}),
  },
  
  // Page-specific policies
  page: {
    'script-src': [
      "'self'",
      "'nonce-{nonce}'",
      'https://cdn.shopify.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://connect.facebook.net',
      'https://cdn.segment.com',
      // Allow unsafe-eval in development for React Hot Reload
      ...(process.env.NODE_ENV !== 'production' ? ["'unsafe-eval'"] : []),
    ],
    'style-src': [
      "'self'",
      "'nonce-{nonce}'",
      "'unsafe-inline'", // Required for Next.js inline styles
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
    ],
    'connect-src': [
      "'self'",
      'https://cdn.shopify.com',
      'https://*.myshopify.com',
      'https://checkout.shopify.com',
      'https://www.google-analytics.com',
      'https://vitals.vercel-insights.com',
      'wss://*.pusher.com',
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      // Allow localhost and development connections
      ...(process.env.NODE_ENV !== 'production' ? [
        'http://localhost:*', 
        'http://127.0.0.1:*', 
        'http://172.*:*',
        'ws://localhost:*',
        'ws://127.0.0.1:*', 
        'ws://172.*:*',
        'wss://localhost:*'
      ] : []),
    ].filter(Boolean),
    'frame-src': [
      "'self'",
      'https://checkout.shopify.com',
    ],
    'media-src': [
      "'self'",
      'https://cdn.shopify.com',
    ],
    'worker-src': [
      "'self'",
      'blob:',
    ],
  },
  
  // Stricter policy for checkout pages
  checkout: {
    'script-src': [
      "'self'",
      "'nonce-{nonce}'",
      'https://cdn.shopify.com',
      'https://checkout.shopify.com',
    ],
    'style-src': [
      "'self'",
      "'nonce-{nonce}'",
      "'unsafe-inline'", // Required for checkout styles
    ],
    'font-src': ["'self'"],
    'img-src': [
      "'self'",
      'data:',
      'https://cdn.shopify.com',
      'https://*.shopify.com',
    ],
    'connect-src': [
      "'self'",
      'https://*.myshopify.com',
      'https://checkout.shopify.com',
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    ].filter(Boolean),
    'frame-src': [
      "'self'",
      'https://checkout.shopify.com',
    ],
    'media-src': ["'none'"],
    'worker-src': ["'none'"],
  },
  
  // API routes policy
  api: {
    'script-src': ["'none'"],
    'style-src': ["'none'"],
    'font-src': ["'none'"],
    'img-src': ["'none'"],
    'connect-src': ["'self'"],
    'frame-src': ["'none'"],
    'media-src': ["'none'"],
    'worker-src': ["'none'"],
  },
};

/**
 * Generate CSP header string
 */
export function getCSPHeader(
  nonce: string,
  context: 'page' | 'checkout' | 'api' = 'page',
): string {
  const policies = {
    ...CSP_POLICIES.base,
    ...CSP_POLICIES[context],
  };
  
  // Build CSP string
  const cspDirectives: string[] = [];
  
  for (const [directive, values] of Object.entries(policies)) {
    if (values.length === 0) {
      cspDirectives.push(directive);
    } else {
      const processedValues = values.map(value =>
        value.replace('{nonce}', nonce),
      );
      cspDirectives.push(`${directive} ${processedValues.join(' ')}`);
    }
  }
  
  // Add report-uri if configured
  if (process.env.NEXT_PUBLIC_CSP_REPORT_URI) {
    cspDirectives.push(`report-uri ${process.env.NEXT_PUBLIC_CSP_REPORT_URI}`);
  }
  
  // Add report-to for newer browsers
  cspDirectives.push('report-to csp-violations');
  
  return cspDirectives.join('; ');
}

/**
 * Get CSP meta tag for client-side use
 */
export function getCSPMetaTag(nonce: string, context: 'page' | 'checkout' = 'page'): string {
  const cspHeader = getCSPHeader(nonce, context);
  return `<meta http-equiv="Content-Security-Policy" content="${cspHeader}">`;
}

/**
 * Validate CSP nonce (for server-side validation)
 */
export function validateCSPNonce(nonce: string): boolean {
  // Nonce should be base64 encoded and of expected length
  if (!nonce || typeof nonce !== 'string') {
    return false;
  }
  
  // Check if it's valid base64
  try {
    const decoded = Buffer.from(nonce, 'base64');
    return decoded.length === 16; // We generate 16 bytes
  } catch {
    return false;
  }
}

/**
 * Generate script tag with nonce
 */
export function generateNonceScript(
  content: string,
  nonce: string,
  attributes: Record<string, string> = {},
): string {
  const attrs = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  return `<script nonce="${nonce}" ${attrs}>${content}</script>`;
}

/**
 * Generate style tag with nonce
 */
export function generateNonceStyle(
  content: string,
  nonce: string,
  attributes: Record<string, string> = {},
): string {
  const attrs = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  return `<style nonce="${nonce}" ${attrs}>${content}</style>`;
}

/**
 * CSP violation report handler
 */
export interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    'referrer': string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'disposition': string;
    'blocked-uri': string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
    'status-code': number;
    'script-sample'?: string;
  };
}

/**
 * Parse and validate CSP violation report
 */
export function parseCSPViolationReport(body: any): CSPViolationReport | null {
  try {
    if (!body || typeof body !== 'object' || !body['csp-report']) {
      return null;
    }
    
    const report = body['csp-report'];
    
    // Validate required fields
    const requiredFields = [
      'document-uri',
      'violated-directive',
      'effective-directive',
      'original-policy',
      'blocked-uri',
    ];
    
    for (const field of requiredFields) {
      if (!report[field]) {
        return null;
      }
    }
    
    return body as CSPViolationReport;
  } catch {
    return null;
  }
}

/**
 * Check if CSP violation should be ignored
 */
export function shouldIgnoreCSPViolation(report: CSPViolationReport): boolean {
  const violation = report['csp-report'];
  
  // Ignore browser extensions
  if (
    violation['blocked-uri'].startsWith('chrome-extension://') ||
    violation['blocked-uri'].startsWith('moz-extension://') ||
    violation['blocked-uri'].startsWith('safari-extension://')
  ) {
    return true;
  }
  
  // Ignore inline styles/scripts without nonce (usually from extensions)
  if (
    violation['blocked-uri'] === 'inline' &&
    violation['violated-directive'].includes('style-src') &&
    !violation['script-sample']
  ) {
    return true;
  }
  
  // Ignore eval from trusted sources (e.g., React DevTools)
  if (
    violation['blocked-uri'] === 'eval' &&
    violation['source-file']?.includes('react-devtools')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Format CSP violation for logging
 */
export function formatCSPViolation(report: CSPViolationReport): string {
  const violation = report['csp-report'];
  
  return `CSP Violation:
  Document: ${violation['document-uri']}
  Blocked: ${violation['blocked-uri']}
  Directive: ${violation['violated-directive']}
  ${violation['source-file'] ? `Source: ${violation['source-file']}:${violation['line-number']}:${violation['column-number']}` : ''}
  ${violation['script-sample'] ? `Sample: ${violation['script-sample']}` : ''}`;
}