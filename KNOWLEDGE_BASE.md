# KNOWLEDGE BASE - Accumulated Technical Intelligence

> **PURPOSE**: This file accumulates ALL insights, patterns, decisions, and lessons learned
> **AUTO-GROWS**: Updated after every audit, review, fix, and decision
> **RETENTION**: NEVER DELETE - Only add and refine

---

## 🧠 ARCHITECTURAL INTELLIGENCE

### **PROVEN PATTERNS** ✅
```typescript
// EXCELLENT: Data integration pattern (lib/data-service.ts)
class DataService {
  // 1. Sanity provides content (titles, descriptions, images)
  // 2. Medusa provides commerce (pricing, inventory, variants)
  // 3. Unified IntegratedProduct interface
  // 4. Fallback strategies + error handling
  // WHY IT WORKS: Clean separation, type-safe, maintainable
}

// EXCELLENT: Zustand cart store pattern
const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Direct Medusa API integration
      // Optimistic updates with rollback
      // Proper error handling
      // Type-safe operations
    }),
    { name: 'cart-storage', storage: createJSONStorage(() => localStorage) }
  )
)

// EXCELLENT: Error boundary system
- AsyncErrorBoundary for async operations
- SuspenseErrorBoundary for suspense
- GeneralErrorBoundary for unexpected errors
// WHY IT WORKS: Comprehensive coverage, development vs production modes
```

### **ANTI-PATTERNS TO AVOID** ❌
```typescript
// BAD: Hardcoded API keys in client code
'x-publishable-api-key': 'pk_29b82d9f59f...' // EXPOSED IN BUNDLE!

// BAD: Silent error swallowing
catch (error) {
  console.error("Error:", error) // No user feedback!
}

// BAD: Unsafe property access
return v.title.toLowerCase() // Will crash if title is undefined

// BAD: Multiple useEffect with overlapping dependencies
useEffect(() => {}, [product?.id])     // Effect 1
useEffect(() => {}, [product, isInWishlist]) // Effect 2 - unnecessary
```

### **ARCHITECTURAL DECISIONS**

#### **✅ DECISION: Next.js 14 App Router** (Dec 2024)
- **Context**: Need modern React patterns
- **Decision**: Use App Router over Pages Router  
- **Rationale**: Better performance, server components, improved DX
- **Status**: Implemented and working well
- **Lessons**: Server components by default, client only when needed

#### **✅ DECISION: Zustand over Redux** (Dec 2024)
- **Context**: Need state management for cart/auth
- **Decision**: Zustand with persistence middleware
- **Rationale**: Simpler API, better TypeScript, smaller bundle
- **Status**: Working excellently for cart store
- **Lessons**: Perfect for e-commerce use cases

#### **✅ DECISION: Medusa v2.8.4 Backend** (Dec 2024)
- **Context**: Need headless e-commerce platform
- **Decision**: Medusa over Shopify/WooCommerce
- **Rationale**: Full control, TypeScript native, modern architecture
- **Status**: Implemented with some initial challenges
- **Lessons**: API key headers required for v2, great admin panel

#### **⚠️ DECISION: Dual CMS (Sanity + Medusa)** (Dec 2024)
- **Context**: Rich content + commerce data
- **Decision**: Sanity for content, Medusa for commerce
- **Rationale**: Best of both worlds - content flexibility + commerce features
- **Status**: Working but complex integration
- **Lessons**: Requires careful data merging, consider GraphQL federation

---

## 🔧 TECHNICAL DISCOVERIES

### **MEDUSA V2 INTEGRATION INSIGHTS**
```typescript
// DISCOVERY: Medusa v2 requires publishable API key in headers
const headers = {
  'Content-Type': 'application/json',
  'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
}

// DISCOVERY: Field expansion syntax changed in v2
// v1: ?expand=items.variant,items.variant.product
// v2: ?fields=*items.variant,*items.variant.product

// DISCOVERY: Direct fetch() calls work better than @medusajs/medusa-js client
// Reason: More control, better error handling, easier debugging
```

### **CART IMPLEMENTATION LEARNINGS**
```typescript
// LESSON: Always fetch cart with expanded variant data
const cartUrl = `${MEDUSA_API_URL}/store/carts/${cartId}?fields=*items.variant,*items.variant.product`

// LESSON: Implement optimistic updates for better UX
// 1. Update UI immediately
// 2. Make API call
// 3. Rollback on error
// 4. Show loading states during API calls

// LESSON: Persist cart ID in localStorage for session continuity
// Works across browser refreshes and sessions
```

### **PERFORMANCE DISCOVERIES**
```typescript
// DISCOVERY: React.memo crucial for product cards
// Without memo: 10+ re-renders on parent state change
// With memo: Only re-renders when product data changes

// DISCOVERY: Dynamic imports reduce initial bundle size
const ProductQuickView = dynamic(() => import('./product-quick-view'), {
  loading: () => <Skeleton className="h-96 w-full" />
})

// DISCOVERY: Image optimization critical for mobile
<Image
  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
  priority={index < 4} // Only first 4 images
/>
```

---

## 🚨 SECURITY INTELLIGENCE

### **VULNERABILITIES DISCOVERED**
1. **Hardcoded API Keys** (Critical)
   - Location: `lib/cart-store.ts`
   - Impact: Full backend access exposed
   - Fix: Environment variables + build-time validation

2. **Axios SSRF Vulnerability** (High)
   - Package: axios < 0.30.0
   - Impact: Server-side request forgery
   - Fix: Update to latest version

3. **Internal IP Exposure** (Medium)
   - Location: Fallback URLs in configs
   - Impact: Network reconnaissance
   - Fix: Use domain names only

### **SECURITY PATTERNS**
```typescript
// GOOD: Environment variable validation
const requiredEnvVars = [
  'NEXT_PUBLIC_MEDUSA_BACKEND_URL',
  'NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY'
]

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
})

// GOOD: Input validation with Zod
const ProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  description: z.string().max(1000)
})

// GOOD: Error handling without data leakage
catch (error) {
  console.error('Operation failed:', error) // Development only
  return { error: 'Something went wrong' } // User-facing
}
```

---

## 📊 PERFORMANCE INTELLIGENCE

### **OPTIMIZATION DISCOVERIES**
```typescript
// CRITICAL: Bundle size impact
Component Size Analysis:
- ProductQuickView: 45KB (too large)
- Header: 23KB (mobile nav can be split)  
- CartSidebar: 18KB (acceptable)

// CRITICAL: API call optimization
Sequential calls (slow):
addItem() -> fetchCart() = 600ms total

Parallel possible:
addItem() with optimistic update = 300ms perceived

// CRITICAL: Image optimization settings
next.config.js optimization:
- formats: ['image/webp', 'image/avif'] 
- domains: ['cdn.sanity.io', 'medusa-images.s3.amazonaws.com']
- deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
```

### **MOBILE PERFORMANCE INSIGHTS**
```typescript
// DISCOVERY: Touch target minimum 44px (Apple HIG)
<Button className="min-h-[44px] min-w-[44px]">

// DISCOVERY: Viewport units cause issues on mobile Safari
// height: 100vh (problematic)
// height: 100dvh (better - dynamic viewport height)

// DISCOVERY: Intersection Observer for lazy loading
const useIntersectionObserver = (threshold = 0.1) => {
  // Lazy load images below the fold
  // Significant performance improvement on mobile
}
```

---

## 🎨 UI/UX INTELLIGENCE

### **DESIGN SYSTEM INSIGHTS**
```css
/* EXCELLENT: CSS custom properties for theming */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --subtle-text-color: hsl(var(--muted-foreground));
}

/* EXCELLENT: Consistent spacing scale */
.section-padding { @apply py-12 px-4 sm:px-6 lg:px-8; }
.strike-container { @apply max-w-7xl mx-auto; }

/* EXCELLENT: Mobile-first responsive design */
.product-card {
  @apply w-full sm:w-1/2 md:w-1/3 lg:w-1/4;
}
```

### **ACCESSIBILITY DISCOVERIES**
```typescript
// CRITICAL: Dialog accessibility requirements
<DialogContent>
  <VisuallyHidden>
    <DialogTitle>Product Quick View</DialogTitle>
  </VisuallyHidden>
  {/* Content */}
</DialogContent>

// CRITICAL: Image alt text patterns
// BAD: alt="product image"
// GOOD: alt={`${product.name} - ${product.color} - View ${currentImageIndex + 1} of ${images.length}`}

// CRITICAL: Focus management
const [isOpen, setIsOpen] = useState(false)
useEffect(() => {
  if (isOpen) {
    document.getElementById('dialog-content')?.focus()
  }
}, [isOpen])
```

---

## 💾 DATA PATTERNS

### **INTEGRATION PATTERNS**
```typescript
// EXCELLENT: Unified product interface
interface IntegratedProduct {
  // Sanity fields
  content: {
    title: string
    description: string
    images: SanityImage[]
  }
  
  // Medusa fields  
  commerce: {
    id: string
    variants: MedusaVariant[]
    prices: MedusaPrice[]
    inventory: number
  }
}

// EXCELLENT: Fallback strategies
const getProductData = async (slug: string) => {
  try {
    // Try Medusa first (authoritative for commerce)
    const medusaProduct = await medusaClient.getProduct(slug)
    
    // Enrich with Sanity content
    const sanityContent = await sanityClient.getProduct(slug)
    
    return mergeProductData(medusaProduct, sanityContent)
  } catch (error) {
    // Fallback to Sanity only
    return await sanityClient.getProduct(slug)
  }
}
```

### **CACHING STRATEGIES**
```typescript
// DISCOVERY: Next.js caching patterns
export const revalidate = 3600 // 1 hour for product pages
export const dynamic = 'force-static' // For category pages

// DISCOVERY: Client-side caching with SWR pattern
const { data, error } = useSWR(
  `/api/products/${slug}`,
  fetcher,
  { 
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 300000 // 5 minutes
  }
)
```

---

## 🧪 TESTING INTELLIGENCE

### **TESTING STRATEGIES LEARNED**
```typescript
// PATTERN: Test cart operations with MSW
import { rest } from 'msw'

const handlers = [
  rest.post('/store/carts', (req, res, ctx) => {
    return res(ctx.json({ cart: mockCart }))
  })
]

// PATTERN: Component testing with React Testing Library
test('ProductCard displays product information', () => {
  render(<ProductCard product={mockProduct} />)
  
  expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /add to cart/i })).toBeEnabled()
})

// PATTERN: E2E testing critical paths
test('Complete checkout flow', async ({ page }) => {
  await page.goto('/product/test-product')
  await page.click('[data-testid="add-to-cart"]')
  await page.click('[data-testid="cart-trigger"]')
  await page.click('[data-testid="checkout-button"]')
  // Verify order completion
})
```

---

## 🔄 REFACTORING INTELLIGENCE

### **SUCCESSFUL REFACTORING PATTERNS**
```typescript
// BEFORE: Large component (400+ lines)
const ProductQuickView = () => {
  // Massive component with multiple responsibilities
}

// AFTER: Focused components
const ProductQuickView = () => (
  <Dialog>
    <ProductImageGallery />
    <ProductDetails />
    <ProductActions />
  </Dialog>
)

// PATTERN: Extract custom hooks for reusability
const useProductActions = (product: Product) => {
  const addToCart = useCallback(() => {
    // Cart logic
  }, [product])
  
  const addToWishlist = useCallback(() => {
    // Wishlist logic  
  }, [product])
  
  return { addToCart, addToWishlist }
}
```

### **DEPENDENCY MANAGEMENT LEARNINGS**
```json
// LESSON: Pin exact versions for stability
{
  "dependencies": {
    "next": "14.2.15", // Not "^14.2.15"
    "@medusajs/medusa": "2.8.4", // Not "latest"
    "zustand": "4.5.4" // Exact versions prevent surprises
  }
}

// LESSON: Separate dev and production dependencies
{
  "devDependencies": {
    "@types/node": "20.19.0",
    "typescript": "5.8.3"
  }
}

// LESSON: Use pnpm for better dependency management
// Faster installs, better deduplication, stricter resolution
```

---

## 📚 FRAMEWORK-SPECIFIC INSIGHTS

### **NEXT.JS 14 DISCOVERIES**
```typescript
// DISCOVERY: App Router file conventions
app/
├── layout.tsx       // Root layout (always present)
├── page.tsx         // Homepage
├── loading.tsx      // Loading UI
├── error.tsx        // Error handling
├── not-found.tsx    // 404 pages
└── [category]/
    ├── page.tsx     // Dynamic route
    └── loading.tsx  // Nested loading

// DISCOVERY: Server vs Client components
// Server by default (better performance)
// Client only for interactivity
'use client' // Only when needed for hooks, events, state

// DISCOVERY: Metadata API
export const metadata: Metadata = {
  title: 'Strike Shop - Premium Fashion',
  description: 'Discover the latest trends...',
  openGraph: {
    title: 'Strike Shop',
    description: 'Premium fashion...',
    images: ['/og-image.jpg']
  }
}
```

### **MEDUSA FRAMEWORK INSIGHTS**
```typescript
// DISCOVERY: Medusa admin customization
// Admin at /app path, customizable
// Good for non-technical users
// API at /store and /admin endpoints

// DISCOVERY: Region-based pricing
// Products must be assigned to regions
// Prices vary by region/currency
// Tax calculations built-in

// DISCOVERY: Workflow engine
// Event-driven architecture
// Custom workflows possible
// Good for complex business logic
```

---

## 🚀 DEPLOYMENT INTELLIGENCE

### **PRODUCTION ENVIRONMENT DISCOVERIES**
```bash
# CRITICAL: Environment variable requirements
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.strike-shop.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_live_...
DATABASE_URL=postgresql://...
JWT_SECRET=<256-bit-random>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# DISCOVERY: Build optimization flags
ANALYZE=true npm run build # Bundle analysis
NEXT_PUBLIC_NODE_ENV=production # Production optimizations
```

### **MONITORING INSIGHTS**
```typescript
// PATTERN: Error tracking with Sentry
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1 // 10% sampling
})

// PATTERN: Performance monitoring
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Add to root layout for comprehensive monitoring
```

---

## 💡 INNOVATION OPPORTUNITIES

### **EMERGING PATTERNS TO EXPLORE**
1. **GraphQL Federation**: Unify Sanity + Medusa APIs
2. **Server Actions**: Simplify form handling in Next.js 14
3. **Partial Prerendering**: Hybrid static/dynamic rendering
4. **React Concurrent Features**: Suspense, Transitions
5. **Web Streams**: Optimized data loading

### **TECHNOLOGY EVALUATIONS**
- **Considered**: Shopify vs Medusa → Chose Medusa for control
- **Considered**: Redux vs Zustand → Chose Zustand for simplicity  
- **Considered**: Clerk vs Medusa Auth → Using both (complex)
- **Evaluating**: Sanity vs Strapi → Currently using Sanity

---

**KNOWLEDGE BASE VERSION**: v3.2.1
**LAST UPDATED**: $(date)
**CONTRIBUTORS**: Audit System, Manual Reviews, Code Analysis
**RETENTION POLICY**: PERMANENT - Never delete, only refine and expand