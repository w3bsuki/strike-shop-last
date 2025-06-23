/**
 * 🚨 SECURITY MONITORING & ALERTING SYSTEM
 * Real-time security threat detection and incident response
 * Implements enterprise-grade security monitoring
 */

import type { NextRequest } from 'next/server'

// 🛡️ Security Alert Levels
export enum SecurityAlertLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 🚨 Security Event Types
export enum SecurityEventType {
  // Authentication & Authorization
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  FAILED_LOGIN = 'FAILED_LOGIN',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  
  // Attack Patterns
  BRUTE_FORCE = 'BRUTE_FORCE',
  SQL_INJECTION = 'SQL_INJECTION',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  
  // Network Security
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_IP = 'SUSPICIOUS_IP',
  DDoS_PATTERN = 'DDOS_PATTERN',
  
  // Data Protection
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  
  // System Security
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  
  // Payment Security
  PAYMENT_FRAUD = 'PAYMENT_FRAUD',
  UNUSUAL_PAYMENT_PATTERN = 'UNUSUAL_PAYMENT_PATTERN'
}

// 📊 Security Event Interface
export interface SecurityEvent {
  id: string
  timestamp: Date
  type: SecurityEventType
  level: SecurityAlertLevel
  source: string
  ip: string
  userAgent?: string
  userId?: string
  description: string
  metadata: Record<string, any>
  resolved: boolean
  responseActions: string[]
}

// 🔍 Threat Detection Patterns
export const THREAT_PATTERNS = {
  // SQL Injection patterns
  SQL_INJECTION: [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/gi,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
    /['"];?\s*(--|\/\*)/gi,
    /\/\*[\s\S]*?\*\//gi,
  ],
  
  // XSS patterns
  XSS_PATTERNS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
  ],
  
  // Directory Traversal
  DIRECTORY_TRAVERSAL: [
    /\.\./g,
    /\/etc\/passwd/gi,
    /\/etc\/shadow/gi,
    /\/windows\/system32/gi,
  ],
  
  // Command Injection
  COMMAND_INJECTION: [
    /[;&|`$()]/g,
    /\b(cat|ls|pwd|whoami|id|uname)\b/gi,
    /\b(rm|mv|cp|chmod|chown)\b/gi,
  ],
  
  // Malicious User Agents
  MALICIOUS_AGENTS: [
    /sqlmap/gi,
    /nmap/gi,
    /burp/gi,
    /nikto/gi,
    /acunetix/gi,
    /nessus/gi,
    /w3af/gi,
    /masscan/gi,
  ]
} as const

// 🚨 Security Monitoring Class
export class SecurityMonitor {
  private static instance: SecurityMonitor
  private events: SecurityEvent[] = []
  private alertHandlers: Array<(event: SecurityEvent) => void> = []
  private blockedIPs = new Set<string>()
  private suspiciousIPs = new Map<string, { score: number; lastActivity: Date }>()

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor()
    }
    return SecurityMonitor.instance
  }

  // 📝 Record security event
  recordEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved' | 'responseActions'>): SecurityEvent {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
      resolved: false,
      responseActions: []
    }

    this.events.push(securityEvent)
    
    // Trigger alert handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(securityEvent)
      } catch (error) {
        console.error('Alert handler error:', error)
      }
    })

    // Auto-response based on event level
    this.handleAutoResponse(securityEvent)
    
    return securityEvent
  }

  // 🔍 Analyze request for threats
  analyzeRequest(request: NextRequest): {
    threats: SecurityEventType[]
    riskScore: number
    shouldBlock: boolean
  } {
    const threats: SecurityEventType[] = []
    let riskScore = 0
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const url = request.nextUrl.pathname + request.nextUrl.search

    // Check for SQL injection
    if (this.containsThreat(url, THREAT_PATTERNS.SQL_INJECTION)) {
      threats.push(SecurityEventType.SQL_INJECTION)
      riskScore += 80
    }

    // Check for XSS
    if (this.containsThreat(url, THREAT_PATTERNS.XSS_PATTERNS)) {
      threats.push(SecurityEventType.XSS_ATTEMPT)
      riskScore += 70
    }

    // Check for directory traversal
    if (this.containsThreat(url, THREAT_PATTERNS.DIRECTORY_TRAVERSAL)) {
      threats.push(SecurityEventType.UNAUTHORIZED_ACCESS)
      riskScore += 90
    }

    // Check malicious user agents
    if (this.containsThreat(userAgent, THREAT_PATTERNS.MALICIOUS_AGENTS)) {
      threats.push(SecurityEventType.SUSPICIOUS_IP)
      riskScore += 60
    }

    // Check if IP is already suspicious
    const suspiciousData = this.suspiciousIPs.get(ip)
    if (suspiciousData) {
      riskScore += suspiciousData.score
    }

    // Check if IP is blocked
    if (this.blockedIPs.has(ip)) {
      riskScore = 100
      threats.push(SecurityEventType.UNAUTHORIZED_ACCESS)
    }

    // Record threats
    threats.forEach(threat => {
      this.recordEvent({
        type: threat,
        level: this.calculateAlertLevel(riskScore),
        source: 'request_analyzer',
        ip,
        userAgent,
        description: `Threat detected: ${threat}`,
        metadata: {
          url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries())
        }
      })
    })

    return {
      threats,
      riskScore,
      shouldBlock: riskScore >= 80
    }
  }

  // 🚨 Handle payment fraud detection
  detectPaymentFraud(paymentData: {
    amount: number
    currency: string
    userId: string
    ip: string
    items: any[]
    timestamp: Date
  }): {
    isFraudulent: boolean
    riskScore: number
    reasons: string[]
  } {
    const reasons: string[] = []
    let riskScore = 0

    // High amount check
    if (paymentData.amount > 100000) { // £1000+
      reasons.push('High value transaction')
      riskScore += 40
    }

    // Rapid successive payments
    const recentPayments = this.getRecentPaymentsByUser(paymentData.userId, 10 * 60 * 1000) // 10 minutes
    if (recentPayments.length > 3) {
      reasons.push('Multiple payments in short time')
      riskScore += 60
    }

    // Unusual quantity patterns
    const totalItems = paymentData.items.reduce((sum, item) => sum + item.quantity, 0)
    if (totalItems > 50) {
      reasons.push('Unusually high item quantity')
      riskScore += 30
    }

    // IP reputation check
    if (this.suspiciousIPs.has(paymentData.ip)) {
      reasons.push('Payment from suspicious IP')
      riskScore += 50
    }

    // Time-based patterns (e.g., payments outside business hours)
    const hour = paymentData.timestamp.getHours()
    if (hour < 6 || hour > 23) {
      reasons.push('Payment outside normal hours')
      riskScore += 20
    }

    const isFraudulent = riskScore >= 70

    if (isFraudulent) {
      this.recordEvent({
        type: SecurityEventType.PAYMENT_FRAUD,
        level: SecurityAlertLevel.HIGH,
        source: 'fraud_detector',
        ip: paymentData.ip,
        userId: paymentData.userId,
        description: `Fraudulent payment detected: ${reasons.join(', ')}`,
        metadata: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          riskScore,
          reasons
        }
      })
    }

    return { isFraudulent, riskScore, reasons }
  }

  // 🛡️ Add alert handler
  addAlertHandler(handler: (event: SecurityEvent) => void): void {
    this.alertHandlers.push(handler)
  }

  // 📊 Get security metrics
  getSecurityMetrics(timeframe: number = 24 * 60 * 60 * 1000): {
    totalEvents: number
    eventsByType: Record<SecurityEventType, number>
    eventsByLevel: Record<SecurityAlertLevel, number>
    topThreats: Array<{ type: SecurityEventType; count: number }>
    blockedIPs: number
    suspiciousIPs: number
  } {
    const cutoff = new Date(Date.now() - timeframe)
    const recentEvents = this.events.filter(event => event.timestamp > cutoff)

    const eventsByType = {} as Record<SecurityEventType, number>
    const eventsByLevel = {} as Record<SecurityAlertLevel, number>

    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
      eventsByLevel[event.level] = (eventsByLevel[event.level] || 0) + 1
    })

    const topThreats = Object.entries(eventsByType)
      .map(([type, count]) => ({ type: type as SecurityEventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsByLevel,
      topThreats,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size
    }
  }

  // 🚫 Block IP address
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip)
    
    this.recordEvent({
      type: SecurityEventType.SUSPICIOUS_IP,
      level: SecurityAlertLevel.HIGH,
      source: 'ip_blocker',
      ip,
      description: `IP blocked: ${reason}`,
      metadata: { reason }
    })
  }

  // ⚠️ Mark IP as suspicious
  markSuspicious(ip: string, score: number): void {
    const existing = this.suspiciousIPs.get(ip) || { score: 0, lastActivity: new Date() }
    existing.score = Math.min(100, existing.score + score)
    existing.lastActivity = new Date()
    
    this.suspiciousIPs.set(ip, existing)
    
    // Auto-block if score is too high
    if (existing.score >= 80) {
      this.blockIP(ip, `Suspicious activity score: ${existing.score}`)
    }
  }

  // 🧹 Clean up old data
  cleanup(): void {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
    
    // Remove old events
    this.events = this.events.filter(event => event.timestamp > cutoff)
    
    // Remove old suspicious IPs
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (data.lastActivity < cutoff) {
        this.suspiciousIPs.delete(ip)
      }
    }
  }

  // 🔧 Helper methods
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.ip ||
      'unknown'
    )
  }

  private containsThreat(text: string, patterns: readonly RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(text))
  }

  private calculateAlertLevel(riskScore: number): SecurityAlertLevel {
    if (riskScore >= 90) return SecurityAlertLevel.CRITICAL
    if (riskScore >= 70) return SecurityAlertLevel.HIGH
    if (riskScore >= 40) return SecurityAlertLevel.MEDIUM
    return SecurityAlertLevel.LOW
  }

  private handleAutoResponse(event: SecurityEvent): void {
    switch (event.level) {
      case SecurityAlertLevel.CRITICAL:
        // Immediate blocking and alerting
        if (event.ip && event.ip !== 'unknown') {
          this.blockIP(event.ip, `Critical security event: ${event.type}`)
        }
        this.sendCriticalAlert(event)
        break
        
      case SecurityAlertLevel.HIGH:
        // Mark as suspicious and alert
        if (event.ip && event.ip !== 'unknown') {
          this.markSuspicious(event.ip, 40)
        }
        this.sendHighAlert(event)
        break
        
      case SecurityAlertLevel.MEDIUM:
        // Track and monitor
        if (event.ip && event.ip !== 'unknown') {
          this.markSuspicious(event.ip, 20)
        }
        break
    }
  }

  private sendCriticalAlert(event: SecurityEvent): void {
    console.error('🚨 CRITICAL SECURITY ALERT:', {
      id: event.id,
      type: event.type,
      ip: event.ip,
      description: event.description,
      timestamp: event.timestamp.toISOString(),
      metadata: event.metadata
    })
    
    // In production, send to alerting systems like Slack, PagerDuty, etc.
    // this.sendSlackAlert(event)
    // this.sendEmailAlert(event)
  }

  private sendHighAlert(event: SecurityEvent): void {
    console.warn('⚠️ HIGH SECURITY ALERT:', {
      id: event.id,
      type: event.type,
      ip: event.ip,
      description: event.description,
      timestamp: event.timestamp.toISOString()
    })
  }

  private getRecentPaymentsByUser(userId: string, timeframe: number): SecurityEvent[] {
    const cutoff = new Date(Date.now() - timeframe)
    return this.events.filter(event => 
      event.userId === userId &&
      event.type === SecurityEventType.PAYMENT_FRAUD &&
      event.timestamp > cutoff
    )
  }
}

// 📧 Alert Notification System
export class AlertNotificationSystem {
  static async sendSlackAlert(event: SecurityEvent): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) return
    
    const payload = {
      text: `🚨 Security Alert: ${event.type}`,
      attachments: [{
        color: event.level === SecurityAlertLevel.CRITICAL ? 'danger' : 'warning',
        fields: [
          { title: 'Event Type', value: event.type, short: true },
          { title: 'Alert Level', value: event.level, short: true },
          { title: 'IP Address', value: event.ip, short: true },
          { title: 'Timestamp', value: event.timestamp.toISOString(), short: true },
          { title: 'Description', value: event.description, short: false }
        ]
      }]
    }
    
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }

  static async sendEmailAlert(event: SecurityEvent): Promise<void> {
    // Implementation for email alerts using SendGrid, SES, etc.
    console.log('📧 Email alert would be sent for:', event.id)
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance()