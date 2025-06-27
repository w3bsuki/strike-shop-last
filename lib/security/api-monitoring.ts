/**
 * API SECURITY MONITORING
 * Real-time API monitoring, anomaly detection, and alerting
 */

import { NextRequest } from 'next/server'
import crypto from 'crypto'

// Monitoring configuration
const MONITORING_CONFIG = {
  // Time windows for analysis (in milliseconds)
  WINDOWS: {
    REALTIME: 60 * 1000,         // 1 minute
    SHORT: 5 * 60 * 1000,        // 5 minutes
    MEDIUM: 60 * 60 * 1000,      // 1 hour
    LONG: 24 * 60 * 60 * 1000   // 24 hours
  },
  
  // Thresholds for anomaly detection
  THRESHOLDS: {
    ERROR_RATE: 0.1,              // 10% error rate
    RESPONSE_TIME_P95: 1000,      // 1 second
    REQUESTS_PER_MINUTE: 10000,   // Total RPS threshold
    FAILED_AUTH_ATTEMPTS: 10,     // Per IP/user
    SUSPICIOUS_PATTERNS: 5        // Suspicious behavior score
  },
  
  // Alert levels
  ALERT_LEVELS: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
  }
}

// Metric types
export enum MetricType {
  REQUEST = 'request',
  ERROR = 'error',
  LATENCY = 'latency',
  AUTH_ATTEMPT = 'auth_attempt',
  RATE_LIMIT = 'rate_limit',
  SECURITY_EVENT = 'security_event',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

// Security event types
export enum SecurityEventType {
  INVALID_AUTH = 'invalid_auth',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_PAYLOAD = 'suspicious_payload',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  UNUSUAL_TRAFFIC_PATTERN = 'unusual_traffic_pattern',
  API_KEY_ABUSE = 'api_key_abuse',
  CORS_VIOLATION = 'cors_violation',
  CSRF_VIOLATION = 'csrf_violation'
}

// Metric data structure
interface ApiMetric {
  id: string
  type: MetricType
  timestamp: Date
  endpoint: string
  method: string
  statusCode?: number
  responseTime?: number
  userId?: string
  ip?: string
  userAgent?: string
  error?: string
  metadata?: Record<string, any>
}

// Security event structure
interface SecurityEvent {
  id: string
  type: SecurityEventType
  severity: string
  timestamp: Date
  endpoint?: string
  userId?: string
  ip?: string
  description: string
  metadata?: Record<string, any>
}

// Alert structure
interface Alert {
  id: string
  level: string
  title: string
  description: string
  timestamp: Date
  metrics?: ApiMetric[]
  events?: SecurityEvent[]
  actionRequired: boolean
}

// In-memory metrics store (replace with Redis/TimescaleDB in production)
class MetricsStore {
  private metrics: Map<string, ApiMetric[]> = new Map()
  private events: SecurityEvent[] = []
  
  addMetric(metric: ApiMetric) {
    const key = `${metric.type}:${metric.endpoint}`
    const existing = this.metrics.get(key) || []
    existing.push(metric)
    
    // Keep only recent metrics
    const cutoff = new Date(Date.now() - MONITORING_CONFIG.WINDOWS.LONG)
    this.metrics.set(key, existing.filter(m => m.timestamp > cutoff))
  }
  
  addEvent(event: SecurityEvent) {
    this.events.push(event)
    
    // Keep only recent events
    const cutoff = new Date(Date.now() - MONITORING_CONFIG.WINDOWS.LONG)
    this.events = this.events.filter(e => e.timestamp > cutoff)
  }
  
  getMetrics(type: MetricType, window: number, filters?: any): ApiMetric[] {
    const cutoff = new Date(Date.now() - window)
    const metrics: ApiMetric[] = []
    
    this.metrics.forEach((value, key) => {
      if (key.startsWith(type)) {
        metrics.push(...value.filter(m => m.timestamp > cutoff))
      }
    })
    
    // Apply filters
    if (filters) {
      return metrics.filter(m => {
        for (const [key, value] of Object.entries(filters)) {
          if (m[key as keyof ApiMetric] !== value) return false
        }
        return true
      })
    }
    
    return metrics
  }
  
  getEvents(window: number, type?: SecurityEventType): SecurityEvent[] {
    const cutoff = new Date(Date.now() - window)
    return this.events.filter(e => 
      e.timestamp > cutoff && (!type || e.type === type)
    )
  }
}

// Global metrics store
const metricsStore = new MetricsStore()

// API Monitor class
export class ApiMonitor {
  private static alertHandlers: Map<string, (alert: Alert) => void> = new Map()
  
  /**
   * Record API request
   */
  static recordRequest(
    request: NextRequest,
    response: { status: number; duration: number },
    context?: {
      userId?: string
      error?: string
    }
  ) {
    const metric: ApiMetric = {
      id: crypto.randomUUID(),
      type: response.status >= 400 ? MetricType.ERROR : MetricType.REQUEST,
      timestamp: new Date(),
      endpoint: request.nextUrl.pathname,
      method: request.method,
      statusCode: response.status,
      responseTime: response.duration,
      userId: context?.userId,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      error: context?.error
    }
    
    metricsStore.addMetric(metric)
    
    // Check for anomalies
    this.detectAnomalies(metric)
  }
  
  /**
   * Record security event
   */
  static recordSecurityEvent(
    type: SecurityEventType,
    severity: string,
    description: string,
    context?: {
      endpoint?: string
      userId?: string
      ip?: string
      metadata?: Record<string, any>
    }
  ) {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type,
      severity,
      timestamp: new Date(),
      description,
      ...context
    }
    
    metricsStore.addEvent(event)
    
    // Check if immediate alert needed
    if (severity === 'critical') {
      this.createAlert(
        MONITORING_CONFIG.ALERT_LEVELS.CRITICAL,
        `Security Event: ${type}`,
        description,
        { events: [event] }
      )
    }
  }
  
  /**
   * Detect anomalies in metrics
   */
  private static detectAnomalies(metric: ApiMetric) {
    // Check response time
    if (metric.responseTime && metric.responseTime > MONITORING_CONFIG.THRESHOLDS.RESPONSE_TIME_P95) {
      this.recordSecurityEvent(
        SecurityEventType.UNUSUAL_TRAFFIC_PATTERN,
        'warning',
        `High response time detected: ${metric.responseTime}ms on ${metric.endpoint}`
      )
    }
    
    // Check error patterns
    if (metric.type === MetricType.ERROR) {
      this.checkErrorRate(metric.endpoint)
    }
    
    // Check authentication failures
    if (metric.statusCode === 401 && metric.endpoint.includes('auth')) {
      this.checkAuthFailures(metric.ip!)
    }
    
    // Run pattern detection
    this.detectSuspiciousPatterns(metric)
  }
  
  /**
   * Check error rate for endpoint
   */
  private static checkErrorRate(endpoint: string) {
    const window = MONITORING_CONFIG.WINDOWS.SHORT
    const errors = metricsStore.getMetrics(MetricType.ERROR, window, { endpoint })
    const total = metricsStore.getMetrics(MetricType.REQUEST, window, { endpoint })
    
    if (total.length > 0) {
      const errorRate = errors.length / total.length
      
      if (errorRate > MONITORING_CONFIG.THRESHOLDS.ERROR_RATE) {
        this.createAlert(
          MONITORING_CONFIG.ALERT_LEVELS.WARNING,
          `High Error Rate on ${endpoint}`,
          `Error rate: ${(errorRate * 100).toFixed(2)}% (${errors.length}/${total.length} requests)`,
          { metrics: errors }
        )
      }
    }
  }
  
  /**
   * Check authentication failures
   */
  private static checkAuthFailures(ip: string) {
    const window = MONITORING_CONFIG.WINDOWS.SHORT
    const failures = metricsStore.getMetrics(
      MetricType.ERROR,
      window,
      { ip, statusCode: 401 }
    )
    
    if (failures.length >= MONITORING_CONFIG.THRESHOLDS.FAILED_AUTH_ATTEMPTS) {
      this.recordSecurityEvent(
        SecurityEventType.INVALID_AUTH,
        'critical',
        `Multiple authentication failures from IP: ${ip}`,
        { ip, metadata: { attemptCount: failures.length } }
      )
    }
  }
  
  /**
   * Detect suspicious patterns
   */
  private static detectSuspiciousPatterns(metric: ApiMetric) {
    const suspiciousIndicators = []
    
    // Check for SQL injection patterns in URL
    if (/(\bUNION\b|\bSELECT\b|'|"|--)/.test(metric.endpoint)) {
      suspiciousIndicators.push('sql_injection_pattern')
    }
    
    // Check for unusual user agents
    if (metric.userAgent && this.isUnusualUserAgent(metric.userAgent)) {
      suspiciousIndicators.push('unusual_user_agent')
    }
    
    // Check for rapid requests from same IP
    const recentRequests = metricsStore.getMetrics(
      MetricType.REQUEST,
      60000, // 1 minute
      { ip: metric.ip }
    )
    
    if (recentRequests.length > 100) {
      suspiciousIndicators.push('rapid_requests')
    }
    
    // Create event if suspicious
    if (suspiciousIndicators.length >= 2) {
      this.recordSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        'warning',
        `Suspicious activity detected from ${metric.ip}`,
        {
          ip: metric.ip,
          endpoint: metric.endpoint,
          metadata: { indicators: suspiciousIndicators }
        }
      )
    }
  }
  
  /**
   * Check if user agent is unusual
   */
  private static isUnusualUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /scanner/i,
      /havij/i,
      /acunetix/i,
      /nmap/i,
      /metasploit/i
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }
  
  /**
   * Create alert
   */
  private static createAlert(
    level: string,
    title: string,
    description: string,
    data?: {
      metrics?: ApiMetric[]
      events?: SecurityEvent[]
    }
  ) {
    const alert: Alert = {
      id: crypto.randomUUID(),
      level,
      title,
      description,
      timestamp: new Date(),
      actionRequired: level === MONITORING_CONFIG.ALERT_LEVELS.CRITICAL,
      ...data
    }
    
    // Send to alert handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert)
      } catch (error) {
        console.error('Alert handler error:', error)
      }
    })
    
    // Log critical alerts
    if (level === MONITORING_CONFIG.ALERT_LEVELS.CRITICAL) {
      console.error(`🚨 CRITICAL ALERT: ${title} - ${description}`)
    }
  }
  
  /**
   * Register alert handler
   */
  static registerAlertHandler(name: string, handler: (alert: Alert) => void) {
    this.alertHandlers.set(name, handler)
  }
  
  /**
   * Get metrics summary
   */
  static getMetricsSummary(window: number = MONITORING_CONFIG.WINDOWS.MEDIUM) {
    const requests = metricsStore.getMetrics(MetricType.REQUEST, window)
    const errors = metricsStore.getMetrics(MetricType.ERROR, window)
    const events = metricsStore.getEvents(window)
    
    // Calculate statistics
    const totalRequests = requests.length
    const totalErrors = errors.length
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0
    
    // Response time statistics
    const responseTimes = requests
      .filter(r => r.responseTime)
      .map(r => r.responseTime!)
      .sort((a, b) => a - b)
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0
    
    const p95ResponseTime = responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length * 0.95)]
      : 0
    
    // Endpoint statistics
    const endpointStats = new Map<string, { requests: number; errors: number }>()
    requests.forEach(r => {
      const stats = endpointStats.get(r.endpoint) || { requests: 0, errors: 0 }
      stats.requests++
      endpointStats.set(r.endpoint, stats)
    })
    errors.forEach(e => {
      const stats = endpointStats.get(e.endpoint) || { requests: 0, errors: 0 }
      stats.errors++
      endpointStats.set(e.endpoint, stats)
    })
    
    return {
      summary: {
        totalRequests,
        totalErrors,
        errorRate,
        avgResponseTime,
        p95ResponseTime,
        securityEvents: events.length
      },
      endpoints: Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
        endpoint,
        ...stats,
        errorRate: stats.requests > 0 ? stats.errors / stats.requests : 0
      })),
      recentEvents: events.slice(-10)
    }
  }
  
  /**
   * Health check
   */
  static getHealthStatus() {
    const summary = this.getMetricsSummary(MONITORING_CONFIG.WINDOWS.SHORT)
    
    const issues = []
    
    if (summary.summary.errorRate > MONITORING_CONFIG.THRESHOLDS.ERROR_RATE) {
      issues.push(`High error rate: ${(summary.summary.errorRate * 100).toFixed(2)}%`)
    }
    
    if (summary.summary.p95ResponseTime > MONITORING_CONFIG.THRESHOLDS.RESPONSE_TIME_P95) {
      issues.push(`High response time: ${summary.summary.p95ResponseTime}ms`)
    }
    
    if (summary.summary.securityEvents > 10) {
      issues.push(`Multiple security events: ${summary.summary.securityEvents}`)
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : issues.length < 3 ? 'degraded' : 'unhealthy',
      issues,
      metrics: summary.summary
    }
  }
}

// Monitoring middleware
export function withMonitoring(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const startTime = Date.now()
    let response: Response
    let error: string | undefined
    
    try {
      response = await handler(request)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      const duration = Date.now() - startTime
      
      ApiMonitor.recordRequest(
        request,
        {
          status: response?.status || 500,
          duration
        },
        { error }
      )
    }
    
    return response
  }
}

// Export monitoring dashboard data
export function getMonitoringDashboard() {
  return {
    health: ApiMonitor.getHealthStatus(),
    metrics: {
      realtime: ApiMonitor.getMetricsSummary(MONITORING_CONFIG.WINDOWS.REALTIME),
      short: ApiMonitor.getMetricsSummary(MONITORING_CONFIG.WINDOWS.SHORT),
      medium: ApiMonitor.getMetricsSummary(MONITORING_CONFIG.WINDOWS.MEDIUM),
      long: ApiMonitor.getMetricsSummary(MONITORING_CONFIG.WINDOWS.LONG)
    }
  }
}