# 🛍️ Add Test Products to Your Store

## Quick Steps:

1. **Access Admin Panel**: http://172.30.205.219:9000/app
   - Email: admin@strikeshop.com
   - Password: AdminPass2025

2. **Add a Product**:
   - Go to "Products" in sidebar
   - Click "Create Product"
   - Fill in:
     - Title: "Test T-Shirt"
     - Description: "A premium test t-shirt"
     - Handle: "test-t-shirt" (auto-generated)
     - Status: "Published"

3. **Add Variant**:
   - Click "Add Variant"
   - Title: "Default"
   - SKU: "TEST-TSHIRT-001"
   - Price: $29.99
   - Inventory: 100

4. **Add Region (if needed)**:
   - Go to "Settings" → "Regions"
   - Create region for your country/currency

## For Frontend to Show Products:

Your frontend will only show products once:
1. ✅ Backend is deployed to production
2. ✅ Products exist in admin
3. ✅ Frontend env points to production backend URL

## Current Status:
- ✅ Backend working locally
- ✅ Admin panel accessible
- ❌ Need to deploy backend to production
- ❌ Need to update frontend to production backend URL

## Next Steps:
1. Add test products in admin
2. Deploy backend to Render (follow PRODUCTION_DEPLOYMENT_PLAN.md)
3. Update Vercel env: NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-app.onrender.com