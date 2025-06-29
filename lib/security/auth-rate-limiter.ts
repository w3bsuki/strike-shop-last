import Redis from 'ioredis';

// Rate limiter for authentication attempts
export class AuthRateLimiter {
  private redis: Redis;
  private readonly IP_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly EMAIL_WINDOW = 60 * 60 * 1000; // 1 hour
  private readonly IP_MAX_ATTEMPTS = 5;
  private readonly EMAIL_MAX_ATTEMPTS = 10;
  private readonly BACKOFF_MULTIPLIER = 2;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  // Check if IP is rate limited
  async checkIPLimit(ip: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    backoffMinutes?: number;
  }> {
    const key = `auth:ip:${ip}`;
    const attempts = await this.redis.incr(key);
    
    if (attempts === 1) {
      await this.redis.pexpire(key, this.IP_WINDOW);
    }

    const ttl = await this.redis.pttl(key);
    const resetAt = new Date(Date.now() + ttl);

    if (attempts > this.IP_MAX_ATTEMPTS) {
      // Calculate exponential backoff
      const excess = attempts - this.IP_MAX_ATTEMPTS;
      const backoffMinutes = Math.pow(this.BACKOFF_MULTIPLIER, excess) * 5;
      
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        backoffMinutes: Math.min(backoffMinutes, 60) // Cap at 1 hour
      };
    }

    return {
      allowed: true,
      remaining: this.IP_MAX_ATTEMPTS - attempts,
      resetAt
    };
  }

  // Check if email is rate limited
  async checkEmailLimit(email: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    const key = `auth:email:${normalizedEmail}`;
    const attempts = await this.redis.incr(key);
    
    if (attempts === 1) {
      await this.redis.pexpire(key, this.EMAIL_WINDOW);
    }

    const ttl = await this.redis.pttl(key);
    const resetAt = new Date(Date.now() + ttl);

    return {
      allowed: attempts <= this.EMAIL_MAX_ATTEMPTS,
      remaining: Math.max(0, this.EMAIL_MAX_ATTEMPTS - attempts),
      resetAt
    };
  }

  // Combined check for both IP and email
  async checkLimit(ip: string, email: string): Promise<{
    allowed: boolean;
    reason?: 'ip' | 'email';
    remaining: number;
    resetAt: Date;
    backoffMinutes?: number;
  }> {
    const [ipCheck, emailCheck] = await Promise.all([
      this.checkIPLimit(ip),
      this.checkEmailLimit(email)
    ]);

    if (!ipCheck.allowed) {
      return {
        allowed: false,
        reason: 'ip',
        remaining: ipCheck.remaining,
        resetAt: ipCheck.resetAt,
        ...(ipCheck.backoffMinutes !== undefined && { backoffMinutes: ipCheck.backoffMinutes })
      };
    }

    if (!emailCheck.allowed) {
      return {
        allowed: false,
        reason: 'email',
        remaining: emailCheck.remaining,
        resetAt: emailCheck.resetAt
      };
    }

    return {
      allowed: true,
      remaining: Math.min(ipCheck.remaining, emailCheck.remaining),
      resetAt: ipCheck.resetAt > emailCheck.resetAt ? ipCheck.resetAt : emailCheck.resetAt
    };
  }

  // Reset limits for successful authentication
  async resetLimits(ip: string, email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await Promise.all([
      this.redis.del(`auth:ip:${ip}`),
      this.redis.del(`auth:email:${normalizedEmail}`)
    ]);
  }

  // Get current attempt counts
  async getAttemptCounts(ip: string, email: string): Promise<{
    ipAttempts: number;
    emailAttempts: number;
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    const [ipAttempts, emailAttempts] = await Promise.all([
      this.redis.get(`auth:ip:${ip}`),
      this.redis.get(`auth:email:${normalizedEmail}`)
    ]);

    return {
      ipAttempts: parseInt(ipAttempts || '0'),
      emailAttempts: parseInt(emailAttempts || '0')
    };
  }

  // Close Redis connection
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let rateLimiterInstance: AuthRateLimiter | null = null;

export function getAuthRateLimiter(): AuthRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new AuthRateLimiter();
  }
  return rateLimiterInstance;
}

// Helper function for API routes
export async function checkAuthRateLimit(
  req: Request
): Promise<{ allowed: boolean; error?: string; headers?: Record<string, string> }> {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  const body = await req.json();
  const email = body.email || body.identifier || '';

  if (!email) {
    return { allowed: true }; // Don't rate limit if no email provided
  }

  const rateLimiter = getAuthRateLimiter();
  const result = await rateLimiter.checkLimit(ip, email);

  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString()
  };

  if (!result.allowed) {
    let error = `Too many authentication attempts. `;
    if (result.reason === 'ip') {
      error += `Your IP has been temporarily blocked. `;
      if (result.backoffMinutes) {
        error += `Please wait ${result.backoffMinutes} minutes before trying again.`;
      }
    } else {
      error += `This email has exceeded the maximum number of attempts. `;
    }
    error += ` Reset at: ${result.resetAt.toLocaleTimeString()}`;

    return {
      allowed: false,
      error,
      headers
    };
  }

  return { allowed: true, headers };
}