# Component Documentation

> **Comprehensive documentation for all components in the Strike Shop design system**

## 📋 Table of Contents

- [Component Library](./component-library.md) - Complete component catalog
- [UI Components](./ui-components.md) - Base UI primitives (shadcn/ui)
- [Business Components](./business-components.md) - E-commerce specific components
- [Hook Documentation](./hooks.md) - Custom React hooks
- [Utilities](./utilities.md) - Helper functions and utilities

## 🎯 Component Philosophy

Our component system is built on these principles:

### **1. Composition Over Configuration**
Components are designed to be composed together rather than configured with complex props.

```typescript
// ✅ GOOD: Composition pattern
<Card>
  <CardHeader>
    <CardTitle>Product Name</CardTitle>
    <CardDescription>Product description</CardDescription>
  </CardHeader>
  <CardContent>
    <ProductImage src={image} />
    <ProductPrice price={price} />
  </CardContent>
  <CardFooter>
    <AddToCartButton productId={id} />
  </CardFooter>
</Card>

// ❌ BAD: Heavy configuration
<ProductCard 
  title={title}
  description={description}
  image={image}
  price={price}
  showDescription={true}
  showAddToCart={true}
  cardStyle="elevated"
  buttonVariant="primary"
/>
```

### **2. Accessibility First**
All components include proper ARIA attributes, keyboard navigation, and screen reader support.

```typescript
export function Button({ children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      aria-describedby={props['aria-describedby']}
      {...props}
    >
      {children}
    </button>
  );
}
```

### **3. Performance Optimized**
Components are optimized for performance with proper memoization and lazy loading.

```typescript
// Memoized for performance
export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  // Component implementation
});

// Lazy loaded for large components
const AdminDashboard = lazy(() => import('./admin-dashboard'));
```

## 🏗️ Component Architecture

### **Component Hierarchy**

```
Components/
├── ui/                     # Base UI primitives (shadcn/ui)
│   ├── button.tsx         # Core button component
│   ├── input.tsx          # Form inputs
│   ├── dialog.tsx         # Modal dialogs
│   └── ...
├── layout/                # Layout components
│   ├── header.tsx         # Site header
│   ├── footer.tsx         # Site footer
│   ├── navigation.tsx     # Navigation menus
│   └── ...
├── features/              # Business logic components
│   ├── product/           # Product-related components
│   ├── cart/             # Shopping cart components
│   ├── auth/             # Authentication components
│   └── ...
├── forms/                 # Form components
│   ├── contact-form.tsx   # Contact form
│   ├── newsletter.tsx     # Newsletter signup
│   └── ...
└── shared/                # Shared utility components
    ├── loading.tsx        # Loading states
    ├── error.tsx          # Error boundaries
    └── ...
```

### **Component Types**

#### **Server Components** (Default)
Used for static content and initial data rendering:
```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  const products = await getProducts();
  
  return (
    <main>
      <ProductGrid products={products} />
    </main>
  );
}
```

#### **Client Components** (When Interactive)
Used for user interactions and browser APIs:
```typescript
'use client';

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  // Interactive logic
}
```

#### **Hybrid Components** (Composition)
Combine server and client components:
```typescript
// Server component wrapper
export function ProductDetails({ product }: { product: Product }) {
  return (
    <div>
      <ProductInfo product={product} /> {/* Server */}
      <AddToCartButton productId={product.id} /> {/* Client */}
    </div>
  );
}
```

## 📚 Component Catalog

### **UI Primitives (shadcn/ui)**

#### **Button**
```typescript
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Primary Button</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Minimal</Button>
<Button variant="link">Link Style</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🛒</Button>
```

#### **Input**
```typescript
import { Input } from '@/components/ui/input';

<Input 
  type="email" 
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### **Card**
```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Product Name</CardTitle>
    <CardDescription>Product description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### **Business Components**

#### **ProductCard**
```typescript
interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
}

<ProductCard 
  product={product}
  priority={true} // For above-the-fold products
  className="custom-styles"
/>
```

#### **CartSidebar**
```typescript
interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

<CartSidebar 
  isOpen={cartOpen}
  onClose={() => setCartOpen(false)}
/>
```

#### **SearchBar**
```typescript
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

<SearchBar 
  placeholder="Search products..."
  onSearch={handleSearch}
/>
```

## 🎨 Design System Integration

### **Design Tokens**
```typescript
// Consistent spacing
<div className="p-4 m-2 gap-6">
  // Uses design token spacing values
</div>

// Color system
<Button className="bg-primary text-primary-foreground">
  // Uses semantic color tokens
</Button>

// Typography scale
<h1 className="text-3xl font-bold">
  // Uses typography tokens
</h1>
```

### **Component Variants**
```typescript
// Using CVA (Class Variance Authority)
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## 🧪 Component Testing

### **Testing Strategy**
Each component should include:
1. **Unit tests** for component logic
2. **Integration tests** for user interactions
3. **Accessibility tests** for a11y compliance
4. **Visual regression tests** for UI consistency

```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../product-card';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    title: 'Test Product',
    price: 2999,
    image: { url: 'test.jpg', altText: 'Test' }
  };

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('handles add to cart click', () => {
    const onAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(onAddToCart).toHaveBeenCalledWith('1');
  });

  it('is accessible', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });
});
```

## 📱 Mobile Optimization

### **Touch Targets**
All interactive elements meet WCAG touch target requirements:
```typescript
export function TouchTarget({ children, onClick }: TouchTargetProps) {
  return (
    <button
      onClick={onClick}
      className="min-h-[44px] min-w-[44px] touch-manipulation"
    >
      {children}
    </button>
  );
}
```

### **Responsive Components**
```typescript
export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## 🔧 Development Guidelines

### **Component Creation Checklist**
- [ ] TypeScript interface with proper documentation
- [ ] Accessibility attributes (ARIA, semantic HTML)
- [ ] Responsive design implementation
- [ ] Error boundary handling
- [ ] Loading states where applicable
- [ ] Unit tests with good coverage
- [ ] Storybook story (if applicable)
- [ ] Documentation with examples

### **Naming Conventions**
- **Components**: PascalCase (`ProductCard`, `AddToCartButton`)
- **Props**: camelCase (`onClick`, `isLoading`, `productId`)
- **Files**: kebab-case (`product-card.tsx`, `add-to-cart-button.tsx`)
- **CSS Classes**: Tailwind utilities or kebab-case custom classes

### **Props Design**
```typescript
// ✅ GOOD: Clear, typed props
interface ProductCardProps {
  /** Product data from Shopify */
  product: Product;
  /** Whether to prioritize image loading */
  priority?: boolean;
  /** Callback when product is added to cart */
  onAddToCart?: (productId: string) => Promise<void>;
  /** Additional CSS classes */
  className?: string;
}

// ❌ BAD: Unclear or overly complex props
interface ProductCardProps {
  data: any;
  config: {
    showImage?: boolean;
    showPrice?: boolean;
    showButton?: boolean;
    imageSize?: 'sm' | 'md' | 'lg';
    buttonText?: string;
  };
}
```

## 📈 Performance Considerations

### **Bundle Size Optimization**
```typescript
// Use dynamic imports for large dependencies
const Chart = dynamic(() => import('recharts'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

// Tree-shake utilities
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';
```

### **Memoization**
```typescript
// Memoize expensive calculations
const ProductCard = memo(function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const formattedPrice = useMemo(() => 
    formatPrice(product.price), 
    [product.price]
  );

  const handleAddToCart = useCallback(() => 
    onAddToCart?.(product.id), 
    [onAddToCart, product.id]
  );

  return (
    // Component JSX
  );
});
```

### **Image Optimization**
```typescript
export function ProductImage({ src, alt, priority = false }: ProductImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={400}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
      className="object-cover rounded-lg"
    />
  );
}
```

## 🔗 Component Dependencies

### **Internal Dependencies**
```typescript
// UI components depend on design system
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

// Business components depend on stores and APIs
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
```

### **External Dependencies**
- **@radix-ui/react-*** - Accessible UI primitives
- **class-variance-authority** - Component variant management
- **tailwind-merge** - Utility class merging
- **lucide-react** - Icon library

---

## 📖 Usage Examples

### **Basic Product Listing**
```typescript
export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            priority={false}
          />
        ))}
      </div>
    </div>
  );
}
```

### **Shopping Cart Implementation**
```typescript
'use client';

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, updateQuantity, removeItem } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>
          
          <div className="border-t pt-4">
            <CheckoutButton items={items} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

*This component documentation serves as the definitive reference for using and maintaining components in the Strike Shop codebase.*

**Last Updated**: 2024-12-30  
**Next Review**: 2025-01-07