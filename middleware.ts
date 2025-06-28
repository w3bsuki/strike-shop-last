import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// Security headers to apply to all responses
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};

// Routes that require authentication
const protectedRoutes = [
  '/account',
  '/orders',
  '/wishlist',
  '/checkout/payment',
];

// Routes that are always public
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/auth/callback',
  '/products',
  '/product',
  '/category',
  '/categories',
  '/search',
  '/cart',
  '/checkout',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/faq',
  '/help',
];

export async function middleware(request: NextRequest) {
  // Update session
  const response = await updateSession(request);
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  const path = request.nextUrl.pathname;

  // Skip authentication for static assets
  const isStaticAsset = path.startsWith('/_next/') || 
                       path.startsWith('/static/') ||
                       path.startsWith('/fonts/') ||
                       path.startsWith('/images/') ||
                       path.startsWith('/icons/') ||
                       path.includes('__nextjs') ||
                       path.includes('.') && (
                         path.endsWith('.js') ||
                         path.endsWith('.css') ||
                         path.endsWith('.png') ||
                         path.endsWith('.jpg') ||
                         path.endsWith('.jpeg') ||
                         path.endsWith('.gif') ||
                         path.endsWith('.svg') ||
                         path.endsWith('.ico') ||
                         path.endsWith('.woff') ||
                         path.endsWith('.woff2') ||
                         path.endsWith('.ttf') ||
                         path.endsWith('.otf')
                       );

  if (isStaticAsset) {
    return response;
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    path.startsWith(route)
  );

  if (isProtectedRoute) {
    // Properly validate session using Supabase middleware
    try {
      const authResponse = await updateSession(request);
      
      // Extract user from auth response to verify valid session
      const userCookie = authResponse.cookies.get('sb-user');
      const isValidSession = userCookie && userCookie.value && userCookie.value !== 'null';
      
      if (!isValidSession) {
        // Clear invalid cookies and redirect to sign-in
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('redirect_url', path);
        const redirectResponse = NextResponse.redirect(signInUrl);
        
        // Clear invalid auth cookies
        redirectResponse.cookies.delete('sb-access-token');
        redirectResponse.cookies.delete('sb-refresh-token');
        redirectResponse.cookies.delete('sb-user');
        
        return redirectResponse;
      }
      
      // If we have a valid session, use the auth response
      response = authResponse;
    } catch (error) {
      // Session validation failed, redirect to sign-in
      console.error('Auth validation failed:', error);
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', path);
      return NextResponse.redirect(signInUrl);
    }
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