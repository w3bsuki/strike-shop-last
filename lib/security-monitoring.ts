/**
 * Security Monitoring System
 * Real-time security event tracking and alerting
 */

import { headers } from 'next/headers';

// Security event types
export enum SecurityEventType {
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_ORIGIN = 'INVALID_ORIGIN',
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  PATH_TRAVERSAL_ATTEMPT = 'PATH_TRAVERSAL_ATTEMPT',
  BLOCKED_IP = 'BLOCKED_IP',
  MULTIPLE_AUTH_FAILURES = 'MULTIPLE_AUTH_FAILURES',
  SUSPICIOUS_USER_AGENT = 'SUSPICIOUS_USER_AGENT',
  INVALID_INPUT = 'INVALID_INPUT',
  FILE_UPLOAD_VIOLATION = 'FILE_UPLOAD_VIOLATION',
  API_ABUSE = 'API_ABUSE',
  PAYMENT_FRAUD_ATTEMPT = 'PAYMENT_FRAUD_ATTEMPT'
}

// Security event severity levels
export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Security event interface
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  ip: string;
  userAgent?: string;
  path?: string;
  method?: string;
  userId?: string;
  details: Record<string, any>;
  blocked: boolean;
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  [SecurityEventType.AUTHENTICATION_FAILED]: { count: 5, window: 300000 }, // 5 failures in 5 minutes
  [SecurityEventType.RATE_LIMIT_EXCEEDED]: { count: 10, window: 600000 }, // 10 in 10 minutes
  [SecurityEventType.SUSPICIOUS_REQUEST]: { count: 3, window: 300000 }, // 3 in 5 minutes
  [SecurityEventType.XSS_ATTEMPT]: { count: 1, window: 0 }, // Immediate alert
  [SecurityEventType.SQL_INJECTION_ATTEMPT]: { count: 1, window: 0 }, // Immediate alert
  [SecurityEventType.PAYMENT_FRAUD_ATTEMPT]: { count: 1, window: 0 }, // Immediate alert
};

/**
 * Security Monitoring Service
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: Map<string, SecurityEvent[]> = new Map();
  private ipReputations: Map<string, number> = new Map();
  private alertCallbacks: ((event: SecurityEvent) => void)[] = [];

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Log a security event
   */
  logEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    details: {
      ip: string;
      userAgent?: string;
      path?: string;
      method?: string;
      userId?: string;
      [key: string]: any;
    },
    blocked: boolean = false
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type,
      severity,
      timestamp: new Date(),
      ip: details.ip,
      userAgent: details.userAgent,
      path: details.path,
      method: details.method,
      userId: details.userId,
      details,
      blocked
    };

    // Store event by IP
    const ipEvents = this.events.get(details.ip) || [];
    ipEvents.push(event);
    this.events.set(details.ip, ipEvents);

    // Update IP reputation
    this.updateIPReputation(details.ip, severity);

    // Log to console based on severity
    this.logToConsole(event);

    // Check if alert threshold reached
    this.checkAlertThreshold(details.ip, type);

    // Trigger alert callbacks
    if (severity === SecuritySeverity.CRITICAL || severity === SecuritySeverity.HIGH) {
      this.triggerAlerts(event);
    }

    // Clean up old events periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return event;
  }

  /**
   * Get events for a specific IP
   */
  getEventsByIP(ip: string, timeWindow?: number): SecurityEvent[] {
    const events = this.events.get(ip) || [];
    if (!timeWindow) return events;

    const cutoff = Date.now() - timeWindow;
    return events.filter(e => e.timestamp.getTime() > cutoff);
  }

  /**
   * Get IP reputation score (0-100, lower is worse)
   */
  getIPReputation(ip: string): number {
    return this.ipReputations.get(ip) || 100;
  }

  /**
   * Check if IP should be blocked based on reputation
   */
  shouldBlockIP(ip: string): boolean {
    const reputation = this.getIPReputation(ip);
    const recentCriticalEvents = this.getEventsByIP(ip, 3600000) // Last hour
      .filter(e => e.severity === SecuritySeverity.CRITICAL);
    
    return reputation < 20 || recentCriticalEvents.length > 0;
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (event: SecurityEvent) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Get security statistics
   */
  getStatistics(timeWindow: number = 3600000): {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecuritySeverity, number>;
    topOffendingIPs: Array<{ ip: string; count: number; reputation: number }>;
    blockedRequests: number;
  } {
    const cutoff = Date.now() - timeWindow;
    const recentEvents: SecurityEvent[] = [];
    
    for (const events of this.events.values()) {
      recentEvents.push(...events.filter(e => e.timestamp.getTime() > cutoff));
    }

    const eventsByType: Partial<Record<SecurityEventType, number>> = {};
    const eventsBySeverity: Partial<Record<SecuritySeverity, number>> = {};
    const ipCounts = new Map<string, number>();

    for (const event of recentEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      ipCounts.set(event.ip, (ipCounts.get(event.ip) || 0) + 1);
    }

    const topOffendingIPs = Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({
        ip,
        count,
        reputation: this.getIPReputation(ip)
      }));

    return {
      totalEvents: recentEvents.length,
      eventsByType: eventsByType as Record<SecurityEventType, number>,
      eventsBySeverity: eventsBySeverity as Record<SecuritySeverity, number>,
      topOffendingIPs,
      blockedRequests: recentEvents.filter(e => e.blocked).length
    };
  }

  /**
   * Update IP reputation based on event severity
   */
  private updateIPReputation(ip: string, severity: SecuritySeverity): void {
    const current = this.ipReputations.get(ip) || 100;
    let penalty = 0;

    switch (severity) {
      case SecuritySeverity.LOW:
        penalty = 2;
        break;
      case SecuritySeverity.MEDIUM:
        penalty = 5;
        break;
      case SecuritySeverity.HIGH:
        penalty = 10;
        break;
      case SecuritySeverity.CRITICAL:
        penalty = 20;
        break;
    }

    const newReputation = Math.max(0, current - penalty);
    this.ipReputations.set(ip, newReputation);

    // Gradually restore reputation over time
    setTimeout(() => {
      const restored = Math.min(100, this.getIPReputation(ip) + 1);
      this.ipReputations.set(ip, restored);
    }, 3600000); // 1 hour
  }

  /**
   * Check if alert threshold is reached
   */
  private checkAlertThreshold(ip: string, type: SecurityEventType): void {
    const threshold = ALERT_THRESHOLDS[type];
    if (!threshold) return;

    const events = this.getEventsByIP(ip, threshold.window)
      .filter(e => e.type === type);

    if (events.length >= threshold.count) {
      this.logEvent(
        SecurityEventType.API_ABUSE,
        SecuritySeverity.HIGH,
        {
          ip,
          details: {
            originalType: type,
            count: events.length,
            window: threshold.window
          }
        },
        true
      );
    }
  }

  /**
   * Log event to console with appropriate formatting
   */
  private logToConsole(event: SecurityEvent): void {
    const emoji = {
      [SecuritySeverity.LOW]: '📝',
      [SecuritySeverity.MEDIUM]: '⚠️',
      [SecuritySeverity.HIGH]: '🚨',
      [SecuritySeverity.CRITICAL]: '🔴'
    };

    const message = `${emoji[event.severity]} SECURITY ${event.severity}: ${event.type}`;
    const details = {
      id: event.id,
      ip: event.ip,
      path: event.path,
      method: event.method,
      userAgent: event.userAgent,
      blocked: event.blocked,
      timestamp: event.timestamp.toISOString(),
      ...event.details
    };

    switch (event.severity) {
      case SecuritySeverity.CRITICAL:
      case SecuritySeverity.HIGH:
        console.error(message, details);
        break;
      case SecuritySeverity.MEDIUM:
        console.warn(message, details);
        break;
      default:
        console.log(message, details);
    }
  }

  /**
   * Trigger alert callbacks
   */
  private triggerAlerts(event: SecurityEvent): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    }
  }

  /**
   * Clean up old events
   */
  private cleanup(): void {
    const cutoff = Date.now() - 86400000; // 24 hours
    
    for (const [ip, events] of this.events.entries()) {
      const filtered = events.filter(e => e.timestamp.getTime() > cutoff);
      if (filtered.length === 0) {
        this.events.delete(ip);
      } else {
        this.events.set(ip, filtered);
      }
    }
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

/**
 * Helper function to log security events from API routes
 */
export function logSecurityEvent(
  type: SecurityEventType,
  severity: SecuritySeverity,
  request: Request,
  details: Record<string, any> = {},
  blocked: boolean = false
): SecurityEvent {
  const headersList = headers();
  
  return securityMonitor.logEvent(type, severity, {
    ip: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
    userAgent: headersList.get('user-agent') || undefined,
    path: new URL(request.url).pathname,
    method: request.method,
    ...details
  }, blocked);
}

/**
 * Security monitoring middleware for API routes
 */
export function withSecurityMonitoring<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    rateLimit?: { window: number; max: number };
    requireAuth?: boolean;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as Request;
    const ip = headers().get('x-forwarded-for') || 'unknown';
    
    // Check IP reputation
    if (securityMonitor.shouldBlockIP(ip)) {
      logSecurityEvent(
        SecurityEventType.BLOCKED_IP,
        SecuritySeverity.HIGH,
        request,
        { reason: 'Low IP reputation' },
        true
      );
      
      return new Response('Forbidden', { status: 403 });
    }
    
    try {
      return await handler(...args);
    } catch (error) {
      // Log unexpected errors as potential security issues
      logSecurityEvent(
        SecurityEventType.SUSPICIOUS_REQUEST,
        SecuritySeverity.MEDIUM,
        request,
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      );
      
      throw error;
    }
  }) as T;
}