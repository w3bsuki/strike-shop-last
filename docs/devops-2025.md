# DevOps Best Practices 2025 - Next.js 15 E-commerce with Shopify Integration

## 🚀 Executive Summary

This comprehensive guide provides production-ready DevOps best practices for modern Next.js 15 e-commerce applications with Shopify integration. Based on 2025 industry standards, this document covers critical areas including CI/CD pipelines, security, monitoring, performance optimization, and deployment strategies.

## 📊 Quick Reference Checklists

### CI/CD Pipeline Checklist
- [ ] Automated security scanning (SAST/DAST)
- [ ] Dependency vulnerability checks
- [ ] Core Web Vitals monitoring
- [ ] Bundle size analysis
- [ ] TypeScript strict mode validation
- [ ] Lighthouse CI integration
- [ ] Automated testing (unit/integration/e2e)
- [ ] Container security scanning
- [ ] Secrets management integration
- [ ] Zero-downtime deployment

### Security Checklist
- [ ] CVE-2025-29927 compliance (no auth in middleware)
- [ ] PCI DSS compliance for payments
- [ ] CORS configuration
- [ ] Rate limiting implementation
- [ ] Input validation & sanitization
- [ ] SSL/TLS certificate automation
- [ ] Security headers configuration
- [ ] API key rotation
- [ ] Audit logging
- [ ] GDPR compliance

### Performance Checklist
- [ ] Core Web Vitals green (INP < 200ms, LCP < 2.5s, CLS < 0.1)
- [ ] Image optimization strategy
- [ ] CDN configuration
- [ ] Caching layers implementation
- [ ] Bundle optimization
- [ ] Edge runtime utilization
- [ ] Database query optimization
- [ ] Progressive Web App features

---

## 1. CI/CD Pipeline Best Practices

### 1.1 Modern GitHub Actions Architecture

#### Recommended Workflow Structure
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  quality-gate:
    name: Quality Gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: TypeScript Check
        run: pnpm type-check
      
      - name: Lint & Format
        run: |
          pnpm lint
          pnpm format:check
      
      - name: Unit Tests
        run: pnpm test:ci
      
      - name: Bundle Analysis
        run: pnpm analyze
        env:
          ANALYZE: true

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Dependency Vulnerability Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: CodeQL Analysis
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript
      
      - name: Container Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'my-app:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'

  performance-test:
    name: Performance Testing
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: './lighthouse.config.js'
          temporaryPublicStorage: true
      
      - name: Core Web Vitals Check
        run: pnpm test:performance
      
      - name: Bundle Size Check
        run: pnpm check:bundle

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Playwright
        run: pnpm playwright:install
      
      - name: Run E2E Tests
        run: pnpm test:e2e
        env:
          SHOPIFY_STOREFRONT_ACCESS_TOKEN: ${{ secrets.SHOPIFY_STOREFRONT_ACCESS_TOKEN }}
          SHOPIFY_STORE_DOMAIN: ${{ secrets.SHOPIFY_STORE_DOMAIN }}

  deploy-staging:
    name: Deploy to Staging
    needs: [quality-gate, security-scan, performance-test, e2e-tests]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to Staging
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    name: Deploy to Production
    needs: [quality-gate, security-scan, performance-test, e2e-tests]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

### 1.2 Advanced Testing Strategies

#### Smart Test Selection
```javascript
// scripts/smart-test-selection.js
const { execSync } = require('child_process');

function getChangedFiles() {
  return execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

function selectTests(changedFiles) {
  const testSuites = [];
  
  if (changedFiles.some(file => file.includes('components/'))) {
    testSuites.push('test:component');
  }
  
  if (changedFiles.some(file => file.includes('app/api/'))) {
    testSuites.push('test:integration');
  }
  
  if (changedFiles.some(file => file.includes('lib/shopify'))) {
    testSuites.push('test:e2e');
  }
  
  return testSuites.length > 0 ? testSuites : ['test:unit'];
}

const changedFiles = getChangedFiles();
const testSuites = selectTests(changedFiles);

console.log(testSuites.join(' && '));
```

#### Performance Budget Configuration
```javascript
// lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      settings: {
        chromeFlags: '--no-sandbox'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
```

---

## 2. Production Deployment Standards

### 2.1 Environment Configuration Management

#### Next.js 15 Environment Strategy
```typescript
// lib/config/environment.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().min(1),
  SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  WEBHOOK_SECRET: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
});

type Environment = z.infer<typeof envSchema>;

function validateEnvironment(): Environment {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
}

export const env = validateEnvironment();

// Runtime environment checker
export function checkEnvironment() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN',
    'NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

### 2.2 Secrets Management

#### GitHub Actions Secrets Structure
```bash
# Required Secrets for CI/CD
VERCEL_TOKEN=                    # Vercel deployment token
VERCEL_ORG_ID=                   # Vercel organization ID
VERCEL_PROJECT_ID=               # Vercel project ID
SNYK_TOKEN=                      # Security scanning token
SHOPIFY_STOREFRONT_ACCESS_TOKEN= # For E2E tests
SHOPIFY_STORE_DOMAIN=           # For E2E tests
```

#### Production Secrets Rotation Strategy
```typescript
// scripts/rotate-secrets.ts
import { createClient } from '@supabase/supabase-js';

interface SecretRotationConfig {
  secretName: string;
  rotationIntervalDays: number;
  lastRotated: Date;
  rotationFunction: () => Promise<string>;
}

class SecretManager {
  private secrets: SecretRotationConfig[] = [
    {
      secretName: 'SHOPIFY_WEBHOOK_SECRET',
      rotationIntervalDays: 90,
      lastRotated: new Date(),
      rotationFunction: this.rotateShopifyWebhookSecret
    },
    {
      secretName: 'STRIPE_WEBHOOK_SECRET',
      rotationIntervalDays: 30,
      lastRotated: new Date(),
      rotationFunction: this.rotateStripeWebhookSecret
    }
  ];

  async checkAndRotateSecrets() {
    for (const secret of this.secrets) {
      if (this.shouldRotate(secret)) {
        await this.rotateSecret(secret);
      }
    }
  }

  private shouldRotate(secret: SecretRotationConfig): boolean {
    const daysSinceRotation = Math.floor(
      (Date.now() - secret.lastRotated.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceRotation >= secret.rotationIntervalDays;
  }

  private async rotateSecret(secret: SecretRotationConfig) {
    try {
      const newSecret = await secret.rotationFunction();
      // Update in your secrets management system
      console.log(`✅ Rotated ${secret.secretName}`);
    } catch (error) {
      console.error(`❌ Failed to rotate ${secret.secretName}:`, error);
    }
  }

  private async rotateShopifyWebhookSecret(): Promise<string> {
    // Implementation for Shopify webhook secret rotation
    return 'new-shopify-secret';
  }

  private async rotateStripeWebhookSecret(): Promise<string> {
    // Implementation for Stripe webhook secret rotation
    return 'new-stripe-secret';
  }
}
```

### 2.3 SSL/TLS Certificate Management

#### Automated Certificate Renewal
```yaml
# .github/workflows/ssl-check.yml
name: SSL Certificate Check

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
  workflow_dispatch:

jobs:
  ssl-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check SSL Certificate
        run: |
          DOMAIN="your-domain.com"
          EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
          EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
          CURRENT_EPOCH=$(date +%s)
          DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
          
          if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
            echo "⚠️ SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
            # Send alert to monitoring system
          else
            echo "✅ SSL certificate is valid for $DAYS_UNTIL_EXPIRY days"
          fi
```

---

## 3. Monitoring & Observability

### 3.1 OpenTelemetry Integration

#### Complete Instrumentation Setup
```typescript
// instrumentation.ts (Next.js 15)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/monitoring/instrumentation');
  }
}

// lib/monitoring/instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'strike-shop',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### 3.2 Error Tracking and Alerting

#### Enhanced Error Boundary with Monitoring
```typescript
// components/error-boundaries/monitored-error-boundary.tsx
'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { captureException } from '@/lib/monitoring/error-tracker';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  context?: Record<string, any>;
}

export class MonitoredErrorBoundary extends React.Component<
  Props,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error tracking with context
    captureException(error, {
      tags: {
        component: 'ErrorBoundary',
        section: this.props.context?.section || 'unknown',
      },
      extra: {
        errorInfo,
        context: this.props.context,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    });

    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          context: this.props.context,
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);
    }
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback;
      
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error!}
            reset={() => this.setState({ hasError: false, error: null })}
          />
        );
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3.3 Performance Monitoring

#### Core Web Vitals Tracking
```typescript
// lib/monitoring/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB, onINP } from 'web-vitals';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

class WebVitalsTracker {
  private metrics: WebVitalMetric[] = [];
  private endpoint = '/api/monitoring/web-vitals';

  constructor() {
    this.initializeTracking();
  }

  private initializeTracking() {
    // Track all Core Web Vitals
    getCLS(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));
    
    // Track new INP metric (2025 update)
    onINP(this.handleMetric.bind(this));
  }

  private handleMetric(metric: WebVitalMetric) {
    this.metrics.push(metric);
    
    // Send immediately for poor ratings
    if (metric.rating === 'poor') {
      this.sendMetric(metric);
    }
    
    // Send real-time alerts for critical metrics
    if (metric.name === 'LCP' && metric.value > 4000) {
      this.sendAlert('LCP_CRITICAL', metric);
    }
    
    if (metric.name === 'INP' && metric.value > 500) {
      this.sendAlert('INP_CRITICAL', metric);
    }
  }

  private async sendMetric(metric: WebVitalMetric) {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...metric,
          url: window.location.href,
          timestamp: Date.now(),
          sessionId: this.getSessionId(),
        }),
      });
    } catch (error) {
      console.error('Failed to send metric:', error);
    }
  }

  private async sendAlert(type: string, metric: WebVitalMetric) {
    try {
      await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          metric,
          severity: 'high',
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('webvitals-session');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('webvitals-session', sessionId);
    }
    return sessionId;
  }

  // Public method to get current metrics
  getMetrics(): WebVitalMetric[] {
    return [...this.metrics];
  }
}

export const webVitalsTracker = new WebVitalsTracker();
```

### 3.4 Business Metrics Tracking

#### E-commerce Analytics Implementation
```typescript
// lib/analytics/ecommerce-tracker.ts
interface EcommerceEvent {
  event: string;
  ecommerce: {
    currency: string;
    value: number;
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      quantity: number;
      price: number;
    }>;
  };
}

export class EcommerceTracker {
  private gtag: any;
  
  constructor() {
    this.gtag = (window as any).gtag;
  }

  // Track product views
  trackProductView(product: {
    id: string;
    name: string;
    category: string;
    price: number;
  }) {
    this.gtag('event', 'view_item', {
      currency: 'USD',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        category: product.category,
        price: product.price,
        quantity: 1,
      }],
    });
  }

  // Track add to cart
  trackAddToCart(product: {
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  }) {
    this.gtag('event', 'add_to_cart', {
      currency: 'USD',
      value: product.price * product.quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        category: product.category,
        price: product.price,
        quantity: product.quantity,
      }],
    });
  }

  // Track purchase
  trackPurchase(order: {
    id: string;
    value: number;
    currency: string;
    items: Array<{
      id: string;
      name: string;
      category: string;
      price: number;
      quantity: number;
    }>;
  }) {
    this.gtag('event', 'purchase', {
      transaction_id: order.id,
      value: order.value,
      currency: order.currency,
      items: order.items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  // Track search
  trackSearch(searchTerm: string, resultsCount: number) {
    this.gtag('event', 'search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }
}
```

---

## 4. Security Best Practices

### 4.1 API Security

#### Rate Limiting Implementation
```typescript
// lib/security/rate-limiter.ts
import { LRUCache } from 'lru-cache';

interface RateLimiterOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
  maxTokens?: number;
}

export class RateLimiter {
  private cache: LRUCache<string, number>;
  private interval: number;
  private maxTokens: number;

  constructor(options: RateLimiterOptions = {}) {
    this.interval = options.interval || 60000; // 1 minute
    this.maxTokens = options.maxTokens || 10;
    
    this.cache = new LRUCache({
      max: options.uniqueTokenPerInterval || 500,
      ttl: this.interval,
    });
  }

  check(limit: number, token: string): { success: boolean; remaining: number } {
    const tokenCount = (this.cache.get(token) || 0) + 1;
    this.cache.set(token, tokenCount);

    const success = tokenCount <= limit;
    const remaining = Math.max(0, limit - tokenCount);

    return { success, remaining };
  }
}

// API route middleware
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  options: RateLimiterOptions & { limit: number } = { limit: 10 }
) {
  const rateLimiter = new RateLimiter(options);

  return async (req: Request): Promise<Response> => {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const { success, remaining } = rateLimiter.check(options.limit, ip);

    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': options.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + rateLimiter.interval).toISOString(),
          },
        }
      );
    }

    const response = await handler(req);
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', options.limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    return response;
  };
}
```

#### CORS Configuration
```typescript
// lib/security/cors.ts
interface CORSOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export function createCORSHeaders(
  origin: string,
  options: CORSOptions = {}
): Headers {
  const headers = new Headers();

  // Handle origin
  if (options.origin === true) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else if (typeof options.origin === 'string') {
    headers.set('Access-Control-Allow-Origin', options.origin);
  } else if (Array.isArray(options.origin)) {
    if (options.origin.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
  }

  // Set other CORS headers
  headers.set(
    'Access-Control-Allow-Methods',
    (options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']).join(', ')
  );
  
  headers.set(
    'Access-Control-Allow-Headers',
    (options.allowedHeaders || [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ]).join(', ')
  );

  if (options.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (options.maxAge) {
    headers.set('Access-Control-Max-Age', options.maxAge.toString());
  }

  return headers;
}

// Next.js API route wrapper
export function withCORS(
  handler: (req: Request) => Promise<Response>,
  options: CORSOptions = {}
) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('origin') || '';
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: createCORSHeaders(origin, options),
      });
    }

    // Process the actual request
    const response = await handler(req);
    
    // Add CORS headers to the response
    const corsHeaders = createCORSHeaders(origin, options);
    corsHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
```

### 4.2 Input Validation & Sanitization

#### Comprehensive Validation System
```typescript
// lib/security/validation.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Product validation schema
export const productSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  price: z.number().positive(),
  description: z.string().max(2000),
  images: z.array(z.string().url()).max(10),
  variants: z.array(z.object({
    id: z.string().uuid(),
    price: z.number().positive(),
    inventory: z.number().min(0),
  })),
});

// User input validation
export const userInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  message: z.string().max(1000),
});

// Sanitization utilities
export class InputSanitizer {
  static sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    });
  }

  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  static sanitizeSearchQuery(query: string): string {
    return query
      .trim()
      .replace(/[^\w\s-]/g, '') // Allow only alphanumeric, spaces, and hyphens
      .substring(0, 100);
  }
}

// API validation middleware
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: Request, data: T) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    try {
      const body = await req.json();
      const validatedData = schema.parse(body);
      return await handler(req, validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            issues: error.issues,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
```

---

## 5. Performance Optimization

### 5.1 Core Web Vitals Optimization

#### Image Optimization Strategy
```typescript
// lib/optimization/image-optimizer.ts
interface ImageOptimizationConfig {
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  sizes?: string;
  priority?: boolean;
}

export class ImageOptimizer {
  static generateSrcSet(
    src: string,
    sizes: number[] = [640, 768, 1024, 1280, 1536]
  ): string {
    return sizes
      .map(size => `${src}?w=${size}&q=75 ${size}w`)
      .join(', ');
  }

  static generateShopifyOptimizedUrl(
    src: string,
    options: {
      width?: number;
      height?: number;
      crop?: 'center' | 'top' | 'bottom' | 'left' | 'right';
      format?: 'webp' | 'jpg' | 'png';
    } = {}
  ): string {
    const url = new URL(src);
    
    if (options.width) url.searchParams.set('width', options.width.toString());
    if (options.height) url.searchParams.set('height', options.height.toString());
    if (options.crop) url.searchParams.set('crop', options.crop);
    if (options.format) url.searchParams.set('format', options.format);
    
    return url.toString();
  }

  static getOptimalImageProps(
    src: string,
    alt: string,
    config: ImageOptimizationConfig = {}
  ) {
    return {
      src,
      alt,
      quality: config.quality || 75,
      sizes: config.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      priority: config.priority || false,
      placeholder: 'blur' as const,
      blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVR...',
    };
  }
}

// Component for optimized product images
export function OptimizedProductImage({
  src,
  alt,
  width,
  height,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  const optimizedSrc = ImageOptimizer.generateShopifyOptimizedUrl(src, {
    width,
    height,
    format: 'webp',
    crop: 'center',
  });

  return (
    <Image
      {...ImageOptimizer.getOptimalImageProps(optimizedSrc, alt, { priority })}
      width={width}
      height={height}
      className="object-cover"
    />
  );
}
```

### 5.2 Caching Strategies

#### Multi-Layer Caching Implementation
```typescript
// lib/cache/cache-manager.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly maxMemorySize = 100; // Max items in memory

  // Memory cache with TTL
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Clean old entries if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      this.cleanExpiredEntries();
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Redis cache wrapper
  async setRedis<T>(key: string, data: T, ttlSeconds: number = 3600): Promise<void> {
    // Implementation would use Redis client
    // await redis.setex(key, ttlSeconds, JSON.stringify(data));
  }

  async getRedis<T>(key: string): Promise<T | null> {
    // Implementation would use Redis client
    // const result = await redis.get(key);
    // return result ? JSON.parse(result) : null;
    return null;
  }
}

export const cacheManager = new CacheManager();

// Caching decorator for API functions
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttlSeconds: number = 300
) {
  return async (...args: T): Promise<R> => {
    const cacheKey = keyGenerator(...args);
    
    // Try memory cache first
    const cachedResult = cacheManager.get<R>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cacheManager.set(cacheKey, result, ttlSeconds);
    
    return result;
  };
}

// Example usage
export const getCachedProducts = withCache(
  async (collectionId: string, limit: number) => {
    // Shopify API call
    return await shopifyClient.products.list({ collection_id: collectionId, limit });
  },
  (collectionId: string, limit: number) => `products:${collectionId}:${limit}`,
  600 // 10 minutes TTL
);
```

### 5.3 Bundle Optimization

#### Advanced Bundle Analysis
```typescript
// scripts/bundle-analyzer.ts
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { execSync } from 'child_process';

interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: number;
  }>;
  duplicates: string[];
  unusedExports: string[];
}

class BundleAnalyzer {
  static async analyzeBundle(): Promise<BundleStats> {
    // Run webpack-bundle-analyzer programmatically
    const stats = await this.getBundleStats();
    
    return {
      totalSize: this.calculateTotalSize(stats),
      gzippedSize: this.calculateGzippedSize(stats),
      chunks: this.getChunkInfo(stats),
      duplicates: this.findDuplicateModules(stats),
      unusedExports: await this.findUnusedExports(),
    };
  }

  private static calculateTotalSize(stats: any): number {
    // Implementation to calculate total bundle size
    return 0;
  }

  private static calculateGzippedSize(stats: any): number {
    // Implementation to calculate gzipped size
    return 0;
  }

  private static getChunkInfo(stats: any): Array<{name: string; size: number; modules: number}> {
    // Implementation to extract chunk information
    return [];
  }

  private static findDuplicateModules(stats: any): string[] {
    // Implementation to find duplicate modules
    return [];
  }

  private static async findUnusedExports(): Promise<string[]> {
    try {
      const result = execSync('npx unimported', { encoding: 'utf8' });
      return result.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  private static async getBundleStats(): Promise<any> {
    // Implementation to get webpack stats
    return {};
  }

  static generateReport(stats: BundleStats): void {
    console.log('📊 Bundle Analysis Report');
    console.log('========================');
    console.log(`Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Gzipped Size: ${(stats.gzippedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Chunks: ${stats.chunks.length}`);
    
    if (stats.duplicates.length > 0) {
      console.log(`⚠️  Duplicate modules found: ${stats.duplicates.length}`);
      stats.duplicates.forEach(dup => console.log(`   - ${dup}`));
    }
    
    if (stats.unusedExports.length > 0) {
      console.log(`🧹 Unused exports found: ${stats.unusedExports.length}`);
    }
  }
}

// Usage in package.json script
if (require.main === module) {
  BundleAnalyzer.analyzeBundle()
    .then(BundleAnalyzer.generateReport)
    .catch(console.error);
}
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Implement security scanning (Snyk, CodeQL)
- [ ] Configure environment management
- [ ] Set up monitoring infrastructure (OpenTelemetry)
- [ ] Implement rate limiting and CORS

### Phase 2: Performance (Week 3-4)
- [ ] Optimize images and implement CDN
- [ ] Set up caching layers
- [ ] Implement Core Web Vitals monitoring
- [ ] Bundle optimization and code splitting
- [ ] Set up performance budgets

### Phase 3: Security Hardening (Week 5-6)
- [ ] Complete PCI compliance review
- [ ] Implement comprehensive input validation
- [ ] Set up secrets rotation
- [ ] Security headers and CSP
- [ ] Audit logging implementation

### Phase 4: Monitoring & Observability (Week 7-8)
- [ ] Complete error tracking setup
- [ ] Business metrics implementation
- [ ] Alerting and notification system
- [ ] Dashboard and reporting
- [ ] Load testing and capacity planning

### Phase 5: Optimization & Polish (Week 9-10)
- [ ] Performance fine-tuning
- [ ] Security penetration testing
- [ ] Documentation completion
- [ ] Team training and handover
- [ ] Go-live preparation

---

## 7. Tools & Technologies

### Required Tools
- **CI/CD**: GitHub Actions, Vercel
- **Security**: Snyk, CodeQL, Trivy
- **Monitoring**: OpenTelemetry, Sentry
- **Performance**: Lighthouse CI, Web Vitals
- **Caching**: Redis, Vercel Edge Cache
- **CDN**: Vercel Edge Network, Cloudflare
- **Testing**: Playwright, Jest, Testing Library

### Recommended Integrations
- **Error Tracking**: Sentry, Bugsnag
- **APM**: DataDog, New Relic
- **Security**: Auth0, Clerk
- **Analytics**: Google Analytics 4, Mixpanel
- **Notifications**: Slack, PagerDuty

---

## 8. Success Metrics

### Performance Metrics
- **LCP**: < 2.5 seconds
- **INP**: < 200 milliseconds  
- **CLS**: < 0.1
- **TTFB**: < 200 milliseconds
- **Bundle Size**: < 250KB initial load

### Security Metrics
- **Vulnerabilities**: 0 critical, 0 high
- **Security Scan**: Pass all checks
- **Compliance**: PCI DSS, GDPR ready
- **Uptime**: 99.9% availability

### Business Metrics
- **Conversion Rate**: Maintain or improve
- **Page Load Time**: < 3 seconds
- **Error Rate**: < 0.1%
- **API Response Time**: < 200ms p95

---

## 9. Maintenance Schedule

### Daily
- [ ] Monitor error rates and performance metrics
- [ ] Check security alerts
- [ ] Review deployment status

### Weekly  
- [ ] Dependency vulnerability scan
- [ ] Performance review and optimization
- [ ] Security log analysis

### Monthly
- [ ] Comprehensive security audit
- [ ] Performance benchmarking
- [ ] Dependency updates review
- [ ] SSL certificate check

### Quarterly
- [ ] Penetration testing
- [ ] Disaster recovery testing
- [ ] Architecture review
- [ ] Team training updates

---

This comprehensive guide provides a production-ready foundation for your Next.js 15 e-commerce application. Implement these practices incrementally, starting with the highest-impact items first. Regular monitoring and iteration will ensure your application remains secure, performant, and maintainable.

Remember to adapt these practices to your specific requirements and scale them based on your application's growth and complexity.