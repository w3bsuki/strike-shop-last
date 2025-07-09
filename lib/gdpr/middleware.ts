/**
 * GDPR Compliance Middleware
 * Handles cookie consent, privacy policy acceptance, and data protection
 */

import { NextRequest, NextResponse } from 'next/server';

// Cookie names
const GDPR_COOKIES = {
  CONSENT: 'gdpr-consent',
  PRIVACY_ACCEPTED: 'privacy-policy-accepted',
  MARKETING_CONSENT: 'marketing-consent',
  ANALYTICS_CONSENT: 'analytics-consent',
  FUNCTIONAL_CONSENT: 'functional-consent',
  CONSENT_TIMESTAMP: 'gdpr-consent-timestamp',
} as const;

// Pages that require privacy policy acceptance
const PRIVACY_REQUIRED_PATHS = [
  '/checkout',
  '/account',
  '/api/checkout',
  '/api/auth/register',
];

// Cookie categories
export const COOKIE_CATEGORIES = {
  necessary: {
    name: 'Necessary',
    description: 'Essential cookies required for the website to function',
    required: true,
    cookies: ['session-id', 'csrf-token', 'locale'],
  },
  functional: {
    name: 'Functional',
    description: 'Cookies that enhance functionality and personalization',
    required: false,
    cookies: ['theme', 'currency', 'recently-viewed'],
  },
  analytics: {
    name: 'Analytics',
    description: 'Cookies that help us understand how you use our website',
    required: false,
    cookies: ['_ga', '_gid', '_gat', 'segment_id'],
  },
  marketing: {
    name: 'Marketing',
    description: 'Cookies used for advertising and remarketing',
    required: false,
    cookies: ['_fbp', 'fr', 'tr', '_gcl_au'],
  },
} as const;

/**
 * Check if user has given GDPR consent
 */
export function hasGDPRConsent(request: NextRequest): boolean {
  const consent = request.cookies.get(GDPR_COOKIES.CONSENT);
  return consent?.value === 'accepted';
}

/**
 * Check if user has accepted privacy policy
 */
export function hasAcceptedPrivacyPolicy(request: NextRequest): boolean {
  const accepted = request.cookies.get(GDPR_COOKIES.PRIVACY_ACCEPTED);
  return accepted?.value === 'true';
}

/**
 * Get user's consent preferences
 */
export function getConsentPreferences(request: NextRequest) {
  return {
    analytics: request.cookies.get(GDPR_COOKIES.ANALYTICS_CONSENT)?.value === 'true',
    marketing: request.cookies.get(GDPR_COOKIES.MARKETING_CONSENT)?.value === 'true',
    functional: request.cookies.get(GDPR_COOKIES.FUNCTIONAL_CONSENT)?.value === 'true',
    timestamp: request.cookies.get(GDPR_COOKIES.CONSENT_TIMESTAMP)?.value,
  };
}

/**
 * GDPR middleware handler
 */
export async function gdprMiddleware(
  request: NextRequest,
): Promise<NextResponse | null> {
  const path = request.nextUrl.pathname;
  
  // Skip GDPR checks for static assets and API routes (except specific ones)
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/static/') ||
    (path.startsWith('/api/') && !PRIVACY_REQUIRED_PATHS.includes(path))
  ) {
    return null;
  }
  
  // Check if path requires privacy policy acceptance
  const requiresPrivacy = PRIVACY_REQUIRED_PATHS.some(p => path.startsWith(p));
  
  if (requiresPrivacy && !hasAcceptedPrivacyPolicy(request)) {
    // Redirect to privacy policy page
    const url = new URL('/privacy-policy', request.url);
    url.searchParams.set('redirect', path);
    url.searchParams.set('required', 'true');
    
    return NextResponse.redirect(url);
  }
  
  // For EU users, check GDPR consent
  const country = request.headers.get('cf-ipcountry') || 
                  request.headers.get('x-vercel-ip-country') ||
                  (request as any).geo?.country;
  
  const isEUCountry = isEU(country || '');
  
  if (isEUCountry && !hasGDPRConsent(request)) {
    // Add header to trigger consent banner
    const response = NextResponse.next();
    response.headers.set('X-Show-Cookie-Banner', 'true');
    response.headers.set('X-GDPR-Required', 'true');
    
    // Set minimal necessary cookies only
    response.headers.set(
      'Set-Cookie',
      `gdpr-notice-shown=true; Path=/; HttpOnly; Secure; SameSite=Strict`,
    );
    
    return response;
  }
  
  return null;
}

/**
 * Check if country is in EU
 */
function isEU(countryCode: string): boolean {
  const euCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  ];
  
  return euCountries.includes(countryCode.toUpperCase());
}

/**
 * Set GDPR consent cookies
 */
export function setGDPRConsent(
  response: NextResponse,
  preferences: {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  },
): void {
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 365 * 24 * 60 * 60, // 1 year
  };
  
  // Set main consent cookie
  response.cookies.set(GDPR_COOKIES.CONSENT, 'accepted', cookieOptions);
  
  // Set individual preferences
  response.cookies.set(
    GDPR_COOKIES.ANALYTICS_CONSENT,
    preferences.analytics.toString(),
    cookieOptions,
  );
  
  response.cookies.set(
    GDPR_COOKIES.MARKETING_CONSENT,
    preferences.marketing.toString(),
    cookieOptions,
  );
  
  response.cookies.set(
    GDPR_COOKIES.FUNCTIONAL_CONSENT,
    preferences.functional.toString(),
    cookieOptions,
  );
  
  // Set timestamp
  response.cookies.set(
    GDPR_COOKIES.CONSENT_TIMESTAMP,
    new Date().toISOString(),
    cookieOptions,
  );
}

/**
 * Set privacy policy acceptance
 */
export function setPrivacyPolicyAcceptance(response: NextResponse): void {
  response.cookies.set(GDPR_COOKIES.PRIVACY_ACCEPTED, 'true', {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 365 * 24 * 60 * 60, // 1 year
  });
}

/**
 * Clear non-essential cookies based on consent
 */
export function clearNonConsentedCookies(
  request: NextRequest,
  response: NextResponse,
): void {
  const preferences = getConsentPreferences(request);
  
  // Get all cookies
  const cookies = request.cookies.getAll();
  
  for (const cookie of cookies) {
    let shouldDelete = false;
    
    // Check analytics cookies
    if (!preferences.analytics) {
      const analyticsCookies = COOKIE_CATEGORIES.analytics.cookies;
      if (analyticsCookies.some(name => cookie.name.startsWith(name))) {
        shouldDelete = true;
      }
    }
    
    // Check marketing cookies
    if (!preferences.marketing) {
      const marketingCookies = COOKIE_CATEGORIES.marketing.cookies;
      if (marketingCookies.some(name => cookie.name.startsWith(name))) {
        shouldDelete = true;
      }
    }
    
    // Check functional cookies
    if (!preferences.functional) {
      const functionalCookies = COOKIE_CATEGORIES.functional.cookies;
      if (functionalCookies.some(name => cookie.name.startsWith(name))) {
        shouldDelete = true;
      }
    }
    
    if (shouldDelete) {
      response.cookies.delete(cookie.name);
    }
  }
}

/**
 * Generate GDPR-compliant cookie policy
 */
export function generateCookiePolicy() {
  return {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    categories: Object.entries(COOKIE_CATEGORIES).map(([key, category]) => ({
      id: key,
      name: category.name,
      description: category.description,
      required: category.required,
      cookies: category.cookies.map(cookie => ({
        name: cookie,
        purpose: getCookiePurpose(cookie),
        expiry: getCookieExpiry(cookie),
        type: getCookieType(cookie),
      })),
    })),
  };
}

/**
 * Get cookie purpose description
 */
function getCookiePurpose(cookieName: string): string {
  const purposes: Record<string, string> = {
    'session-id': 'Maintains user session',
    'csrf-token': 'Prevents cross-site request forgery',
    'locale': 'Stores language preference',
    'theme': 'Stores theme preference',
    'currency': 'Stores currency preference',
    'recently-viewed': 'Tracks recently viewed products',
    '_ga': 'Google Analytics tracking',
    '_gid': 'Google Analytics user identification',
    '_gat': 'Google Analytics rate limiting',
    'segment_id': 'Segment analytics tracking',
    '_fbp': 'Facebook advertising',
    'fr': 'Facebook advertising',
    'tr': 'Facebook conversion tracking',
    '_gcl_au': 'Google Ads conversion tracking',
  };
  
  return purposes[cookieName] || 'General website functionality';
}

/**
 * Get cookie expiry
 */
function getCookieExpiry(cookieName: string): string {
  const expiries: Record<string, string> = {
    'session-id': 'Session',
    'csrf-token': 'Session',
    'locale': '1 year',
    'theme': '1 year',
    'currency': '1 year',
    'recently-viewed': '30 days',
    '_ga': '2 years',
    '_gid': '24 hours',
    '_gat': '1 minute',
    'segment_id': '1 year',
    '_fbp': '90 days',
    'fr': '90 days',
    'tr': 'Session',
    '_gcl_au': '90 days',
  };
  
  return expiries[cookieName] || '1 year';
}

/**
 * Get cookie type
 */
function getCookieType(cookieName: string): 'first-party' | 'third-party' {
  const thirdPartyCookies = ['_ga', '_gid', '_gat', '_fbp', 'fr', 'tr', '_gcl_au'];
  return thirdPartyCookies.includes(cookieName) ? 'third-party' : 'first-party';
}