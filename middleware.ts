import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware, CryptoUtils } from './lib/security-fortress';

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher(['/account(.*)', '/admin(.*)']);
const isAPIRoute = createRouteMatcher(['/api(.*)']);
const isPaymentRoute = createRouteMatcher(['/api/payments(.*)']);
const isAuthRoute = createRouteMatcher(['/api/auth(.*)', '/sign-in', '/sign-up']);

// 🛡️ FORTRESS-LEVEL SECURITY MIDDLEWARE

export default clerkMiddleware((auth, req) => {
  // For development, skip security checks
  if (process.env.NODE_ENV === 'development') {
    if (isProtectedRoute(req)) {
      try {
        auth().protect();
      } catch (error) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
    }
    return NextResponse.next();
  }

  // 🚨 IMMEDIATE SECURITY VALIDATION
  const securityCheck = securityMiddleware.validateRequest(req);
  
  if (securityCheck.shouldBlock) {
    console.error(`🚨 SECURITY BREACH BLOCKED: ${securityCheck.errors.join(', ')}`, {
      ip: req.headers.get('x-forwarded-for') || req.ip,
      path: req.nextUrl.pathname,
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
    
    return securityMiddleware.createSecurityResponse(
      403,
      'Request blocked by security system',
      securityCheck.errors.join(', ')
    );
  }

  // 🛡️ RATE LIMITING BY ENDPOINT TYPE
  let rateLimitPassed = true;
  
  if (isPaymentRoute(req)) {
    rateLimitPassed = securityMiddleware.checkRateLimit(req, 'PAYMENTS');
  } else if (isAuthRoute(req)) {
    rateLimitPassed = securityMiddleware.checkRateLimit(req, 'AUTH');
  } else if (isAPIRoute(req)) {
    rateLimitPassed = securityMiddleware.checkRateLimit(req, 'API');
  }
  
  if (!rateLimitPassed) {
    console.warn(`🚦 RATE LIMIT EXCEEDED: ${req.nextUrl.pathname}`, {
      ip: req.headers.get('x-forwarded-for') || req.ip,
      timestamp: new Date().toISOString()
    });
    
    return securityMiddleware.createSecurityResponse(
      429,
      'Rate limit exceeded. Please try again later.',
      'Too many requests from your IP address'
    );
  }

  // 🔐 CLERK AUTHENTICATION PROTECTION
  if (isProtectedRoute(req)) {
    try {
      auth().protect();
    } catch (error) {
      console.warn(`🔒 AUTHENTICATION FAILED: ${req.nextUrl.pathname}`, {
        ip: req.headers.get('x-forwarded-for') || req.ip,
        error: error instanceof Error ? error.message : 'Unknown auth error',
        timestamp: new Date().toISOString()
      });
      
      return securityMiddleware.createSecurityResponse(
        401,
        'Authentication required',
        'Please sign in to access this resource'
      );
    }
  }

  // 🛡️ APPLY FORTRESS-LEVEL SECURITY HEADERS
  const response = NextResponse.next();
  const nonce = CryptoUtils.generateNonce();
  
  return securityMiddleware.applySecurityHeaders(response, nonce);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
