# API Security Report - Strike Shop

## Executive Summary

This report documents the comprehensive API security implementation for Strike Shop, implementing defense-in-depth strategies across all API endpoints. The security measures protect against OWASP API Security Top 10 threats and ensure data integrity, confidentiality, and availability.

## 1. Request Signing Implementation

### Overview
HMAC-SHA256 based request signing ensures API request authenticity and integrity.

### Implementation Details
- **Location**: `/lib/security/request-signing.ts`
- **Algorithm**: HMAC-SHA256
- **Key Components**:
  - Signature generation with timestamp validation
  - Request ID for replay attack prevention
  - 5-minute signature expiry window
  - Constant-time comparison to prevent timing attacks

### Usage Example
```typescript
import { RequestSigner, withRequestSigning } from '@/lib/security/request-signing'

// Server-side validation
export const POST = withRequestSigning(async (request) => {
  // Request is authenticated
  return NextResponse.json({ success: true })
})

// Client-side signing
const client = new SignedApiClient('https://api.example.com', process.env.API_SECRET)
const response = await client.post('/api/orders', { items: [...] })
```

### Security Features
- Prevents replay attacks with timestamp validation
- Unique request IDs prevent duplicate processing
- Secure key storage using environment variables
- Protection against timing attacks

## 2. Rate Limiting Implementation

### Overview
Multi-tier rate limiting protects against DoS attacks and API abuse.

### Rate Limit Tiers
| Tier | Requests/Minute | Use Case |
|------|----------------|----------|
| PUBLIC | 100 | Unauthenticated endpoints |
| AUTHENTICATED | 1000 | Logged-in users |
| ADMIN | 5000 | Administrative APIs |
| PAYMENT | 10 | Payment processing |
| STRICT | 5/15min | Login/Registration |

### Implementation Details
- **Location**: `/lib/security/rate-limiting.ts`
- **Storage**: In-memory (dev) / Redis (production)
- **Strategies**:
  - Fixed window counter
  - Sliding window log
  - Token bucket algorithm
  - Distributed rate limiting

### Usage Example
```typescript
import { withRateLimit } from '@/lib/security/rate-limiting'

export const GET = withRateLimit(
  async (request) => {
    return NextResponse.json({ products: [...] })
  },
  'PUBLIC' // Rate limit tier
)
```

### Advanced Features
- Per-user and per-IP tracking
- Automatic tier selection based on authentication
- Rate limit headers in responses
- Circuit breaker pattern for external services

## 3. Input Validation Implementation

### Overview
Comprehensive input validation using Zod schemas prevents injection attacks and ensures data integrity.

### Security Protections
- SQL Injection prevention
- XSS (Cross-Site Scripting) protection
- Path traversal prevention
- Command injection protection
- LDAP/XML injection prevention

### Implementation Details
- **Location**: `/lib/security/input-validation.ts`
- **Validation Library**: Zod
- **Sanitization**: DOMPurify for HTML content

### Common Schemas
```typescript
// Email validation
email: z.string().email().max(254).transform(val => val.toLowerCase().trim())

// Strong password requirements
password: z.string()
  .min(8)
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character')

// Financial validation
amount: z.number().positive().multipleOf(0.01).max(999999.99)
```

### Usage Example
```typescript
import { withValidation, apiSchemas } from '@/lib/security/input-validation'

export const POST = withValidation(
  apiSchemas.createProduct,
  async (request, validatedData) => {
    // validatedData is type-safe and sanitized
    const product = await createProduct(validatedData)
    return NextResponse.json(product)
  }
)
```

## 4. API Key Management Implementation

### Overview
Secure API key generation, rotation, and scoped permissions.

### Features
- Cryptographically secure key generation
- SHA-256 hashing for storage
- Granular permission scopes
- Automatic key rotation
- IP whitelisting support
- Usage tracking and analytics

### Permission Scopes
```typescript
enum ApiKeyScope {
  // Read permissions
  READ_PRODUCTS = 'read:products',
  READ_ORDERS = 'read:orders',
  
  // Write permissions  
  WRITE_PRODUCTS = 'write:products',
  WRITE_ORDERS = 'write:orders',
  
  // Admin permissions
  ADMIN_USERS = 'admin:users',
  ADMIN_SETTINGS = 'admin:settings'
}
```

### Key Lifecycle Management
1. **Creation**: Generate secure random keys with scoped permissions
2. **Rotation**: Automatic rotation with grace period
3. **Revocation**: Immediate deactivation with audit trail
4. **Monitoring**: Usage tracking and anomaly detection

### Usage Example
```typescript
import { ApiKeyManager, withApiKey, ApiKeyScope } from '@/lib/security/api-key-management'

// Create API key
const { key, metadata } = await ApiKeyManager.createApiKey({
  name: 'Mobile App Key',
  userId: 'user123',
  scopes: [ApiKeyScope.READ_PRODUCTS, ApiKeyScope.WRITE_ORDERS],
  expiresInDays: 90
})

// Protect endpoint
export const GET = withApiKey(
  async (req, res) => {
    // req.apiKey contains validated key metadata
    return res.json({ data: 'protected' })
  },
  [ApiKeyScope.READ_PRODUCTS]
)
```

## 5. Error Handling Implementation

### Overview
Production-safe error responses with detailed internal logging.

### Error Types
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Rate limit errors (429)
- Internal errors (500)

### Security Features
- No stack traces in production
- Generic error messages for security
- Detailed internal logging
- Error ID correlation
- Automatic error classification

### Implementation Details
- **Location**: `/lib/security/error-handling.ts`
- **Error Classes**: Type-safe error creation
- **Logging**: Structured logging with context
- **Recovery**: Retry strategies and circuit breakers

### Usage Example
```typescript
import { withErrorHandling, ApiErrors } from '@/lib/security/error-handling'

export const GET = withErrorHandling(async (request) => {
  const product = await getProduct(id)
  
  if (!product) {
    throw ApiErrors.resourceNotFound('Product', id)
  }
  
  return NextResponse.json(product)
})
```

### Error Response Format
```json
{
  "error": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "VALIDATION_ERROR",
    "message": "The request contains invalid data",
    "timestamp": "2024-01-20T12:00:00Z"
  }
}
```

## 6. API Security Monitoring Implementation

### Overview
Real-time monitoring, anomaly detection, and alerting system.

### Monitoring Capabilities
- Request/response metrics
- Error rate tracking
- Latency monitoring
- Security event detection
- Anomaly detection
- Automated alerting

### Security Events Tracked
- Invalid authentication attempts
- Rate limit violations
- Suspicious payloads
- SQL injection attempts
- XSS attempts
- Unusual traffic patterns
- API key abuse

### Implementation Details
- **Location**: `/lib/security/api-monitoring.ts`
- **Storage**: Time-series metrics store
- **Analysis Windows**: 1min, 5min, 1hr, 24hr
- **Alert Levels**: Info, Warning, Error, Critical

### Dashboard Metrics
```typescript
const dashboard = getMonitoringDashboard()
// Returns:
{
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy',
    issues: string[],
    metrics: {...}
  },
  metrics: {
    realtime: {...},
    short: {...},
    medium: {...},
    long: {...}
  }
}
```

### Alert Configuration
```typescript
ApiMonitor.registerAlertHandler('slack', async (alert) => {
  if (alert.level === 'critical') {
    await sendSlackNotification(alert)
  }
})
```

## 7. Integration Examples

### Secure API Route Example
```typescript
import { withAPISecurity } from '@/lib/api-security'
import { withRateLimit } from '@/lib/security/rate-limiting'
import { withValidation, apiSchemas } from '@/lib/security/input-validation'
import { withErrorHandling } from '@/lib/security/error-handling'
import { withMonitoring } from '@/lib/security/api-monitoring'

export const POST = withMonitoring(
  withErrorHandling(
    withRateLimit(
      withValidation(
        apiSchemas.createOrder,
        withAPISecurity(
          async (request, validatedData) => {
            // Fully secured endpoint
            const order = await createOrder(validatedData)
            return NextResponse.json(order)
          },
          {
            requireAuth: true,
            requireCSRF: true,
            allowedMethods: ['POST']
          }
        )
      ),
      'AUTHENTICATED'
    )
  )
)
```

### Middleware Chain Order
1. Monitoring (outermost - tracks everything)
2. Error Handling (catches all errors)
3. Rate Limiting (prevents abuse)
4. Input Validation (validates/sanitizes data)
5. Security Checks (auth, CSRF, etc.)
6. Business Logic (innermost)

## 8. Security Best Practices

### Environment Variables
```env
# Required security environment variables
INTERNAL_API_SECRET=<32+ character random string>
NEXTAUTH_SECRET=<32+ character random string>
CSRF_SECRET=<32+ character random string>
ENCRYPTION_KEY=<32 byte hex string>
```

### Headers Configuration
All API responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: default-src 'self'`

### CORS Configuration
```typescript
ALLOWED_ORIGINS: process.env.NODE_ENV === 'production' 
  ? ['https://yourdomain.com']
  : ['http://localhost:3000']
```

## 9. Monitoring and Alerts

### Key Metrics to Monitor
1. **Error Rate**: Alert if > 10%
2. **Response Time**: Alert if P95 > 1s
3. **Auth Failures**: Alert if > 10 per IP/5min
4. **Rate Limits**: Track violations by endpoint
5. **Security Events**: Immediate alerts for critical events

### Alert Channels
- Slack (critical alerts)
- Email (daily summaries)
- PagerDuty (system down)
- Datadog (metrics visualization)

## 10. Compliance and Auditing

### Audit Trail
All security events are logged with:
- Timestamp
- User ID
- IP Address
- Action performed
- Success/failure status
- Error details (if applicable)

### Compliance Features
- GDPR: Data encryption, access logging
- PCI DSS: No sensitive data in logs
- SOC 2: Access controls, monitoring
- HIPAA: Audit trails, encryption

## 11. Incident Response

### Response Procedures
1. **Detection**: Automated monitoring alerts
2. **Analysis**: Review logs and metrics
3. **Containment**: Rate limiting, IP blocking
4. **Eradication**: Fix vulnerabilities
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update security measures

### Emergency Controls
- Global rate limit override
- IP/User blacklisting
- API key revocation
- Circuit breaker activation

## 12. Testing and Validation

### Security Testing Checklist
- [ ] Input validation tests
- [ ] Rate limit verification
- [ ] Authentication bypass attempts
- [ ] SQL injection testing
- [ ] XSS payload testing
- [ ] API key permission tests
- [ ] Error message leakage
- [ ] Timing attack resistance

### Load Testing
```bash
# Example K6 load test
k6 run --vus 100 --duration 30s api-security-test.js
```

## Conclusion

This comprehensive API security implementation provides multiple layers of protection against common and advanced threats. Regular security audits, monitoring, and updates ensure continued protection as threats evolve.

### Next Steps
1. Deploy monitoring dashboards
2. Configure alert channels
3. Conduct security audit
4. Train team on security procedures
5. Schedule regular security reviews

### Contact
For security concerns or questions, contact: security@strikeshop.com