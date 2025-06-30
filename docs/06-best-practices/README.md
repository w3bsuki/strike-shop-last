# Best Practices & Standards

> **Comprehensive coding standards, guidelines, and best practices for the Strike Shop codebase**

## 📋 Table of Contents

- [Code Standards](./code-standards.md) - TypeScript, React, and general coding standards
- [Performance Guidelines](./performance.md) - Performance optimization practices
- [Security Standards](./security.md) - Security implementation guidelines
- [Accessibility](./accessibility.md) - Accessibility compliance and best practices
- [Mobile Optimization](./mobile.md) - Mobile-first development guidelines

## 🎯 Philosophy

Our best practices are designed around these core principles:

### **1. Developer Experience**
- **Predictable patterns** that reduce cognitive load
- **Clear conventions** that eliminate decision fatigue
- **Comprehensive tooling** that catches errors early
- **Documentation-driven** development for long-term maintainability

### **2. User Experience**
- **Performance-first** approach to all decisions
- **Accessibility-inclusive** design from the start
- **Mobile-optimized** as the primary experience
- **Progressive enhancement** for advanced features

### **3. Code Quality**
- **Type safety** throughout the application
- **Testable architecture** with clear separation of concerns
- **Maintainable code** that's easy to understand and modify
- **Security-conscious** development practices

## 🛠️ Code Standards Overview

### **TypeScript Standards**

```typescript
// ✅ GOOD: Explicit types and proper naming
interface ProductCardProps {
  product: Product;
  priority?: boolean;
  onAddToCart?: (productId: string) => Promise<void>;
}

export function ProductCard({ 
  product, 
  priority = false, 
  onAddToCart 
}: ProductCardProps): JSX.Element {
  // Implementation
}

// ❌ BAD: Any types and unclear naming
function Card({ data, flag, cb }: any) {
  // Implementation
}
```

### **React Component Standards**

```typescript
// ✅ GOOD: Server Component with clear data fetching
export default async function ProductsPage({
  searchParams
}: {
  searchParams: { category?: string; sort?: string }
}) {
  const products = await getProducts({
    category: searchParams.category,
    sortBy: searchParams.sort || 'newest'
  });

  return (
    <main className="container mx-auto py-8">
      <ProductGrid products={products} />
    </main>
  );
}

// ✅ GOOD: Client Component with proper error handling
'use client';

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await addItem({ productId, quantity: 1 });
    } catch (error) {
      toast.error('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleAddToCart} disabled={loading}>
      {loading ? 'Adding...' : 'Add to Cart'}
    </Button>
  );
}
```

### **File Organization Standards**

```
components/
├── ui/                     # Base UI components (shadcn/ui)
│   ├── button.tsx         # Single responsibility
│   ├── input.tsx          # Consistent naming
│   └── index.ts           # Barrel exports
├── features/              # Feature-specific components
│   ├── product/           # Grouped by domain
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   └── index.ts
│   └── cart/
│       ├── cart-sidebar.tsx
│       ├── cart-item.tsx
│       └── index.ts
└── layout/                # Layout components
    ├── header.tsx
    ├── footer.tsx
    └── navigation.tsx
```

## ⚡ Performance Best Practices

### **Bundle Optimization**

```typescript
// ✅ GOOD: Dynamic imports for large dependencies
const Chart = dynamic(() => import('recharts'), {
  ssr: false,
  loading: () => <ChartSkeleton />
});

// ✅ GOOD: Tree-shaking friendly imports
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';

// ❌ BAD: Full library imports
import * as React from 'react';
import _ from 'lodash';
```

### **Image Optimization**

```typescript
// ✅ GOOD: Optimized images with proper sizing
import Image from 'next/image';

<Image
  src={product.image.url}
  alt={product.image.altText}
  width={400}
  height={400}
  priority={priority}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
  className="object-cover rounded-lg"
/>

// ❌ BAD: Unoptimized images
<img src={product.image.url} alt={product.image.altText} />
```

### **Data Fetching Patterns**

```typescript
// ✅ GOOD: Server-side data fetching with proper caching
export async function getProducts(filters: ProductFilters) {
  const response = await fetch(`${API_URL}/products`, {
    next: { 
      revalidate: 3600, // 1 hour cache
      tags: ['products'] 
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  
  return response.json();
}

// ✅ GOOD: Client-side data fetching with proper loading states
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });
}
```

## 🔒 Security Best Practices

### **Input Validation**

```typescript
// ✅ GOOD: Runtime validation with Zod
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100)
});

export async function createUser(data: unknown) {
  const validatedData = CreateUserSchema.parse(data);
  // Safe to use validatedData
}

// ❌ BAD: No validation
export async function createUser(data: any) {
  // Unsafe - data could be anything
}
```

### **API Security**

```typescript
// ✅ GOOD: Proper authentication and rate limiting
import { rateLimit } from '@/lib/rate-limit';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: Request) {
  // Rate limiting
  const { success } = await rateLimit(request);
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }

  // Authentication
  const user = await verifyAuth(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Input validation
  const body = await request.json();
  const validatedData = CreateOrderSchema.parse(body);
  
  // Process request
}
```

## ♿ Accessibility Best Practices

### **Semantic HTML**

```typescript
// ✅ GOOD: Semantic HTML with proper ARIA
export function ProductCard({ product }: ProductCardProps) {
  return (
    <article 
      className="border rounded-lg p-4"
      aria-labelledby={`product-title-${product.id}`}
    >
      <header>
        <h3 id={`product-title-${product.id}`}>
          {product.title}
        </h3>
        <p aria-label={`Price: ${formatPrice(product.price)}`}>
          {formatPrice(product.price)}
        </p>
      </header>
      
      <img 
        src={product.image.url}
        alt={product.image.altText || `Image of ${product.title}`}
        loading="lazy"
      />
      
      <footer>
        <Button
          aria-describedby={`product-title-${product.id}`}
          onClick={() => addToCart(product.id)}
        >
          Add to Cart
        </Button>
      </footer>
    </article>
  );
}

// ❌ BAD: Generic divs without semantic meaning
export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <div>{product.title}</div>
      <div>{product.price}</div>
      <img src={product.image.url} />
      <div onClick={() => addToCart(product.id)}>Add to Cart</div>
    </div>
  );
}
```

### **Keyboard Navigation**

```typescript
// ✅ GOOD: Proper keyboard navigation
export function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus management
      modalRef.current?.focus();
      
      // Escape key handling
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="fixed inset-0 z-50"
    >
      {children}
    </div>
  );
}
```

## 📱 Mobile-First Best Practices

### **Responsive Design**

```css
/* ✅ GOOD: Mobile-first responsive design */
.product-grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: single column */
  gap: 1rem;
}

@media (min-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet: two columns */
  }
}

@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr); /* Desktop: three columns */
  }
}

/* ❌ BAD: Desktop-first approach */
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### **Touch Optimization**

```typescript
// ✅ GOOD: Touch-optimized components
export function TouchTarget({ 
  children, 
  onClick, 
  className 
}: TouchTargetProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "min-h-[44px] min-w-[44px]", // WCAG touch target size
        "touch-manipulation", // Prevent double-tap zoom
        "select-none", // Prevent text selection
        className
      )}
      type="button"
    >
      {children}
    </button>
  );
}

// ✅ GOOD: Haptic feedback for mobile
export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  return { triggerHaptic };
}
```

## 🧪 Testing Best Practices

### **Component Testing**

```typescript
// ✅ GOOD: Comprehensive component testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ProductCard } from '../product-card';

const mockProduct = {
  id: 'product-1',
  title: 'Test Product',
  price: 29.99,
  image: { url: 'test.jpg', altText: 'Test' },
  available: true
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('handles add to cart interaction', async () => {
    const onAddToCart = vi.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(onAddToCart).toHaveBeenCalledWith('product-1');
    });
  });

  it('is accessible via keyboard', () => {
    render(<ProductCard product={mockProduct} />);
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    addButton.focus();
    
    expect(addButton).toHaveFocus();
    
    fireEvent.keyDown(addButton, { key: 'Enter' });
    // Assert expected behavior
  });
});
```

### **API Testing**

```typescript
// ✅ GOOD: API route testing
import { createMocks } from 'node-mocks-http';
import { POST } from '../route';

describe('/api/cart/add', () => {
  it('adds item to cart successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 1
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cart).toBeDefined();
  });

  it('validates request body', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {} // Invalid body
    });

    const response = await POST(req);
    
    expect(response.status).toBe(400);
  });
});
```

## 📚 Documentation Standards

### **Component Documentation**

```typescript
/**
 * ProductCard component for displaying product information with add-to-cart functionality.
 * 
 * @example
 * ```tsx
 * <ProductCard 
 *   product={product}
 *   priority={true}
 *   onAddToCart={handleAddToCart}
 * />
 * ```
 */
export interface ProductCardProps {
  /** Product data from Shopify API */
  product: Product;
  /** Whether to prioritize image loading for above-the-fold content */
  priority?: boolean;
  /** Callback fired when add-to-cart button is clicked */
  onAddToCart?: (productId: string) => Promise<void>;
  /** Additional CSS classes for styling */
  className?: string;
}

export function ProductCard({
  product,
  priority = false,
  onAddToCart,
  className
}: ProductCardProps) {
  // Implementation with proper JSDoc comments for complex logic
}
```

### **Function Documentation**

```typescript
/**
 * Formats a price value for display with proper currency formatting.
 * 
 * @param price - The price in cents
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted price string (e.g., '$29.99')
 * 
 * @example
 * ```typescript
 * formatPrice(2999) // '$29.99'
 * formatPrice(1000, 'EUR') // '€10.00'
 * ```
 */
export function formatPrice(
  price: number, 
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(price / 100);
}
```

## 🔧 Development Workflow

### **Git Commit Standards**

```bash
# ✅ GOOD: Conventional commits
feat(cart): add optimistic updates for cart operations
fix(mobile): resolve touch event conflicts on product cards
docs(api): update Shopify integration documentation
refactor(components): consolidate duplicate product card variants
test(cart): add comprehensive cart store tests

# ❌ BAD: Unclear commit messages
update stuff
fix bug
wip
```

### **Branch Naming**

```bash
# ✅ GOOD: Descriptive branch names
feature/cart-optimization
fix/mobile-touch-events
refactor/component-architecture
docs/api-documentation

# ❌ BAD: Unclear branch names
branch1
fix
update
```

## 📊 Code Quality Metrics

### **Target Metrics**
- **TypeScript Coverage**: 100% (no `any` types)
- **Test Coverage**: 90%+ for critical paths
- **Bundle Size**: <600KB total
- **Lighthouse Performance**: >90
- **ESLint Issues**: 0 errors, minimal warnings
- **Accessibility**: WCAG 2.1 AA compliance

### **Quality Gates**
- All builds must pass TypeScript compilation
- No critical security vulnerabilities
- All tests must pass before merge
- Performance budgets must be met
- Accessibility tests must pass

---

## 🎯 Enforcement

These best practices are enforced through:

1. **Automated Tooling**
   - ESLint and TypeScript for code quality
   - Prettier for consistent formatting
   - Husky for pre-commit hooks
   - GitHub Actions for CI/CD

2. **Code Reviews**
   - Mandatory peer review for all changes
   - Architecture review for significant changes
   - Performance review for optimization PRs
   - Accessibility review for UI changes

3. **Documentation**
   - Style guide in repository
   - Component documentation requirements
   - API documentation standards
   - Architecture decision records

---

*These best practices are living documents that evolve with the codebase. All team members should contribute to their improvement.*

**Last Updated**: 2024-12-30  
**Next Review**: 2025-01-15