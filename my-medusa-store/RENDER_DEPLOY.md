# Deploy Medusa to Render

## 1. Push to GitHub
```bash
# Create new repo on GitHub: https://github.com/new
# Name it: medusa-backend-strike

git remote add origin https://github.com/w3bsuki/medusa-backend-strike.git
git push -u origin main
```

## 2. Go to Render.com
1. Sign up at https://render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub account
4. Select your `medusa-backend-strike` repo

## 3. Configure Service
- **Name**: medusa-backend-strike
- **Root Directory**: (leave blank)
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Plan**: Free

## 4. Add Environment Variables
Click **Advanced** → **Add Environment Variable**:

```
NODE_ENV=production
JWT_SECRET=click-generate-random-string
COOKIE_SECRET=click-generate-random-string
STORE_CORS=*
ADMIN_CORS=*
AUTH_CORS=*
```

## 5. Add PostgreSQL Database
1. Click **New +** → **PostgreSQL**
2. Name: medusa-db
3. Plan: Free
4. Click **Create Database**
5. Wait for it to be ready (5 mins)
6. Copy the **Internal Database URL**

## 6. Connect Database to Web Service
1. Go back to your web service
2. Add environment variable:
   - Key: `DATABASE_URL`
   - Value: (paste the Internal Database URL)

## 7. Deploy
Click **Create Web Service**

## 8. After Deploy Completes
The URL will be: `https://medusa-backend-strike.onrender.com`

## 9. Run Migrations (in Render Shell)
1. Go to your service dashboard
2. Click **Shell** tab
3. Run:
```bash
npm run build
npx medusa migrations run
npx medusa seed
npx medusa user -e admin@strike.com -p supersecret123
```

## 10. Update Vercel
Add these to Vercel environment variables:
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa-backend-strike.onrender.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae
```