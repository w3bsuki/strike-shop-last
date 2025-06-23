# Deploy Medusa to Railway - Quick Guide

## 1. Create Railway Account
Go to https://railway.app and sign up with GitHub

## 2. Install Railway CLI
```bash
npm install -g @railway/cli
# or
curl -fsSL https://railway.app/install.sh | sh
```

## 3. Login to Railway
```bash
railway login
```

## 4. Create New Project
```bash
cd my-medusa-store
railway link
# Select "Create New Project"
```

## 5. Add PostgreSQL Database
```bash
railway add postgresql
```

## 6. Set Environment Variables
```bash
# Railway will auto-generate these:
# DATABASE_URL (from PostgreSQL)
# PORT (auto-set to 9000)

# You need to add these:
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set COOKIE_SECRET=$(openssl rand -base64 32)
railway variables set STORE_CORS=https://your-vercel-app.vercel.app
railway variables set ADMIN_CORS=https://your-vercel-app.vercel.app
railway variables set AUTH_CORS=https://your-vercel-app.vercel.app
railway variables set NODE_ENV=production
railway variables set MEDUSA_ADMIN_ONBOARDING_TYPE=default
```

## 7. Deploy
```bash
railway up
```

## 8. Run Migrations & Seed Data
```bash
# After deployment completes, run:
railway run npx medusa migrations run
railway run npm run seed
```

## 9. Create Admin User
```bash
railway run npx medusa user -e admin@medusa-store.com -p supersecret123
```

## 10. Get Your Medusa URL
```bash
railway status
# Copy the deployment URL (e.g., https://your-app.up.railway.app)
```

## 11. Create Publishable API Key
Visit: https://your-app.up.railway.app/admin
Login with your admin credentials
Go to Settings → API Key Management → Create Publishable Key

## Alternative: One-Click Deploy to Render

1. Go to https://render.com
2. New → Web Service
3. Connect your GitHub repo
4. Use these settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Add PostgreSQL database
   - Add environment variables from .env.template

## Required Environment Variables for Vercel:
```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-medusa-app.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxx (get from Medusa admin)
```