import crypto from 'crypto';

/**
 * Verifies the Shopify webhook signature
 * @param rawBody - The raw webhook body as a string
 * @param signature - The X-Shopify-Hmac-Sha256 header value
 * @returns boolean indicating if the webhook is valid
 */
export function verifyShopifyWebhook(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('SHOPIFY_WEBHOOK_SECRET is not configured');
    return false;
  }

  try {
    const hash = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    return hash === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Common webhook response handler
 */
export function webhookResponse(success: boolean, message?: string) {
  if (success) {
    return new Response(JSON.stringify({ success: true, message: message || 'Webhook processed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return new Response(JSON.stringify({ success: false, error: message || 'Webhook processing failed' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Extract webhook topic from headers
 */
export function getWebhookTopic(headers: Headers): string | null {
  return headers.get('x-shopify-topic');
}

/**
 * Extract shop domain from headers
 */
export function getShopDomain(headers: Headers): string | null {
  return headers.get('x-shopify-shop-domain');
}

/**
 * Extract webhook ID from headers
 */
export function getWebhookId(headers: Headers): string | null {
  return headers.get('x-shopify-webhook-id');
}

/**
 * Log webhook event
 */
export function logWebhookEvent(
  topic: string,
  shopDomain: string | null,
  webhookId: string | null,
  payload: any,
  error?: Error
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    topic,
    shopDomain,
    webhookId,
    payloadId: payload?.id,
    status: error ? 'error' : 'success',
    error: error?.message,
  };

  if (error) {
    console.error('[Webhook Error]', logEntry);
  } else {
    console.log('[Webhook Processed]', logEntry);
  }
}