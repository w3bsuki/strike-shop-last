/**
 * Base Webhook Handler Utility
 * Provides a standardized way to handle Shopify webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  verifyWebhookSignature,
  checkWebhookRateLimit,
  parseWebhookHeaders,
  validateWebhookPayload,
  logWebhookEvent,
  formatWebhookResponse,
  createWebhookError
} from './verify';
import type {
  WebhookHandler,
  WebhookHandlerResult,
  ShopifyWebhookHeaders,
  ShopifyWebhookTopic,
  WebhookPayload
} from '../types/webhooks';

// Handler registry for different webhook topics
const webhookHandlers = new Map<ShopifyWebhookTopic, WebhookHandler>();

/**
 * Register a webhook handler for a specific topic
 * 
 * @param topic - The webhook topic to handle
 * @param handler - The handler function
 */
export function registerWebhookHandler<T extends WebhookPayload = WebhookPayload>(
  topic: ShopifyWebhookTopic,
  handler: WebhookHandler<T>
): void {
  webhookHandlers.set(topic, handler as WebhookHandler);
}

/**
 * Create a standardized webhook route handler
 * 
 * @param options - Handler configuration options
 * @returns Next.js route handler function
 */
export function createWebhookHandler(options?: {
  secret?: string;
  handlers?: Map<ShopifyWebhookTopic, WebhookHandler>;
  onError?: (error: Error, topic?: string) => void;
  validatePayload?: (payload: any, topic: string) => boolean;
  beforeProcess?: (payload: any, headers: Partial<ShopifyWebhookHeaders>) => Promise<void>;
  afterProcess?: (result: WebhookHandlerResult, topic: string) => Promise<void>;
}) {
  return async function POST(request: NextRequest) {
    const startTime = Date.now();
    let topic: string | undefined;
    let shopDomain: string | undefined;
    let webhookId: string | undefined;

    try {
      // Get request body
      const rawBody = await request.text();
      
      // Get headers
      const headersList = await headers();
      const signature = headersList.get('x-shopify-hmac-sha256');
      const webhookHeaders = parseWebhookHeaders(headersList);
      
      topic = webhookHeaders['x-shopify-topic'];
      shopDomain = webhookHeaders['x-shopify-shop-domain'];
      webhookId = webhookHeaders['x-shopify-webhook-id'];

      // Validate required headers
      if (!signature) {
        throw createWebhookError('Missing X-Shopify-Hmac-Sha256 header', 'MISSING_HEADER');
      }

      if (!topic) {
        throw createWebhookError('Missing X-Shopify-Topic header', 'MISSING_HEADER');
      }

      if (!shopDomain) {
        throw createWebhookError('Missing X-Shopify-Shop-Domain header', 'MISSING_HEADER');
      }

      // Check rate limiting
      if (!checkWebhookRateLimit(shopDomain)) {
        return NextResponse.json(
          formatWebhookResponse(false, 'Rate limit exceeded'),
          { status: 429 }
        );
      }

      // Get webhook secret
      const secret = options?.secret || process.env.SHOPIFY_WEBHOOK_SECRET;
      if (!secret) {
        throw new Error('SHOPIFY_WEBHOOK_SECRET not configured');
      }

      // Verify webhook signature
      const verificationResult = verifyWebhookSignature(
        rawBody,
        signature,
        secret,
        webhookHeaders
      );

      if (!verificationResult.verified) {
        throw createWebhookError(
          verificationResult.error || 'Webhook verification failed',
          'INVALID_SIGNATURE'
        );
      }

      // Parse payload
      let payload: WebhookPayload;
      try {
        payload = JSON.parse(rawBody);
      } catch (e) {
        throw createWebhookError('Invalid JSON payload', 'INVALID_PAYLOAD');
      }

      // Validate payload structure
      const isValidPayload = options?.validatePayload 
        ? options.validatePayload(payload, topic)
        : validateWebhookPayload(payload);

      if (!isValidPayload) {
        throw createWebhookError('Invalid webhook payload structure', 'INVALID_PAYLOAD');
      }

      // Run before process hook
      if (options?.beforeProcess) {
        await options.beforeProcess(payload, webhookHeaders);
      }

      // Get handler for topic
      const handlers = options?.handlers || webhookHandlers;
      const handler = handlers.get(topic as ShopifyWebhookTopic);

      if (!handler) {
        console.warn(`No handler registered for webhook topic: ${topic}`);
        // Return success even if no handler - webhook is valid
        return NextResponse.json(
          formatWebhookResponse(true, `No handler for topic: ${topic}`)
        );
      }

      // Process webhook
      const result = await handler(payload, webhookHeaders as ShopifyWebhookHeaders);

      // Run after process hook
      if (options?.afterProcess) {
        await options.afterProcess(result, topic);
      }

      // Log success
      logWebhookEvent({
        topic,
        shop: shopDomain,
        webhookId,
        success: result.success,
        error: result.error,
        duration: Date.now() - startTime
      });

      // Return response
      const statusCode = result.success ? 200 : 500;
      return NextResponse.json(
        formatWebhookResponse(result.success, result.message, result.data),
        { status: statusCode }
      );

    } catch (error) {
      // Log error
      logWebhookEvent({
        topic: topic || 'unknown',
        shop: shopDomain || 'unknown',
        webhookId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });

      // Call error handler if provided
      if (options?.onError) {
        options.onError(error as Error, topic);
      }

      // Determine status code
      let statusCode = 500;
      if (error instanceof Error) {
        if (error.message.includes('Missing') || error.message.includes('Invalid')) {
          statusCode = 400;
        } else if (error.message.includes('Rate limit')) {
          statusCode = 429;
        } else if ((error as any).code === 'INVALID_SIGNATURE') {
          statusCode = 401;
        }
      }

      // Return error response
      return NextResponse.json(
        formatWebhookResponse(
          false,
          error instanceof Error ? error.message : 'Webhook processing failed'
        ),
        { status: statusCode }
      );
    }
  };
}

/**
 * Create a simple webhook handler for a specific topic
 * 
 * @param topic - The webhook topic to handle
 * @param handler - The handler function
 * @param options - Additional options
 * @returns Next.js route handler
 */
export function createTopicHandler<T extends WebhookPayload = WebhookPayload>(
  topic: ShopifyWebhookTopic,
  handler: WebhookHandler<T>,
  options?: {
    secret?: string;
    onError?: (error: Error) => void;
  }
) {
  const handlers = new Map<ShopifyWebhookTopic, WebhookHandler>();
  handlers.set(topic, handler as WebhookHandler);

  return createWebhookHandler({
    ...options,
    handlers,
    onError: options?.onError ? (error) => options.onError!(error) : undefined
  });
}

/**
 * Batch process multiple webhooks (for bulk operations)
 * 
 * @param webhooks - Array of webhook payloads with headers
 * @param options - Processing options
 * @returns Array of results
 */
export async function batchProcessWebhooks(
  webhooks: Array<{
    payload: WebhookPayload;
    headers: ShopifyWebhookHeaders;
  }>,
  options?: {
    handlers?: Map<ShopifyWebhookTopic, WebhookHandler>;
    concurrency?: number;
    stopOnError?: boolean;
  }
): Promise<WebhookHandlerResult[]> {
  const handlers = options?.handlers || webhookHandlers;
  const concurrency = options?.concurrency || 5;
  const results: WebhookHandlerResult[] = [];

  // Process in batches
  for (let i = 0; i < webhooks.length; i += concurrency) {
    const batch = webhooks.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(async ({ payload, headers }) => {
        try {
          const handler = handlers.get(headers['x-shopify-topic']);
          if (!handler) {
            return {
              success: false,
              error: `No handler for topic: ${headers['x-shopify-topic']}`
            };
          }
          
          return await handler(payload, headers);
        } catch (error) {
          const result = {
            success: false,
            error: error instanceof Error ? error.message : 'Processing failed'
          };
          
          if (options?.stopOnError) {
            throw error;
          }
          
          return result;
        }
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Retry failed webhook processing
 * 
 * @param payload - Webhook payload
 * @param headers - Webhook headers
 * @param options - Retry options
 * @returns Handler result
 */
export async function retryWebhook(
  payload: WebhookPayload,
  headers: ShopifyWebhookHeaders,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    handlers?: Map<ShopifyWebhookTopic, WebhookHandler>;
  }
): Promise<WebhookHandlerResult> {
  const maxRetries = options?.maxRetries || 3;
  const retryDelay = options?.retryDelay || 1000;
  const handlers = options?.handlers || webhookHandlers;
  
  const handler = handlers.get(headers['x-shopify-topic']);
  if (!handler) {
    return {
      success: false,
      error: `No handler for topic: ${headers['x-shopify-topic']}`
    };
  }
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await handler(payload, headers);
      if (result.success) {
        return result;
      }
      
      // If handler returned failure but no error, don't retry
      if (!result.error) {
        return result;
      }
      
      lastError = new Error(result.error);
    } catch (error) {
      lastError = error as Error;
    }
    
    // Wait before retry (except on last attempt)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Max retries exceeded'
  };
}