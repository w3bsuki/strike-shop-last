import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n, type Locale } from './lib/i18n/config';

/**
 * CVE-2025-29927 Compliant Middleware
 * 
 * SECURITY: This middleware contains NO authentication logic
 * Authentication is handled in Data Access Layer only (lib/auth/server.ts)
 * 
 * Middleware responsibilities:
 * - Security headers
 * - Static asset optimization  
 * - Basic routing (non-auth related)
 * - Internationalization (i18n) routing
 * - Performance optimizations
 */

// Locale detection logic
function getLocale(request: NextRequest): Locale {
  // 1. Check if locale is in URL path
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = pathname.split('/')[1];
  
  if (i18n.locales.includes(pathnameLocale as Locale)) {
    return pathnameLocale as Locale;
  }
  
  // 2. Check browser language preferences
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    // Parse Accept-Language header
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, q = '1'] = lang.trim().split(';q=');
        return { code: (code || 'en').toLowerCase(), quality: parseFloat(q) };
      })
      .sort((a, b) => b.quality - a.quality);
    
    // Find best match
    for (const { code } of languages) {
      // Check exact match first
      if (i18n.locales.includes(code as Locale)) {
        return code as Locale;
      }
      
      // Check language without region (e.g., 'en' from 'en-US')
      const langOnly = code.split('-')[0];
      if (i18n.locales.includes(langOnly as Locale)) {
        return langOnly as Locale;
      }
    }
  }
  
  // 3. Check geographic region based on headers
  const country = request.headers.get('cloudflare-ipcountry') || 
                  request.headers.get('cf-ipcountry') ||
                  (request as any).geo?.country;
  
  if (country) {
    switch (country.toLowerCase()) {
      case 'bg':
      case 'bulgaria':
        return 'bg';
      case 'ua':
      case 'ukraine':
        return 'ua';
      case 'gb':
      case 'us':
      case 'ca':
      case 'au':
      case 'ie':
      case 'nz':
        return 'en';
      default:
        // Default to English for other countries
        return 'en';
    }
  }
  
  // 4. Fallback to default locale
  return i18n.defaultLocale;
}

// Enhanced security headers for production
const securityHeaders = {
  // DNS prefetching control
  'X-DNS-Prefetch-Control': 'on',
  
  // HTTPS enforcement
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Clickjacking protection
  'X-Frame-Options': 'SAMEORIGIN',
  
  // MIME type sniffing prevention
  'X-Content-Type-Options': 'nosniff',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Feature policy restrictions
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  
  // Content Security Policy (basic)
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://api.stripe.com wss://;
  `.replace(/\s+/g, ' ').trim(),
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip middleware for API routes - MUST be first check
  if (path.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Apply security headers to API routes
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    return response;
  }
  
  // Skip middleware for static files and internal Next.js paths
  const isStaticAsset = path.startsWith('/_next/') || 
                       path.startsWith('/static/') ||
                       path.startsWith('/fonts/') ||
                       path.startsWith('/images/') ||
                       path.startsWith('/icons/') ||
                       path.includes('__nextjs') ||
                       path === '/favicon.ico' ||
                       path === '/robots.txt' ||
                       path === '/sitemap.xml' ||
                       path === '/manifest.json' ||
                       /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|otf|webp|avif)$/.test(path);

  if (isStaticAsset) {
    const response = NextResponse.next();
    // Cache static assets aggressively
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Apply basic security headers to static assets
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  // ============= I18N ROUTING LOGIC =============
  
  // Check if pathname already has a locale
  const pathnameHasLocale = i18n.locales.some(
    locale => path.startsWith(`/${locale}/`) || path === `/${locale}`
  );
  
  if (!pathnameHasLocale) {
    // Detect locale and redirect
    const locale = getLocale(request);
    const newUrl = new URL(`/${locale}${path}`, request.url);
    
    // Preserve query parameters
    newUrl.search = request.nextUrl.search;
    
    console.log(`[i18n Middleware] Redirecting ${path} to /${locale}${path}`);
    
    const redirectResponse = NextResponse.redirect(newUrl);
    
    // Apply security headers to redirect response
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    
    return redirectResponse;
  }
  
  // ============= STANDARD RESPONSE =============
  
  const response = NextResponse.next();
  
  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add locale header for use in components
  if (pathnameHasLocale) {
    const currentLocale = path.split('/')[1] as Locale;
    response.headers.set('x-locale', currentLocale);
  }


  // Add performance headers for pages
  if (!path.startsWith('/api/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Robots-Tag', 'index, follow');
  }

  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that shouldn't be protected
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)',
  ],
};