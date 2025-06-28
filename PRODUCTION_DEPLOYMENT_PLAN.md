# 🚀 Strike Shop Production Deployment Plan

## Overview
This document outlines the complete production deployment strategy for Strike Shop using Medusa 2.0, Supabase, Stripe, and Vercel.

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel (CDN)  │────▶│  Render/Railway │────▶│    Supabase     │
│   Next.js App   │     │   Medusa API   │     │   PostgreSQL    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Stripe      │     │   Redis Cloud   │     │    AWS S3       │
│    Payments     │     │  Cache/Events   │     │  File Storage   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 📋 Complete Environment Variables

### Medusa Backend (Render/Railway)
```bash
# Core Security - PRODUCTION VALUES (Generate new secure strings!)
JWT_SECRET=generate-32-char-secure-random-string-here
COOKIE_SECRET=generate-32-char-secure-random-string-here

# Database - Supabase
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
# For persistent connections (if needed):
# DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Redis - Redis Cloud or Upstash
REDIS_URL=redis://default:[password]@[host]:[port]

# CORS Configuration
STORE_CORS=https://strikeshop.vercel.app
ADMIN_CORS=https://strikeshop-admin.render.com
AUTH_CORS=https://strikeshop.vercel.app,https://strikeshop-admin.render.com

# Application URLs
MEDUSA_BACKEND_URL=https://strikeshop-api.render.com
PORT=9000

# Stripe Integration
STRIPE_SECRET_KEY=sk_live_[your-stripe-secret-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]

# File Storage - AWS S3
S3_ACCESS_KEY_ID=[aws-access-key]
S3_SECRET_ACCESS_KEY=[aws-secret-key]
S3_REGION=us-east-1
S3_BUCKET=strikeshop-assets
S3_FILE_URL=https://strikeshop-assets.s3.amazonaws.com

# Optional Features
SENDGRID_API_KEY=[sendgrid-key-for-emails]
NODE_ENV=production
```

### Vercel Frontend
```bash
# API Configuration
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://strikeshop-api.render.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your-stripe-publishable-key]

# Optional Analytics
NEXT_PUBLIC_GA_ID=G-[google-analytics-id]
NEXT_PUBLIC_SENTRY_DSN=[sentry-dsn]
```

## 🔧 Step-by-Step Deployment Process

### Phase 1: Infrastructure Setup

#### 1. Supabase Database Setup
```bash
# 1. Create new Supabase project at https://supabase.com/dashboard
# 2. Enable required extensions in SQL Editor:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

# 3. Configure connection pooling:
# Use port 6543 for transaction mode (recommended for serverless)
# Connection string format:
# postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### 2. Redis Setup (Redis Cloud)
```bash
# 1. Create Redis Cloud account at https://redis.com/cloud/
# 2. Create new database (30MB free tier is sufficient to start)
# 3. Enable persistence and eviction policy: allkeys-lru
# 4. Copy connection string: redis://default:[password]@[host]:[port]
```

#### 3. AWS S3 Setup
```bash
# 1. Create S3 bucket with public read access
# 2. Configure CORS policy:
{
  "CorsRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://strikeshop.vercel.app", "https://strikeshop-admin.render.com"],
    "ExposeHeaders": ["ETag"]
  }]
}

# 3. Create IAM user with S3 access policy
# 4. Generate access keys
```

#### 4. Stripe Configuration
```bash
# 1. Login to Stripe Dashboard
# 2. Create webhook endpoint: https://strikeshop-api.render.com/stripe/hooks
# 3. Select events:
#    - payment_intent.succeeded
#    - payment_intent.payment_failed
#    - payment_intent.canceled
#    - checkout.session.completed
#    - customer.subscription.created
#    - customer.subscription.updated
#    - customer.subscription.deleted
# 4. Copy webhook signing secret
```

### Phase 2: Backend Deployment (Render)

#### 1. Prepare Repository
```bash
# Update package.json scripts
{
  "scripts": {
    "build": "medusa build",
    "build:admin": "medusa build --admin-only",
    "start": "medusa start",
    "predeploy": "medusa db:migrate"
  }
}

# Create render.yaml
services:
  - type: web
    name: strikeshop-api
    runtime: node
    buildCommand: npm install && npm run build && cd .medusa/server && npm install --production
    startCommand: npm run predeploy && npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_VERSION
        value: 20
```

#### 2. Deploy to Render
```bash
# 1. Connect GitHub repository to Render
# 2. Create new Web Service
# 3. Configure environment variables (from list above)
# 4. Set build command: 
#    npm install && npm run build && cd .medusa/server && npm install --production
# 5. Set start command:
#    npm run predeploy && npm start
# 6. Enable auto-deploy
```

#### 3. Post-Deployment Setup
```bash
# SSH into Render instance or use Render Shell

# Create admin user
npx medusa user -e admin@strikeshop.com -p [secure-password]

# Verify migrations
npx medusa db:migrate

# Test health endpoint
curl https://strikeshop-api.render.com/health
```

### Phase 3: Frontend Deployment (Vercel)

#### 1. Configure Next.js
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['strikeshop-assets.s3.amazonaws.com'],
  },
  env: {
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
}
```

#### 2. Deploy to Vercel
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Configure environment variables in Vercel Dashboard
# 4. Set up custom domain if needed
```

## 🔒 Security Checklist

- [ ] Generate new JWT_SECRET and COOKIE_SECRET
- [ ] Enable SSL/TLS on all connections
- [ ] Configure CORS with exact domains (no wildcards)
- [ ] Set up Stripe webhook signature verification
- [ ] Enable Row Level Security on Supabase tables
- [ ] Configure S3 bucket policies properly
- [ ] Set up rate limiting on API endpoints
- [ ] Enable 2FA on all service accounts
- [ ] Configure backup retention policies
- [ ] Set up monitoring and alerting

## 📊 Monitoring & Maintenance

### Health Checks
```typescript
// Implement comprehensive health check
GET /health
Response: {
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "stripe": "configured",
  "version": "2.0.0"
}
```

### Monitoring Setup
1. **Application Monitoring**: Sentry or LogRocket
2. **Database Monitoring**: Supabase Dashboard
3. **API Monitoring**: Render Metrics + Custom dashboards
4. **Payment Monitoring**: Stripe Dashboard + Webhooks
5. **Uptime Monitoring**: UptimeRobot or Pingdom

### Backup Strategy
```bash
# Daily automated backups
# Supabase: Enable PITR for databases > 4GB
# Redis: Enable persistence
# S3: Enable versioning

# Weekly manual verification
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Admin Panel "Failed to fetch"
```bash
# Check CORS configuration
ADMIN_CORS=https://your-exact-admin-url.com
AUTH_CORS=https://your-exact-admin-url.com

# Verify MEDUSA_BACKEND_URL
MEDUSA_BACKEND_URL=https://your-api-url.com  # No trailing slash
```

#### 2. Database Connection Issues
```bash
# For Supabase transaction mode issues:
# Add to medusa-config.ts
databaseDriverOptions: {
  connection: {
    ssl: { rejectUnauthorized: false }
  }
}
```

#### 3. Stripe Webhook Failures
```javascript
// Ensure raw body parsing
app.use('/stripe/*', express.raw({ type: 'application/json' }))
```

#### 4. Redis Connection on Railway
```bash
# Add family parameter for IPv6 issues
REDIS_URL=redis://default:password@host:port?family=0
```

## 🎯 Go-Live Checklist

### Pre-Launch (1 Week Before)
- [ ] Complete security audit
- [ ] Load test API endpoints
- [ ] Test payment flows with real cards
- [ ] Verify email deliverability
- [ ] Test backup restoration
- [ ] Review error handling

### Launch Day
- [ ] Enable production mode
- [ ] Switch DNS records
- [ ] Monitor error rates
- [ ] Check payment processing
- [ ] Verify admin access
- [ ] Test critical user flows

### Post-Launch (First Week)
- [ ] Monitor performance metrics
- [ ] Review error logs daily
- [ ] Check conversion rates
- [ ] Optimize slow queries
- [ ] Gather user feedback
- [ ] Plan first iteration

## 📈 Scaling Considerations

### When to Scale
- Database CPU > 80% consistently
- API response time > 500ms p95
- Redis memory usage > 80%
- Concurrent users > 1000

### Scaling Options
1. **Vertical Scaling**: Upgrade Render/Supabase tiers
2. **Horizontal Scaling**: Add read replicas
3. **Caching Layer**: Implement CDN for static assets
4. **Queue System**: Add BullMQ for heavy operations

## 🔄 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Render
        run: |
          curl -X POST $RENDER_DEPLOY_HOOK_URL
```

## 🎉 Final Notes

This production deployment plan provides a robust, scalable foundation for Strike Shop. Remember to:

1. **Test everything** in a staging environment first
2. **Monitor actively** during the first weeks
3. **Iterate based on real usage** patterns
4. **Keep security as top priority**
5. **Document any deviations** from this plan

Your e-commerce platform is now ready for production deployment with enterprise-grade infrastructure! 🚀