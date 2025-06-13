# Railway Deployment Setup for Medusa v2

## Prerequisites
1. Railway account
2. PostgreSQL and Redis services deployed in your Railway project

## Environment Variables

### For Server Mode (Main Instance)
```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
DATABASE_NAME=medusa-store

# Worker Mode
MEDUSA_WORKER_MODE=server

# Admin
DISABLE_MEDUSA_ADMIN=false
MEDUSA_BACKEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}

# Redis (if using)
REDIS_URL=${{Redis.REDIS_PUBLIC_URL}}

# CORS
STORE_CORS=https://your-storefront-url.com,http://localhost:3000
ADMIN_CORS=https://${{RAILWAY_PUBLIC_DOMAIN}}
AUTH_CORS=https://${{RAILWAY_PUBLIC_DOMAIN}},https://your-storefront-url.com

# Security
JWT_SECRET=your-super-secret-jwt-key-here
COOKIE_SECRET=your-super-secret-cookie-key-here

# Stripe (if using)
STRIPE_API_KEY=your-stripe-api-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Port
PORT=9000
```

### For Worker Mode (Second Instance - Optional)
```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
DATABASE_NAME=medusa-store

# Worker Mode
MEDUSA_WORKER_MODE=worker

# Admin (disabled for worker)
DISABLE_MEDUSA_ADMIN=true

# Redis (required for worker mode)
REDIS_URL=${{Redis.REDIS_PUBLIC_URL}}

# Security (must match server instance)
JWT_SECRET=your-super-secret-jwt-key-here
COOKIE_SECRET=your-super-secret-cookie-key-here

# Port
PORT=9000
```

## Railway Deployment Steps

1. **Create Railway Project**
   ```bash
   railway login
   railway init
   ```

2. **Add PostgreSQL Service**
   - Go to Railway dashboard
   - Click "New Service" → "Database" → "PostgreSQL"
   - Note the DATABASE_URL reference

3. **Add Redis Service (Optional but Recommended)**
   - Click "New Service" → "Database" → "Redis"
   - Note the REDIS_URL reference

4. **Deploy Medusa Server Instance**
   ```bash
   railway up
   ```

5. **Configure Environment Variables**
   - Go to your service settings
   - Add all environment variables from the "Server Mode" section above
   - Use Railway's template variable syntax for database URLs

6. **Deploy Worker Instance (Optional)**
   - Create a new service in the same project
   - Deploy the same code
   - Configure with "Worker Mode" environment variables

## Important Notes

1. **Database URL Format**: Railway uses a specific format for PostgreSQL URLs. Make sure to use the template variable syntax: `${{Postgres.DATABASE_PUBLIC_URL}}`

2. **Redis Requirement**: For production deployments with separate worker instances, Redis is required. Without Redis, use `workerMode: "shared"` in the config.

3. **CORS Configuration**: Update CORS settings to match your frontend URLs. Use comma-separated values for multiple origins.

4. **Module Resolution**: The stock_location and inventory modules are built into Medusa v2 and referenced as:
   - `@medusajs/medusa/stock-location`
   - `@medusajs/medusa/inventory`

5. **Build Command**: The `railway.toml` file specifies the build command. Make sure your package.json has the corresponding scripts.

## Troubleshooting

### Common Issues:

1. **Import Errors**: Ensure using CommonJS syntax (`require`) not ES6 (`import`)
2. **Database Connection**: Verify PostgreSQL URL format and credentials
3. **Redis Connection**: If Redis modules fail, ensure REDIS_URL is properly set
4. **Module Not Found**: Check that all required packages are in package.json

### Health Check
The deployment includes a health check at `/health`. Ensure this endpoint returns 200 OK.

### Logs
Monitor deployment logs with:
```bash
railway logs
```

## Testing the Deployment

1. **Check Health**: `curl https://your-app.railway.app/health`
2. **Access Admin**: `https://your-app.railway.app/app`
3. **Test API**: `curl https://your-app.railway.app/store/products`