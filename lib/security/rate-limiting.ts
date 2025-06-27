/**
 * RATE LIMITING IMPLEMENTATION
 * Advanced rate limiting with Redis/memory storage and multiple strategies
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Rate limit tiers
export const RATE_LIMIT_TIERS = {
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many requests from this IP, please try again later'
  },
  AUTHENTICATED: {
    windowMs: 60 * 1000, // 1 minute
    max: 1000,
    message: 'Rate limit exceeded, please slow down'
  },
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    max: 5000,
    message: 'Admin rate limit exceeded'
  },
  PAYMENT: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Payment endpoint rate limit exceeded, please wait before retrying'
  },
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Strict rate limit exceeded, please try again later'
  }
} as const

// Rate limit store interface
interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<number>
  reset(key: string): Promise<void>
  get(key: string): Promise<number | null>
}

// In-memory store (for development/single instance)
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now()
    const resetTime = now + windowMs

    const existing = this.store.get(key)
    
    if (existing && existing.resetTime > now) {
      existing.count++
      return existing.count
    } else {
      this.store.set(key, { count: 1, resetTime })
      return 1
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  async get(key: string): Promise<number | null> {
    const existing = this.store.get(key)
    if (existing && existing.resetTime > Date.now()) {
      return existing.count
    }
    return null
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime <= now) {
        this.store.delete(key)
      }
    }
  }
}

// Redis store (for production/distributed systems)
class RedisStore implements RateLimitStore {
  private redis: any // Replace with actual Redis client type

  constructor(redisClient: any) {
    this.redis = redisClient
  }

  async increment(key: string, windowMs: number): Promise<number> {
    const multi = this.redis.multi()
    const ttl = Math.ceil(windowMs / 1000)
    
    multi.incr(key)
    multi.expire(key, ttl)
    
    const results = await multi.exec()
    return results[0][1]
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async get(key: string): Promise<number | null> {
    const count = await this.redis.get(key)
    return count ? parseInt(count) : null
  }
}

// Rate limiter class
export class RateLimiter {
  private store: RateLimitStore

  constructor(store?: RateLimitStore) {
    this.store = store || new MemoryStore()
    
    // Run cleanup every minute for memory store
    if (this.store instanceof MemoryStore) {
      setInterval(() => {
        (this.store as MemoryStore).cleanup()
      }, 60 * 1000)
    }
  }

  /**
   * Get identifier for rate limiting
   */
  private async getIdentifier(request: NextRequest): Promise<string> {
    // Try to get user ID first (most specific)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        return `user:${user.id}`
      }
    } catch (error) {
      // Continue to IP fallback
    }

    // Fall back to IP address
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'
    
    return `ip:${ip}`
  }

  /**
   * Get rate limit key
   */
  private getRateLimitKey(identifier: string, endpoint: string): string {
    return `ratelimit:${endpoint}:${identifier}`
  }

  /**
   * Check if request should be rate limited
   */
  async shouldLimit(
    request: NextRequest,
    tier: keyof typeof RATE_LIMIT_TIERS = 'PUBLIC'
  ): Promise<{ limited: boolean; retryAfter?: number; remaining?: number }> {
    const identifier = await this.getIdentifier(request)
    const endpoint = request.nextUrl.pathname
    const key = this.getRateLimitKey(identifier, endpoint)
    
    const limit = RATE_LIMIT_TIERS[tier]
    const count = await this.store.increment(key, limit.windowMs)
    
    const remaining = Math.max(0, limit.max - count)
    const limited = count > limit.max
    
    if (limited) {
      return {
        limited: true,
        retryAfter: Math.ceil(limit.windowMs / 1000),
        remaining: 0
      }
    }
    
    return {
      limited: false,
      remaining
    }
  }

  /**
   * Create rate limit response
   */
  createRateLimitResponse(
    tier: keyof typeof RATE_LIMIT_TIERS,
    retryAfter: number
  ): NextResponse {
    const limit = RATE_LIMIT_TIERS[tier]
    
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: limit.message,
          retryAfter
        }
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + limit.windowMs).toISOString(),
          'Retry-After': retryAfter.toString()
        }
      }
    )
  }

  /**
   * Add rate limit headers to response
   */
  addRateLimitHeaders(
    response: NextResponse,
    tier: keyof typeof RATE_LIMIT_TIERS,
    remaining: number
  ): NextResponse {
    const limit = RATE_LIMIT_TIERS[tier]
    
    response.headers.set('X-RateLimit-Limit', limit.max.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + limit.windowMs).toISOString())
    
    return response
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter()

/**
 * Rate limiting middleware for Next.js API routes
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  tier: keyof typeof RATE_LIMIT_TIERS = 'PUBLIC'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const { limited, retryAfter, remaining } = await rateLimiter.shouldLimit(request, tier)
    
    if (limited && retryAfter) {
      return rateLimiter.createRateLimitResponse(tier, retryAfter)
    }
    
    // Execute handler
    const response = await handler(request)
    
    // Add rate limit headers
    if (remaining !== undefined) {
      rateLimiter.addRateLimitHeaders(response, tier, remaining)
    }
    
    return response
  }
}

/**
 * Advanced rate limiting with multiple strategies
 */
export class AdvancedRateLimiter extends RateLimiter {
  /**
   * Sliding window rate limiting
   */
  async slidingWindowLimit(
    request: NextRequest,
    windowMs: number,
    max: number
  ): Promise<{ limited: boolean; count: number }> {
    const identifier = await this['getIdentifier'](request)
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Store requests with timestamps
    const key = `sliding:${request.nextUrl.pathname}:${identifier}`
    const requests = await this.getRequestTimestamps(key, windowStart)
    
    // Add current request
    requests.push(now)
    
    // Clean old requests and save
    const validRequests = requests.filter(ts => ts > windowStart)
    await this.saveRequestTimestamps(key, validRequests, windowMs)
    
    return {
      limited: validRequests.length > max,
      count: validRequests.length
    }
  }

  /**
   * Token bucket rate limiting
   */
  async tokenBucketLimit(
    request: NextRequest,
    capacity: number,
    refillRate: number // tokens per second
  ): Promise<{ limited: boolean; tokensRemaining: number }> {
    const identifier = await this['getIdentifier'](request)
    const key = `bucket:${request.nextUrl.pathname}:${identifier}`
    
    const bucket = await this.getBucket(key)
    const now = Date.now()
    
    // Calculate tokens to add based on time passed
    const timePassed = (now - bucket.lastRefill) / 1000
    const tokensToAdd = Math.floor(timePassed * refillRate)
    
    // Update bucket
    bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
    
    // Check if we have tokens
    if (bucket.tokens >= 1) {
      bucket.tokens--
      await this.saveBucket(key, bucket)
      return { limited: false, tokensRemaining: bucket.tokens }
    }
    
    await this.saveBucket(key, bucket)
    return { limited: true, tokensRemaining: 0 }
  }

  /**
   * Distributed rate limiting with synchronization
   */
  async distributedLimit(
    request: NextRequest,
    limit: number,
    windowMs: number,
    nodeId: string
  ): Promise<{ limited: boolean; globalCount: number }> {
    const identifier = await this['getIdentifier'](request)
    const endpoint = request.nextUrl.pathname
    
    // Get counts from all nodes
    const nodeKeys = await this.getNodeKeys(endpoint, identifier)
    let totalCount = 0
    
    for (const nodeKey of nodeKeys) {
      const count = await this['store'].get(nodeKey) || 0
      totalCount += count
    }
    
    // Add current request to this node
    const thisNodeKey = `dist:${endpoint}:${identifier}:${nodeId}`
    await this['store'].increment(thisNodeKey, windowMs)
    
    return {
      limited: totalCount >= limit,
      globalCount: totalCount + 1
    }
  }

  // Helper methods for advanced strategies
  private async getRequestTimestamps(key: string, windowStart: number): Promise<number[]> {
    // Implementation depends on storage backend
    return []
  }

  private async saveRequestTimestamps(key: string, timestamps: number[], ttl: number): Promise<void> {
    // Implementation depends on storage backend
  }

  private async getBucket(key: string): Promise<{ tokens: number; lastRefill: number }> {
    // Implementation depends on storage backend
    return { tokens: 0, lastRefill: Date.now() }
  }

  private async saveBucket(key: string, bucket: { tokens: number; lastRefill: number }): Promise<void> {
    // Implementation depends on storage backend
  }

  private async getNodeKeys(endpoint: string, identifier: string): Promise<string[]> {
    // Implementation depends on storage backend
    return []
  }
}

/**
 * Endpoint-specific rate limit configurations
 */
export const ENDPOINT_LIMITS = {
  '/api/auth/login': { tier: 'STRICT' as const, max: 5, windowMs: 15 * 60 * 1000 },
  '/api/auth/register': { tier: 'STRICT' as const, max: 3, windowMs: 60 * 60 * 1000 },
  '/api/payments': { tier: 'PAYMENT' as const },
  '/api/admin': { tier: 'ADMIN' as const },
  '/api/products': { tier: 'PUBLIC' as const },
  '/api/reviews': { tier: 'AUTHENTICATED' as const, max: 20, windowMs: 60 * 1000 },
  '/api/webhooks': { tier: 'PUBLIC' as const, max: 1000, windowMs: 60 * 1000 }
} as const

/**
 * Get rate limit tier for endpoint
 */
export function getEndpointTier(pathname: string): keyof typeof RATE_LIMIT_TIERS {
  for (const [endpoint, config] of Object.entries(ENDPOINT_LIMITS)) {
    if (pathname.startsWith(endpoint)) {
      return config.tier
    }
  }
  
  // Default based on authentication
  const { userId } = auth()
  return userId ? 'AUTHENTICATED' : 'PUBLIC'
}