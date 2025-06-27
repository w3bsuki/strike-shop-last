import Redis from 'ioredis';
import crypto from 'crypto';

export interface AuthEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'mfa_enabled' | 'mfa_disabled' | 'suspicious_activity';
  userId?: string;
  email: string;
  ip: string;
  userAgent: string;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  deviceFingerprint?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SuspiciousPattern {
  type: 'rapid_location_change' | 'multiple_failed_logins' | 'unusual_time' | 'new_device' | 'impossible_travel';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export class AuthMonitor {
  private redis: Redis;
  private readonly EVENTS_TTL = 30 * 24 * 60 * 60; // 30 days
  private readonly LOCATION_CACHE_TTL = 24 * 60 * 60; // 24 hours

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  // Log authentication event
  async logAuthEvent(event: Omit<AuthEvent, 'id' | 'timestamp'>): Promise<AuthEvent> {
    const fullEvent: AuthEvent = {
      ...event,
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date()
    };

    // Store event in Redis
    const key = `auth:events:${fullEvent.email}:${fullEvent.id}`;
    await this.redis.setex(key, this.EVENTS_TTL, JSON.stringify(fullEvent));

    // Add to user's event list
    await this.redis.zadd(
      `auth:events:list:${fullEvent.email}`,
      fullEvent.timestamp.getTime(),
      fullEvent.id
    );

    // Add to global event stream
    await this.redis.xadd(
      'auth:events:stream',
      '*',
      'event',
      JSON.stringify(fullEvent)
    );

    // Check for suspicious patterns
    await this.detectSuspiciousActivity(fullEvent);

    return fullEvent;
  }

  // Detect suspicious authentication patterns
  private async detectSuspiciousActivity(event: AuthEvent): Promise<void> {
    const suspiciousPatterns: SuspiciousPattern[] = [];

    // Get recent events for comparison
    const recentEvents = await this.getRecentEvents(event.email, 24); // Last 24 hours

    // Check for rapid location changes
    if (event.location && recentEvents.length > 0) {
      const locationPattern = await this.checkLocationAnomaly(event, recentEvents);
      if (locationPattern) {
        suspiciousPatterns.push(locationPattern);
      }
    }

    // Check for multiple failed logins
    const failedLogins = recentEvents.filter(e => e.type === 'failed_login');
    if (failedLogins.length >= 5) {
      suspiciousPatterns.push({
        type: 'multiple_failed_logins',
        severity: 'high',
        description: `${failedLogins.length} failed login attempts in the last 24 hours`
      });
    }

    // Check for unusual login time
    const timePattern = this.checkUnusualTime(event);
    if (timePattern) {
      suspiciousPatterns.push(timePattern);
    }

    // Check for new device
    if (event.deviceFingerprint) {
      const isNewDevice = await this.isNewDevice(event.email, event.deviceFingerprint);
      if (isNewDevice) {
        suspiciousPatterns.push({
          type: 'new_device',
          severity: 'low',
          description: 'Login from a new device'
        });
      }
    }

    // If suspicious patterns detected, log and alert
    if (suspiciousPatterns.length > 0) {
      await this.handleSuspiciousActivity(event, suspiciousPatterns);
    }
  }

  // Check for impossible travel or rapid location changes
  private async checkLocationAnomaly(
    currentEvent: AuthEvent,
    recentEvents: AuthEvent[]
  ): Promise<SuspiciousPattern | null> {
    if (!currentEvent.location) return null;

    for (const prevEvent of recentEvents) {
      if (!prevEvent.location || prevEvent.type !== 'login') continue;

      const timeDiff = (currentEvent.timestamp.getTime() - prevEvent.timestamp.getTime()) / 1000 / 60; // minutes
      const distance = this.calculateDistance(
        currentEvent.location,
        prevEvent.location
      );

      // Impossible travel: >500km in less than 30 minutes
      if (distance > 500 && timeDiff < 30) {
        return {
          type: 'impossible_travel',
          severity: 'critical',
          description: `Login from ${currentEvent.location.city} after login from ${prevEvent.location.city} ${Math.round(timeDiff)} minutes ago (${Math.round(distance)}km apart)`
        };
      }

      // Rapid location change: >100km in less than 60 minutes
      if (distance > 100 && timeDiff < 60) {
        return {
          type: 'rapid_location_change',
          severity: 'medium',
          description: `Rapid location change detected: ${Math.round(distance)}km in ${Math.round(timeDiff)} minutes`
        };
      }
    }

    return null;
  }

  // Calculate distance between two locations (Haversine formula)
  private calculateDistance(loc1: any, loc2: any): number {
    if (!loc1.latitude || !loc1.longitude || !loc2.latitude || !loc2.longitude) {
      return 0;
    }

    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);
    const lat1 = this.toRad(loc1.latitude);
    const lat2 = this.toRad(loc2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * 
              Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Check for unusual login time
  private checkUnusualTime(event: AuthEvent): SuspiciousPattern | null {
    const hour = event.timestamp.getHours();
    const dayOfWeek = event.timestamp.getDay();

    // Unusual time: 2 AM - 5 AM on weekdays
    if (hour >= 2 && hour <= 5 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      return {
        type: 'unusual_time',
        severity: 'low',
        description: `Login at unusual time: ${event.timestamp.toLocaleTimeString()}`
      };
    }

    return null;
  }

  // Check if device is new
  private async isNewDevice(email: string, deviceFingerprint: string): Promise<boolean> {
    const knownDevices = await this.redis.smembers(`auth:devices:${email}`);
    const isNew = !knownDevices.includes(deviceFingerprint);
    
    if (isNew) {
      await this.redis.sadd(`auth:devices:${email}`, deviceFingerprint);
    }
    
    return isNew;
  }

  // Handle suspicious activity detection
  private async handleSuspiciousActivity(
    event: AuthEvent,
    patterns: SuspiciousPattern[]
  ): Promise<void> {
    // Log suspicious activity event
    const suspiciousEvent: AuthEvent = {
      ...event,
      type: 'suspicious_activity',
      metadata: {
        ...event.metadata,
        suspiciousPatterns: patterns
      }
    };

    await this.logAuthEvent(suspiciousEvent);

    // Check severity and take action
    const highSeverity = patterns.some(p => p.severity === 'high' || p.severity === 'critical');
    
    if (highSeverity) {
      // Send immediate alert
      await this.sendSecurityAlert(event.email, patterns);
      
      // For critical severity, consider additional actions
      const criticalSeverity = patterns.some(p => p.severity === 'critical');
      if (criticalSeverity) {
        // Flag account for review
        await this.redis.setex(
          `auth:flagged:${event.email}`,
          24 * 60 * 60, // 24 hours
          JSON.stringify({ patterns, timestamp: new Date() })
        );
      }
    }
  }

  // Send security alert
  private async sendSecurityAlert(email: string, patterns: SuspiciousPattern[]): Promise<void> {
    // TODO: Integrate with notification service
    console.log('[SECURITY ALERT]', {
      email,
      patterns,
      timestamp: new Date().toISOString()
    });
  }

  // Get recent authentication events
  async getRecentEvents(email: string, hours: number = 24): Promise<AuthEvent[]> {
    const since = Date.now() - (hours * 60 * 60 * 1000);
    const eventIds = await this.redis.zrangebyscore(
      `auth:events:list:${email}`,
      since,
      '+inf'
    );

    const events: AuthEvent[] = [];
    for (const id of eventIds) {
      const eventData = await this.redis.get(`auth:events:${email}:${id}`);
      if (eventData) {
        events.push(JSON.parse(eventData));
      }
    }

    return events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Get authentication statistics
  async getAuthStats(email: string): Promise<{
    totalLogins: number;
    failedLogins: number;
    uniqueDevices: number;
    uniqueLocations: number;
    lastLogin?: Date;
    suspiciousActivities: number;
  }> {
    const events = await this.getRecentEvents(email, 30 * 24); // Last 30 days
    const devices = await this.redis.scard(`auth:devices:${email}`);
    
    const locations = new Set();
    let lastLogin: Date | undefined;
    
    const stats = events.reduce((acc, event) => {
      if (event.type === 'login') {
        acc.totalLogins++;
        if (!lastLogin || new Date(event.timestamp) > lastLogin) {
          lastLogin = new Date(event.timestamp);
        }
      }
      if (event.type === 'failed_login') {
        acc.failedLogins++;
      }
      if (event.type === 'suspicious_activity') {
        acc.suspiciousActivities++;
      }
      if (event.location?.city) {
        locations.add(event.location.city);
      }
      return acc;
    }, {
      totalLogins: 0,
      failedLogins: 0,
      suspiciousActivities: 0
    });

    return {
      ...stats,
      uniqueDevices: devices,
      uniqueLocations: locations.size,
      lastLogin
    };
  }

  // Get global authentication metrics
  async getGlobalMetrics(): Promise<{
    totalEvents: number;
    recentEvents: AuthEvent[];
    flaggedAccounts: number;
    topFailedEmails: Array<{ email: string; count: number }>;
  }> {
    // Get recent events from stream
    const streamEvents = await this.redis.xrevrange(
      'auth:events:stream',
      '+',
      '-',
      'COUNT',
      '100'
    );

    const recentEvents = streamEvents.map(([id, fields]) => {
      const eventData = fields.find((f, i) => i % 2 === 0 && f === 'event');
      const eventIndex = fields.indexOf(eventData!);
      return JSON.parse(fields[eventIndex + 1]);
    });

    // Get flagged accounts
    const flaggedKeys = await this.redis.keys('auth:flagged:*');
    
    // Calculate top failed emails
    const failedCounts = new Map<string, number>();
    recentEvents.forEach(event => {
      if (event.type === 'failed_login') {
        failedCounts.set(event.email, (failedCounts.get(event.email) || 0) + 1);
      }
    });

    const topFailedEmails = Array.from(failedCounts.entries())
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: recentEvents.length,
      recentEvents: recentEvents.slice(0, 10),
      flaggedAccounts: flaggedKeys.length,
      topFailedEmails
    };
  }

  // Generate device fingerprint
  static generateDeviceFingerprint(userAgent: string, acceptHeaders?: string): string {
    const data = `${userAgent}:${acceptHeaders || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  // Get location from IP (placeholder - integrate with IP geolocation service)
  async getLocationFromIP(ip: string): Promise<AuthEvent['location'] | undefined> {
    // Check cache first
    const cached = await this.redis.get(`location:cache:${ip}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // TODO: Integrate with IP geolocation service (e.g., ipinfo.io, maxmind)
    // For now, return undefined
    return undefined;
  }

  // Close Redis connection
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let authMonitorInstance: AuthMonitor | null = null;

export function getAuthMonitor(): AuthMonitor {
  if (!authMonitorInstance) {
    authMonitorInstance = new AuthMonitor();
  }
  return authMonitorInstance;
}

// Helper function for logging auth events in API routes
export async function logAuthenticationEvent(
  req: Request,
  email: string,
  type: AuthEvent['type'],
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const monitor = getAuthMonitor();
  
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const acceptHeaders = req.headers.get('accept') || '';
  
  const deviceFingerprint = AuthMonitor.generateDeviceFingerprint(
    userAgent,
    acceptHeaders
  );

  const location = await monitor.getLocationFromIP(ip);

  await monitor.logAuthEvent({
    type,
    userId,
    email,
    ip,
    userAgent,
    location,
    deviceFingerprint,
    metadata
  });
}