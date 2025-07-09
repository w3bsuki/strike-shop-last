# Shopify Webhooks

This directory contains all Shopify webhook handlers for Strike Shop.

## Available Webhooks

### Orders
- **POST `/api/webhooks/shopify/orders/create`** - New order created
- **POST `/api/webhooks/shopify/orders/updated`** - Order updated (status, fulfillment, etc.)
- **POST `/api/webhooks/shopify/orders/cancelled`** - Order cancelled

### Products
- **POST `/api/webhooks/shopify/products/create`** - New product created
- **POST `/api/webhooks/shopify/products/update`** - Product updated

### Inventory
- **POST `/api/webhooks/shopify/inventory/update`** - Inventory levels changed

### Customers
- **POST `/api/webhooks/shopify/customers/create`** - New customer registered

### Checkouts
- **POST `/api/webhooks/shopify/checkouts/create`** - Checkout started (for abandoned cart recovery)

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```env
# Shopify Admin API (required for webhooks)
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_your_admin_token_here
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret-here
```

### 2. Register Webhooks in Shopify

You can register webhooks via:

1. **Shopify Admin API** (recommended):
```bash
curl -X POST "https://{shop}.myshopify.com/admin/api/2024-01/webhooks.json" \
  -H "X-Shopify-Access-Token: {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "topic": "orders/create",
      "address": "https://your-domain.com/api/webhooks/shopify/orders/create",
      "format": "json"
    }
  }'
```

2. **Shopify Partner Dashboard**:
   - Go to your app settings
   - Navigate to "Webhooks"
   - Add webhook URLs

### 3. Webhook Verification

All webhooks are automatically verified using HMAC-SHA256. The verification ensures:
- The webhook came from Shopify
- The payload hasn't been tampered with
- Replay attacks are prevented

## Webhook Handler Structure

Each webhook handler follows this pattern:

```typescript
export async function POST(request: NextRequest) {
  // 1. Verify webhook signature
  const isValid = verifyShopifyWebhook(rawBody, signature);
  
  // 2. Parse payload
  const data = JSON.parse(rawBody);
  
  // 3. Process business logic
  await processWebhookData(data);
  
  // 4. Return response
  return webhookResponse(true, 'Success');
}
```

## Business Logic Implementation

Each webhook handler has a TODO section for implementing business logic:

### Orders Created
- Store order in database
- Send confirmation email
- Update inventory
- Track analytics
- Trigger fulfillment

### Products Updated
- Update product cache
- Clear CDN cache
- Update search index
- Notify price drops
- Sync inventory

### Inventory Updated
- Update stock status
- Send low stock alerts
- Update product availability
- Notify back-in-stock

### Customers Created
- Send welcome email
- Add to mailing list
- Create loyalty account
- Apply welcome discount

### Checkouts Created
- Set up abandoned cart recovery
- Reserve inventory
- Track conversion funnel
- Apply dynamic pricing

## Testing Webhooks Locally

Use ngrok to test webhooks locally:

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL for webhook registration
# https://abc123.ngrok.io/api/webhooks/shopify/orders/create
```

## Monitoring & Debugging

All webhook events are logged with:
- Timestamp
- Topic
- Shop domain
- Webhook ID
- Payload ID
- Success/Error status

Check logs for webhook processing:
```bash
# Development
npm run dev

# Production (Vercel)
vercel logs
```

## Security Best Practices

1. **Always verify webhooks** - Never trust incoming data without verification
2. **Use HTTPS only** - Webhooks must use secure connections
3. **Validate payload data** - Check required fields before processing
4. **Implement idempotency** - Handle duplicate webhooks gracefully
5. **Set up monitoring** - Track webhook failures and retries
6. **Implement timeout handling** - Respond quickly (within 5 seconds)

## Error Handling

Webhook handlers return appropriate HTTP status codes:
- `200 OK` - Webhook processed successfully
- `400 Bad Request` - Invalid signature or payload
- `500 Internal Server Error` - Processing error

Shopify will retry failed webhooks with exponential backoff.

## Extending Webhooks

To add a new webhook:

1. Create a new directory: `/api/webhooks/shopify/[topic]/[action]`
2. Create `route.ts` file
3. Import verification utilities
4. Implement handler logic
5. Register webhook in Shopify
6. Test thoroughly

## Useful Resources

- [Shopify Webhook Documentation](https://shopify.dev/docs/admin-api/rest/reference/events/webhook)
- [Webhook Topics Reference](https://shopify.dev/docs/admin-api/rest/reference/events/webhook#webhook-topics)
- [HMAC Verification Guide](https://shopify.dev/tutorials/manage-webhooks#verifying-webhooks)