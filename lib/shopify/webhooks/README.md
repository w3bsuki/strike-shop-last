# Shopify Webhook System

This directory contains the webhook verification and handling system for Shopify webhooks in Strike Shop.

## Overview

The webhook system provides:
- **HMAC-SHA256 signature verification** for security
- **Rate limiting** to prevent abuse
- **Type-safe webhook payloads** with TypeScript
- **Standardized error handling** and logging
- **Retry mechanism** for failed webhooks
- **Batch processing** capabilities

## Usage

### Creating a Webhook Handler

To create a new webhook handler, use the `createTopicHandler` utility:

```typescript
// app/api/webhooks/shopify/products/update/route.ts
import { 
  createTopicHandler, 
  ShopifyWebhookTopic,
  type ProductWebhookPayload 
} from '@/lib/shopify/webhooks';

export const POST = createTopicHandler(
  ShopifyWebhookTopic.PRODUCTS_UPDATE,
  async (payload: ProductWebhookPayload) => {
    // Handle the webhook
    console.log(`Product updated: ${payload.title}`);
    
    // Your business logic here
    
    return {
      success: true,
      message: 'Product update processed'
    };
  }
);
```

### Using the Base Handler

For more complex scenarios, use `createWebhookHandler`:

```typescript
import { createWebhookHandler, ShopifyWebhookTopic } from '@/lib/shopify/webhooks';

const handlers = new Map();
handlers.set(ShopifyWebhookTopic.ORDERS_CREATE, handleOrderCreate);
handlers.set(ShopifyWebhookTopic.ORDERS_UPDATED, handleOrderUpdate);

export const POST = createWebhookHandler({
  handlers,
  beforeProcess: async (payload, headers) => {
    // Pre-processing logic
  },
  afterProcess: async (result, topic) => {
    // Post-processing logic
  },
  onError: (error, topic) => {
    // Custom error handling
  }
});
```

### Manual Verification

If you need to verify webhooks manually:

```typescript
import { verifyWebhookSignature } from '@/lib/shopify/webhooks';

const result = verifyWebhookSignature(
  rawBody,
  signature,
  process.env.SHOPIFY_WEBHOOK_SECRET!,
  headers
);

if (!result.verified) {
  throw new Error(result.error);
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret-here
```

### Webhook Topics

Available webhook topics are defined in the `ShopifyWebhookTopic` enum:

- `ORDERS_CREATE`
- `ORDERS_UPDATED`
- `ORDERS_PAID`
- `ORDERS_CANCELLED`
- `PRODUCTS_CREATE`
- `PRODUCTS_UPDATE`
- `CUSTOMERS_CREATE`
- `INVENTORY_LEVELS_UPDATE`
- And many more...

## Security Features

### Signature Verification
- Uses HMAC-SHA256 with timing-safe comparison
- Validates webhook age (rejects webhooks older than 5 minutes)
- Checks all required headers

### Rate Limiting
- 100 webhooks per minute per shop
- In-memory tracking (use Redis in production)
- Returns 429 status when exceeded

### Error Handling
- Proper error codes and status responses
- Webhook retry queue for failed processing
- Detailed logging for debugging

## Best Practices

1. **Always verify webhooks** - Never trust incoming data without verification
2. **Handle errors gracefully** - Don't let one bad webhook break your system
3. **Log everything** - Use the built-in logging for debugging
4. **Implement idempotency** - Webhooks may be sent multiple times
5. **Process asynchronously** - For heavy operations, queue the work
6. **Monitor webhook health** - Track success/failure rates

## Testing Webhooks

### Local Development

Use ngrok or similar to expose your local server:

```bash
ngrok http 3000
```

Then register the webhook in Shopify:
```
https://your-ngrok-url.ngrok.io/api/webhooks/shopify/orders/create
```

### Webhook Payload Examples

See the type definitions in `/lib/shopify/types/webhooks.ts` for complete payload structures.

## Monitoring

The system logs all webhook events with:
- Topic
- Shop domain
- Success/failure status
- Processing duration
- Error details (if any)

Example log output:
```
[Webhook Processed] {
  type: 'webhook_processed',
  timestamp: '2024-01-20T10:30:00.000Z',
  topic: 'orders/create',
  shop: 'example.myshopify.com',
  webhookId: 'abc123',
  success: true,
  duration: 234
}
```

## Troubleshooting

### Common Issues

1. **"Invalid webhook signature"**
   - Check that `SHOPIFY_WEBHOOK_SECRET` is set correctly
   - Ensure you're using the raw request body for verification
   - Verify the webhook was registered with the correct URL

2. **"Rate limit exceeded"**
   - Too many webhooks from one shop
   - Implement queuing for high-volume shops
   - Consider using bulk operations instead

3. **"Webhook is too old"**
   - Webhook took too long to reach your server
   - Check network latency
   - Ensure your server can handle the load

### Debug Mode

Enable debug logging by setting:
```typescript
process.env.WEBHOOK_DEBUG = 'true';
```

This will log additional information including:
- Raw headers
- Payload structure
- Verification steps
- Handler execution details