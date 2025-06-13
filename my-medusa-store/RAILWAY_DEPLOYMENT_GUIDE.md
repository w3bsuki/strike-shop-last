# Railway Deployment Guide for Medusa v2

## EXACT Working Configuration (Tested January 2025)

This guide provides the exact configuration that successfully deploys Medusa v2 on Railway.

## Option 1: Using Nixpacks (Recommended)

### 1. railway.toml
```toml
[build]
builder = "NIXPACKS"
buildCommand = "pnpm install --frozen-lockfile && pnpm run build"

[build.nixpacksPlan.phases.setup]
nixPkgs = ["nodejs", "pnpm", "python3"]

[deploy]
startCommand = "npx medusa db:migrate && pnpm run start"
healthcheckPath = "/health"
healthcheckTimeout = 180
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### 2. Required Environment Variables
```bash
# Database (Railway provides this)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Application
NODE_ENV=production
PORT=9000
MEDUSA_BACKEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}

# Security (Generate unique values!)
JWT_SECRET=your-super-secret-jwt-key-here
COOKIE_SECRET=your-super-secret-cookie-key-here

# CORS
STORE_CORS=https://your-frontend-domain.com,http://localhost:3000
ADMIN_CORS=https://${{RAILWAY_PUBLIC_DOMAIN}}
AUTH_CORS=https://${{RAILWAY_PUBLIC_DOMAIN}},https://your-frontend-domain.com

# Stripe
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Worker Mode (for main instance)
MEDUSA_WORKER_MODE=server
```

## Option 2: Using Docker

### 1. Rename railway.docker.toml to railway.toml
```bash
mv railway.docker.toml railway.toml
```

### 2. The Dockerfile is already configured
The Dockerfile includes:
- Node 20 Alpine base image
- Python and build dependencies
- Non-root user for security
- Health check configuration
- Automatic migration on start

## Health Check Endpoint

The health endpoint is implemented at `/src/api/health/route.ts` and returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-06T12:00:00.000Z"
}
```

## Start Commands

The deployment uses these start commands:
1. **Nixpacks**: `npx medusa db:migrate && pnpm run start`
2. **Docker**: Configured in the Dockerfile CMD

Both commands:
- Run database migrations first
- Start Medusa in production mode
- Use PORT environment variable (9000)

## Deployment Steps

### 1. Create Railway Project
```bash
railway login
railway init
```

### 2. Add PostgreSQL
- In Railway dashboard: New → Database → PostgreSQL
- Copy the DATABASE_URL reference

### 3. Add Environment Variables
- Go to your service settings
- Add ALL environment variables listed above
- Use Railway's template syntax: `${{Postgres.DATABASE_URL}}`

### 4. Deploy
```bash
# From the my-medusa-store directory
railway up
```

### 5. Verify Deployment
```bash
# Check health endpoint
curl https://your-app.railway.app/health

# Check admin panel
open https://your-app.railway.app/app

# Check API
curl https://your-app.railway.app/store/products
```

## Troubleshooting

### If deployment fails:

1. **Check Logs**
   ```bash
   railway logs
   ```

2. **Common Issues**:
   - **Database Connection**: Ensure DATABASE_URL uses Railway's template syntax
   - **Port Binding**: Must use PORT=9000
   - **Build Failures**: Try Docker option if Nixpacks fails
   - **Health Check Timeout**: Increase to 300 if needed

3. **Migration Issues**:
   - Run manually after deployment:
   ```bash
   railway run npx medusa db:migrate
   ```

4. **Module Errors**:
   - Ensure all dependencies are in package.json
   - Use `--frozen-lockfile` for consistent installs

### If using Redis (Optional):

Add to environment:
```bash
REDIS_URL=${{Redis.REDIS_URL}}
```

Update medusa-config.production.ts to use Redis modules (see RAILWAY_SETUP.md).

## Production Checklist

- [ ] Unique JWT_SECRET and COOKIE_SECRET
- [ ] Correct CORS origins
- [ ] Stripe keys configured
- [ ] Database connected
- [ ] Health check returns 200
- [ ] Admin panel accessible
- [ ] API endpoints working

## Support

- Railway Discord: https://discord.gg/railway
- Medusa Discord: https://discord.gg/medusajs
- GitHub Issues: https://github.com/medusajs/medusa/issues