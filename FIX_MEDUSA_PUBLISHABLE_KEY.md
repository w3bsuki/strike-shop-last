# Fix for Invalid Medusa Publishable Key

## Issue
The Medusa backend at https://medusa-starter-default-production-3201.up.railway.app requires a publishable key, but the key we have (pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae) is invalid.

## Solution

You need to get the correct publishable key from your Railway Medusa backend. Here's how:

### Option 1: Get the key from Railway logs
1. Go to your Railway dashboard
2. Click on your Medusa service
3. Check the deployment logs for the publishable key
4. Look for messages like "Publishable API Key:" or similar

### Option 2: Access Medusa Admin
1. Your Medusa admin should be available at: https://medusa-starter-default-production-3201.up.railway.app/app
2. Login with your admin credentials
3. Go to Settings → API Keys
4. Find or create a publishable key

### Option 3: Check Railway environment variables
1. In Railway dashboard, go to your Medusa service
2. Click on Variables tab
3. Look for any variables containing publishable keys

### Option 4: Use Medusa CLI
If you have access to the database, you can query the publishable keys directly:
```sql
SELECT * FROM api_key WHERE type = 'publishable';
```

## Temporary Workaround

Until you get the correct key, the frontend will show mock data. Once you have the correct key:

1. Update `.env.local`:
```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your-correct-key-here
```

2. Update `lib/config/medusa.ts` if you hardcoded it there

3. Restart your dev server

## Alternative: Disable Publishable Key Requirement

If this is your own Medusa backend, you can disable the publishable key requirement:

1. In your Medusa backend, edit `medusa-config.js`
2. Set `disable_publishable_key: true` in the project config
3. Redeploy on Railway

This is not recommended for production but can help during development.