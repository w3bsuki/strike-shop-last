# Railway Deployment Setup

## Alternative Approach: Deploy from Subdirectory

Since we're having issues with the Dockerfile approach, let's try deploying directly from the subdirectory:

### Step 1: Create a new Railway project

```bash
cd my-medusa-store
railway login
railway init
```

### Step 2: Add PostgreSQL Database

```bash
railway add
# Select PostgreSQL
```

### Step 3: Set Environment Variables

```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set COOKIE_SECRET=$(openssl rand -base64 32)
railway variables set STORE_CORS=*
railway variables set ADMIN_CORS=*
railway variables set AUTH_CORS=*
```

### Step 4: Deploy

```bash
railway up
```

### Step 5: Run Migrations

```bash
railway run npx medusa db:migrate
```

### Alternative: Use Railway Button

You can also try using Railway's template button approach by adding this to your README:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/medusa)

## Environment Variables Needed

- `DATABASE_URL` - Automatically provided by Railway PostgreSQL
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `COOKIE_SECRET` - Generate with: `openssl rand -base64 32`
- `NODE_ENV` - Set to `production`
- `PORT` - Railway provides this automatically

## Debugging Commands

Check logs:
```bash
railway logs
```

Run commands in the deployed environment:
```bash
railway run npx medusa --help
```

## Simple Vercel Deployment for Frontend

Once backend is deployed:

```bash
cd .. # Go to project root
npx vercel
```

Set these environment variables in Vercel:
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` = Your Railway URL
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` = Get from Medusa admin