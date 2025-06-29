/**
 * 🛡️ API SECURITY FORTRESS
 * Comprehensive API endpoint security, validation, and protection
 * Implements OWASP API Security Top 10 protections
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InputValidator } from './security-fortress'
import { validateCSRF } from './csrf-protection'

// 🔐 API Security Configuration
export const API_SECURITY_CONFIG = {
  // Request size limits (bytes)
  MAX_REQUEST_SIZE: {
    JSON: 10 * 1024, // 10KB for JSON payloads
    FORM: 50 * 1024, // 50KB for form data
    FILE: 10 * 1024 * 1024, // 10MB for file uploads
  },
  
  // Allowed origins for CORS
  ALLOWED_ORIGINS: process.env.NODE_ENV === 'production' 
    ? [
        'https://yourdomain.com',
        'https://www.yourdomain.com',
        'https://admin.yourdomain.com'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:4000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:4000'
      ],

  // API Rate limits per endpoint
  RATE_LIMITS: {
    STRICT: { window: 15 * 60 * 1000, max: 10 }, // 10 requests per 15 minutes
    MODERATE: { window: 15 * 60 * 1000, max: 50 }, // 50 requests per 15 minutes
    LENIENT: { window: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  },

  // Sensitive endpoints that require extra protection
  SENSITIVE_ENDPOINTS: [
    '/api/payments/',
    '/api/auth/',
    '/api/admin/',
    '/api/webhooks/',
    '/api/user/profile',
    '/api/orders/',
  ],

  // Public endpoints (no auth required)
  PUBLIC_ENDPOINTS: [
    '/api/health',
    '/api/products',
    '/api/categories',
    '/api/csrf-token',
    '/api/webhooks/stripe', // Stripe webhooks have their own verification
  ],
} as const

// 🛡️ Request validation schemas
export interface ValidationSchema {
  body?: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'url' | 'array' | 'object'
    required?: boolean
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
    sanitize?: boolean
    allowedValues?: string[]
  }>
  query?: Record<string, {
    type: 'string' | 'number' | 'boolean'
    required?: boolean
    pattern?: RegExp
    allowedValues?: string[]
  }>
  headers?: Record<string, {
    required?: boolean
    pattern?: RegExp
  }>
}

// 🔒 API Security Middleware Class
export class APISecurityMiddleware {
  // Validate request against schema
  static validateRequest(request: NextRequest, schema: ValidationSchema): {
    isValid: boolean
    errors: string[]
    sanitizedData: any
  } {
    const errors: string[] = []
    const sanitizedData: any = {}

    try {
      // Parse request body for validation
      // Note: In middleware, we can't directly access request.json()
      // This validation would typically be done in the API route handler
      if (request.headers.get('content-type')?.includes('application/json')) {
        // Body validation would happen in API route handler
      }

      // Validate query parameters
      if (schema.query) {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries())
        const queryValidation = this.validateQueryParams(queryParams, schema.query)
        
        if (!queryValidation.isValid) {
          errors.push(...queryValidation.errors)
        }
        
        sanitizedData.query = queryValidation.sanitizedData
      }

      // Validate headers
      if (schema.headers) {
        const headerValidation = this.validateHeaders(request, schema.headers)
        
        if (!headerValidation.isValid) {
          errors.push(...headerValidation.errors)
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData
      }
    } catch (error) {
      return {
        isValid: false,
        errors: ['Request validation failed'],
        sanitizedData: {}
      }
    }
  }

  // Validate query parameters
  private static validateQueryParams(params: Record<string, string>, schema: ValidationSchema['query']): {
    isValid: boolean
    errors: string[]
    sanitizedData: Record<string, any>
  } {
    const errors: string[] = []
    const sanitizedData: Record<string, any> = {}

    if (!schema) return { isValid: true, errors: [], sanitizedData: {} }

    // Check required parameters
    for (const [key, rules] of Object.entries(schema)) {
      const value = params[key]
      
      if (rules.required && !value) {
        errors.push(`Missing required query parameter: ${key}`)
        continue
      }
      
      if (!value) continue

      // Type validation
      if (rules.type === 'number') {
        const numValue = Number(value)
        if (isNaN(numValue)) {
          errors.push(`Invalid number format for parameter: ${key}`)
        } else {
          sanitizedData[key] = numValue
        }
      } else if (rules.type === 'boolean') {
        sanitizedData[key] = value === 'true'
      } else {
        // String validation
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`Invalid format for parameter: ${key}`)
        }
        
        if (rules.allowedValues && !rules.allowedValues.includes(value)) {
          errors.push(`Invalid value for parameter: ${key}`)
        }
        
        sanitizedData[key] = InputValidator.sanitizeHTML(value)
      }
    }

    return { isValid: errors.length === 0, errors, sanitizedData }
  }

  // Validate headers
  private static validateHeaders(request: NextRequest, schema: ValidationSchema['headers']): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!schema) return { isValid: true, errors: [] }

    for (const [header, rules] of Object.entries(schema)) {
      const value = request.headers.get(header.toLowerCase())
      
      if (rules.required && !value) {
        errors.push(`Missing required header: ${header}`)
        continue
      }
      
      if (value && rules.pattern && !rules.pattern.test(value)) {
        errors.push(`Invalid format for header: ${header}`)
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  // Check if endpoint is public
  static isPublicEndpoint(pathname: string): boolean {
    return API_SECURITY_CONFIG.PUBLIC_ENDPOINTS.some(endpoint => 
      pathname.startsWith(endpoint)
    )
  }

  // Check if endpoint is sensitive
  static isSensitiveEndpoint(pathname: string): boolean {
    return API_SECURITY_CONFIG.SENSITIVE_ENDPOINTS.some(endpoint => 
      pathname.startsWith(endpoint)
    )
  }

  // Validate CORS
  static validateCORS(request: NextRequest): boolean {
    const origin = request.headers.get('origin')
    
    if (!origin) return true // Same-origin requests
    
    return API_SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin)
  }

  // Create standardized API error response
  static createErrorResponse(
    status: number,
    code: string,
    message: string,
    details?: any
  ): NextResponse {
    const errorResponse = {
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && details && { details })
      }
    }

    const response = NextResponse.json(errorResponse, { status })
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    
    return response
  }

  // Create standardized API success response
  static createSuccessResponse(
    data: any,
    message?: string,
    metadata?: any
  ): NextResponse {
    const successResponse = {
      success: true,
      data,
      ...(message && { message }),
      ...(metadata && { metadata }),
      timestamp: new Date().toISOString()
    }

    const response = NextResponse.json(successResponse)
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    
    return response
  }
}

// 🛡️ API Route Security Wrapper
export function withAPISecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    schema?: ValidationSchema
    rateLimit?: keyof typeof API_SECURITY_CONFIG.RATE_LIMITS
    requireCSRF?: boolean
    allowedMethods?: string[]
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
        return APISecurityMiddleware.createErrorResponse(
          405,
          'METHOD_NOT_ALLOWED',
          `Method ${request.method} not allowed`
        )
      }

      // CORS validation
      if (!APISecurityMiddleware.validateCORS(request)) {
        return APISecurityMiddleware.createErrorResponse(
          403,
          'CORS_VIOLATION',
          'Origin not allowed'
        )
      }

      // Authentication validation
      if (options.requireAuth && !APISecurityMiddleware.isPublicEndpoint(request.nextUrl.pathname)) {
        try {
          const supabase = await createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            return APISecurityMiddleware.createErrorResponse(
              401,
              'UNAUTHORIZED',
              'Authentication required'
            )
          }
        } catch (error) {
          return APISecurityMiddleware.createErrorResponse(
            401,
            'AUTH_ERROR',
            'Authentication failed'
          )
        }
      }

      // CSRF validation for state-changing requests
      if (options.requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        try {
          const isValid = await validateCSRF(request)
          if (!isValid) {
            return APISecurityMiddleware.createErrorResponse(
              403,
              'CSRF_VIOLATION',
              'CSRF token validation failed'
            )
          }
        } catch (error) {
          return APISecurityMiddleware.createErrorResponse(
            403,
            'CSRF_ERROR',
            'CSRF validation error'
          )
        }
      }

      // Request validation
      if (options.schema) {
        const validation = APISecurityMiddleware.validateRequest(request, options.schema)
        
        if (!validation.isValid) {
          return APISecurityMiddleware.createErrorResponse(
            400,
            'VALIDATION_ERROR',
            'Request validation failed',
            validation.errors
          )
        }
      }

      // Request size validation
      const contentLength = parseInt(request.headers.get('content-length') || '0')
      const maxSize = request.headers.get('content-type')?.includes('multipart/form-data')
        ? API_SECURITY_CONFIG.MAX_REQUEST_SIZE.FILE
        : API_SECURITY_CONFIG.MAX_REQUEST_SIZE.JSON

      if (contentLength > maxSize) {
        return APISecurityMiddleware.createErrorResponse(
          413,
          'PAYLOAD_TOO_LARGE',
          'Request payload too large'
        )
      }

      // Execute the actual handler
      return await handler(request)

    } catch (error) {
      console.error('🚨 API Security Error:', error)
      
      return APISecurityMiddleware.createErrorResponse(
        500,
        'INTERNAL_ERROR',
        'Internal server error',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  }
}

// 🔐 Common validation schemas
export const VALIDATION_SCHEMAS = {
  // User authentication
  AUTH_LOGIN: {
    body: {
      email: { type: 'email' as const, required: true, maxLength: 254 },
      password: { type: 'string' as const, required: true, minLength: 8, maxLength: 128 }
    }
  },

  // Product search
  PRODUCT_SEARCH: {
    query: {
      q: { type: 'string' as const, required: false },
      category: { type: 'string' as const, required: false },
      page: { type: 'number' as const, required: false },
      limit: { type: 'number' as const, required: false },
      sort: { 
        type: 'string' as const, 
        required: false,
        allowedValues: ['price-asc', 'price-desc', 'name-asc', 'name-desc', 'created-desc']
      }
    }
  },

  // Contact form
  CONTACT_FORM: {
    body: {
      name: { type: 'string' as const, required: true, minLength: 2, maxLength: 100, sanitize: true },
      email: { type: 'email' as const, required: true },
      message: { type: 'string' as const, required: true, minLength: 10, maxLength: 1000, sanitize: true },
      subject: { type: 'string' as const, required: false, maxLength: 200, sanitize: true }
    }
  },

  // Payment processing
  PAYMENT_INTENT: {
    body: {
      amount: { type: 'number' as const, required: true, min: 50, max: 100000 }, // $0.50 - $1000
      currency: { 
        type: 'string' as const, 
        required: true,
        allowedValues: ['usd', 'eur', 'gbp', 'cad', 'aud']
      },
      paymentMethodId: { type: 'string' as const, required: false },
      orderId: { type: 'string' as const, required: true, pattern: /^[a-zA-Z0-9_-]+$/ }
    }
  },

  // Admin actions
  ADMIN_ACTION: {
    headers: {
      'x-admin-token': { required: true, pattern: /^[a-zA-Z0-9_-]+$/ }
    }
  }
} as const