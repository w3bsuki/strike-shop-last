# Security Implementation Quick Reference

## 🚨 Critical Security Files

### 1. CORS Configuration
**File**: `/medusa-config.js`
```javascript
// Environment-specific CORS origins
const allowedOrigins = {
  development: ['http://localhost:3000', ...],
  production: ['https://strike-shop.com', ...]
};
```

### 2. Security Middleware
**File**: `/middleware.ts`
- Request validation
- Rate limiting
- Authentication checks
- Security header application

### 3. Security Headers
**File**: `/middleware/security-headers.ts`
- Content Security Policy (CSP)
- HSTS enforcement
- Frame options
- XSS protection

### 4. Security Monitoring
**File**: `/lib/security-monitoring.ts`
- Real-time event tracking
- IP reputation system
- Alert thresholds
- Security statistics

### 5. Request Signing
**File**: `/lib/request-signing.ts`
- HMAC-based signatures
- Replay attack prevention
- Internal API authentication

### 6. File Upload Security
**File**: `/lib/file-upload-security.ts`
- MIME type validation
- Magic number verification
- Malware scanning
- Filename sanitization

## 🔧 Configuration

### Environment Variables
```env
# Required for production
NODE_ENV=production
ALLOWED_ORIGINS=https://strike-shop.com,https://www.strike-shop.com

# Optional security monitoring
SECURITY_ALERT_WEBHOOK=https://your-webhook-url
SECURITY_ADMIN_EMAIL=security@strike-shop.com
```

## 🛡️ Security Headers Applied

| Header | Purpose | Value |
|--------|---------|-------|
| Content-Security-Policy | Prevent XSS/injection | Strict policy with nonces |
| X-Frame-Options | Prevent clickjacking | DENY |
| X-Content-Type-Options | Prevent MIME sniffing | nosniff |
| Strict-Transport-Security | Force HTTPS | max-age=31536000 |
| Permissions-Policy | Disable unnecessary features | camera=(), microphone=(), etc |

## 🚦 Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|---------|
| API | 100 requests | 15 minutes |
| Auth | 5 attempts | 15 minutes |
| Payments | 10 requests | 1 hour |
| Search | 30 requests | 1 minute |

## 🔍 Security Event Types

- `SUSPICIOUS_REQUEST`
- `RATE_LIMIT_EXCEEDED`
- `AUTHENTICATION_FAILED`
- `INVALID_ORIGIN`
- `XSS_ATTEMPT`
- `SQL_INJECTION_ATTEMPT`
- `PATH_TRAVERSAL_ATTEMPT`
- `BLOCKED_IP`
- `PAYMENT_FRAUD_ATTEMPT`

## 📊 Monitoring Dashboard

Access security statistics:
```
GET /api/admin/security?window=3600000
```

## 🧪 Testing Security

Run security tests:
```bash
npm run security:test
# or
node scripts/test-security.js
```

## 🚨 Emergency Response

### Block an IP immediately:
```javascript
import { securityMonitor } from '@/lib/security-monitoring';

securityMonitor.logEvent(
  SecurityEventType.BLOCKED_IP,
  SecuritySeverity.CRITICAL,
  { ip: 'malicious-ip', reason: 'Active attack' },
  true
);
```

### Check IP reputation:
```javascript
const reputation = securityMonitor.getIPReputation('suspicious-ip');
const shouldBlock = securityMonitor.shouldBlockIP('suspicious-ip');
```

## 🔐 Best Practices

1. **Never use wildcard CORS** - Always specify exact origins
2. **Validate all inputs** - Use InputValidator for user data
3. **Monitor security events** - Check dashboard regularly
4. **Update allowed origins** - Add new domains as needed
5. **Test security regularly** - Run security tests before deployment

## 📞 Security Contacts

- Security alerts: security@strike-shop.com
- Bug reports: Use responsible disclosure
- Emergency: Check SECURITY_ALERT_WEBHOOK logs