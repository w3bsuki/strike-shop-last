"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { medusaClient } from "@/lib/medusa"
import CryptoJS from 'crypto-js'

// Security configuration
const AUTH_CONFIG = {
  TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  REFRESH_THRESHOLD: 60 * 60 * 1000, // 1 hour
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes of inactivity
}

// Secure token storage with encryption
class SecureTokenStorage {
  private static ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key-change-in-production'
  
  static setToken(key: string, value: string): void {
    if (typeof window === 'undefined') return
    
    // Encrypt token before storage
    const encrypted = CryptoJS.AES.encrypt(value, this.ENCRYPTION_KEY).toString()
    
    // Store in httpOnly cookie via API endpoint (recommended)
    // For now, using localStorage with encryption
    localStorage.setItem(key, encrypted)
    
    // Set expiry
    localStorage.setItem(`${key}_expiry`, String(Date.now() + AUTH_CONFIG.TOKEN_EXPIRY))
  }
  
  static getToken(key: string): string | null {
    if (typeof window === 'undefined') return null
    
    const encrypted = localStorage.getItem(key)
    const expiry = localStorage.getItem(`${key}_expiry`)
    
    if (!encrypted || !expiry) return null
    
    // Check if token expired
    if (Date.now() > parseInt(expiry)) {
      this.removeToken(key)
      return null
    }
    
    try {
      // Decrypt token
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.ENCRYPTION_KEY)
      return decrypted.toString(CryptoJS.enc.Utf8)
    } catch {
      return null
    }
  }
  
  static removeToken(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
    localStorage.removeItem(`${key}_expiry`)
  }
}

// Rate limiting for auth attempts
class RateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number }> = new Map()
  
  canAttempt(identifier: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)
    
    if (!record) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now })
      return true
    }
    
    // Reset if lockout period has passed
    if (now - record.firstAttempt > AUTH_CONFIG.LOCKOUT_DURATION) {
      this.attempts.delete(identifier)
      return true
    }
    
    // Check if max attempts reached
    if (record.count >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
      return false
    }
    
    record.count++
    return true
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

// Session activity tracker
class SessionTracker {
  private lastActivity: number = Date.now()
  private timeoutId: NodeJS.Timeout | null = null
  
  updateActivity(): void {
    this.lastActivity = Date.now()
    this.resetTimeout()
  }
  
  private resetTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    
    this.timeoutId = setTimeout(() => {
      // Auto logout on inactivity
      useAuthStore.getState().logout()
    }, AUTH_CONFIG.SESSION_TIMEOUT)
  }
  
  isSessionActive(): boolean {
    return Date.now() - this.lastActivity < AUTH_CONFIG.SESSION_TIMEOUT
  }
  
  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
  }
}

// CSRF token management
class CSRFManager {
  static generateToken(): string {
    return CryptoJS.lib.WordArray.random(32).toString()
  }
  
  static validateToken(token: string): boolean {
    const storedToken = SecureTokenStorage.getToken('csrf_token')
    return storedToken === token
  }
  
  static getToken(): string {
    let token = SecureTokenStorage.getToken('csrf_token')
    if (!token) {
      token = this.generateToken()
      SecureTokenStorage.setToken('csrf_token', token)
    }
    return token
  }
}

// Enhanced types with security fields
type SecureUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  isVerified: boolean
  twoFactorEnabled: boolean
  lastLogin: string
  loginAttempts: number
  lockedUntil?: string
  sessionId: string
  permissions: string[]
}

type AuthStore = {
  user: SecureUser | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionId: string | null
  csrfToken: string | null
  
  // Secure auth methods
  login: (email: string, password: string, captchaToken?: string) => Promise<{ success: boolean; requiresTwoFactor?: boolean }>
  verifyTwoFactor: (code: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
  validateSession: () => boolean
  
  // Security utilities
  checkPasswordStrength: (password: string) => { score: number; feedback: string[] }
  validateEmail: (email: string) => boolean
  sanitizeInput: (input: string) => string
}

// Instances
const rateLimiter = new RateLimiter()
const sessionTracker = new SessionTracker()

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionId: null,
      csrfToken: null,
      
      login: async (email: string, password: string, captchaToken?: string) => {
        const sanitizedEmail = get().sanitizeInput(email.toLowerCase().trim())
        
        // Rate limiting
        if (!rateLimiter.canAttempt(sanitizedEmail)) {
          throw new Error('Too many login attempts. Please try again later.')
        }
        
        // Validate inputs
        if (!get().validateEmail(sanitizedEmail)) {
          throw new Error('Invalid email format')
        }
        
        set({ isLoading: true })
        
        try {
          // Add CSRF token to request
          const csrfToken = CSRFManager.getToken()
          
          // Authenticate with Medusa
          const response = await medusaClient.auth.authenticate({
            email: sanitizedEmail,
            password,
            // Add security headers
            headers: {
              'X-CSRF-Token': csrfToken,
              'X-Captcha-Token': captchaToken || '',
            }
          })
          
          if (response.customer) {
            // Generate secure session
            const sessionId = CryptoJS.lib.WordArray.random(32).toString()
            
            // Store auth tokens securely
            SecureTokenStorage.setToken('auth_token', response.token)
            SecureTokenStorage.setToken('session_id', sessionId)
            
            const secureUser: SecureUser = {
              id: response.customer.id,
              email: response.customer.email,
              firstName: response.customer.first_name || '',
              lastName: response.customer.last_name || '',
              isVerified: response.customer.has_account || false,
              twoFactorEnabled: false, // Implement based on your needs
              lastLogin: new Date().toISOString(),
              loginAttempts: 0,
              sessionId,
              permissions: ['customer'], // Add role-based permissions
            }
            
            set({
              user: secureUser,
              isAuthenticated: true,
              sessionId,
              csrfToken,
            })
            
            // Reset rate limiter on success
            rateLimiter.reset(sanitizedEmail)
            
            // Start session tracking
            sessionTracker.updateActivity()
            
            return { success: true }
          }
          
          return { success: false }
        } catch (error) {
          console.error('Login error:', error)
          return { success: false }
        } finally {
          set({ isLoading: false })
        }
      },
      
      verifyTwoFactor: async (code: string) => {
        // Implement 2FA verification
        // This would require backend support
        return false
      },
      
      logout: async () => {
        set({ isLoading: true })
        
        try {
          // Invalidate session on backend
          await medusaClient.auth.deleteSession()
          
          // Clear all secure storage
          SecureTokenStorage.removeToken('auth_token')
          SecureTokenStorage.removeToken('session_id')
          SecureTokenStorage.removeToken('csrf_token')
          
          // Clear session tracking
          sessionTracker.clear()
          
          set({
            user: null,
            isAuthenticated: false,
            sessionId: null,
            csrfToken: null,
          })
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({ isLoading: false })
        }
      },
      
      refreshSession: async () => {
        const token = SecureTokenStorage.getToken('auth_token')
        if (!token) return false
        
        try {
          // Refresh token with backend
          // This would require backend support for token refresh
          sessionTracker.updateActivity()
          return true
        } catch {
          await get().logout()
          return false
        }
      },
      
      validateSession: () => {
        const sessionId = SecureTokenStorage.getToken('session_id')
        const { user } = get()
        
        if (!sessionId || !user || user.sessionId !== sessionId) {
          return false
        }
        
        return sessionTracker.isSessionActive()
      },
      
      checkPasswordStrength: (password: string) => {
        let score = 0
        const feedback: string[] = []
        
        if (password.length >= 12) score += 2
        else if (password.length >= 8) score += 1
        else feedback.push('Password should be at least 8 characters')
        
        if (/[a-z]/.test(password)) score += 1
        else feedback.push('Add lowercase letters')
        
        if (/[A-Z]/.test(password)) score += 1
        else feedback.push('Add uppercase letters')
        
        if (/[0-9]/.test(password)) score += 1
        else feedback.push('Add numbers')
        
        if (/[^a-zA-Z0-9]/.test(password)) score += 1
        else feedback.push('Add special characters')
        
        // Check for common patterns
        if (/(.)\1{2,}/.test(password)) {
          score -= 1
          feedback.push('Avoid repeating characters')
        }
        
        if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password)) {
          score -= 1
          feedback.push('Use a mix of character types')
        }
        
        return { score: Math.max(0, Math.min(5, score)), feedback }
      },
      
      validateEmail: (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      },
      
      sanitizeInput: (input: string) => {
        // Basic XSS prevention
        return input
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '')
          .trim()
      },
    }),
    {
      name: 'strike-auth-secure',
      partialize: (state) => ({
        // Only persist non-sensitive data
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          firstName: state.user.firstName,
          lastName: state.user.lastName,
        } : null,
      }),
    }
  )
)

// Auto-refresh session
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useAuthStore.getState()
    if (store.isAuthenticated && store.validateSession()) {
      store.refreshSession()
    }
  }, AUTH_CONFIG.REFRESH_THRESHOLD)
  
  // Track user activity
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, () => {
      if (useAuthStore.getState().isAuthenticated) {
        sessionTracker.updateActivity()
      }
    }, { passive: true })
  })
}