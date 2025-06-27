import { NextRequest, NextResponse } from 'next/server';
import { getAuthRateLimiter } from '@/lib/security/auth-rate-limiter';
import { getAuthMonitor } from '@/lib/security/auth-monitor';
import { getPasswordSecurity } from '@/lib/security/password-security';
import { getSessionSecurity } from '@/lib/security/session-security';
import crypto from 'crypto';
import { z } from 'zod';

// Request validation schemas
const requestResetSchema = z.object({
  email: z.string().email()
});

const confirmResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(12),
  confirmPassword: z.string().min(12)
});

// Request password reset
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = requestResetSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limiting for password reset requests
    const rateLimiter = getAuthRateLimiter();
    const rateLimit = await rateLimiter.checkIPLimit(ip);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // TODO: Store reset token in database with expiration
    // For now, we'll store it in Redis with 1-hour expiration
    const redis = (await import('ioredis')).default;
    const redisClient = new redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    await redisClient.setex(
      `password-reset:${resetTokenHash}`,
      3600, // 1 hour
      JSON.stringify({
        email,
        createdAt: new Date().toISOString(),
        ip
      })
    );

    // Log password reset request
    await getAuthMonitor().logAuthEvent({
      type: 'password_change',
      email,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      metadata: { action: 'reset_requested' }
    });

    // TODO: Send email with reset link
    console.log(`Password reset link: ${process.env.NEXT_PUBLIC_URL}/reset-password?token=${resetToken}`);

    // Always return success to prevent email enumeration
    return NextResponse.json(
      { 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}

// Confirm password reset
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = confirmResetSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { token, newPassword, confirmPassword } = validation.data;
    
    // Verify passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Hash the token to look it up
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Retrieve reset token data
    const redis = (await import('ioredis')).default;
    const redisClient = new redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    const resetData = await redisClient.get(`password-reset:${resetTokenHash}`);
    
    if (!resetData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const { email, ip: originalIp } = JSON.parse(resetData);
    
    // Validate new password
    const passwordSecurity = getPasswordSecurity();
    const passwordValidation = await passwordSecurity.validatePassword(
      newPassword,
      { email }
    );
    
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet security requirements',
          errors: passwordValidation.errors,
          strength: passwordValidation.strength
        },
        { status: 400 }
      );
    }

    // TODO: Check password history in production
    // const passwordHash = await hashPassword(newPassword);
    // const isInHistory = await passwordSecurity.isPasswordInHistory(userId, passwordHash);
    // if (isInHistory) {
    //   return NextResponse.json(
    //     { error: 'Password has been used recently. Please choose a different password.' },
    //     { status: 400 }
    //   );
    // }

    // TODO: Update password in Clerk
    // For now, we'll simulate the update
    console.log(`Password updated for ${email}`);

    // Delete the reset token
    await redisClient.del(`password-reset:${resetTokenHash}`);

    // Invalidate all existing sessions for this user
    const sessionSecurity = getSessionSecurity();
    // TODO: Get actual user ID from Clerk
    const userId = 'simulated_user_id';
    const invalidatedSessions = await sessionSecurity.invalidateAllUserSessions(userId);

    // Log password change
    const monitor = getAuthMonitor();
    await monitor.logAuthEvent({
      type: 'password_change',
      email,
      userId,
      ip: req.headers.get('x-forwarded-for') || 
          req.headers.get('x-real-ip') || 
          'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      metadata: { 
        action: 'reset_completed',
        sessionsInvalidated: invalidatedSessions,
        originalRequestIp: originalIp
      }
    });

    // TODO: Send confirmation email
    console.log(`Password reset confirmation sent to ${email}`);

    return NextResponse.json(
      { 
        message: 'Password successfully reset. Please sign in with your new password.',
        sessionsInvalidated: invalidatedSessions
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return NextResponse.json(
      { error: 'An error occurred resetting your password' },
      { status: 500 }
    );
  }
}