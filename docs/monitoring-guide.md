# Monitoring and Logging System Guide

This guide covers the comprehensive monitoring and logging system implemented for the Strike Shop Shopify integration.

## Overview

The monitoring system provides:
- **Structured Logging** with Winston
- **Error Tracking** with Sentry
- **Performance Monitoring** for APIs and operations
- **Webhook Event Tracking** with detailed metrics
- **Core Web Vitals** collection
- **Custom Dashboards** for different monitoring scenarios

## Components

### 1. Logger (`lib/monitoring/logger.ts`)

Structured logging with Winston that provides:
- Different log levels (debug, info, warn, error, fatal)
- Automatic sensitive data redaction
- Request ID tracking
- Log rotation and retention
- JSON formatting in production
- Pretty printing in development

```typescript
import { logger, createRequestLogger } from '@/lib/monitoring';

// Basic logging
logger.info('Order created', { orderId: '12345', amount: 100 });

// Request-scoped logging
const requestLogger = createRequestLogger(request);
requestLogger.info('Processing payment');

// Performance logging
const endTimer = logger.startTimer('database-query');
// ... perform operation
endTimer();
```

### 2. Error Tracking (`lib/monitoring/error-tracker.ts` & `sentry.ts`)

Comprehensive error tracking with Sentry integration:

```typescript
import { captureException, captureMessage, addBreadcrumb } from '@/lib/monitoring';

// Capture exceptions
try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    tags: { component: 'checkout' },
    extra: { orderId: '12345' }
  });
}

// Add breadcrumbs for context
addBreadcrumb('User clicked checkout', 'user-action', {
  cartTotal: 150.00
});

// Capture messages
captureMessage('Payment gateway timeout', 'warning');
```

### 3. Performance Monitoring (`lib/monitoring/performance.ts`)

Track performance of various operations:

```typescript
import { monitorApi, monitorDb, performanceMonitor } from '@/lib/monitoring';

// Monitor API calls
const result = await monitorApi('/api/orders', async () => {
  return fetch('/api/orders');
});

// Monitor database queries
const users = await monitorDb('SELECT * FROM users', async () => {
  return db.query('SELECT * FROM users');
});

// Custom monitoring
await performanceMonitor.monitor('image-processing', 'custom', async () => {
  return processImage(imageData);
});

// Get performance report
const report = performanceMonitor.getReport(60); // Last 60 minutes
```

### 4. Webhook Monitoring (`lib/monitoring/webhook-logger.ts`)

Specialized logging for Shopify webhooks:

```typescript
import { 
  logWebhookReceived, 
  logWebhookProcessing, 
  logWebhookCompleted, 
  logWebhookFailed 
} from '@/lib/monitoring';

// In your webhook handler
const webhookId = request.headers.get('x-shopify-webhook-id');
const topic = request.headers.get('x-shopify-topic');
const shop = request.headers.get('x-shopify-shop-domain');

// Log webhook received
logWebhookReceived(webhookId, topic, shop, payload);

// Log processing start
logWebhookProcessing(webhookId);

try {
  const result = await processWebhook(payload);
  
  // Log successful completion
  logWebhookCompleted(webhookId, performance.now() - startTime, result);
} catch (error) {
  // Log failure
  logWebhookFailed(webhookId, error, performance.now() - startTime);
}

// Get webhook metrics
const metrics = webhookLogger.getMetrics();
console.log(`Success rate: ${metrics.successRate}%`);
```

### 5. Metrics Collection (`lib/monitoring/metrics.ts`)

Collect and track various metrics:

```typescript
import { 
  trackEvent, 
  trackPageView, 
  trackCartAction, 
  trackCheckout 
} from '@/lib/monitoring';

// Track user events
trackEvent('product_viewed', { productId: 'ABC123', category: 'shoes' });

// Track page views
trackPageView('/product/nike-air-max');

// Track cart actions
trackCartAction('add', 'ABC123');

// Track checkout funnel
trackCheckout('shipping_info', 150.00);
trackCheckout('payment_info', 150.00);
trackCheckout('completed', 150.00);
```

## Configuration

### Environment Variables

Create a `.env.local` file with:

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your_auth_token

# Logging
LOG_LEVEL=info
LOG_DIR=logs
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# Performance Thresholds (ms)
PERF_THRESHOLD_API=1000
PERF_THRESHOLD_DB=100
PERF_THRESHOLD_CACHE=50
PERF_THRESHOLD_EXTERNAL=2000
PERF_THRESHOLD_RENDER=100

# Metrics
METRICS_API_KEY=your_metrics_api_key
```

### Initialization

The monitoring system initializes automatically when imported, but you can also manually initialize:

```typescript
import { initializeMonitoring } from '@/lib/monitoring/init';

// In your app initialization
initializeMonitoring();
```

## API Endpoints

### GET /api/monitoring/metrics

Retrieve current metrics in JSON or Prometheus format:

```bash
# Get all metrics
curl http://localhost:3000/api/monitoring/metrics

# Get specific metrics
curl http://localhost:3000/api/monitoring/metrics?include=performance,webhooks

# Get Prometheus format
curl http://localhost:3000/api/monitoring/metrics?format=prometheus
```

### POST /api/monitoring/metrics

Send client-side metrics:

```javascript
fetch('/api/monitoring/metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    webVitals: {
      lcp: 1500,
      fid: 50,
      cls: 0.1
    },
    events: [
      { name: 'button_click', tags: { button: 'add-to-cart' } }
    ]
  })
});
```

## Dashboards

Pre-configured dashboards are available:

1. **System Overview** - High-level system health
2. **Shopify Integration** - Webhook and API metrics
3. **Performance Monitoring** - Detailed performance metrics
4. **E-commerce Metrics** - Business metrics
5. **Security Monitoring** - Security events and threats

Access dashboards programmatically:

```typescript
import { getDashboard, listDashboards } from '@/lib/monitoring';

// Get specific dashboard
const dashboard = getDashboard('shopify');

// List all dashboards
const allDashboards = listDashboards();
```

## Best Practices

### 1. Use Request Context

Always set request context for better tracing:

```typescript
export async function POST(request: Request) {
  const logger = createRequestLogger(request);
  
  logger.info('Processing webhook');
  // All subsequent logs will include request ID
}
```

### 2. Add Meaningful Tags

Include relevant tags for better filtering:

```typescript
logger.info('Order processed', {
  orderId: order.id,
  customerId: customer.id,
  amount: order.total,
  paymentMethod: order.paymentMethod
});
```

### 3. Use Appropriate Log Levels

- **Debug**: Detailed information for debugging
- **Info**: General informational messages
- **Warn**: Warning messages for potentially harmful situations
- **Error**: Error events that might still allow the app to continue
- **Fatal**: Very severe error events that might cause the app to abort

### 4. Monitor Performance Proactively

Wrap critical operations:

```typescript
const result = await performanceMonitor.monitorWithSentry(
  'checkout-process',
  'custom',
  async () => {
    return processCheckout(cartData);
  }
);
```

### 5. Handle Sensitive Data

The system automatically redacts sensitive fields, but always be cautious:

```typescript
// Bad
logger.info('User login', { password: user.password });

// Good
logger.info('User login', { userId: user.id, email: user.email });
```

## Troubleshooting

### Logs Not Appearing

1. Check `LOG_LEVEL` environment variable
2. Ensure `NODE_ENV` is set correctly
3. Verify file permissions for log directory

### Sentry Not Capturing Errors

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check network connectivity
3. Look for initialization errors in console

### Performance Metrics Missing

1. Ensure monitoring is enabled in production
2. Check browser console for client-side errors
3. Verify API endpoint is accessible

## Monitoring Checklist

- [ ] Set up Sentry account and get DSN
- [ ] Configure environment variables
- [ ] Test error tracking locally
- [ ] Verify log rotation is working
- [ ] Set up alerts for critical errors
- [ ] Configure performance thresholds
- [ ] Test webhook monitoring
- [ ] Set up monitoring dashboards
- [ ] Configure alert channels (email, Slack, etc.)
- [ ] Document team-specific procedures