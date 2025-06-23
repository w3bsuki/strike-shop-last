# Render Deploy - Simple Steps

1. **Render.com → New → Web Service**
2. **Connect repo**: strike-shop-last
3. **Configure**:
   - Root Directory: `my-medusa-store`
   - Build: `npm install && npm run build`
   - Start: `npm run start`

4. **Environment Variables**:
```
NODE_ENV=production
JWT_SECRET=(generate)
COOKIE_SECRET=(generate)
STORE_CORS=*
ADMIN_CORS=*
AUTH_CORS=*
```

5. **Add PostgreSQL** → Connect to service
6. **Deploy**

Done. Your backend URL will be: https://[service-name].onrender.com