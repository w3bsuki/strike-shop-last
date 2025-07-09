/**
 * Rate Limiting Middleware
 * Implements flexible rate limiting with different limits per endpoint
 * Supports both Upstash Redis and in-memory fallback
 */

import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

// Rate limit configurations per endpoint
const RATE_LIMITS = {
  // Cart operations: 30 requests per minute
  '/api/cart': { limit: 30, window: 60 * 1000 },
  
  // Checkout: 10 requests per minute
  '/api/checkout': { limit: 10, window: 60 * 1000 },
  
  // Webhooks: 100 requests per minute
  '/api/webhooks': { limit: 100, window: 60 * 1000 },
  
  // Auth endpoints: 5 requests per minute
  '/api/auth': { limit: 5, window: 60 * 1000 },
  
  // Product search: 60 requests per minute
  '/api/search': { limit: 60, window: 60 * 1000 },
  
  // Default for other endpoints: 60 requests per minute
  default: { limit: 60, window: 60 * 1000 },
} as const;

// Upstash Redis client (optional)
let upstashClient: any = null;

// Initialize Upstash if available
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const { Redis } = require('@upstash/redis');
    upstashClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.warn('Upstash Redis not available, falling back to in-memory rate limiting');
  }
}

// In-memory fallback using LRU cache
const memoryStore = new LRUCache<string, { count: number; resetTime: number }>({
  max: 10000, // Store up to 10k unique IPs
  ttl: 60 * 60 * 1000, // 1 hour TTL
});

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Use the first available IP
  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown';
  
  // For authenticated requests, include user ID for more accurate limiting
  const userId = request.headers.get('x-user-id');
  
  return userId ? `user:${userId}` : `ip:${ip}`;
}

/**
 * Get rate limit configuration for a path
 */
function getRateLimitConfig(path: string) {
  // Find matching config
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pattern !== 'default' && path.startsWith(pattern)) {
      return config;
    }
  }
  
  return RATE_LIMITS.default;
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(request: NextRequest): Promise<{
  blocked: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
}> {
  const path = request.nextUrl.pathname;
  const clientId = getClientId(request);
  const config = getRateLimitConfig(path);
  
  const now = Date.now();
  const key = `rate-limit:${path}:${clientId}`;
  
  try {
    if (upstashClient) {
      // Use Upstash Redis
      const pipeline = upstashClient.pipeline();
      
      // Get current count and TTL
      pipeline.get(key);
      pipeline.ttl(key);
      
      const [count, ttl] = await pipeline.exec();
      
      const currentCount = parseInt(count || '0');
      const resetTime = ttl > 0 ? now + (ttl * 1000) : now + config.window;
      
      if (currentCount >= config.limit) {
        // Rate limit exceeded
        return {
          blocked: true,
          limit: config.limit,
          remaining: 0,
          reset: resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000),
        };
      }
      
      // Increment counter
      const newCount = await upstashClient.incr(key);
      
      // Set expiry on first request
      if (newCount === 1) {
        await upstashClient.expire(key, Math.ceil(config.window / 1000));
      }
      
      return {
        blocked: false,
        limit: config.limit,
        remaining: config.limit - newCount,
        reset: resetTime,
        retryAfter: 0,
      };
    } else {
      // Use in-memory store
      const stored = memoryStore.get(key);
      
      if (stored && stored.resetTime > now) {
        // Window still active
        if (stored.count >= config.limit) {
          // Rate limit exceeded
          return {
            blocked: true,
            limit: config.limit,
            remaining: 0,
            reset: stored.resetTime,
            retryAfter: Math.ceil((stored.resetTime - now) / 1000),
          };
        }
        
        // Increment count
        stored.count++;
        memoryStore.set(key, stored);
        
        return {
          blocked: false,
          limit: config.limit,
          remaining: config.limit - stored.count,
          reset: stored.resetTime,
          retryAfter: 0,
        };
      } else {
        // New window
        const resetTime = now + config.window;
        memoryStore.set(key, { count: 1, resetTime });
        
        return {
          blocked: false,
          limit: config.limit,
          remaining: config.limit - 1,
          reset: resetTime,
          retryAfter: 0,
        };
      }
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    
    // On error, allow the request but log it
    return {
      blocked: false,
      limit: config.limit,
      remaining: config.limit,
      reset: now + config.window,
      retryAfter: 0,
    };
  }
}

/**
 * Helper to create rate limit headers
 */
export function getRateLimitHeaders(result: Awaited<ReturnType<typeof rateLimit>>) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    ...(result.blocked && { 'Retry-After': result.retryAfter.toString() }),
  };
}

/**
 * Rate limit by API key (for external APIs)
 */
export async function rateLimitByApiKey(
  apiKey: string,
  limit: number = 1000,
  window: number = 60 * 60 * 1000, // 1 hour
): Promise<boolean> {
  const key = `api-key:${apiKey}`;
  const now = Date.now();
  
  try {
    if (upstashClient) {
      const count = await upstashClient.incr(key);
      
      if (count === 1) {
        await upstashClient.expire(key, Math.ceil(window / 1000));
      }
      
      return count <= limit;
    } else {
      const stored = memoryStore.get(key);
      
      if (stored && stored.resetTime > now) {
        stored.count++;
        memoryStore.set(key, stored);
        return stored.count <= limit;
      } else {
        memoryStore.set(key, { count: 1, resetTime: now + window });
        return true;
      }
    }
  } catch (error) {
    console.error('API key rate limiting error:', error);
    return true; // Allow on error
  }
}