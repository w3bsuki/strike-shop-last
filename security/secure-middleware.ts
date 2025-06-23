import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { validateCSRF } from '@/lib/csrf-protection';

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/admin(.*)',
  '/api/payments(.*)',
  '/api/orders(.*)',
  '/api/users(.*)',
  '/checkout(.*)',
]);

// Define admin routes for additional security
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);

// Define API routes for rate limiting
const isAPIRoute = createRouteMatcher(['/api(.*)']);

// Define public routes that don't need authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/product(.*)',
  '/category(.*)',
  '/api/reviews(.*)',
  '/api/products(.*)',
  '/api/community-fits(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Security headers for all requests
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://clerk.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://clerk.com https://*.sanity.io",
    "frame-src 'self' https://js.stripe.com https://clerk.com",
    "worker-src 'self' blob:",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Add HSTS header in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Rate limiting for API routes
  if (isAPIRoute(req)) {
    try {
      await rateLimit(req);
    } catch (error) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }

  // CSRF protection for state-changing requests
  if (
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) &&
    !pathname.startsWith('/api/webhooks')
  ) {
    try {
      await validateCSRF(req);
    } catch (error) {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid request',
          message: 'CSRF token validation failed',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Skip authentication for public routes
  if (isPublicRoute(req)) {
    return response;
  }

  // Enhanced security for admin routes
  if (isAdminRoute(req)) {
    try {
      const { userId, has } = auth();

      // Check if user is authenticated
      if (!userId) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }

      // Check if user has admin role
      const hasAdminRole =
        has({ role: 'admin' }) || has({ permission: 'admin:access' });

      if (!hasAdminRole) {
        return new NextResponse(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Admin access required',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Additional admin security checks
      response.headers.set('X-Admin-Access', 'true');
      response.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
    } catch (error) {
      console.error('Admin auth error:', error);
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // Standard authentication for protected routes
  if (isProtectedRoute(req)) {
    try {
      auth().protect();
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Include root path
    '/',
  ],
};

// Additional security utilities
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return req.ip || 'unknown';
}

export function isValidOrigin(
  req: NextRequest,
  allowedOrigins: string[]
): boolean {
  const origin = req.headers.get('origin');

  if (!origin) {
    return false;
  }

  return allowedOrigins.includes(origin);
}

export function logSecurityEvent(
  event: string,
  details: any,
  request: NextRequest
) {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const timestamp = new Date().toISOString();

  const logData = {
    timestamp,
    event,
    clientIP,
    userAgent,
    path: request.nextUrl.pathname,
    method: request.method,
    details,
  };

  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with security monitoring service
    console.error('🚨 SECURITY EVENT:', JSON.stringify(logData));
  } else {
    console.warn('⚠️ Security Event:', logData);
  }
}
