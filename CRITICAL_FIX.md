# CRITICAL DATABASE CONNECTION FIX

## The Problem
Your Railway deployment is failing because:
1. **DATABASE_URL is not set** - The logs clearly show "DATABASE_URL: Not set"
2. Without a database, the Product module (and all others) fail with ECONNREFUSED

## The Solution

### In Railway Dashboard:

1. **Add PostgreSQL to your project**:
   ```
   Railway Dashboard → Your Project → New → Database → PostgreSQL
   ```

2. **Connect PostgreSQL to your app**:
   - Click on your app service
   - Go to Variables tab
   - You should see these auto-populated:
     - DATABASE_URL
     - DATABASE_PUBLIC_URL
     - DATABASE_PRIVATE_URL

3. **If not auto-populated, add manually**:
   - Click "Add Variable Reference"
   - Select Postgres → DATABASE_URL
   - This creates: `DATABASE_URL=${{Postgres.DATABASE_URL}}`

4. **Add other required variables**:
   ```
   JWT_SECRET=<generate with: openssl rand -base64 32>
   COOKIE_SECRET=<generate with: openssl rand -base64 32>
   MEDUSA_CONFIG_FILE=medusa-config.minimal.js
   ```

## What I've Fixed

1. **Created minimal config** (`medusa-config.minimal.js`):
   - No module specifications to avoid initialization errors
   - Checks multiple database URL environment variables
   - Exits cleanly if no database found

2. **Updated start.js**:
   - Checks all possible database URL variables
   - Auto-copies any found database URL to DATABASE_URL
   - Shows all available environment variables for debugging

3. **Simplified deployment**:
   - Disabled admin panel to reduce complexity
   - Minimal module configuration
   - Better error messages

## Verify Database Connection

After adding PostgreSQL in Railway:

1. Check the PostgreSQL service is green (running)
2. In your app's Variables tab, confirm DATABASE_URL is set
3. Redeploy your app
4. Check logs - you should see "Found database URL in DATABASE_URL"

## If Still Failing

The issue is 100% the missing database connection. Railway needs:
1. PostgreSQL service added to project
2. DATABASE_URL variable properly linked
3. PostgreSQL service must be running (green status)

Without these, Medusa cannot start.