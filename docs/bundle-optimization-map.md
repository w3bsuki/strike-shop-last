# Bundle Optimization Map

## Overview
This document maps all heavy components and their optimization strategies to achieve <300KB initial bundle size.

## Current Optimizations Implemented

### 1. Route-Based Code Splitting (Automatic)
Next.js automatically code-splits at the route level. Each page is its own bundle.

### 2. Heavy Component Dynamic Imports

#### Sanity Studio (~104MB)
- **Location**: `/app/studio/[[...tool]]/page.tsx`
- **Strategy**: Dynamic import with SSR disabled
- **Impact**: Removes 104MB from initial bundle

#### Recharts (~1MB)
- **Location**: `/components/ui/chart-dynamic.tsx`
- **Strategy**: Individual component dynamic imports
- **Impact**: Removes ~1MB from initial bundle
- **Usage**: Admin dashboard charts

#### Admin Dashboard
- **Location**: `/app/admin/page.tsx`
- **Strategy**: Dynamic import with loading skeleton
- **Impact**: Isolates admin-specific code

#### Enhanced Checkout Form (includes Stripe SDK)
- **Location**: `/app/checkout/page.tsx`
- **Strategy**: Dynamic import with SSR disabled
- **Impact**: Removes Stripe SDK and payment logic from initial bundle

### 3. Webpack Optimizations (next.config.mjs)

#### Chunk Splitting Strategy
```javascript
splitChunks: {
  chunks: 'all',
  maxSize: 244000, // ~240KB max chunk size
  cacheGroups: {
    framework: { /* React core */ },
    radixCore: { /* UI components */ },
    clerk: { /* Authentication */ },
    query: { /* React Query */ },
    state: { /* Zustand */ },
    utils: { /* Utilities */ },
    icons: { /* Lucide icons */ },
  }
}
```

#### Tree Shaking
- Modularized imports for Lucide React icons
- Modularized imports for Recharts
- Side-effects marked as false for key packages

### 4. ViewportLoader Component
- **Location**: `/components/ui/viewport-loader.tsx`
- **Purpose**: Lazy load below-fold content
- **Usage**: Wrap heavy components that appear below the fold

## Recommended Future Optimizations

### 1. Image Optimization
- Use Next.js Image component everywhere
- Implement progressive loading with blur placeholders
- Consider using AVIF format for modern browsers

### 2. Font Optimization
- Use `next/font` for automatic font optimization
- Subset fonts to only needed characters
- Consider variable fonts for weight variations

### 3. Third-Party Scripts
- Load analytics scripts with `next/script` strategy="afterInteractive"
- Defer non-critical scripts
- Consider using web workers for heavy computations

### 4. Component-Level Optimizations

#### Heavy Components to Consider for Dynamic Import:
1. **Product Gallery** - Large image carousel
2. **Size Guide Modal** - Only needed on interaction
3. **Product Reviews** - Can be loaded on scroll
4. **Community Carousel** - Below fold on homepage
5. **Footer** - Often below fold, can be lazy loaded

#### Example Implementation:
```typescript
// Before
import { ProductGallery } from '@/components/product/gallery';

// After
const ProductGallery = dynamic(
  () => import('@/components/product/gallery'),
  { 
    loading: () => <GallerySkeleton />,
    ssr: true // Keep SSR for SEO
  }
);
```

### 5. Bundle Analysis Commands
```bash
# Analyze bundle size
ANALYZE=true npm run build

# Check bundle sizes
npm run build
# Look at .next/analyze/client.html
```

### 6. Performance Monitoring
- Implement Web Vitals tracking
- Monitor bundle size in CI/CD
- Set performance budgets

## Target Metrics
- **Initial Bundle**: <300KB
- **First Load JS**: <400KB
- **LCP**: <2.5s
- **FID**: <100ms
- **CLS**: <0.1

## Verification Steps
1. Run production build: `npm run build`
2. Check `.next` output for bundle sizes
3. Use Chrome DevTools Coverage tab to identify unused code
4. Run Lighthouse audit for performance score

## Notes
- Always provide loading states for dynamic imports
- Consider SEO impact when disabling SSR
- Test on slow 3G to ensure good UX during lazy loading
- Monitor Core Web Vitals after deployment