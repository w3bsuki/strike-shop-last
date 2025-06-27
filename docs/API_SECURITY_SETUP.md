# API Security Setup Guide

## Quick Start

### 1. Environment Variables

Add these to your `.env.local` file:

```env
# Security Keys (generate using: openssl rand -hex 32)
INTERNAL_API_SECRET=your-32-character-secret-here
CSRF_SECRET=your-csrf-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# API Configuration
API_RATE_LIMIT_REDIS_URL=redis://localhost:6379
API_MONITORING_SERVICE=datadog|sentry|custom
```

### 2. Install Dependencies

```bash
npm install zod isomorphic-dompurify validator express-rate-limit
npm install --save-dev @types/validator
```

### 3. Database Schema (Prisma)

Add to your `schema.prisma`:

```prisma
model ApiKey {
  id          String    @id @default(uuid())
  name        String
  keyHash     String    @unique
  userId      String
  scopes      String[]
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  isActive    Boolean   @default(true)
  usageCount  Int       @default(0)
  ipWhitelist String[]
  metadata    Json?
  
  user        User      @relation(fields: [userId], references: [id])
  events      ApiKeyEvent[]
}

model ApiKeyEvent {
  id        String   @id @default(uuid())
  keyId     String
  event     String
  userId    String
  metadata  Json?
  timestamp DateTime @default(now())
  
  apiKey    ApiKey   @relation(fields: [keyId], references: [id])
}
```

Run migrations:
```bash
npx prisma migrate dev --name add-api-security
```

### 4. Middleware Configuration

Create `/middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ApiMonitor } from '@/lib/security/api-monitoring'

export function middleware(request: NextRequest) {
  // Skip middleware for static assets
  if (request.nextUrl.pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  return response
}

export const config = {
  matcher: '/api/:path*'
}
```

## Implementation Guide

### Step 1: Secure Existing Endpoints

#### Before (Unsecured):
```typescript
// app/api/products/route.ts
export async function GET(request: NextRequest) {
  const products = await getProducts()
  return NextResponse.json(products)
}
```

#### After (Secured):
```typescript
// app/api/products/route.ts
import { withRateLimit } from '@/lib/security/rate-limiting'
import { withErrorHandling } from '@/lib/security/error-handling'
import { withMonitoring } from '@/lib/security/api-monitoring'

export const GET = withMonitoring(
  withErrorHandling(
    withRateLimit(
      async (request: NextRequest) => {
        const products = await getProducts()
        return NextResponse.json(products)
      },
      'PUBLIC'
    )
  )
)
```

### Step 2: Add Input Validation

```typescript
// app/api/products/create/route.ts
import { withValidation, apiSchemas } from '@/lib/security/input-validation'

export const POST = withValidation(
  apiSchemas.createProduct,
  async (request, validatedData) => {
    const product = await createProduct(validatedData)
    return NextResponse.json(product)
  }
)
```

### Step 3: Implement API Keys

#### Generate API Key:
```typescript
// app/api/admin/api-keys/route.ts
import { ApiKeyManager } from '@/lib/security/api-key-management'

export async function POST(request: NextRequest) {
  const { userId } = auth()
  
  const { key, metadata } = await ApiKeyManager.createApiKey({
    name: 'Production API Key',
    userId,
    scopes: ['read:products', 'write:orders'],
    expiresInDays: 90
  })
  
  // Return key only once
  return NextResponse.json({ 
    key, // Save this - it won't be shown again
    id: metadata.id,
    expiresAt: metadata.expiresAt
  })
}
```

#### Use API Key:
```bash
curl -H "X-API-Key: sk_your_api_key_here" \
  https://api.yourdomain.com/api/products
```

### Step 4: Setup Monitoring

```typescript
// app/api/admin/monitoring/route.ts
import { getMonitoringDashboard } from '@/lib/security/api-monitoring'
import { withAPISecurity } from '@/lib/api-security'

export const GET = withAPISecurity(
  async (request) => {
    const dashboard = getMonitoringDashboard()
    return NextResponse.json(dashboard)
  },
  { requireAuth: true }
)
```

### Step 5: Configure Alerts

```typescript
// lib/security/alert-config.ts
import { ApiMonitor } from '@/lib/security/api-monitoring'

// Slack integration
ApiMonitor.registerAlertHandler('slack', async (alert) => {
  if (alert.level === 'critical') {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 ${alert.title}: ${alert.description}`
      })
    })
  }
})

// Email alerts
ApiMonitor.registerAlertHandler('email', async (alert) => {
  if (alert.level === 'error' || alert.level === 'critical') {
    await sendEmail({
      to: 'security@yourdomain.com',
      subject: `Security Alert: ${alert.title}`,
      body: alert.description
    })
  }
})
```

## Testing Security

### 1. Rate Limit Testing
```bash
# Test rate limiting
for i in {1..150}; do
  curl -X GET http://localhost:3000/api/products
done
```

### 2. Input Validation Testing
```bash
# Test SQL injection protection
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test\" OR 1=1--"}'
```

### 3. API Key Testing
```bash
# Test invalid API key
curl -H "X-API-Key: invalid_key" \
  http://localhost:3000/api/secure-endpoint

# Test expired key
curl -H "X-API-Key: sk_expired_key" \
  http://localhost:3000/api/secure-endpoint
```

## Production Checklist

- [ ] All environment variables set
- [ ] Redis configured for rate limiting
- [ ] Database migrations run
- [ ] Security headers verified
- [ ] API keys generated for services
- [ ] Monitoring dashboard accessible
- [ ] Alert channels configured
- [ ] Error logging configured
- [ ] SSL/TLS certificates valid
- [ ] CORS properly configured
- [ ] Rate limits tested
- [ ] Input validation on all endpoints
- [ ] API documentation updated
- [ ] Security audit completed
- [ ] Incident response plan ready

## Troubleshooting

### Common Issues

#### 1. Rate Limiting Not Working
```typescript
// Check Redis connection
const redis = new Redis(process.env.API_RATE_LIMIT_REDIS_URL)
await redis.ping() // Should return 'PONG'
```

#### 2. API Keys Not Validating
```typescript
// Check database connection
const apiKey = await prisma.apiKey.findFirst()
console.log('API Keys in DB:', apiKey)
```

#### 3. Monitoring Not Recording
```typescript
// Check monitoring is enabled
console.log('Monitoring enabled:', process.env.API_MONITORING_ENABLED)
```

## Security Maintenance

### Weekly Tasks
- Review security alerts
- Check API key usage
- Monitor error rates
- Update rate limits if needed

### Monthly Tasks
- Rotate API keys
- Security dependency updates
- Review access logs
- Update security documentation

### Quarterly Tasks
- Full security audit
- Penetration testing
- Update security policies
- Team security training

## Support

For security issues or questions:
- Email: security@yourdomain.com
- Slack: #security-alerts
- Documentation: /docs/api-security