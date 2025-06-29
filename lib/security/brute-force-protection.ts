import Redis from 'ioredis';
import crypto from 'crypto';

export interface BruteForceConfig {
  maxFailedAttempts: number;
  lockoutDuration: number; // in minutes
  captchaThreshold: number;
  ipBlockThreshold: number;
  ipBlockDuration: number; // in hours
}

const DEFAULT_CONFIG: BruteForceConfig = {
  maxFailedAttempts: 5,
  lockoutDuration: 30, // 30 minutes
  captchaThreshold: 3,
  ipBlockThreshold: 20, // 20 failed attempts from same IP
  ipBlockDuration: 24 // 24 hours
};

export class BruteForceProtection {
  private redis: Redis;
  private config: BruteForceConfig;

  constructor(config: Partial<BruteForceConfig> = {}) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Record failed login attempt
  async recordFailedAttempt(email: string, ip: string): Promise<{
    accountLocked: boolean;
    requiresCaptcha: boolean;
    ipBlocked: boolean;
    failedAttempts: number;
    lockoutEndsAt?: Date;
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    const failedKey = `bruteforce:failed:${normalizedEmail}`;
    const lockedKey = `bruteforce:locked:${normalizedEmail}`;
    const ipKey = `bruteforce:ip:${ip}`;
    const ipBlockKey = `bruteforce:ipblock:${ip}`;

    // Check if IP is blocked
    const ipBlocked = await this.redis.exists(ipBlockKey);
    if (ipBlocked) {
      return {
        accountLocked: false,
        requiresCaptcha: false,
        ipBlocked: true,
        failedAttempts: 0
      };
    }

    // Increment failed attempts for email
    const failedAttempts = await this.redis.incr(failedKey);
    if (failedAttempts === 1) {
      await this.redis.expire(failedKey, 3600); // Reset after 1 hour
    }

    // Increment failed attempts for IP
    const ipAttempts = await this.redis.incr(ipKey);
    if (ipAttempts === 1) {
      await this.redis.expire(ipKey, 3600); // Reset after 1 hour
    }

    // Check if IP should be blocked
    if (ipAttempts >= this.config.ipBlockThreshold) {
      await this.redis.setex(
        ipBlockKey,
        this.config.ipBlockDuration * 3600,
        Date.now().toString()
      );
      
      // Log IP block event
      await this.logSecurityEvent('ip_blocked', { ip, attempts: ipAttempts });
      
      return {
        accountLocked: false,
        requiresCaptcha: false,
        ipBlocked: true,
        failedAttempts
      };
    }

    // Check if account should be locked
    if (failedAttempts >= this.config.maxFailedAttempts) {
      const lockoutEndsAt = new Date(Date.now() + this.config.lockoutDuration * 60 * 1000);
      await this.redis.setex(
        lockedKey,
        this.config.lockoutDuration * 60,
        lockoutEndsAt.toISOString()
      );

      // Send notification email
      await this.sendLockoutNotification(email, lockoutEndsAt);
      
      // Log account lockout event
      await this.logSecurityEvent('account_locked', { email, ip, failedAttempts });

      return {
        accountLocked: true,
        requiresCaptcha: true,
        ipBlocked: false,
        failedAttempts,
        lockoutEndsAt
      };
    }

    // Check if CAPTCHA is required
    const requiresCaptcha = failedAttempts >= this.config.captchaThreshold;

    return {
      accountLocked: false,
      requiresCaptcha,
      ipBlocked: false,
      failedAttempts
    };
  }

  // Check if account is locked or IP is blocked
  async checkStatus(email: string, ip: string): Promise<{
    accountLocked: boolean;
    ipBlocked: boolean;
    requiresCaptcha: boolean;
    lockoutEndsAt?: Date;
    message?: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    const lockedKey = `bruteforce:locked:${normalizedEmail}`;
    const failedKey = `bruteforce:failed:${normalizedEmail}`;
    const ipBlockKey = `bruteforce:ipblock:${ip}`;

    // Check IP block
    const ipBlocked = await this.redis.exists(ipBlockKey);
    if (ipBlocked) {
      return {
        accountLocked: false,
        ipBlocked: true,
        requiresCaptcha: false,
        message: 'Your IP address has been temporarily blocked due to suspicious activity.'
      };
    }

    // Check account lock
    const lockoutData = await this.redis.get(lockedKey);
    if (lockoutData) {
      const lockoutEndsAt = new Date(lockoutData);
      return {
        accountLocked: true,
        ipBlocked: false,
        requiresCaptcha: true,
        lockoutEndsAt,
        message: `Account locked due to multiple failed login attempts. Try again after ${lockoutEndsAt.toLocaleTimeString()}.`
      };
    }

    // Check if CAPTCHA is required
    const failedAttempts = parseInt(await this.redis.get(failedKey) || '0');
    const requiresCaptcha = failedAttempts >= this.config.captchaThreshold;

    return {
      accountLocked: false,
      ipBlocked: false,
      requiresCaptcha
    };
  }

  // Clear failed attempts on successful login
  async clearFailedAttempts(email: string, _ip: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await Promise.all([
      this.redis.del(`bruteforce:failed:${normalizedEmail}`),
      this.redis.del(`bruteforce:locked:${normalizedEmail}`)
    ]);
  }

  // Verify CAPTCHA (placeholder - integrate with actual CAPTCHA service)
  async verifyCaptcha(token: string): Promise<boolean> {
    // TODO: Integrate with reCAPTCHA or hCaptcha
    // For now, return true in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // Example reCAPTCHA verification
    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY || '',
          response: token
        })
      });
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('CAPTCHA verification failed:', error);
      return false;
    }
  }

  // Generate unlock token for manual unlock
  async generateUnlockToken(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase().trim();
    const token = crypto.randomBytes(32).toString('hex');
    const tokenKey = `bruteforce:unlock:${token}`;
    
    await this.redis.setex(tokenKey, 3600, normalizedEmail); // Valid for 1 hour
    
    return token;
  }

  // Manually unlock account with token
  async unlockAccount(token: string): Promise<boolean> {
    const tokenKey = `bruteforce:unlock:${token}`;
    const email = await this.redis.get(tokenKey);
    
    if (!email) {
      return false;
    }

    await Promise.all([
      this.redis.del(`bruteforce:locked:${email}`),
      this.redis.del(`bruteforce:failed:${email}`),
      this.redis.del(tokenKey)
    ]);

    await this.logSecurityEvent('account_unlocked', { email, method: 'token' });
    
    return true;
  }

  // Log security events
  private async logSecurityEvent(event: string, data: any): Promise<void> {
    const logEntry = {
      event,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Store in Redis for recent events
    await this.redis.lpush('security:events', JSON.stringify(logEntry));
    await this.redis.ltrim('security:events', 0, 999); // Keep last 1000 events

    // Also log to console/monitoring service
    console.log('[SECURITY EVENT]', logEntry);
  }

  // Send lockout notification email
  private async sendLockoutNotification(email: string, lockoutEndsAt: Date): Promise<void> {
    // TODO: Integrate with email service
    console.log(`[EMAIL] Account lockout notification sent to ${email}`);
    console.log(`Lockout ends at: ${lockoutEndsAt.toISOString()}`);
  }

  // Get security statistics
  async getSecurityStats(): Promise<{
    lockedAccounts: number;
    blockedIPs: number;
    recentEvents: any[];
  }> {
    const [lockedAccounts, blockedIPs, recentEvents] = await Promise.all([
      this.redis.keys('bruteforce:locked:*').then(keys => keys.length),
      this.redis.keys('bruteforce:ipblock:*').then(keys => keys.length),
      this.redis.lrange('security:events', 0, 49).then(events => 
        events.map(e => JSON.parse(e))
      )
    ]);

    return {
      lockedAccounts,
      blockedIPs,
      recentEvents
    };
  }

  // Close Redis connection
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let bruteForceInstance: BruteForceProtection | null = null;

export function getBruteForceProtection(): BruteForceProtection {
  if (!bruteForceInstance) {
    bruteForceInstance = new BruteForceProtection();
  }
  return bruteForceInstance;
}

// Middleware helper for Next.js API routes
export async function checkBruteForce(
  req: Request,
  email: string
): Promise<{ allowed: boolean; error?: string; requiresCaptcha?: boolean }> {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';

  const protection = getBruteForceProtection();
  const status = await protection.checkStatus(email, ip);

  if (status.ipBlocked) {
    return {
      allowed: false,
      error: status.message || 'IP blocked due to suspicious activity'
    };
  }

  if (status.accountLocked) {
    return {
      allowed: false,
      error: status.message || 'Account locked due to failed login attempts',
      requiresCaptcha: true
    };
  }

  return {
    allowed: true,
    requiresCaptcha: status.requiresCaptcha
  };
}