/**
 * 2025 Production Rate Limiting - Simple & Fast
 * Clean, minimal API with Upstash Redis
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, type RateLimitType } from './config';

/**
 * Simple rate limit check - returns response if blocked, null if allowed
 */
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType
): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'anonymous';
  
  const { success, limit, remaining, reset } = await rateLimiters[type].limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }
  
  return null; // Allow request
}