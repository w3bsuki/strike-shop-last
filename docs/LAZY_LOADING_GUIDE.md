# Lazy Loading Guide - Strike Shop

## Overview

This guide explains how to implement lazy loading in Strike Shop to maintain our 300KB bundle size target.

## When to Use Lazy Loading

### Always Lazy Load:
1. **Heavy Libraries** (>50KB)
   - Charting libraries (recharts)
   - Animation libraries (framer-motion)
   - Rich text editors
   - Map components
   - PDF viewers

2. **Route-Specific Components**
   - Admin dashboard components
   - Checkout forms
   - User account pages
   - Category/product pages

3. **Below-the-Fold Content**
   - Product carousels
   - Reviews sections
   - Related products
   - Footer content

4. **Modal/Dialog Content**
   - Quick view modals
   - Search overlays
   - Cart drawers
   - Authentication forms

### Never Lazy Load:
1. **Critical UI Components**
   - Navigation headers
   - Hero sections
   - Core layout components
   - Error boundaries

2. **Small Utilities** (<10KB)
   - clsx
   - Small utility functions
   - Constants/configs

## Implementation Patterns

### 1. Basic Dynamic Import

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false // Disable SSR if not needed
});
```

### 2. With Custom Loading State

```typescript
const ProductGallery = dynamic(
  () => import('./ProductGallery'),
  {
    loading: () => (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    ),
    ssr: false
  }
);
```

### 3. Named Export Import

```typescript
// When component is not default export
const BarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { ssr: false }
);
```

### 4. Conditional Loading

```typescript
const AdminDashboard = dynamic(
  () => import('./AdminDashboard'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false
  }
);

// In component
{isAdmin && <AdminDashboard />}
```

### 5. Route-Based Splitting

```typescript
// app/admin/page.tsx
import dynamic from 'next/dynamic';

const AdminContent = dynamic(() => import('./AdminContent'), {
  loading: () => <AdminLoader />
});

export default function AdminPage() {
  return <AdminContent />;
}
```

## Using the Dynamic Components Library

We've created a centralized library at `/lib/dynamic-components.ts`:

```typescript
import { 
  LineChart, 
  BarChart, 
  AnimatePresence,
  motion,
  AdminDashboard,
  CategoryPageClient 
} from '@/lib/dynamic-components';
```

## Best Practices

### 1. Loading States
Always provide meaningful loading states:

```typescript
// Good - Shows layout structure
loading: () => (
  <div className="space-y-4">
    <div className="h-8 bg-gray-200 rounded w-1/4" />
    <div className="h-64 bg-gray-200 rounded" />
  </div>
)

// Bad - Generic spinner
loading: () => <Spinner />
```

### 2. Error Boundaries
Wrap lazy loaded components in error boundaries:

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <LazyComponent />
</ErrorBoundary>
```

### 3. Preload Critical Components
For components that will definitely be used:

```typescript
// Preload on hover
<button
  onMouseEnter={() => {
    import('./ExpensiveModal');
  }}
  onClick={() => setShowModal(true)}
>
  Open Modal
</button>
```

### 4. Bundle Size Monitoring
After adding lazy loading:

```bash
# Check bundle sizes
npm run check:bundle

# Analyze bundle
npm run analyze
```

## Common Patterns

### Modal/Dialog Pattern
```typescript
const [showModal, setShowModal] = useState(false);

const ExpensiveModal = dynamic(() => import('./ExpensiveModal'), {
  loading: () => null,
  ssr: false
});

return (
  <>
    <button onClick={() => setShowModal(true)}>Open</button>
    {showModal && <ExpensiveModal onClose={() => setShowModal(false)} />}
  </>
);
```

### Progressive Enhancement Pattern
```typescript
// Load core functionality first
const BasicFeature = () => <div>Basic Feature</div>;

// Enhance with heavy features progressively
const EnhancedFeature = dynamic(() => import('./EnhancedFeature'), {
  loading: () => <BasicFeature />,
  ssr: false
});
```

### Route Guard Pattern
```typescript
const ProtectedContent = dynamic(
  () => import('./ProtectedContent'),
  {
    loading: () => <AuthChecking />,
    ssr: false
  }
);

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <AuthChecking />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  
  return <ProtectedContent />;
}
```

## Performance Tips

1. **Group Related Imports**: If components are always used together, import them in the same chunk
2. **Avoid Over-Splitting**: Don't split components smaller than 20KB
3. **Consider Network**: On slow connections, fewer larger chunks may perform better than many small ones
4. **Measure Impact**: Always measure before/after with Lighthouse

## Monitoring

Use these commands to ensure optimizations are working:

```bash
# Check bundle sizes against targets
npm run check:bundle

# Detailed bundle analysis
npm run analyze

# Build and check
npm run build && npm run optimize:check
```

## Troubleshooting

### Issue: Component flashes during load
**Solution**: Ensure consistent height/width in loading state

### Issue: SEO content not indexed
**Solution**: Enable SSR for SEO-critical content

### Issue: Hydration mismatch
**Solution**: Ensure loading state matches server render or disable SSR

### Issue: Bundle size increased after lazy loading
**Solution**: Check for duplicate dependencies across chunks

Remember: The goal is optimal user experience, not just small bundles. Always test on real devices and network conditions.