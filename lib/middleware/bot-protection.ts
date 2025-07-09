/**
 * Bot Protection Middleware
 * Detects and blocks automated bot traffic from cart operations
 * Uses multiple signals to determine bot likelihood
 */

import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

// Bot detection thresholds
const BOT_THRESHOLDS = {
  // Request patterns
  requestsPerMinute: 20, // More than 20 requests/min is suspicious
  cartAdditionsPerMinute: 10, // More than 10 cart additions/min is suspicious
  
  // User agent patterns (known bots)
  botUserAgents: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /ruby/i,
    /perl/i,
    /go-http-client/i,
    /postman/i,
    /insomnia/i,
  ],
  
  // Suspicious patterns
  suspiciousPatterns: {
    noUserAgent: 10, // No user agent header
    noReferer: 5, // No referer on cart operations
    directApiAccess: 15, // Direct API access without page visit
    rapidActions: 20, // Too rapid successive actions
    identicalRequests: 25, // Identical requests in succession
  },
};

// Track request patterns
const requestPatterns = new LRUCache<string, {
  requests: Array<{ timestamp: number; path: string; hash: string }>;
  cartAdditions: number[];
  suspiciousScore: number;
  lastSeen: number;
}>({
  max: 10000,
  ttl: 60 * 60 * 1000, // 1 hour
});

// Track session patterns
const sessionPatterns = new LRUCache<string, {
  pageViews: Set<string>;
  apiCalls: Set<string>;
  hasJavaScript: boolean;
  hasCookies: boolean;
}>({
  max: 10000,
  ttl: 60 * 60 * 1000, // 1 hour
});

/**
 * Generate request hash for duplicate detection
 */
function generateRequestHash(request: NextRequest): string {
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const body = request.body ? JSON.stringify(request.body) : '';
  
  return `${method}:${pathname}${search}:${body}`;
}

/**
 * Get client identifier
 */
function getClientId(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown';
  const sessionId = request.cookies.get('session-id')?.value || 'no-session';
  
  return `${ip}:${sessionId}`;
}

/**
 * Calculate bot score based on various signals
 */
function calculateBotScore(
  request: NextRequest,
  clientId: string,
): number {
  let score = 0;
  const now = Date.now();
  
  // Check user agent
  const userAgent = request.headers.get('user-agent');
  if (!userAgent) {
    score += BOT_THRESHOLDS.suspiciousPatterns.noUserAgent;
  } else {
    // Check against known bot patterns
    for (const pattern of BOT_THRESHOLDS.botUserAgents) {
      if (pattern.test(userAgent)) {
        score += 50; // Known bot
        break;
      }
    }
  }
  
  // Check referer for cart operations
  const referer = request.headers.get('referer');
  const isCartOperation = request.nextUrl.pathname.includes('cart');
  if (isCartOperation && !referer) {
    score += BOT_THRESHOLDS.suspiciousPatterns.noReferer;
  }
  
  // Check request patterns
  const patterns = requestPatterns.get(clientId);
  if (patterns) {
    // Check request rate
    const recentRequests = patterns.requests.filter(
      r => r.timestamp > now - 60000, // Last minute
    );
    
    if (recentRequests.length > BOT_THRESHOLDS.requestsPerMinute) {
      score += 20;
    }
    
    // Check for identical requests
    const requestHash = generateRequestHash(request);
    const identicalRequests = recentRequests.filter(r => r.hash === requestHash);
    if (identicalRequests.length > 3) {
      score += BOT_THRESHOLDS.suspiciousPatterns.identicalRequests;
    }
    
    // Check cart addition rate
    if (isCartOperation) {
      const recentCartAdditions = patterns.cartAdditions.filter(
        timestamp => timestamp > now - 60000,
      );
      
      if (recentCartAdditions.length > BOT_THRESHOLDS.cartAdditionsPerMinute) {
        score += 30;
      }
      
      // Check time between cart additions
      if (recentCartAdditions.length > 1) {
        const timeDiffs = [];
        for (let i = 1; i < recentCartAdditions.length; i++) {
          timeDiffs.push(recentCartAdditions[i]! - recentCartAdditions[i - 1]!);
        }
        
        const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
        if (avgTimeDiff < 1000) { // Less than 1 second between additions
          score += BOT_THRESHOLDS.suspiciousPatterns.rapidActions;
        }
      }
    }
    
    // Add existing suspicious score
    score += patterns.suspiciousScore;
  }
  
  // Check session patterns
  const session = sessionPatterns.get(clientId);
  if (session) {
    // Check for direct API access without page views
    if (session.apiCalls.size > 0 && session.pageViews.size === 0) {
      score += BOT_THRESHOLDS.suspiciousPatterns.directApiAccess;
    }
    
    // Check for JavaScript execution
    if (!session.hasJavaScript) {
      score += 10;
    }
    
    // Check for cookie support
    if (!session.hasCookies) {
      score += 5;
    }
  } else if (request.nextUrl.pathname.startsWith('/api/')) {
    // First request is to API
    score += BOT_THRESHOLDS.suspiciousPatterns.directApiAccess;
  }
  
  return score;
}

/**
 * Update request patterns
 */
function updateRequestPatterns(
  request: NextRequest,
  clientId: string,
  score: number,
): void {
  const now = Date.now();
  const requestHash = generateRequestHash(request);
  const isCartOperation = request.nextUrl.pathname.includes('cart');
  
  const existing = requestPatterns.get(clientId) || {
    requests: [],
    cartAdditions: [],
    suspiciousScore: 0,
    lastSeen: now,
  };
  
  // Add current request
  existing.requests.push({
    timestamp: now,
    path: request.nextUrl.pathname,
    hash: requestHash,
  });
  
  // Keep only recent requests (last 5 minutes)
  existing.requests = existing.requests.filter(r => r.timestamp > now - 300000);
  
  // Track cart additions
  if (isCartOperation && request.method === 'POST') {
    existing.cartAdditions.push(now);
    existing.cartAdditions = existing.cartAdditions.filter(t => t > now - 300000);
  }
  
  // Update suspicious score (decays over time)
  const timeSinceLastSeen = now - existing.lastSeen;
  const decayFactor = Math.max(0, 1 - timeSinceLastSeen / (60 * 60 * 1000)); // Decay over 1 hour
  existing.suspiciousScore = Math.max(0, existing.suspiciousScore * decayFactor);
  
  existing.lastSeen = now;
  
  requestPatterns.set(clientId, existing);
}

/**
 * Update session patterns
 */
export function updateSessionPatterns(
  clientId: string,
  type: 'page' | 'api',
  path: string,
  hasJavaScript?: boolean,
  hasCookies?: boolean,
): void {
  const existing = sessionPatterns.get(clientId) || {
    pageViews: new Set(),
    apiCalls: new Set(),
    hasJavaScript: false,
    hasCookies: false,
  };
  
  if (type === 'page') {
    existing.pageViews.add(path);
  } else {
    existing.apiCalls.add(path);
  }
  
  if (hasJavaScript !== undefined) {
    existing.hasJavaScript = hasJavaScript;
  }
  
  if (hasCookies !== undefined) {
    existing.hasCookies = hasCookies;
  }
  
  sessionPatterns.set(clientId, existing);
}

/**
 * Bot protection middleware
 */
export async function botProtection(request: NextRequest): Promise<{
  isBot: boolean;
  score: number;
  reason?: string;
}> {
  const clientId = getClientId(request);
  
  // Calculate bot score
  const score = calculateBotScore(request, clientId);
  
  // Update patterns
  updateRequestPatterns(request, clientId, score);
  
  // Determine if it's a bot
  const isBot = score >= 50;
  
  let reason: string | undefined;
  if (isBot) {
    if (score >= 100) {
      reason = 'Known bot user agent';
    } else if (score >= 75) {
      reason = 'Suspicious request patterns';
    } else {
      reason = 'Automated behavior detected';
    }
  }
  
  // Log suspicious activity
  if (score > 30) {
    console.warn(`[Bot Protection] Suspicious activity detected for ${clientId}`, {
      score,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent'),
      reason,
    });
  }
  
  return { isBot, score, reason };
}

/**
 * Generate CAPTCHA challenge
 */
export function generateCaptchaChallenge(): {
  challenge: string;
  token: string;
} {
  // In production, integrate with a real CAPTCHA service like reCAPTCHA or hCaptcha
  // This is a placeholder implementation
  const challenge = Math.random().toString(36).substring(2, 8).toUpperCase();
  const token = Buffer.from(`${challenge}:${Date.now()}`).toString('base64');
  
  return { challenge, token };
}

/**
 * Verify CAPTCHA response
 */
export async function verifyCaptchaResponse(
  token: string,
  response: string,
): Promise<boolean> {
  // In production, verify with the CAPTCHA service
  // This is a placeholder implementation
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [challenge] = decoded.split(':');
    return challenge === response.toUpperCase();
  } catch {
    return false;
  }
}

/**
 * Rate limit specifically for bot-like behavior
 */
export function getBotRateLimit(score: number): {
  limit: number;
  window: number;
} {
  if (score >= 75) {
    // Severe restrictions for likely bots
    return { limit: 5, window: 60 * 60 * 1000 }; // 5 requests per hour
  } else if (score >= 50) {
    // Moderate restrictions
    return { limit: 20, window: 60 * 60 * 1000 }; // 20 requests per hour
  } else if (score >= 30) {
    // Light restrictions
    return { limit: 100, window: 60 * 60 * 1000 }; // 100 requests per hour
  }
  
  // Normal limits
  return { limit: 1000, window: 60 * 60 * 1000 }; // 1000 requests per hour
}