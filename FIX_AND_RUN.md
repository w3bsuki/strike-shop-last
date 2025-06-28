# 🚀 Quick Fix & Run Guide

## What We Just Did:
1. ✅ Connected your Medusa backend to YOUR Supabase database
2. ✅ Added your LIVE Stripe keys to Medusa
3. ✅ Fixed CORS settings for admin panel
4. ✅ Generated secure JWT/Cookie secrets
5. ✅ Added SSL support for Supabase connection

## Next Steps:

### 1. Enable Supabase Extensions (REQUIRED - Do this first!)
Go to your Supabase dashboard > SQL Editor and run:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2. Start Your Backend
```bash
cd my-medusa-store
npm install  # If you haven't already
npm run dev
```

### 3. Run Migrations (First time only)
```bash
# In another terminal, while backend is running
cd my-medusa-store
npx medusa db:migrate
```

### 4. Create Admin User
```bash
npx medusa user -e your-email@example.com -p your-secure-password
```

### 5. Access Admin Panel
Open: http://localhost:9000/app

### 6. Test Your Frontend
Your frontend on Vercel should now connect properly!

## If Admin Panel Still Shows "Failed to fetch":

1. Check backend is running: `curl http://localhost:9000/health`
2. Clear browser cache/cookies
3. Try incognito mode
4. Check console for errors

## For Production Deployment:

When ready to deploy to Render:
1. Add these same environment variables to Render
2. Update CORS URLs to include your production domains
3. Use the PRODUCTION_DEPLOYMENT_PLAN.md we created

## Important Notes:
- You're using LIVE Stripe keys - be careful!
- Your Supabase is already set up and ready
- Frontend is already on Vercel
- Just need to deploy backend properly now