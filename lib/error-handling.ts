import { toast } from '@/hooks/use-toast';

// Error types
export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public fields?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Retry configuration
interface RetryConfig {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

// Retry mechanism
export async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    onRetry,
  } = config;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof NetworkError ||
    (error instanceof Error && 
      (error.message.includes('fetch') || 
       error.message.includes('network') ||
       error.message.includes('Failed to fetch')))
  );
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

// User-friendly error messages
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Connection error. Please check your internet and try again.';
  }

  if (isApiError(error)) {
    switch (error.statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Please sign in to continue.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested item was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'Something went wrong. Please try again.';
    }
  }

  if (isValidationError(error)) {
    return error.message || 'Please check your input and try again.';
  }

  return getErrorMessage(error);
}

// Toast error handler
export function handleError(error: unknown, showToast = true): void {
  const message = getUserFriendlyErrorMessage(error);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  // Log to monitoring service
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error);
  }

  // Show toast notification
  if (showToast) {
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  }
}

// Async error handler wrapper
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: { showToast?: boolean; fallback?: any } = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options.showToast);
      if (options.fallback !== undefined) {
        return options.fallback;
      }
      throw error;
    }
  }) as T;
}

// Loading state manager
export interface LoadingState<T = any> {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  retry: () => void;
}

// Hook for managing loading states
export function createLoadingState<T>(
  initialData: T | null = null
): LoadingState<T> {
  return {
    isLoading: false,
    error: null,
    data: initialData,
    retry: () => {},
  };
}