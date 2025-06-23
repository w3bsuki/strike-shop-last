import type { NextRequest } from 'next/server';
const { LRUCache } = require('lru-cache') as any;

export interface RateLimitOptions {
  max?: number;
  window?: string;
  identifier?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Create separate caches for different rate limit contexts
const caches = new Map<string, any>();

function getCache(identifier: string): any {
  if (!caches.has(identifier)) {
    caches.set(
      identifier,
      new LRUCache({
        max: 10000, // Store up to 10k unique IPs
        ttl: 1000 * 60 * 60, // 1 hour TTL
      })
    );
  }
  return caches.get(identifier)!;
}

function getClientIdentifier(req: NextRequest): string {
  // Try to get the real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');

  if (cfConnectingIp) return cfConnectingIp;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp;

  // Fallback to a generic identifier if no IP is found
  return 'anonymous';
}

function parseWindow(window: string): number {
  const unit = window.slice(-1);
  const value = parseInt(window.slice(0, -1));

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 60 * 1000; // Default to 1 minute
  }
}

export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { max = 100, window = '1m', identifier = 'global' } = options;

  const cache = getCache(identifier);
  const clientId = getClientIdentifier(req);
  const now = Date.now();
  const windowMs = parseWindow(window);

  // Get or create rate limit entry
  let entry = cache.get(clientId);

  if (!entry || entry.resetAt <= now) {
    // Create new entry or reset expired one
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // Increment count
  entry.count++;

  // Update cache
  cache.set(clientId, entry);

  // Check if limit exceeded
  const success = entry.count <= max;
  const remaining = Math.max(0, max - entry.count);
  const reset = Math.ceil(entry.resetAt / 1000);

  if (!success) {
    // Rate limit exceeded

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service
    }

    throw new Error(
      `Rate limit exceeded. Try again in ${Math.ceil((entry.resetAt - now) / 1000)} seconds.`
    );
  }

  return { success, remaining, reset };
}

// Utility function for API routes
export function createRateLimiter(options: RateLimitOptions) {
  return (req: NextRequest) => rateLimit(req, options);
}

// Preset rate limiters for common use cases
export const rateLimiters = {
  // Strict limit for authentication endpoints
  auth: createRateLimiter({
    max: 5,
    window: '15m',
    identifier: 'auth',
  }),

  // Moderate limit for API endpoints
  api: createRateLimiter({
    max: 100,
    window: '1m',
    identifier: 'api',
  }),

  // Strict limit for payment endpoints
  payment: createRateLimiter({
    max: 3,
    window: '1m',
    identifier: 'payment',
  }),

  // Lenient limit for public endpoints
  public: createRateLimiter({
    max: 1000,
    window: '1m',
    identifier: 'public',
  }),
};
