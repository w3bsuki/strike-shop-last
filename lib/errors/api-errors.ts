/**
 * 2025 Error Handling - Clean & Typed
 */

export class APIError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends APIError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ShopifyError extends APIError {
  constructor(message: string, status: number = 502) {
    super(message, status, 'SHOPIFY_ERROR');
    this.name = 'ShopifyError';
  }
}

export function handleError(error: unknown): { message: string; status: number; code?: string } {
  if (error instanceof APIError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
    };
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
      code: 'INTERNAL_ERROR',
    };
  }
  
  return {
    message: 'An unexpected error occurred',
    status: 500,
    code: 'UNKNOWN_ERROR',
  };
}