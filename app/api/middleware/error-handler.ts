import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

// API Error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Error response formatter
export const formatErrorResponse = (error: ApiError | Error | unknown) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details = undefined;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || code;
    details = error.details;
  } else if (error instanceof Error) {
    message = error.message;

    // Map common errors to status codes
    if (error.name === 'ValidationError') {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
      code = 'UNAUTHORIZED';
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403;
      code = 'FORBIDDEN';
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
      code = 'NOT_FOUND';
    }
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {

  }

  return NextResponse.json(
    {
      error: {
        message,
        code,
        ...(details ? { details } : {}),
        ...(process.env.NODE_ENV === 'development'
          ? {
              stack: error instanceof Error ? error.stack : undefined,
            }
          : {}),
      },
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
};

// Async handler wrapper
export const asyncHandler = <T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return formatErrorResponse(error);
    }
  };
};

// Request validation middleware
export const validateRequest = async (
  req: NextRequest,
  schema: {
    body?: { safeParse: (data: unknown) => { success: boolean; error?: { errors: Array<{ path: string[]; message: string }> } } };
    query?: { safeParse: (data: unknown) => { success: boolean; error?: { errors: Array<{ path: string[]; message: string }> } } };
    params?: { safeParse: (data: unknown) => { success: boolean; error?: { errors: Array<{ path: string[]; message: string }> } } };
  }
) => {
  const errors: Record<string, string[]> = {};

  // Validate body
  if (schema.body && req.method !== 'GET') {
    try {
      const body = await req.json();
      const validation = schema.body.safeParse(body);

      if (!validation.success && validation.error) {
        errors['body'] = validation.error.errors.map(
          (e) => `${e.path.join('.')}: ${e.message}`
        );
      }
    } catch (_error) {
      errors['body'] = ['Invalid JSON body'];
    }
  }

  // Validate query parameters
  if (schema.query) {
    const query = Object.fromEntries(req.nextUrl.searchParams);
    const validation = schema.query.safeParse(query);

    if (!validation.success && validation.error) {
      errors['query'] = validation.error.errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      );
    }
  }

  // If there are validation errors, throw
  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', errors);
  }
};

// Rate limiting middleware
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (
  options: {
    windowMs?: number;
    max?: number;
  } = {}
) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const max = options.max || 100; // 100 requests per window

  return async (req: NextRequest) => {
    const identifier =
      req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();

    // Get or create request count
    let requestData = requestCounts.get(identifier);

    if (!requestData || now > requestData.resetTime) {
      requestData = {
        count: 0,
        resetTime: now + windowMs,
      };
      requestCounts.set(identifier, requestData);
    }

    requestData.count++;

    // Check if limit exceeded
    if (requestData.count > max) {
      const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);

      throw new ApiError(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED', {
        limit: max,
        windowMs,
        retryAfter,
      });
    }

    // Clean up old entries periodically
    if (requestCounts.size > 10000) {
      for (const [key, value] of requestCounts.entries()) {
        if (now > value.resetTime) {
          requestCounts.delete(key);
        }
      }
    }
  };
};

// CORS middleware
export const cors = (
  options: {
    origin?: string | string[] | ((origin: string) => boolean);
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  } = {}
) => {
  return (req: NextRequest) => {
    const origin = req.headers.get('origin');
    const headers = new Headers();

    // Handle origin
    if (options.origin) {
      if (typeof options.origin === 'string') {
        headers.set('Access-Control-Allow-Origin', options.origin);
      } else if (Array.isArray(options.origin)) {
        if (origin && options.origin.includes(origin)) {
          headers.set('Access-Control-Allow-Origin', origin);
        }
      } else if (typeof options.origin === 'function') {
        if (origin && options.origin(origin)) {
          headers.set('Access-Control-Allow-Origin', origin);
        }
      }
    } else {
      headers.set('Access-Control-Allow-Origin', '*');
    }

    // Handle methods
    if (options.methods) {
      headers.set('Access-Control-Allow-Methods', options.methods.join(', '));
    }

    // Handle headers
    if (options.headers) {
      headers.set('Access-Control-Allow-Headers', options.headers.join(', '));
    }

    // Handle credentials
    if (options.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers });
    }

    return headers;
  };
};

// Authentication middleware
export const authenticate = async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Authentication required', 'NO_TOKEN');
  }

  // TODO: Verify token with your auth service
  // For now, just check if token exists
  if (!token || token.length < 10) {
    throw new ApiError(401, 'Invalid token', 'INVALID_TOKEN');
  }

  // Return user data or continue
  return { userId: 'user-id', email: 'user@example.com' };
};

// Combined middleware runner
export const middleware = async (
  req: NextRequest,
  middlewares: ((req: NextRequest) => Promise<unknown> | unknown)[]
): Promise<void | NextResponse> => {
  for (const mw of middlewares) {
    const result = await mw(req);
    if (result instanceof NextResponse) {
      return result;
    }
  }
};
