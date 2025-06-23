# Route-Based Code Splitting Guide

## Current Heavy Routes

### 1. Admin Routes (/admin/*)
- **Current impact**: ~500KB
- **Components**: AdminDashboard, Charts, DataTables
- **Solution**: Already split in next.config.mjs

### 2. Studio Routes (/studio/*)
- **Current impact**: ~2MB (Sanity Studio)
- **Components**: Studio, Vision plugin
- **Solution**: Use dynamic import in page component

### 3. Product Pages
- **Components**: ProductGallery, Reviews, RelatedProducts
- **Solution**: Lazy load below-the-fold components

## Implementation Examples

### Studio Page Optimization
```tsx
// app/studio/[[...tool]]/page.tsx
import dynamic from 'next/dynamic';

const Studio = dynamic(
  () => import('@/components/studio/StudioWrapper'),
  {
    ssr: false,
    loading: () => <StudioLoader />,
  }
);

export default function StudioPage() {
  return <Studio />;
}
```

### Product Page Optimization
```tsx
// components/product/ProductPage.tsx
import dynamic from 'next/dynamic';

// Load immediately (above the fold)
import ProductInfo from './ProductInfo';
import ProductGallery from './ProductGallery';

// Lazy load (below the fold)
const ProductReviews = dynamic(() => import('./ProductReviews'));
const RelatedProducts = dynamic(() => import('./RelatedProducts'));
const ProductQA = dynamic(() => import('./ProductQA'));

export function ProductPage() {
  return (
    <>
      <ProductGallery />
      <ProductInfo />
      {/* These load as user scrolls */}
      <ProductReviews />
      <RelatedProducts />
      <ProductQA />
    </>
  );
}
```

## Bundle Size Targets

| Route | Current | Target | Savings |
|-------|---------|--------|---------|
| Home | 250KB | 200KB | 20% |
| Product | 300KB | 220KB | 27% |
| Admin | 500KB | 300KB | 40% |
| Studio | 2MB | 100KB* | 95% |

*Initial load, studio loads on demand

## Monitoring

Run these commands to track progress:
- `npm run bundle:check` - Check current bundle sizes
- `npm run build:analyze` - Visual bundle analysis
- `npm run bundle:optimize` - Run optimization scripts
