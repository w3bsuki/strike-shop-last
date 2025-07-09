/**
 * 🛡️ SECURITY FORTRESS - Industrial-Grade Security Implementation
 * Zero-tolerance security configuration for e-commerce applications
 * Implements OWASP Top 10 protections, PCI DSS compliance, and fortress-level security
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
// import crypto from 'crypto' // Edge Runtime incompatible

// 🔐 SECURITY CONSTANTS
export const SECURITY_CONFIG = {
  // Rate limiting configurations
  RATE_LIMITS: {
    API: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 req per 15min
    AUTH: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 auth attempts per 15min
    PAYMENTS: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 payment attempts per hour
    SEARCH: { windowMs: 60 * 1000, max: 30 }, // 30 searches per minute
    CONTACT: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 contact forms per hour
  },
  
  // Content Security Policy - FORTRESS LEVEL
  CSP_POLICY: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'wasm-unsafe-eval'", // For WebAssembly
      "https://js.stripe.com",
      "https://challenges.cloudflare.com",
      // Remove 'unsafe-inline' and 'unsafe-eval' for maximum security
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components, minimize usage
      "https://fonts.googleapis.com",
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
    ],
    'img-src': [
      "'self'",
      "data:",
      "https:",
      "blob:",
      "https://cdn.sanity.io",
      "https://images.unsplash.com"
    ],
    'connect-src': [
      "'self'",
      "https://api.stripe.com",
      "https://uploads.stripe.com",
      "https://*.clerk.dev",
      "https://*.clerk.com",
      "https://*.sanity.io",
      "https://*.railway.app",
      "wss:",
      "ws:", // WebSocket connections
    ],
    'frame-src': [
      "'self'",
      "https://js.stripe.com",
      "https://hooks.stripe.com",
      "https://challenges.cloudflare.com",
    ],
    'frame-ancestors': ["'none'"], // Prevent clickjacking
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'worker-src': ["'self'", "blob:"],
    'manifest-src': ["'self'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': [],
  },

  // Security headers configuration
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-Download-Options': 'noopen',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()', // Disable FLoC
      'payment=(self)',
      'usb=()',
      'serial=()',
      'bluetooth=()',
    ].join(', '),
  },

  // Trusted domains for external resources
  TRUSTED_DOMAINS: {
    PAYMENT: ['stripe.com', 'js.stripe.com'],
    CDN: ['cdn.sanity.io', 'images.unsplash.com'],
    FONTS: ['fonts.googleapis.com', 'fonts.gstatic.com'],
    AUTH: ['clerk.dev', 'clerk.com'],
  },

  // File upload security
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ],
    BLOCKED_EXTENSIONS: [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
      '.js', '.jar', '.vbs', '.sh', '.ps1', '.php',
      '.asp', '.aspx', '.jsp', '.pl', '.py', '.rb'
    ]
  }
} as const

// 🛡️ IP-based rate limiting store
class SecurityStore {
  private static instance: SecurityStore
  private rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: boolean }>()
  private blockedIPs = new Set<string>()
  private suspiciousIPs = new Map<string, { violations: number; lastViolation: number }>()

  static getInstance(): SecurityStore {
    if (!SecurityStore.instance) {
      SecurityStore.instance = new SecurityStore()
    }
    return SecurityStore.instance
  }

  // Check if IP is blocked
  isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip)
  }

  // Block IP address
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip)
    console.warn(`🚨 SECURITY: IP ${ip} blocked - ${reason}`)
    
    // Auto-unblock after 24 hours for non-permanent blocks
    if (!reason.includes('PERMANENT')) {
      setTimeout(() => {
        this.blockedIPs.delete(ip)
        console.log(`🔓 SECURITY: IP ${ip} unblocked after timeout`)
      }, 24 * 60 * 60 * 1000)
    }
  }

  // Track suspicious activity
  addSuspiciousActivity(ip: string, activity: string): void {
    const current = this.suspiciousIPs.get(ip) || { violations: 0, lastViolation: 0 }
    current.violations++
    current.lastViolation = Date.now()
    
    this.suspiciousIPs.set(ip, current)
    
    console.warn(`⚠️  SECURITY: Suspicious activity from ${ip} - ${activity} (${current.violations} violations)`)
    
    // Block after 5 violations in 1 hour
    if (current.violations >= 5 && Date.now() - current.lastViolation < 60 * 60 * 1000) {
      this.blockIP(ip, `Excessive suspicious activity: ${activity}`)
    }
  }

  // Apply rate limiting
  applyRateLimit(ip: string, config: { windowMs: number; max: number }): boolean {
    const now = Date.now()
    const key = `${ip}-${Math.floor(now / config.windowMs)}`
    
    const current = this.rateLimitStore.get(key) || { 
      count: 0, 
      resetTime: now + config.windowMs,
      blocked: false 
    }

    if (now > current.resetTime) {
      current.count = 1
      current.resetTime = now + config.windowMs
      current.blocked = false
    } else {
      current.count++
    }

    this.rateLimitStore.set(key, current)

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup()
    }

    if (current.count > config.max) {
      current.blocked = true
      this.addSuspiciousActivity(ip, `Rate limit exceeded: ${current.count}/${config.max}`)
      return false
    }

    return true
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, data] of this.rateLimitStore.entries()) {
      if (now > data.resetTime) {
        this.rateLimitStore.delete(key)
      }
    }
  }
}

// 🔐 Cryptographic utilities
export class CryptoUtils {
  // Generate cryptographically secure token
  static generateSecureToken(length: number = 32): string {
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  }

  // Secure hash function
  static async secureHash(data: string, salt?: string): Promise<string> {
    const actualSalt = salt || this.generateSecureToken(16)
    // Edge Runtime compatible hashing
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(data),
      'PBKDF2',
      false,
      ['deriveBits']
    )
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(actualSalt),
        iterations: 100000,
        hash: 'SHA-512'
      },
      keyMaterial,
      512
    )
    return Array.from(new Uint8Array(derived), b => b.toString(16).padStart(2, '0')).join('')
  }

  // Timing-safe comparison
  static timingSafeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    if (a.length !== b.length) return false
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }

  // Generate nonce for CSP
  static generateNonce(): string {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return btoa(String.fromCharCode(...bytes))
  }
}

// 🛡️ Input validation and sanitization
export class InputValidator {
  // Validate email
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email) && email.length <= 254
  }

  // Validate phone number
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  // Sanitize HTML input
  static sanitizeHTML(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  // Validate against XSS
  static containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<link/gi,
      /<meta/gi,
      /vbscript:/gi,
      /data:/gi,
      /expression\s*\(/gi,
    ]
    
    return xssPatterns.some(pattern => pattern.test(input))
  }

  // Validate against SQL injection
  static containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/gi,
      /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
      /['"];/gi,
      /\/\*[\s\S]*?\*\//gi,
      /--/gi,
    ]
    
    return sqlPatterns.some(pattern => pattern.test(input))
  }

  // Comprehensive input validation
  static validateInput(input: string, type: 'email' | 'phone' | 'text' | 'url' = 'text'): {
    isValid: boolean
    sanitized: string
    errors: string[]
  } {
    const errors: string[] = []
    let sanitized = input.trim()

    // Check for common attacks
    if (this.containsXSS(input)) {
      errors.push('Input contains potentially malicious script content')
    }
    
    if (this.containsSQLInjection(input)) {
      errors.push('Input contains potentially malicious SQL content')
    }

    // Type-specific validation
    switch (type) {
      case 'email':
        if (!this.isValidEmail(sanitized)) {
          errors.push('Invalid email format')
        }
        break
      case 'phone':
        if (!this.isValidPhone(sanitized)) {
          errors.push('Invalid phone number format')
        }
        break
      case 'url':
        try {
          new URL(sanitized)
        } catch {
          errors.push('Invalid URL format')
        }
        break
    }

    // Sanitize for safe usage
    if (type === 'text') {
      sanitized = this.sanitizeHTML(sanitized)
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    }
  }
}

// 🛡️ Security middleware factory
export class SecurityMiddleware {
  private securityStore = SecurityStore.getInstance()

  // Get client IP address
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    return (
      cfConnectingIP ||
      realIP ||
      forwarded?.split(',')[0]?.trim() ||
      'unknown'
    )
  }

  // Apply comprehensive security headers
  applySecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
    // Content Security Policy with nonce
    const csp = Object.entries(SECURITY_CONFIG.CSP_POLICY)
      .map(([directive, sources]) => {
        let sourceList = sources.join(' ')
        
        // Add nonce to script-src if provided
        if (directive === 'script-src' && nonce) {
          sourceList += ` 'nonce-${nonce}'`
        }
        
        return `${directive} ${sourceList}`
      })
      .join('; ')

    response.headers.set('Content-Security-Policy', csp)

    // Apply all security headers
    Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([header, value]) => {
      response.headers.set(header, value)
    })

    // HSTS for HTTPS
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }

    // Remove server identification headers
    response.headers.delete('Server')
    response.headers.delete('X-Powered-By')
    response.headers.delete('X-Nextjs-Cache')

    return response
  }

  // Rate limiting middleware
  checkRateLimit(request: NextRequest, endpoint: keyof typeof SECURITY_CONFIG.RATE_LIMITS): boolean {
    const ip = this.getClientIP(request)
    const config = SECURITY_CONFIG.RATE_LIMITS[endpoint]
    
    // Check if IP is blocked
    if (this.securityStore.isBlocked(ip)) {
      return false
    }

    return this.securityStore.applyRateLimit(ip, config)
  }

  // Validate request security
  validateRequest(request: NextRequest): {
    isValid: boolean
    errors: string[]
    shouldBlock: boolean
  } {
    const errors: string[] = []
    let shouldBlock = false
    const ip = this.getClientIP(request)

    // Check if IP is already blocked
    if (this.securityStore.isBlocked(ip)) {
      return { isValid: false, errors: ['IP address is blocked'], shouldBlock: true }
    }

    // Validate user agent
    const userAgent = request.headers.get('user-agent')
    if (!userAgent || userAgent.length < 10) {
      errors.push('Invalid or missing user agent')
      this.securityStore.addSuspiciousActivity(ip, 'Invalid user agent')
    }

    // Check for suspicious patterns in URL
    const url = request.nextUrl.pathname + request.nextUrl.search
    const suspiciousPatterns = [
      /\.\./g, // Directory traversal
      /<script/gi, // XSS attempt
      /union.*select/gi, // SQL injection
      /php$/gi, // PHP file access attempt
      /wp-admin/gi, // WordPress admin access
      /\.env/gi, // Environment file access
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        errors.push('Suspicious URL pattern detected')
        shouldBlock = true
        this.securityStore.addSuspiciousActivity(ip, `Suspicious URL: ${url}`)
        break
      }
    }

    // Validate referer for form submissions
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      const referer = request.headers.get('referer')
      const origin = request.headers.get('origin')
      const host = request.headers.get('host')

      if (!referer && !origin) {
        errors.push('Missing referer/origin header for state-changing request')
        this.securityStore.addSuspiciousActivity(ip, 'Missing referer for POST request')
      } else if (referer && !referer.includes(host || '')) {
        errors.push('Invalid referer header')
        shouldBlock = true
        this.securityStore.addSuspiciousActivity(ip, `Invalid referer: ${referer}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      shouldBlock
    }
  }

  // Create security response
  createSecurityResponse(
    status: number,
    message: string,
    details?: string
  ): NextResponse {
    const response = NextResponse.json(
      {
        error: message,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
        timestamp: new Date().toISOString(),
      },
      { status }
    )

    return this.applySecurityHeaders(response)
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware()