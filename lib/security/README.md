# Security Configuration Guide

## Overview

This directory contains security middleware and utilities for Strike Shop's Shopify integration, implementing:

- **Content Security Policy (CSP)** with nonce support
- **Rate limiting** for API endpoints
- **Bot protection** for cart operations
- **GDPR compliance** tools
- **PCI DSS v4** compliance checks

## Environment Variables

Add these to your `.env.local` file:

```bash
# Rate Limiting (Optional - falls back to in-memory)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# CSP Reporting (Optional)
NEXT_PUBLIC_CSP_REPORT_URI=/api/security/csp-report

# Security Monitoring (Optional)
MONITORING_ENDPOINT=https://your-monitoring.com/api/events
MONITORING_API_KEY=your-monitoring-api-key

# GDPR Settings
GDPR_DATA_RETENTION_DAYS=90
GDPR_EXPORT_ENCRYPTION_KEY=your-32-char-encryption-key

# PCI DSS Settings
PCI_SESSION_TIMEOUT_MINUTES=15
PCI_MAX_LOGIN_ATTEMPTS=5
```

## Features

### 1. Content Security Policy (CSP)

Strict CSP with different policies for:
- Regular pages
- Checkout pages (stricter)
- API routes (minimal)

**Key features:**
- Nonce-based inline script allowlisting
- Violation reporting
- Automatic header generation

### 2. Rate Limiting

Flexible rate limiting with different limits:
- Cart operations: 30/minute
- Checkout: 10/minute
- Webhooks: 100/minute
- Auth endpoints: 5/minute

**Features:**
- Upstash Redis support (optional)
- In-memory fallback
- Per-user and per-IP limiting
- Proper 429 responses with Retry-After

### 3. Bot Protection

Detects automated traffic using:
- Request patterns analysis
- User-agent detection
- Behavior scoring
- Session tracking

**Protection levels:**
- Score < 30: Normal traffic
- Score 30-50: Light restrictions
- Score 50-75: Moderate restrictions
- Score > 75: Severe restrictions or block

### 4. GDPR Compliance

Complete GDPR toolkit:
- Cookie consent management
- Data export (Article 20)
- Right to deletion (Article 17)
- Privacy policy tracking
- Consent preference center

**Cookie categories:**
- Necessary (always enabled)
- Functional
- Analytics
- Marketing

### 5. PCI DSS v4 Compliance

Payment page security:
- No caching of sensitive data
- Session timeout (15 minutes)
- Secure headers
- Data validation
- Audit logging (without sensitive data)

## Usage

### Basic Middleware Setup

The main `middleware.ts` file automatically applies all security features:

```typescript
import { middleware } from './middleware';

export default middleware;
```

### Manual Implementation

For custom implementations:

```typescript
// Rate limiting
import { rateLimit } from '@/lib/middleware/rate-limit';

const result = await rateLimit(request);
if (result.blocked) {
  return new NextResponse('Too Many Requests', { 
    status: 429,
    headers: getRateLimitHeaders(result)
  });
}

// Bot protection
import { botProtection } from '@/lib/middleware/bot-protection';

const botCheck = await botProtection(request);
if (botCheck.isBot) {
  return new NextResponse('Forbidden', { status: 403 });
}

// GDPR consent check
import { hasGDPRConsent } from '@/lib/gdpr';

if (!hasGDPRConsent(request)) {
  // Show consent banner
}
```

### CSP Nonce Usage in Components

```tsx
// In your layout or page
import { headers } from 'next/headers';

export default function Layout({ children }) {
  const nonce = headers().get('X-CSP-Nonce');
  
  return (
    <html>
      <head>
        <script nonce={nonce}>
          // Inline script with nonce
        </script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### GDPR Data Export API

```typescript
// app/api/gdpr/export/route.ts
import { exportUserData, generateDataExport } from '@/lib/gdpr';

export async function GET(request: Request) {
  const userId = // get from session
  
  const result = await generateDataExport(userId, 'json');
  
  if (result.success) {
    return new Response(result.data, {
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  }
}
```

### GDPR Data Deletion API

```typescript
// app/api/gdpr/delete/route.ts
import { deleteUserData } from '@/lib/gdpr';

export async function DELETE(request: Request) {
  const userId = // get from session
  
  const result = await deleteUserData(userId, {
    reason: 'User requested deletion',
  });
  
  return Response.json(result);
}
```

## Security Best Practices

1. **Never log sensitive data** - All logging utilities sanitize PII
2. **Use tokenization** - Never handle raw payment card data
3. **Rotate sessions** - Sessions are rotated on checkout pages
4. **Monitor violations** - Review CSP and security reports regularly
5. **Update dependencies** - Keep security packages up to date

## Testing

### Rate Limiting Test

```bash
# Test rate limiting
for i in {1..50}; do
  curl -X POST https://your-site.com/api/cart/add
done
```

### CSP Violation Test

```javascript
// This should trigger a CSP violation
eval('console.log("test")');
```

### Bot Detection Test

```bash
# Test with curl (should be detected as bot)
curl -H "User-Agent: curl/7.68.0" https://your-site.com/api/cart/add
```

## Monitoring

1. **CSP Violations**: Check `/api/security/csp-report` logs
2. **Rate Limit Hits**: Monitor 429 responses
3. **Bot Detection**: Review bot scores in logs
4. **GDPR Requests**: Track data export/deletion requests

## Compliance Checklist

- [ ] CSP headers on all responses
- [ ] Rate limiting on sensitive endpoints
- [ ] Bot protection on cart/checkout
- [ ] GDPR consent banner for EU users
- [ ] Data export functionality
- [ ] Data deletion process
- [ ] PCI DSS headers on payment pages
- [ ] Security monitoring configured
- [ ] Regular security audits scheduled

## Support

For security issues or questions:
1. Check logs for detailed error messages
2. Review environment variables
3. Ensure Redis/Upstash is properly configured (if used)
4. Contact security team for vulnerabilities