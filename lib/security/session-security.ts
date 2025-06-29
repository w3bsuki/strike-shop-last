import Redis from 'ioredis';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export interface SessionConfig {
  maxConcurrentSessions: number;
  sessionTimeout: number; // in minutes
  absoluteTimeout: number; // in minutes
  inactivityTimeout: number; // in minutes
  rotateSessionIdInterval: number; // in minutes
  secureCookie: boolean;
}

const DEFAULT_CONFIG: SessionConfig = {
  maxConcurrentSessions: 3,
  sessionTimeout: 30, // 30 minutes sliding window
  absoluteTimeout: 480, // 8 hours absolute max
  inactivityTimeout: 15, // 15 minutes of inactivity
  rotateSessionIdInterval: 60, // Rotate session ID every hour
  secureCookie: process.env.NODE_ENV === 'production'
};

export interface SecureSession {
  id: string;
  userId: string;
  email: string;
  createdAt: Date;
  lastActivity: Date;
  lastRotation: Date;
  ip: string;
  userAgent: string;
  deviceFingerprint: string;
  metadata?: Record<string, any>;
}

export class SessionSecurity {
  private redis: Redis;
  private config: SessionConfig;

  constructor(config: Partial<SessionConfig> = {}) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Create a new secure session
  async createSession(
    userId: string,
    email: string,
    ip: string,
    userAgent: string,
    deviceFingerprint: string,
    metadata?: Record<string, any>
  ): Promise<{ session: SecureSession; token: string }> {
    // Check concurrent session limit
    await this.enforceSessionLimit(userId);

    const sessionId = this.generateSessionId();
    const now = new Date();
    
    const session: SecureSession = {
      id: sessionId,
      userId,
      email,
      createdAt: now,
      lastActivity: now,
      lastRotation: now,
      ip,
      userAgent,
      deviceFingerprint,
      ...(metadata && { metadata })
    };

    // Store session in Redis
    const sessionKey = `session:${sessionId}`;
    await this.redis.setex(
      sessionKey,
      this.config.sessionTimeout * 60,
      JSON.stringify(session)
    );

    // Add to user's session list
    await this.redis.zadd(
      `user:sessions:${userId}`,
      now.getTime(),
      sessionId
    );

    // Generate secure token
    const token = this.generateSecureToken(sessionId);

    return { session, token };
  }

  // Validate and refresh session
  async validateSession(token: string): Promise<{
    valid: boolean;
    session?: SecureSession;
    newToken?: string;
    reason?: string;
  }> {
    const sessionId = this.extractSessionId(token);
    if (!sessionId) {
      return { valid: false, reason: 'Invalid token format' };
    }

    const sessionKey = `session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);
    
    if (!sessionData) {
      return { valid: false, reason: 'Session not found or expired' };
    }

    const session: SecureSession = JSON.parse(sessionData);
    const now = new Date();

    // Check absolute timeout
    const sessionAge = now.getTime() - new Date(session.createdAt).getTime();
    if (sessionAge > this.config.absoluteTimeout * 60 * 1000) {
      await this.invalidateSession(sessionId);
      return { valid: false, reason: 'Session exceeded absolute timeout' };
    }

    // Check inactivity timeout
    const inactivityPeriod = now.getTime() - new Date(session.lastActivity).getTime();
    if (inactivityPeriod > this.config.inactivityTimeout * 60 * 1000) {
      await this.invalidateSession(sessionId);
      return { valid: false, reason: 'Session timed out due to inactivity' };
    }

    // Update last activity
    session.lastActivity = now;

    // Check if session ID should be rotated
    let newToken: string | undefined;
    const rotationAge = now.getTime() - new Date(session.lastRotation).getTime();
    if (rotationAge > this.config.rotateSessionIdInterval * 60 * 1000) {
      const rotationResult = await this.rotateSessionId(session);
      session.id = rotationResult.newSessionId;
      session.lastRotation = now;
      newToken = rotationResult.newToken;
    }

    // Extend session TTL
    await this.redis.setex(
      `session:${session.id}`,
      this.config.sessionTimeout * 60,
      JSON.stringify(session)
    );

    return { valid: true, session, ...(newToken && { newToken }) };
  }

  // Rotate session ID for security
  private async rotateSessionId(session: SecureSession): Promise<{
    newSessionId: string;
    newToken: string;
  }> {
    const oldSessionId = session.id;
    const newSessionId = this.generateSessionId();
    
    // Copy session with new ID
    const newSession = { ...session, id: newSessionId };
    
    // Store new session
    await this.redis.setex(
      `session:${newSessionId}`,
      this.config.sessionTimeout * 60,
      JSON.stringify(newSession)
    );

    // Update user's session list
    await this.redis.zrem(`user:sessions:${session.userId}`, oldSessionId);
    await this.redis.zadd(
      `user:sessions:${session.userId}`,
      Date.now(),
      newSessionId
    );

    // Delete old session
    await this.redis.del(`session:${oldSessionId}`);

    const newToken = this.generateSecureToken(newSessionId);
    
    return { newSessionId, newToken };
  }

  // Enforce concurrent session limit
  private async enforceSessionLimit(userId: string): Promise<void> {
    const sessions = await this.redis.zrange(
      `user:sessions:${userId}`,
      0,
      -1
    );

    if (sessions.length >= this.config.maxConcurrentSessions) {
      // Remove oldest sessions
      const toRemove = sessions.slice(0, sessions.length - this.config.maxConcurrentSessions + 1);
      
      for (const sessionId of toRemove) {
        await this.invalidateSession(sessionId);
      }
    }
  }

  // Invalidate session
  async invalidateSession(sessionId: string): Promise<void> {
    const sessionData = await this.redis.get(`session:${sessionId}`);
    if (sessionData) {
      const session: SecureSession = JSON.parse(sessionData);
      await this.redis.zrem(`user:sessions:${session.userId}`, sessionId);
    }
    
    await this.redis.del(`session:${sessionId}`);
  }

  // Invalidate all sessions for a user (e.g., on password change)
  async invalidateAllUserSessions(userId: string): Promise<number> {
    const sessions = await this.redis.zrange(
      `user:sessions:${userId}`,
      0,
      -1
    );

    for (const sessionId of sessions) {
      await this.redis.del(`session:${sessionId}`);
    }

    await this.redis.del(`user:sessions:${userId}`);
    
    return sessions.length;
  }

  // Get all active sessions for a user
  async getUserSessions(userId: string): Promise<SecureSession[]> {
    const sessionIds = await this.redis.zrange(
      `user:sessions:${userId}`,
      0,
      -1
    );

    const sessions: SecureSession[] = [];
    
    for (const sessionId of sessionIds) {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (sessionData) {
        sessions.push(JSON.parse(sessionData));
      }
    }

    return sessions.sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  }

  // Generate secure session ID
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate secure token
  private generateSecureToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    const signature = this.createSignature(sessionId, timestamp);
    
    return Buffer.from(
      JSON.stringify({ sessionId, timestamp, random, signature })
    ).toString('base64url');
  }

  // Extract session ID from token
  private extractSessionId(token: string): string | null {
    try {
      const decoded = JSON.parse(
        Buffer.from(token, 'base64url').toString()
      );
      
      // Verify signature
      const expectedSignature = this.createSignature(
        decoded.sessionId,
        decoded.timestamp
      );
      
      if (decoded.signature !== expectedSignature) {
        return null;
      }
      
      return decoded.sessionId;
    } catch {
      return null;
    }
  }

  // Create HMAC signature
  private createSignature(sessionId: string, timestamp: string): string {
    const secret = process.env.SESSION_SECRET || 'default-secret-change-me';
    return crypto
      .createHmac('sha256', secret)
      .update(`${sessionId}:${timestamp}`)
      .digest('hex');
  }

  // Get session statistics
  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    sessionsByUser: Array<{ userId: string; count: number }>;
    averageSessionDuration: number;
  }> {
    const allSessionKeys = await this.redis.keys('session:*');
    const userSessionCounts = new Map<string, number>();
    let totalDuration = 0;
    let sessionCount = 0;

    for (const key of allSessionKeys) {
      const sessionData = await this.redis.get(key);
      if (sessionData) {
        const session: SecureSession = JSON.parse(sessionData);
        userSessionCounts.set(
          session.userId,
          (userSessionCounts.get(session.userId) || 0) + 1
        );
        
        const duration = new Date(session.lastActivity).getTime() - 
                        new Date(session.createdAt).getTime();
        totalDuration += duration;
        sessionCount++;
      }
    }

    const sessionsByUser = Array.from(userSessionCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalActiveSessions: sessionCount,
      sessionsByUser,
      averageSessionDuration: sessionCount > 0 ? totalDuration / sessionCount : 0
    };
  }

  // Close Redis connection
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let sessionSecurityInstance: SessionSecurity | null = null;

export function getSessionSecurity(): SessionSecurity {
  if (!sessionSecurityInstance) {
    sessionSecurityInstance = new SessionSecurity();
  }
  return sessionSecurityInstance;
}

// Middleware helper for session validation
export async function validateSessionMiddleware(
  req: NextRequest
): Promise<{ valid: boolean; session?: SecureSession; response?: NextResponse }> {
  const token = req.cookies.get('session-token')?.value || 
                req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return { valid: false };
  }

  const sessionSecurity = getSessionSecurity();
  const result = await sessionSecurity.validateSession(token);

  if (!result.valid) {
    return { valid: false };
  }

  // If new token generated, set it in response
  if (result.newToken) {
    const response = NextResponse.next();
    response.cookies.set('session-token', result.newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8 // 8 hours
    });
    
    return { valid: true, ...(result.session && { session: result.session }), response };
  }

  return { valid: true, ...(result.session && { session: result.session }) };
}