/**
 * Production Rate Limiting Configuration
 * Using Upstash Redis for distributed rate limiting
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = (() => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    // In production, we need valid Upstash credentials
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing Upstash Redis credentials in production environment');
    }
    // For development, create a mock Redis client
    return {
      get: async () => null,
      set: async () => 'OK',
      del: async () => 1,
      expire: async () => 1,
      exists: async () => 0,
      incr: async () => 1,
      eval: async () => null,
    } as any;
  }
  
  return new Redis({ url, token });
})();

// Rate limiting configurations for different endpoints
export const rateLimitConfigs = {
  // Authentication endpoints - very strict
  auth: {
    requests: 5,
    window: '15m',
    identifier: 'auth',
  },
  
  // Password reset - strict
  passwordReset: {
    requests: 3,
    window: '15m',
    identifier: 'password-reset',
  },
  
  // Payment endpoints - strict
  payment: {
    requests: 10,
    window: '1m',
    identifier: 'payment',
  },
  
  // Checkout endpoints - moderate
  checkout: {
    requests: 20,
    window: '1m',
    identifier: 'checkout',
  },
  
  // Cart operations - lenient
  cart: {
    requests: 100,
    window: '1m',
    identifier: 'cart',
  },
  
  // API endpoints - moderate
  api: {
    requests: 100,
    window: '1m',
    identifier: 'api',
  },
  
  // Public endpoints - very lenient
  public: {
    requests: 1000,
    window: '1m',
    identifier: 'public',
  },
  
  // Search endpoints - moderate
  search: {
    requests: 50,
    window: '1m',
    identifier: 'search',
  },
} as const;

// Create rate limiters for each configuration
export const rateLimiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.auth.requests,
      rateLimitConfigs.auth.window
    ),
    analytics: true,
  }),
  
  passwordReset: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.passwordReset.requests,
      rateLimitConfigs.passwordReset.window
    ),
    analytics: true,
  }),
  
  payment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.payment.requests,
      rateLimitConfigs.payment.window
    ),
    analytics: true,
  }),
  
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.checkout.requests,
      rateLimitConfigs.checkout.window
    ),
    analytics: true,
  }),
  
  cart: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.cart.requests,
      rateLimitConfigs.cart.window
    ),
    analytics: true,
  }),
  
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.api.requests,
      rateLimitConfigs.api.window
    ),
    analytics: true,
  }),
  
  public: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.public.requests,
      rateLimitConfigs.public.window
    ),
    analytics: true,
  }),
  
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.search.requests,
      rateLimitConfigs.search.window
    ),
    analytics: true,
  }),
};

export type RateLimitType = keyof typeof rateLimiters;