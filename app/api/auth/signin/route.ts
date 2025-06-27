import { NextRequest, NextResponse } from 'next/server';
import { getAuthRateLimiter } from '@/lib/security/auth-rate-limiter';
import { getBruteForceProtection } from '@/lib/security/brute-force-protection';
import { getAuthMonitor, AuthMonitor } from '@/lib/security/auth-monitor';
import { getSessionSecurity } from '@/lib/security/session-security';
import { z } from 'zod';

// Request validation schema
const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  captchaToken: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const validation = signInSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, captchaToken } = validation.data;
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // 1. Check rate limiting
    const rateLimiter = getAuthRateLimiter();
    const rateLimit = await rateLimiter.checkLimit(ip, email);
    
    if (!rateLimit.allowed) {
      // Log failed attempt due to rate limit
      await getAuthMonitor().logAuthEvent({
        type: 'failed_login',
        email,
        ip,
        userAgent,
        metadata: { reason: 'rate_limited', backoffMinutes: rateLimit.backoffMinutes }
      });

      return NextResponse.json(
        { 
          error: `Too many attempts. Please try again after ${rateLimit.resetAt.toLocaleTimeString()}`,
          requiresCaptcha: true
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // 2. Check brute force protection
    const bruteForce = getBruteForceProtection();
    const bruteForceStatus = await bruteForce.checkStatus(email, ip);
    
    if (bruteForceStatus.ipBlocked || bruteForceStatus.accountLocked) {
      // Log blocked attempt
      await getAuthMonitor().logAuthEvent({
        type: 'failed_login',
        email,
        ip,
        userAgent,
        metadata: { 
          reason: bruteForceStatus.ipBlocked ? 'ip_blocked' : 'account_locked',
          lockoutEndsAt: bruteForceStatus.lockoutEndsAt
        }
      });

      return NextResponse.json(
        { 
          error: bruteForceStatus.message || 'Access denied',
          requiresCaptcha: true,
          accountLocked: bruteForceStatus.accountLocked
        },
        { status: 403 }
      );
    }

    // 3. Verify CAPTCHA if required
    if (bruteForceStatus.requiresCaptcha) {
      if (!captchaToken) {
        return NextResponse.json(
          { error: 'CAPTCHA verification required', requiresCaptcha: true },
          { status: 400 }
        );
      }

      const captchaValid = await bruteForce.verifyCaptcha(captchaToken);
      if (!captchaValid) {
        return NextResponse.json(
          { error: 'Invalid CAPTCHA', requiresCaptcha: true },
          { status: 400 }
        );
      }
    }

    // 4. Attempt authentication with Clerk
    // TODO: Replace with actual Clerk authentication
    // For now, we'll simulate the authentication
    const authenticated = await authenticateWithClerk(email, password);
    
    if (!authenticated.success) {
      // Record failed attempt
      const bruteForceResult = await bruteForce.recordFailedAttempt(email, ip);
      
      // Log failed login
      await getAuthMonitor().logAuthEvent({
        type: 'failed_login',
        email,
        ip,
        userAgent,
        metadata: { 
          reason: 'invalid_credentials',
          failedAttempts: bruteForceResult.failedAttempts
        }
      });

      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          requiresCaptcha: bruteForceResult.requiresCaptcha,
          remainingAttempts: Math.max(0, 5 - bruteForceResult.failedAttempts)
        },
        { status: 401 }
      );
    }

    // 5. Authentication successful - create secure session
    const sessionSecurity = getSessionSecurity();
    const deviceFingerprint = AuthMonitor.generateDeviceFingerprint(
      userAgent,
      req.headers.get('accept') || undefined
    );

    // TypeScript requires userId to be defined since authentication succeeded
    if (!authenticated.userId) {
      throw new Error('Authentication succeeded but userId is missing');
    }

    const { session, token } = await sessionSecurity.createSession(
      authenticated.userId,
      email,
      ip,
      userAgent,
      deviceFingerprint,
      { role: authenticated.role }
    );

    // 6. Clear failed attempts
    await Promise.all([
      rateLimiter.resetLimits(ip, email),
      bruteForce.clearFailedAttempts(email, ip)
    ]);

    // 7. Log successful login
    const monitor = getAuthMonitor();
    const location = await monitor.getLocationFromIP(ip);
    await monitor.logAuthEvent({
      type: 'login',
      userId: authenticated.userId,
      email,
      ip,
      userAgent,
      deviceFingerprint,
      ...(location && { location }),
      metadata: { sessionId: session.id }
    });

    // 8. Create response with secure session cookie
    const response = NextResponse.json(
      { 
        success: true,
        user: {
          id: authenticated.userId,
          email: authenticated.email || email,
          role: authenticated.role || 'user'
        }
      },
      { status: 200 }
    );

    // Set secure session cookie
    response.cookies.set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Sign-in error:', error);
    return NextResponse.json(
      { error: 'An error occurred during sign-in' },
      { status: 500 }
    );
  }
}

// Mock authentication function - replace with actual Clerk integration
async function authenticateWithClerk(email: string, password: string): Promise<{
  success: boolean;
  userId?: string;
  email?: string;
  role?: string;
}> {
  // TODO: Implement actual Clerk authentication
  // This is a placeholder for demonstration
  
  // Simulate authentication delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // For demo purposes, accept specific test credentials
  if (email === 'admin@example.com' && password === 'SecurePassword123!') {
    return {
      success: true,
      userId: 'user_123456',
      email,
      role: 'admin'
    };
  }
  
  if (email === 'user@example.com' && password === 'UserPassword123!') {
    return {
      success: true,
      userId: 'user_789012',
      email,
      role: 'user'
    };
  }
  
  return { success: false };
}