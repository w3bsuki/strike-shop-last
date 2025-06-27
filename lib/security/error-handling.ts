/**
 * SECURE ERROR HANDLING
 * Production-safe error responses with detailed internal logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import crypto from 'crypto'

// Error types enum
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  PAYMENT = 'PAYMENT_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  DATABASE = 'DATABASE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error codes mapping
const ERROR_CODES: Record<ErrorType, { status: number; severity: ErrorSeverity }> = {
  [ErrorType.VALIDATION]: { status: 400, severity: ErrorSeverity.LOW },
  [ErrorType.BAD_REQUEST]: { status: 400, severity: ErrorSeverity.LOW },
  [ErrorType.AUTHENTICATION]: { status: 401, severity: ErrorSeverity.MEDIUM },
  [ErrorType.AUTHORIZATION]: { status: 403, severity: ErrorSeverity.MEDIUM },
  [ErrorType.NOT_FOUND]: { status: 404, severity: ErrorSeverity.LOW },
  [ErrorType.CONFLICT]: { status: 409, severity: ErrorSeverity.LOW },
  [ErrorType.RATE_LIMIT]: { status: 429, severity: ErrorSeverity.MEDIUM },
  [ErrorType.PAYMENT]: { status: 402, severity: ErrorSeverity.HIGH },
  [ErrorType.EXTERNAL_SERVICE]: { status: 502, severity: ErrorSeverity.HIGH },
  [ErrorType.DATABASE]: { status: 500, severity: ErrorSeverity.CRITICAL },
  [ErrorType.INTERNAL]: { status: 500, severity: ErrorSeverity.CRITICAL }
}

// Production-safe error messages
const SAFE_ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.VALIDATION]: 'The request contains invalid data',
  [ErrorType.BAD_REQUEST]: 'The request could not be understood',
  [ErrorType.AUTHENTICATION]: 'Authentication is required',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to access this resource',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found',
  [ErrorType.CONFLICT]: 'The request conflicts with the current state',
  [ErrorType.RATE_LIMIT]: 'Too many requests, please try again later',
  [ErrorType.PAYMENT]: 'Payment processing error',
  [ErrorType.EXTERNAL_SERVICE]: 'External service is temporarily unavailable',
  [ErrorType.DATABASE]: 'A system error occurred',
  [ErrorType.INTERNAL]: 'An unexpected error occurred'
}

// Error context interface
interface ErrorContext {
  userId?: string
  requestId?: string
  method?: string
  path?: string
  ip?: string
  userAgent?: string
  timestamp?: Date
  [key: string]: any
}

// Custom error class
export class ApiError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public details?: any,
    public context?: ErrorContext
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get status(): number {
    return ERROR_CODES[this.type].status
  }

  get severity(): ErrorSeverity {
    return ERROR_CODES[this.type].severity
  }

  get safeMessage(): string {
    return SAFE_ERROR_MESSAGES[this.type]
  }

  toJSON(includeDetails = false) {
    return {
      type: this.type,
      message: includeDetails ? this.message : this.safeMessage,
      ...(includeDetails && this.details && { details: this.details })
    }
  }
}

// Error logger class
export class ErrorLogger {
  private static loggers: Map<string, (error: any) => void> = new Map()

  /**
   * Register error logger
   */
  static registerLogger(name: string, logger: (error: any) => void) {
    this.loggers.set(name, logger)
  }

  /**
   * Log error with context
   */
  static logError(error: any, context?: ErrorContext) {
    const errorId = crypto.randomUUID()
    const timestamp = new Date()

    const logEntry = {
      errorId,
      timestamp,
      type: error instanceof ApiError ? error.type : ErrorType.INTERNAL,
      severity: error instanceof ApiError ? error.severity : ErrorSeverity.HIGH,
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        nodeEnv: process.env.NODE_ENV,
        service: 'api'
      }
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 API Error:', logEntry)
    } else {
      // In production, log minimal info to console
      console.error(`Error ${errorId}: ${error.message}`)
    }

    // Send to registered loggers
    this.loggers.forEach(logger => {
      try {
        logger(logEntry)
      } catch (loggerError) {
        console.error('Logger error:', loggerError)
      }
    })

    return errorId
  }

  /**
   * Log error metrics
   */
  static logErrorMetrics(error: any, context?: ErrorContext) {
    // Track error counts by type
    const metrics = {
      error_type: error instanceof ApiError ? error.type : 'unknown',
      error_severity: error instanceof ApiError ? error.severity : 'unknown',
      endpoint: context?.path || 'unknown',
      method: context?.method || 'unknown',
      status_code: error instanceof ApiError ? error.status : 500
    }

    // Send to metrics service
    this.loggers.get('metrics')?.(metrics)
  }
}

// Error response builder
export class ErrorResponseBuilder {
  /**
   * Build error response
   */
  static buildResponse(
    error: any,
    request?: NextRequest,
    options?: {
      includeStack?: boolean
      includeDetails?: boolean
      correlationId?: string
    }
  ): NextResponse {
    const errorId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const isDevelopment = process.env.NODE_ENV === 'development'

    // Extract error info
    let status = 500
    let type = ErrorType.INTERNAL
    let message = SAFE_ERROR_MESSAGES[ErrorType.INTERNAL]
    let details: any = undefined

    if (error instanceof ApiError) {
      status = error.status
      type = error.type
      message = isDevelopment || options?.includeDetails ? error.message : error.safeMessage
      details = isDevelopment || options?.includeDetails ? error.details : undefined
    } else if (error instanceof ZodError) {
      status = 400
      type = ErrorType.VALIDATION
      message = 'Validation failed'
      details = isDevelopment ? error.errors : undefined
    } else if (error?.name === 'PrismaClientKnownRequestError') {
      status = 400
      type = ErrorType.DATABASE
      message = isDevelopment ? error.message : SAFE_ERROR_MESSAGES[ErrorType.DATABASE]
    }

    // Build context
    const context: ErrorContext = {
      requestId: options?.correlationId || errorId,
      timestamp: new Date(),
      ...(request && {
        method: request.method,
        path: request.nextUrl.pathname,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      })
    }

    // Log error
    ErrorLogger.logError(error, context)
    ErrorLogger.logErrorMetrics(error, context)

    // Build response body
    const responseBody = {
      error: {
        id: errorId,
        type,
        message,
        timestamp,
        ...(details && { details }),
        ...(isDevelopment && options?.includeStack && error.stack && { stack: error.stack })
      }
    }

    // Create response
    const response = NextResponse.json(responseBody, { status })

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Error-ID', errorId)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

    return response
  }
}

// Error handler middleware
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error) {
      return ErrorResponseBuilder.buildResponse(error, request)
    }
  }
}

// Common API errors
export const ApiErrors = {
  // Authentication errors
  invalidCredentials: () => new ApiError(
    ErrorType.AUTHENTICATION,
    'Invalid email or password'
  ),
  
  tokenExpired: () => new ApiError(
    ErrorType.AUTHENTICATION,
    'Authentication token has expired'
  ),
  
  tokenInvalid: () => new ApiError(
    ErrorType.AUTHENTICATION,
    'Invalid authentication token'
  ),

  // Authorization errors
  insufficientPermissions: (resource?: string) => new ApiError(
    ErrorType.AUTHORIZATION,
    `Insufficient permissions${resource ? ` for ${resource}` : ''}`,
    { resource }
  ),
  
  accessDenied: () => new ApiError(
    ErrorType.AUTHORIZATION,
    'Access denied'
  ),

  // Resource errors
  resourceNotFound: (resource: string, id?: string) => new ApiError(
    ErrorType.NOT_FOUND,
    `${resource} not found`,
    { resource, id }
  ),
  
  resourceConflict: (resource: string, field?: string) => new ApiError(
    ErrorType.CONFLICT,
    `${resource} already exists`,
    { resource, field }
  ),

  // Validation errors
  validationFailed: (errors: any) => new ApiError(
    ErrorType.VALIDATION,
    'Validation failed',
    errors
  ),
  
  invalidInput: (field: string, reason?: string) => new ApiError(
    ErrorType.VALIDATION,
    `Invalid ${field}${reason ? `: ${reason}` : ''}`,
    { field, reason }
  ),

  // Rate limit errors
  rateLimitExceeded: (retryAfter: number) => new ApiError(
    ErrorType.RATE_LIMIT,
    'Rate limit exceeded',
    { retryAfter }
  ),

  // Payment errors
  paymentFailed: (reason?: string) => new ApiError(
    ErrorType.PAYMENT,
    'Payment processing failed',
    { reason }
  ),
  
  insufficientFunds: () => new ApiError(
    ErrorType.PAYMENT,
    'Insufficient funds'
  ),

  // External service errors
  externalServiceError: (service: string, error?: any) => new ApiError(
    ErrorType.EXTERNAL_SERVICE,
    `${service} service error`,
    { service, originalError: error }
  ),

  // Database errors
  databaseError: (operation?: string) => new ApiError(
    ErrorType.DATABASE,
    'Database operation failed',
    { operation }
  ),

  // Generic errors
  badRequest: (reason?: string) => new ApiError(
    ErrorType.BAD_REQUEST,
    reason || 'Bad request'
  ),
  
  internalError: (details?: any) => new ApiError(
    ErrorType.INTERNAL,
    'Internal server error',
    details
  )
}

// Error recovery strategies
export class ErrorRecovery {
  private static retryDelays = [1000, 2000, 5000, 10000] // milliseconds

  /**
   * Retry with exponential backoff
   */
  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    shouldRetry?: (error: any) => boolean
  ): Promise<T> {
    let lastError: any

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        // Check if we should retry
        if (shouldRetry && !shouldRetry(error)) {
          throw error
        }

        // Don't retry on last attempt
        if (i === maxRetries - 1) {
          throw error
        }

        // Wait before retry
        const delay = this.retryDelays[Math.min(i, this.retryDelays.length - 1)]
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Circuit breaker pattern
   */
  static createCircuitBreaker(
    fn: (...args: any[]) => Promise<any>,
    options: {
      failureThreshold: number
      resetTimeout: number
      monitoringPeriod: number
    }
  ) {
    let failures = 0
    let lastFailureTime = 0
    let state: 'closed' | 'open' | 'half-open' = 'closed'

    return async (...args: any[]) => {
      // Check if circuit should be reset
      if (state === 'open' && Date.now() - lastFailureTime > options.resetTimeout) {
        state = 'half-open'
        failures = 0
      }

      // If circuit is open, fail fast
      if (state === 'open') {
        throw new ApiError(
          ErrorType.EXTERNAL_SERVICE,
          'Service temporarily unavailable (circuit open)'
        )
      }

      try {
        const result = await fn(...args)
        
        // Reset on success
        if (state === 'half-open') {
          state = 'closed'
          failures = 0
        }
        
        return result
      } catch (error) {
        failures++
        lastFailureTime = Date.now()

        // Open circuit if threshold reached
        if (failures >= options.failureThreshold) {
          state = 'open'
          ErrorLogger.logError(
            new Error(`Circuit opened after ${failures} failures`),
            { function: fn.name }
          )
        }

        throw error
      }
    }
  }
}