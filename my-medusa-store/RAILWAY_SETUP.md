# Railway Setup Instructions

## Required Services

For production deployment on Railway, you need to set up these services:

### 1. PostgreSQL Database
- Add PostgreSQL service from Railway dashboard
- It will automatically provide `DATABASE_URL`

### 2. Redis (Optional but Recommended)
- Add Redis service from Railway dashboard
- It will provide `REDIS_URL`
- Used for caching, events, and workflows

### 3. Environment Variables

Add these in Railway dashboard:

```bash
# Required
NODE_ENV=production
MEDUSA_BACKEND_URL=https://your-app.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-generated-jwt-secret
COOKIE_SECRET=your-generated-cookie-secret

# CORS Settings
STORE_CORS=https://your-frontend-domain.com
ADMIN_CORS=https://your-app.railway.app
AUTH_CORS=https://your-frontend-domain.com

# Stripe (Required for payments)
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis (if added)
REDIS_URL=${{Redis.REDIS_URL}}

# Optional - S3 Storage
S3_ACCESS_KEY_ID=your-s3-key
S3_SECRET_ACCESS_KEY=your-s3-secret
S3_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
S3_ENDPOINT=https://s3.amazonaws.com

# Optional - SendGrid
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM=noreply@yourdomain.com

# Optional - Search
MEILISEARCH_HOST=https://your-meilisearch.com
MEILISEARCH_API_KEY=your-api-key
```

## Setup Steps

1. **Create PostgreSQL Service**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically connect it

2. **Create Redis Service** (Optional)
   - Click "New" → "Database" → "Redis"
   - Railway will automatically connect it

3. **Deploy Medusa**
   - Run `railway up` in the my-medusa-store directory
   - Railway will build and deploy using the Dockerfile

4. **Run Migrations**
   - After deployment, run:
   ```bash
   railway run npx medusa db:migrate
   ```

5. **Seed Data** (Optional)
   - To add sample products:
   ```bash
   railway run npm run seed
   ```

## If You Don't Want Redis

The current production config works without Redis. Medusa will use:
- In-memory cache (instead of Redis cache)
- Local event bus (instead of Redis event bus)
- Local workflow engine (instead of Redis workflow)

This is fine for getting started but Redis is recommended for production scale.

## Updating the Config for Redis

If you add Redis later, update `medusa-config.production.ts`:

```typescript
// Add these modules when Redis is available
[Modules.CACHE]: {
  resolve: "@medusajs/cache-redis",
  options: {
    redisUrl: process.env.REDIS_URL,
    ttl: 60 * 60 * 1000, // 1 hour
  },
},
[Modules.EVENT_BUS]: {
  resolve: "@medusajs/event-bus-redis",
  options: {
    redisUrl: process.env.REDIS_URL,
  },
},
[Modules.WORKFLOW_ENGINE]: {
  resolve: "@medusajs/workflow-engine-redis",
  options: {
    redis: {
      url: process.env.REDIS_URL,
    },
  },
},
```

But first install the packages:
```bash
pnpm add @medusajs/cache-redis @medusajs/event-bus-redis @medusajs/workflow-engine-redis
```