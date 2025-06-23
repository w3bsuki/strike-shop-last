# AGGRESSIVE BUNDLE OPTIMIZATION STRATEGY

## CURRENT STATE
- **node_modules size**: 1.2GB
- **Target**: <200MB (83% reduction required)
- **Largest packages**: @next (277M), @sanity (124M), sanity (104M), next (103M)

## PHASE 1: DEPENDENCY PURGE (Immediate ~100MB savings)

### Safe to Remove Production Dependencies
```bash
npm uninstall @sanity/vision node-fetch
```
- `@sanity/vision`: Development tool, not needed in production (1.9M)
- `node-fetch`: Not used, Next.js has built-in fetch (208K)

### Conditional Removals (Need verification)
- `@hookform/resolvers`: Only if react-hook-form is actually unused
- `date-fns`: Large package (37M) - check if used in production
- `react-dom`: Should be used by Next.js - verify before removing

### Development Dependencies Cleanup
```bash
npm uninstall --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event jest-environment-jsdom prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-next eslint-plugin-jsx-a11y husky lint-staged
```
**Savings**: ~45MB of dev dependencies

## PHASE 2: MAJOR PACKAGE OPTIMIZATIONS

### 1. Sanity Optimization (228M → ~50M)
- **Current**: `sanity` (104M) + `@sanity/client` (124M) = 228M
- **Strategy**: 
  - Use production-only Sanity client
  - Remove Sanity Studio from production build
  - Implement lazy loading for admin features

### 2. Lucide Icons Optimization (31M → ~5M)
- **Current**: Full lucide-react package (31M)
- **Strategy**: Individual icon imports
- **Implementation**: Use import maps in next.config.mjs

### 3. React Query DevTools (Production Exclusion)
- **Current**: @tanstack/react-query-devtools included in production
- **Strategy**: Conditional import only in development

## PHASE 3: DYNAMIC IMPORTS & CODE SPLITTING

### Critical Path (Initial Bundle <500KB)
```typescript
// Keep in initial bundle
- Layout components
- Basic UI components (Button, Input)
- Authentication providers
- Core utilities
```

### Lazy Load Candidates
```typescript
// Admin components (25MB reduction)
const AdminDashboard = dynamic(() => import('@/components/admin/AdminDashboard'))

// Studio components (104MB Sanity reduction)
const StudioWrapper = dynamic(() => import('@/components/studio/StudioWrapper'))

// Complex UI components
const QuickViewModal = dynamic(() => import('@/components/QuickViewModal'))
const CommunityCarousel = dynamic(() => import('@/components/community-carousel'))

// Route-specific components
const CheckoutForm = dynamic(() => import('@/components/checkout/enhanced-checkout-form'))
const ProductReviews = dynamic(() => import('@/components/product-reviews'))
```

## PHASE 4: CDN MIGRATION STRATEGY

### Candidates for CDN
1. **React & React-DOM**: Use CDN for production
2. **Stripe**: Load from CDN
3. **Clerk**: Use CDN version if available

### Implementation
```html
<!-- In production only -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
```

## PHASE 5: TREE-SHAKING OPTIMIZATION

### Import Optimizations
```typescript
// BEFORE (Bad)
import { format } from 'date-fns'
import * as Icons from 'lucide-react'

// AFTER (Good)
import { format } from 'date-fns/format'
import { Search, Menu } from 'lucide-react/dist/esm/icons'
```

### Webpack Configuration
- Enable `sideEffects: false` for all packages
- Implement aggressive module concatenation
- Perfect chunk splitting strategy

## PHASE 6: PRODUCTION BUILD OPTIMIZATION

### Environment-Specific Dependencies
```json
// Create separate package.json for production
{
  "dependencies": {
    // Only production essentials
    // Exclude: @sanity/vision, testing libraries, dev tools
  }
}
```

### Compression Strategy
- Enable Brotli compression
- Optimize static asset caching
- Implement perfect chunk splitting

## TARGET METRICS

### Bundle Size Targets
- **Initial bundle**: <500KB (currently unknown)
- **Route chunks**: <100KB each
- **Vendor chunks**: <200KB each
- **Total node_modules**: <200MB

### Performance Targets
- **Tree-shaking efficiency**: >95%
- **Compression ratio**: >80%
- **Initial load time**: <3s
- **Route transition**: <1s

## EXECUTION ORDER

1. ✅ **Dependency Audit** (COMPLETED)
2. 🔄 **Safe Dependency Removal** (IN PROGRESS)
3. 📋 **Import Optimization**
4. 📋 **Dynamic Import Implementation**  
5. 📋 **CDN Migration**
6. 📋 **Webpack Optimization**
7. 📋 **Production Build Test**
8. 📋 **Final Verification**

## RISK MITIGATION
- Backup current package.json before changes
- Test builds after each phase
- Maintain development environment functionality
- Gradual implementation with rollback capability