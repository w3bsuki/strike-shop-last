# Fix Vercel Frontend Showing Mock Data

## Issue
The Vercel frontend is showing mock data instead of fetching from the Railway Medusa backend. This happens because the `NEXT_PUBLIC_MEDUSA_BACKEND_URL` environment variable is not properly configured in Vercel.

## Root Cause
In `lib/medusa-service-refactored.ts`, the service falls back to mock data when:
1. `NEXT_PUBLIC_MEDUSA_BACKEND_URL` is not configured (lines 18-22, 134-138)
2. The API returns a non-ok response (lines 34-36, 168-170)  
3. An error occurs during the fetch (lines 41-45, 175-179)

Currently, `.env.local` has:
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```

This points to localhost, which doesn't exist on Vercel's servers.

## Solution

### 1. Get Your Railway Backend URL
First, get your Railway Medusa backend URL. It should look like:
```
https://strike-shop-medusa-production-xxxx.up.railway.app
```

You can find this in your Railway dashboard under the Medusa service's settings.

### 2. Set Environment Variables in Vercel

Go to your Vercel project dashboard and add these environment variables:

```bash
# Required - Your Railway backend URL
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-railway-backend-url.railway.app

# Required - From your Medusa backend
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae
NEXT_PUBLIC_MEDUSA_REGION_ID=reg_01JXFMWZWX24XQD1BYNTS3N15Q

# Supabase (if using authentication)
NEXT_PUBLIC_SUPABASE_URL=https://vxvitkusmtukyjrdjhqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dml0a3VzbXR1a3lqcmRqaHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NzgyNTEsImV4cCI6MjA2NjU1NDI1MX0.g8h8yhQvyRKRsKenFJWGHE942IVlrFle_isLSn91zEM

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51QoF6o2LUSziTeuCJvH1qViyuGLMBVNTUEQgjCrdz122Gwd5Y4J9mhLaoads4SNd6UEaBWQLxlDSXv2kulR9I26L00mV4P5SGi
```

### 3. Configure CORS in Railway Medusa Backend

Make sure your Railway Medusa backend allows CORS from your Vercel frontend. In your Railway environment variables for Medusa, set:

```bash
STORE_CORS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
ADMIN_CORS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
AUTH_CORS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

### 4. Test the Connection

After setting the environment variables:

1. Redeploy your Vercel app (this happens automatically when you add/change env vars)
2. Check the browser console for any CORS or connection errors
3. Verify in Network tab that requests are going to your Railway backend URL

### 5. Debugging Tips

If you still see mock data:

1. **Check Browser Console**: Look for messages like:
   - "Medusa backend URL not configured, returning mock products"
   - "Medusa products API returned XXX, falling back to mock data"
   - "Failed to fetch products from Medusa:"

2. **Verify API is accessible**: 
   ```bash
   curl https://your-railway-backend.railway.app/store/products \
     -H "x-publishable-api-key: pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae"
   ```

3. **Check CORS headers**: Use browser DevTools Network tab to see if CORS headers are present

4. **Verify Region ID**: Make sure the region ID exists in your Medusa backend

### 6. Optional: Create .env.production

For better organization, create a `.env.production` file (don't commit this):

```bash
# Production Medusa Backend
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-railway-backend.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae
NEXT_PUBLIC_MEDUSA_REGION_ID=reg_01JXFMWZWX24XQD1BYNTS3N15Q

# Copy other necessary variables from .env.local
```

## Common Issues

1. **CORS Errors**: Make sure your Vercel domain is in the CORS whitelist on Railway
2. **404 on API calls**: Verify the backend URL doesn't have a trailing slash
3. **Authentication errors**: Check that the publishable key matches your Medusa backend
4. **Region errors**: Ensure the region ID exists in your Medusa database

## Verification

Once properly configured, you should:
- See real products from your Medusa backend
- No longer see "Mock Product" items
- API calls in Network tab should go to Railway URL
- No fallback messages in console