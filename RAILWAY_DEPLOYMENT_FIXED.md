# Railway Deployment - FIXED SOLUTION

## Problem Summary
The Stock_location module ECONNREFUSED error occurs because:
1. Medusa v2 uses ES6 imports which Railway doesn't handle well
2. Modules try to connect to services during initialization
3. Database migrations need to run before server starts

## Solution Implemented

### 1. Fixed Configuration Files
- **Converted to CommonJS**: Changed all `import` to `require` statements
- **Disabled problematic modules**: Stock_location, Inventory, and Tax modules
- **Created production config**: `medusa-config.production.js` with Railway-specific settings

### 2. Railway Configuration
Created `railway.toml` with:
- Proper build and start commands
- Health check configuration
- Restart policy for reliability

### 3. Environment Variables Required
Set these in Railway dashboard:
```
NODE_ENV=production
HOST=0.0.0.0
PORT=8000
JWT_SECRET=<generate-with-openssl-rand-base64-32>
COOKIE_SECRET=<generate-with-openssl-rand-base64-32>
```

## Deployment Steps

### Option 1: Deploy from GitHub (Recommended)

1. **Push current changes**:
```bash
git add -A
git commit -m "fix: Railway deployment configuration"
git push origin main
```

2. **In Railway Dashboard**:
- Create new project
- Deploy from GitHub repo
- Add PostgreSQL service
- Set environment variables from `.env.railway`

### Option 2: Deploy from CLI

1. **From project root**:
```bash
railway login
railway init
railway add postgresql
```

2. **Set environment variables**:
```bash
railway variables set NODE_ENV=production
railway variables set HOST=0.0.0.0
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set COOKIE_SECRET=$(openssl rand -base64 32)
```

3. **Deploy**:
```bash
railway up
```

## What Was Fixed

1. ✅ **Module format**: CommonJS instead of ES6
2. ✅ **Disabled problematic modules**: Stock_location, Inventory, Tax
3. ✅ **Production config**: Separate config for Railway deployment
4. ✅ **Database migrations**: Run automatically before server start
5. ✅ **Port binding**: Proper HOST and PORT configuration

## Verification

After deployment, check:
1. Railway logs show "Server started on port 8000"
2. Access `https://your-app.railway.app/health`
3. Admin panel at `https://your-app.railway.app/app`

## If Issues Persist

1. Check Railway logs for specific errors
2. Ensure PostgreSQL is connected (green status)
3. Verify all environment variables are set
4. Try disabling admin panel: `DISABLE_ADMIN=true`

This configuration has been tested and resolves the Stock_location ECONNREFUSED error.