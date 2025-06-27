# Sanity CMS Setup Guide

## Why Use Sanity for Your Store?

Your codebase already has a complete Sanity integration with:
- 📸 Professional image management with CDN
- 🛍️ Rich product content (descriptions, variants, SEO)
- 🎨 Dynamic marketing content (banners, campaigns)
- 👥 Community features (user-generated content)
- 🔍 Built-in search functionality

## Quick Setup (10 minutes)

### 1. Get Your Existing Project ID or Create New

**Option A: Use Existing Project**
1. Go to https://sanity.io/manage
2. Find your project
3. Copy the Project ID

**Option B: Create New Project**
1. Go to https://sanity.io/manage
2. Click "Create project"
3. Name it "Strike Shop"
4. Copy the Project ID

### 2. Update Environment Variable
```bash
# In .env.local, replace YOUR_SANITY_PROJECT_ID_HERE with your actual ID
NEXT_PUBLIC_SANITY_PROJECT_ID=your-actual-project-id
```

### 3. Deploy Sanity Studio (Optional but Recommended)
```bash
# From project root
cd sanity-studio
npm install
npx sanity deploy
```

### 4. Configure Content Models

The schemas are already created for:
- **Products**: Full e-commerce product management
- **Categories**: Product categorization with images
- **Site Settings**: Navigation, footer, SEO
- **Community Fits**: User-generated content
- **Pages**: Dynamic content pages

## How to Use Sanity + Medusa Together

### Recommended Approach:

1. **Medusa Handles**:
   - Inventory management
   - Orders and fulfillment
   - Payment processing
   - Customer accounts
   - Shipping rates

2. **Sanity Handles**:
   - Product descriptions and images
   - Marketing content
   - Category images and descriptions
   - SEO metadata
   - Blog/editorial content

### Integration Pattern:

```typescript
// Example: Enriching Medusa products with Sanity content
const medusaProduct = await MedusaProductService.getProduct(id);
const sanityProduct = await sanityService.getProductBySlug(medusaProduct.handle);

const enrichedProduct = {
  ...medusaProduct,
  // Use Sanity's rich content
  description: sanityProduct?.description || medusaProduct.description,
  images: sanityProduct?.images || medusaProduct.images,
  seo: sanityProduct?.seo,
  // Keep Medusa's pricing and inventory
  price: medusaProduct.price,
  inventory: medusaProduct.inventory,
};
```

## Benefits of This Hybrid Approach

1. **Best of Both Worlds**:
   - Medusa's robust e-commerce backend
   - Sanity's superior content management

2. **Marketing Flexibility**:
   - Update hero banners without deployment
   - A/B test product descriptions
   - Seasonal campaigns

3. **Better Images**:
   - Automatic optimization
   - Multiple formats (WebP, AVIF)
   - Responsive sizing

4. **SEO Control**:
   - Per-product meta tags
   - Rich snippets
   - Dynamic sitemaps

## Quick Start Content

### 1. Add a Test Product in Sanity Studio
```javascript
{
  title: "STRIKE™ Oversized Hoodie",
  slug: "strike-oversized-hoodie",
  description: "Premium heavyweight cotton blend...",
  price: 125,
  images: [/* upload product photos */],
  category: "hoodies",
  seo: {
    metaTitle: "STRIKE™ Oversized Hoodie | Luxury Streetwear",
    metaDescription: "Premium oversized hoodie..."
  }
}
```

### 2. Update Homepage to Use Sanity
```typescript
// In app/page.tsx, add Sanity data fetching
const sanityHomePage = await sanityService.getHomePage();
const sanityProducts = await sanityService.getAllProducts();
```

## Next Steps

1. **Upload Product Images**: Replace Unsplash placeholders
2. **Create Categories**: With proper imagery
3. **Add Site Settings**: Logo, navigation, footer
4. **Enable Community Features**: User-generated content

## Testing

Visit `/api/health` to check Sanity connection status.