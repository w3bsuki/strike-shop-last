/**
 * Shopify Webhook Verification
 * Implements HMAC-SHA256 signature verification for Shopify webhooks
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { logWebhookFailed, logger } from '@/lib/monitoring';
import type { 
  ShopifyWebhookHeaders, 
  WebhookVerificationResult,
  WebhookVerificationError,
  ShopifyWebhookTopic
} from '../types/webhooks';

// Rate limiting tracking (in-memory for simplicity, use Redis in production)
const webhookAttempts = new Map<string, { count: number; resetAt: number }>();

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 100; // Max webhooks per minute per shop
const WEBHOOK_TIMEOUT = 5 * 60 * 1000; // 5 minutes - reject webhooks older than this

/**
 * Verify Shopify webhook signature using HMAC-SHA256
 * 
 * @param rawBody - The raw request body as a string or Buffer
 * @param signature - The X-Shopify-Hmac-Sha256 header value
 * @param secret - The webhook secret from environment variables
 * @param headers - Optional webhook headers for additional validation
 * @returns Verification result with status and metadata
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string | null | undefined,
  secret: string | null | undefined,
  headers?: Partial<ShopifyWebhookHeaders>
): WebhookVerificationResult {
  try {
    // Validate inputs
    if (!signature) {
      return {
        verified: false,
        error: 'Missing webhook signature header'
      };
    }

    if (!secret) {
      return {
        verified: false,
        error: 'Webhook secret not configured'
      };
    }

    if (!rawBody) {
      return {
        verified: false,
        error: 'Empty webhook body'
      };
    }

    // Check webhook age if timestamp is provided
    if (headers?.['x-shopify-triggered-at']) {
      const triggeredAt = new Date(headers['x-shopify-triggered-at']).getTime();
      const now = Date.now();
      
      if (now - triggeredAt > WEBHOOK_TIMEOUT) {
        return {
          verified: false,
          error: `Webhook is too old (${Math.floor((now - triggeredAt) / 1000)}s)`
        };
      }
    }

    // Convert body to string if it's a Buffer
    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    // Calculate HMAC
    const hash = createHmac('sha256', secret)
      .update(bodyString, 'utf8')
      .digest('base64');

    // Timing-safe comparison
    const hashBuffer = Buffer.from(hash);
    const signatureBuffer = Buffer.from(signature);

    // Buffers must be same length for timing-safe comparison
    if (hashBuffer.length !== signatureBuffer.length) {
      return {
        verified: false,
        error: 'Invalid signature format'
      };
    }

    const verified = timingSafeEqual(hashBuffer, signatureBuffer);

    if (!verified) {
      return {
        verified: false,
        error: 'Invalid webhook signature'
      };
    }

    // Extract additional metadata if headers provided
    const result: WebhookVerificationResult = {
      verified: true
    };

    if (headers?.['x-shopify-topic']) {
      result.topic = headers['x-shopify-topic'] as ShopifyWebhookTopic;
    }

    if (headers?.['x-shopify-shop-domain']) {
      result.domain = headers['x-shopify-shop-domain'];
    }

    return result;

  } catch (error) {
    console.error('Webhook verification error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

/**
 * Check rate limiting for webhook processing
 * 
 * @param shopDomain - The shop domain from webhook headers
 * @returns Whether the webhook should be processed
 */
export function checkWebhookRateLimit(shopDomain: string): boolean {
  const now = Date.now();
  const key = `webhook:${shopDomain}`;
  
  // Get or create rate limit entry
  let rateLimit = webhookAttempts.get(key);
  
  if (!rateLimit || now > rateLimit.resetAt) {
    // Create new window
    rateLimit = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW
    };
    webhookAttempts.set(key, rateLimit);
  }
  
  // Check if exceeded
  if (rateLimit.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }
  
  // Increment counter
  rateLimit.count++;
  
  // Cleanup old entries periodically
  if (webhookAttempts.size > 1000) {
    for (const [k, v] of webhookAttempts.entries()) {
      if (now > v.resetAt) {
        webhookAttempts.delete(k);
      }
    }
  }
  
  return true;
}

/**
 * Parse webhook headers from Next.js headers
 * 
 * @param headers - Headers object from Next.js
 * @returns Parsed Shopify webhook headers
 */
export function parseWebhookHeaders(headers: Headers): Partial<ShopifyWebhookHeaders> {
  const webhookHeaders: Partial<ShopifyWebhookHeaders> = {};
  
  const headerMapping: Record<string, keyof ShopifyWebhookHeaders> = {
    'x-shopify-topic': 'x-shopify-topic',
    'x-shopify-hmac-sha256': 'x-shopify-hmac-sha256',
    'x-shopify-shop-domain': 'x-shopify-shop-domain',
    'x-shopify-api-version': 'x-shopify-api-version',
    'x-shopify-webhook-id': 'x-shopify-webhook-id',
    'x-shopify-triggered-at': 'x-shopify-triggered-at',
  };
  
  for (const [header, key] of Object.entries(headerMapping)) {
    const value = headers.get(header);
    if (value) {
      (webhookHeaders as any)[key] = value;
    }
  }
  
  return webhookHeaders;
}

/**
 * Validate webhook payload structure
 * 
 * @param payload - Parsed webhook payload
 * @returns Whether the payload has required fields
 */
export function validateWebhookPayload(payload: any): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  // All Shopify webhooks should have an ID
  if (!payload.id && !payload.inventory_item_id) { // inventory_levels/update is special
    return false;
  }
  
  return true;
}

/**
 * Create a webhook error with proper typing
 * 
 * @param message - Error message
 * @param code - Error code
 * @returns WebhookVerificationError instance
 */
export function createWebhookError(
  message: string,
  code: 'INVALID_SIGNATURE' | 'MISSING_HEADER' | 'INVALID_PAYLOAD' | 'EXPIRED_WEBHOOK'
): WebhookVerificationError {
  const error = new Error(message) as WebhookVerificationError;
  error.name = 'WebhookVerificationError';
  (error as any).code = code;
  return error;
}

/**
 * Log webhook processing for debugging and monitoring
 * 
 * @param event - Event details to log
 */
export function logWebhookEvent(event: {
  topic: string;
  shop: string;
  webhookId?: string;
  success: boolean;
  error?: string;
  duration?: number;
}): void {
  const logData = {
    type: 'webhook_processed',
    timestamp: new Date().toISOString(),
    ...event
  };
  
  if (event.success) {
    logger.info('Webhook processed successfully', {
      webhook: logData
    });
  } else {
    logger.error('Webhook processing failed', {
      webhook: logData,
      error: event.error
    });
    
    // Also log to webhook-specific logger if we have the ID
    if (event.webhookId) {
      logWebhookFailed(event.webhookId, event.error || 'Unknown error');
    }
  }
}

/**
 * Format webhook response for consistency
 * 
 * @param success - Whether the webhook was processed successfully
 * @param message - Optional message
 * @param data - Optional response data
 * @returns Formatted response object
 */
export function formatWebhookResponse(
  success: boolean,
  message?: string,
  data?: any
): { success: boolean; message?: string; data?: any; timestamp: string } {
  return {
    success,
    ...(message && { message }),
    ...(data && { data }),
    timestamp: new Date().toISOString()
  };
}