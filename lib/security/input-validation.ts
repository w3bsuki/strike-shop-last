/**
 * INPUT VALIDATION MIDDLEWARE
 * Comprehensive input validation with Zod schemas and security sanitization
 */

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
// import DOMPurify from 'isomorphic-dompurify' // TODO: Install this package
// @ts-ignore - types not available
import validator from 'validator'

// Security patterns
const SECURITY_PATTERNS = {
  SQL_INJECTION: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|eval)\b)|(-{2})|(\*|;|'|"|%|<|>)/gi,
  XSS: /<[^>]*>|javascript:|on\w+\s*=/gi,
  PATH_TRAVERSAL: /\.\.|\/\//g,
  COMMAND_INJECTION: /[;&|`$(){}[\]<>]/g,
  LDAP_INJECTION: /[*()\\]/g,
  XML_INJECTION: /<!ENTITY|SYSTEM|PUBLIC|DOCTYPE/gi,
  HEADER_INJECTION: /[\r\n]/g,
  NULL_BYTE: /\x00/g
}

// Common Zod schemas
export const commonSchemas = {
  // User input
  email: z.string().email().max(254).transform(val => val.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  username: z.string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .transform(val => val.replace(/\D/g, '')),
  
  // IDs and tokens
  uuid: z.string().uuid(),
  
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
  
  apiKey: z.string().regex(/^[a-zA-Z0-9_-]{32,64}$/, 'Invalid API key format'),
  
  // Financial
  amount: z.number()
    .positive()
    .multipleOf(0.01)
    .max(999999.99),
  
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']),
  
  creditCard: z.string()
    .transform(val => val.replace(/\s/g, ''))
    .refine(val => validator.isCreditCard(val), 'Invalid credit card number'),
  
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  
  limit: z.coerce.number().int().positive().max(100).default(10),
  
  // Search and filters
  search: z.string()
    .max(100)
    .transform(val => val.trim())
    .refine(val => !SECURITY_PATTERNS.SQL_INJECTION.test(val), 'Invalid search query'),
  
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'price', 'rating']).default('createdAt'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Dates
  date: z.string().datetime(),
  
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).refine(data => new Date(data.start) <= new Date(data.end), 'Start date must be before end date'),
  
  // File uploads
  fileUpload: z.object({
    filename: z.string().max(255),
    mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
    size: z.number().max(10 * 1024 * 1024) // 10MB
  })
}

// Input sanitizer class
export class InputSanitizer {
  /**
   * Sanitize HTML content
   */
  static sanitizeHTML(input: string): string {
    // TODO: Use DOMPurify when installed
    // Basic HTML sanitization - strips all HTML tags
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  /**
   * Sanitize for SQL queries
   */
  static sanitizeSQL(input: string): string {
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
  }

  /**
   * Sanitize file paths
   */
  static sanitizePath(input: string): string {
    return input
      .replace(SECURITY_PATTERNS.PATH_TRAVERSAL, '')
      .replace(/^\/+/, '')
      .replace(/\\/g, '/')
  }

  /**
   * Sanitize for shell commands
   */
  static sanitizeShell(input: string): string {
    return input.replace(SECURITY_PATTERNS.COMMAND_INJECTION, '')
  }

  /**
   * Remove null bytes
   */
  static removeNullBytes(input: string): string {
    return input.replace(SECURITY_PATTERNS.NULL_BYTE, '')
  }

  /**
   * Sanitize headers
   */
  static sanitizeHeader(input: string): string {
    return input.replace(SECURITY_PATTERNS.HEADER_INJECTION, '')
  }

  /**
   * Deep sanitize object
   */
  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeHTML(this.removeNullBytes(obj))
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item))
    }
    
    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[this.sanitizeHTML(key)] = this.sanitizeObject(value)
      }
      return sanitized
    }
    
    return obj
  }
}

// Validation error formatter
export class ValidationError extends Error {
  constructor(
    public errors: z.ZodError,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super('Validation failed')
    this.name = 'ValidationError'
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      errors: this.errors.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    }
  }
}

// API endpoint schemas
export const apiSchemas = {
  // Authentication
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password required'),
    rememberMe: z.boolean().optional()
  }),

  register: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    confirmPassword: z.string(),
    username: commonSchemas.username,
    acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms')
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }),

  // Products
  createProduct: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(5000).transform(InputSanitizer.sanitizeHTML),
    price: commonSchemas.amount,
    currency: commonSchemas.currency,
    category: z.string().max(50),
    tags: z.array(z.string().max(30)).max(10).optional(),
    images: z.array(z.string().url()).max(10),
    stock: z.number().int().nonnegative()
  }),

  updateProduct: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).transform(InputSanitizer.sanitizeHTML).optional(),
    price: commonSchemas.amount.optional(),
    category: z.string().max(50).optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    images: z.array(z.string().url()).max(10).optional(),
    stock: z.number().int().nonnegative().optional()
  }),

  // Reviews
  createReview: z.object({
    productId: commonSchemas.uuid,
    rating: z.number().int().min(1).max(5),
    title: z.string().max(100).transform(InputSanitizer.sanitizeHTML),
    comment: z.string().max(1000).transform(InputSanitizer.sanitizeHTML).optional(),
    verified: z.boolean().default(false)
  }),

  // Payments
  createPaymentIntent: z.object({
    amount: commonSchemas.amount,
    currency: commonSchemas.currency,
    orderId: commonSchemas.uuid,
    paymentMethodId: z.string().optional(),
    metadata: z.record(z.string()).optional()
  }),

  // Orders
  createOrder: z.object({
    items: z.array(z.object({
      productId: commonSchemas.uuid,
      quantity: z.number().int().positive().max(100),
      price: commonSchemas.amount
    })).min(1).max(50),
    shippingAddress: z.object({
      line1: z.string().max(200),
      line2: z.string().max(200).optional(),
      city: z.string().max(100),
      state: z.string().max(100),
      postalCode: z.string().max(20),
      country: z.string().length(2) // ISO country code
    }),
    billingAddress: z.object({
      line1: z.string().max(200),
      line2: z.string().max(200).optional(),
      city: z.string().max(100),
      state: z.string().max(100),
      postalCode: z.string().max(20),
      country: z.string().length(2)
    }).optional()
  }),

  // Search
  searchProducts: z.object({
    q: commonSchemas.search.optional(),
    category: z.string().max(50).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    tags: z.array(z.string().max(30)).optional(),
    inStock: z.coerce.boolean().optional(),
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    sortBy: commonSchemas.sortBy,
    sortOrder: commonSchemas.sortOrder
  }).refine(data => {
    if (data.minPrice && data.maxPrice) {
      return data.minPrice <= data.maxPrice
    }
    return true
  }, 'Min price must be less than max price')
}

/**
 * Validation middleware for Next.js API routes
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (request: NextRequest, data: T) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      let data: any = {}

      // Parse request body
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          data = await request.json()
        } catch (error) {
          return NextResponse.json(
            {
              error: {
                code: 'INVALID_JSON',
                message: 'Invalid JSON in request body'
              }
            },
            { status: 400 }
          )
        }
      }

      // Parse query parameters
      const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
      if (Object.keys(searchParams).length > 0) {
        data = { ...data, ...searchParams }
      }

      // Validate data
      const validatedData = schema.parse(data)

      // Call handler with validated data
      return await handler(request, validatedData)

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError(error)
        return NextResponse.json(
          { error: validationError.toJSON() },
          { status: 400 }
        )
      }

      console.error('Validation middleware error:', error)
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred during validation'
          }
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Custom validation rules
 */
export const customValidators = {
  /**
   * Validate credit card expiry
   */
  creditCardExpiry: z.string().refine(val => {
    const match = val.match(/^(0[1-9]|1[0-2])\/(\d{2})$/)
    if (!match || !match[1] || !match[2]) return false
    
    const month = parseInt(match[1])
    const year = parseInt('20' + match[2])
    const now = new Date()
    const expiry = new Date(year, month - 1)
    
    return expiry > now
  }, 'Invalid or expired credit card expiry date'),

  /**
   * Validate strong password
   */
  strongPassword: z.string().refine(val => {
    const score = calculatePasswordStrength(val)
    return score >= 3
  }, 'Password is too weak'),

  /**
   * Validate safe filename
   */
  safeFilename: z.string().refine(val => {
    const safe = /^[a-zA-Z0-9._-]+$/.test(val)
    const noTraversal = !val.includes('..')
    const reasonableLength = val.length <= 255
    
    return safe && noTraversal && reasonableLength
  }, 'Invalid filename'),

  /**
   * Validate IP address
   */
  ipAddress: z.string().refine(val => {
    return validator.isIP(val, 4) || validator.isIP(val, 6)
  }, 'Invalid IP address'),

  /**
   * Validate URL with specific domain
   */
  urlWithDomain: (domain: string) => z.string().url().refine(val => {
    try {
      const url = new URL(val)
      return url.hostname === domain || url.hostname.endsWith('.' + domain)
    } catch {
      return false
    }
  }, `URL must be from ${domain}`)
}

/**
 * Calculate password strength (0-5)
 */
function calculatePasswordStrength(password: string): number {
  let strength = 0
  
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  
  return strength
}