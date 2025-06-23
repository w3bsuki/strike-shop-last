// Error handling utilities for Strike Shop

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests', 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: any) {
    super(`External service error: ${service}`, 'EXTERNAL_SERVICE_ERROR', 502, {
      service,
      originalError,
    });
    this.name = 'ExternalServiceError';
  }
}

// Error handler middleware for API routes
export function errorHandler(error: any) {

  // Handle known errors
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      status: error.statusCode,
    };
  }

  // Handle Stripe errors
  if (error.type === 'StripeCardError') {
    return {
      error: {
        code: 'PAYMENT_ERROR',
        message: error.message,
        details: {
          type: error.type,
          code: error.code,
          decline_code: error.decline_code,
        },
      },
      status: 402,
    };
  }

  // Handle Medusa errors
  if (error.response?.data?.message) {
    return {
      error: {
        code: 'MEDUSA_ERROR',
        message: error.response.data.message,
        details: error.response.data,
      },
      status: error.response.status || 500,
    };
  }

  // Handle validation errors from libraries
  if (error.name === 'ValidationError') {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.errors || error.message,
      },
      status: 400,
    };
  }

  // Default error response
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    status: 500,
  };
}

// Async error wrapper for API routes
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorResponse = errorHandler(error);
      throw new Response(JSON.stringify(errorResponse.error), {
        status: errorResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }) as T;
}

// Client-side error handling
export function handleClientError(
  error: any,
  fallbackMessage: string = 'Something went wrong'
) {

  if (error.response?.data?.error) {
    return error.response.data.error.message || fallbackMessage;
  }

  if (error.message) {
    return error.message;
  }

  return fallbackMessage;
}

// Error logging utility
export function logError(error: any, context?: Record<string, any>) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    context,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    },
  };

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, LogRocket, etc.

  } else {

  }
}

// Retry utility for flaky operations
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      const waitTime = delay * Math.pow(backoff, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

// Form validation error formatter
export function formatValidationErrors(
  errors: Record<string, string[]>
): string {
  const errorMessages = Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('; ');

  return `Validation failed: ${errorMessages}`;
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    logError(error, { json, fallback });
    return fallback;
  }
}

// Network error detection
export function isNetworkError(error: any): boolean {
  return (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.includes('fetch failed') ||
    error.message?.includes('Network request failed')
  );
}

// User-friendly error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTH_ERROR: 'Please sign in to continue.',
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  PAYMENT_ERROR: 'Payment processing failed. Please try again.',
  CART_ERROR: 'Unable to update cart. Please try again.',
  STOCK_ERROR: 'Some items are no longer available.',
} as const;
