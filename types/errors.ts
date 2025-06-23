/**
 * Comprehensive Error Handling with Discriminated Unions
 * Perfect TypeScript error management system
 */

import type { HttpStatus } from './index';

// Base error interface
export interface BaseError {
  readonly code: string;
  readonly message: string;
  readonly timestamp: string;
  readonly requestId?: string;
  readonly details?: Record<string, unknown>;
}

// Specific error types (discriminated unions)
export type ApiError =
  | ValidationError
  | AuthenticationError
  | AuthorizationError
  | NotFoundError
  | ConflictError
  | RateLimitError
  | ServerError
  | NetworkError
  | PaymentError
  | InventoryError;

export interface ValidationError extends BaseError {
  readonly type: 'validation';
  readonly code: 'VALIDATION_ERROR';
  readonly fields: ValidationFieldError[];
}

export interface ValidationFieldError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly value?: unknown;
}

export interface AuthenticationError extends BaseError {
  readonly type: 'authentication';
  readonly code: 'UNAUTHENTICATED' | 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED';
}

export interface AuthorizationError extends BaseError {
  readonly type: 'authorization';
  readonly code: 'UNAUTHORIZED' | 'INSUFFICIENT_PERMISSIONS' | 'RESOURCE_FORBIDDEN';
  readonly requiredPermissions?: string[];
}

export interface NotFoundError extends BaseError {
  readonly type: 'not_found';
  readonly code: 'RESOURCE_NOT_FOUND' | 'ENDPOINT_NOT_FOUND';
  readonly resource?: string;
  readonly resourceId?: string;
}

export interface ConflictError extends BaseError {
  readonly type: 'conflict';
  readonly code: 'RESOURCE_CONFLICT' | 'DUPLICATE_RESOURCE' | 'CONCURRENT_MODIFICATION';
  readonly conflictingResource?: string;
}

export interface RateLimitError extends BaseError {
  readonly type: 'rate_limit';
  readonly code: 'RATE_LIMIT_EXCEEDED';
  readonly retryAfter: number;
  readonly limit: number;
  readonly remaining: number;
}

export interface ServerError extends BaseError {
  readonly type: 'server';
  readonly code: 'INTERNAL_SERVER_ERROR' | 'SERVICE_UNAVAILABLE' | 'TIMEOUT';
  readonly service?: string;
}

export interface NetworkError extends BaseError {
  readonly type: 'network';
  readonly code: 'NETWORK_ERROR' | 'CONNECTION_FAILED' | 'TIMEOUT';
  readonly originalError?: unknown;
}

export interface PaymentError extends BaseError {
  readonly type: 'payment';
  readonly code: 
    | 'PAYMENT_FAILED'
    | 'PAYMENT_DECLINED'
    | 'INSUFFICIENT_FUNDS'
    | 'INVALID_PAYMENT_METHOD'
    | 'PAYMENT_PROCESSING_ERROR';
  readonly paymentMethod?: string;
  readonly paymentId?: string;
}

export interface InventoryError extends BaseError {
  readonly type: 'inventory';
  readonly code: 'INSUFFICIENT_STOCK' | 'PRODUCT_UNAVAILABLE' | 'VARIANT_NOT_FOUND';
  readonly productId?: string;
  readonly variantId?: string;
  readonly availableQuantity?: number;
  readonly requestedQuantity?: number;
}

// Error result types
export type ErrorResult<T = never> = {
  success: false;
  error: ApiError;
  data?: T;
};

export type SuccessResult<T> = {
  success: true;
  data: T;
  error?: never;
};

export type Result<T> = SuccessResult<T> | ErrorResult;

// Async result types
export type AsyncResult<T> = Promise<Result<T>>;

// HTTP status code to error type mapping
export const httpStatusToErrorType = (status: HttpStatus): ApiError['type'] => {
  switch (status) {
    case 400:
      return 'validation';
    case 401:
      return 'authentication';
    case 403:
      return 'authorization';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 422:
      return 'validation';
    case 429:
      return 'rate_limit';
    case 500:
    case 502:
    case 503:
      return 'server';
    default:
      return 'server';
  }
};

// Error factory functions
export const createValidationError = (
  fields: ValidationFieldError[],
  message = 'Validation failed'
): ValidationError => ({
  type: 'validation',
  code: 'VALIDATION_ERROR',
  message,
  timestamp: new Date().toISOString(),
  fields,
});

export const createAuthenticationError = (
  code: AuthenticationError['code'] = 'UNAUTHENTICATED',
  message = 'Authentication required'
): AuthenticationError => ({
  type: 'authentication',
  code,
  message,
  timestamp: new Date().toISOString(),
});

export const createNotFoundError = (
  resource?: string,
  resourceId?: string,
  message = 'Resource not found'
): NotFoundError => {
  const error: NotFoundError = {
    type: 'not_found',
    code: 'RESOURCE_NOT_FOUND',
    message,
    timestamp: new Date().toISOString(),
  };
  
  if (resource !== undefined) {
    (error as any).resource = resource;
  }
  if (resourceId !== undefined) {
    (error as any).resourceId = resourceId;
  }
  
  return error;
};

export const createPaymentError = (
  code: PaymentError['code'],
  message: string,
  paymentMethod?: string,
  paymentId?: string
): PaymentError => {
  const error: PaymentError = {
    type: 'payment',
    code,
    message,
    timestamp: new Date().toISOString(),
  };
  
  if (paymentMethod !== undefined) {
    (error as any).paymentMethod = paymentMethod;
  }
  if (paymentId !== undefined) {
    (error as any).paymentId = paymentId;
  }
  
  return error;
};

export const createInventoryError = (
  code: InventoryError['code'],
  message: string,
  productId?: string,
  variantId?: string,
  availableQuantity?: number,
  requestedQuantity?: number
): InventoryError => {
  const error: InventoryError = {
    type: 'inventory',
    code,
    message,
    timestamp: new Date().toISOString(),
  };
  
  if (productId !== undefined) {
    (error as any).productId = productId;
  }
  if (variantId !== undefined) {
    (error as any).variantId = variantId;
  }
  if (availableQuantity !== undefined) {
    (error as any).availableQuantity = availableQuantity;
  }
  if (requestedQuantity !== undefined) {
    (error as any).requestedQuantity = requestedQuantity;
  }
  
  return error;
};

// Error type guards
export const isValidationError = (error: ApiError): error is ValidationError =>
  error.type === 'validation';

export const isAuthenticationError = (error: ApiError): error is AuthenticationError =>
  error.type === 'authentication';

export const isAuthorizationError = (error: ApiError): error is AuthorizationError =>
  error.type === 'authorization';

export const isNotFoundError = (error: ApiError): error is NotFoundError =>
  error.type === 'not_found';

export const isConflictError = (error: ApiError): error is ConflictError =>
  error.type === 'conflict';

export const isRateLimitError = (error: ApiError): error is RateLimitError =>
  error.type === 'rate_limit';

export const isServerError = (error: ApiError): error is ServerError =>
  error.type === 'server';

export const isNetworkError = (error: ApiError): error is NetworkError =>
  error.type === 'network';

export const isPaymentError = (error: ApiError): error is PaymentError =>
  error.type === 'payment';

export const isInventoryError = (error: ApiError): error is InventoryError =>
  error.type === 'inventory';

// Result type guards
export const isSuccess = <T>(result: Result<T>): result is SuccessResult<T> =>
  result.success === true;

export const isError = <T>(result: Result<T>): result is ErrorResult =>
  result.success === false;

// Utility functions for error handling
export const toError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    return {
      type: 'server',
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
      details: {
        stack: error.stack,
        name: error.name,
      },
    };
  }

  if (typeof error === 'string') {
    return {
      type: 'server',
      code: 'INTERNAL_SERVER_ERROR',
      message: error,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    type: 'server',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unknown error occurred',
    timestamp: new Date().toISOString(),
    details: { originalError: error },
  };
};

export const toResult = <T>(data: T): SuccessResult<T> => ({
  success: true,
  data,
});

export const toErrorResult = <T = never>(error: ApiError): ErrorResult<T> => ({
  success: false,
  error,
});

// Error boundary types for React
export interface ErrorBoundaryState {
  hasError: boolean;
  error: ApiError | null;
  errorInfo: unknown;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: ApiError; reset: () => void }>;
  onError?: (error: ApiError, errorInfo: unknown) => void;
}

// Error reporting types
export interface ErrorReport {
  error: ApiError;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Retry strategy types
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: ApiError['type'][];
}

export interface RetryableFunction<T> {
  (): Promise<T>;
}

// Default retry configurations
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableErrors: ['network', 'server'],
};

// Circuit breaker types
export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  monitoringPeriod: number;
}

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}