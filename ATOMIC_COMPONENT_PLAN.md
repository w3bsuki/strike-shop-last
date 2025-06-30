# 🧬 Atomic Component Architecture Plan - Strike Shop

## Overview

This document outlines a comprehensive atomic component architecture for Strike Shop, building on the existing ShadCN/UI foundation. The goal is to create maximum reusability, performance, and maintainability while preserving the existing compound component patterns and Strike Shop's unique design language.

## 🏗️ Architecture Principles

### Core Tenets
1. **Atomic Design Methodology** - Brad Frost's 5-level system
2. **Composition over Inheritance** - Favor compound components
3. **Accessibility First** - WCAG 2.1 AA compliance by default
4. **Performance Optimized** - Code splitting and lazy loading
5. **TypeScript Native** - Type safety throughout
6. **Testing Integrated** - Every component has tests
7. **Strike Shop Identity** - Custom variants preserve brand

### Design Tokens Foundation
```typescript
// design-tokens.ts
export const tokens = {
  // Spacing (already in Tailwind)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    xxl: '3rem',      // 48px
  },
  
  // Touch targets
  touchTarget: {
    min: '44px',      // iOS minimum
    preferred: '48px', // Android preferred
    comfortable: '52px' // Large screens
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      typewriter: ['Courier New', 'monospace'], // Strike Shop brand
    }
  },
  
  // Animations
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms'
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
} as const;
```

---

## 🔬 Level 1: Atoms (Basic UI Elements)

### Existing Atoms (ShadCN/UI Extended)
- ✅ **Button** - Enhanced with Strike variants
- ✅ **Input** - Text inputs with validation states
- ✅ **Label** - Form labels with error states
- ✅ **Badge** - Status indicators
- ✅ **Separator** - Visual dividers
- ✅ **Switch** - Toggle controls
- ✅ **Checkbox** - Selection controls
- ✅ **Radio Group** - Single selection
- ✅ **Progress** - Loading indicators

### New Atoms to Create

#### 1. **Icon Atom**
```typescript
// components/ui/icon.tsx
interface IconProps {
  name: keyof typeof icons;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'muted' | 'danger' | 'success';
  className?: string;
}

export const Icon = ({ name, size = 'md', color = 'primary', className }: IconProps) => {
  const Component = icons[name];
  return (
    <Component 
      className={cn(iconVariants({ size, color }), className)}
      aria-hidden={true}
    />
  );
};
```

#### 2. **Typography Atoms**
```typescript
// components/ui/typography.tsx
export const Heading = ({ level, children, ...props }: HeadingProps) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  return <Component className={cn(headingVariants({ level }))} {...props}>{children}</Component>;
};

export const Text = ({ variant, children, ...props }: TextProps) => (
  <p className={cn(textVariants({ variant }))} {...props}>{children}</p>
);

export const Link = ({ href, children, ...props }: LinkProps) => (
  <NextLink href={href} className={cn(linkVariants())} {...props}>{children}</NextLink>
);
```

#### 3. **Image Atom**
```typescript
// components/ui/image.tsx
export const Image = ({ src, alt, priority = false, ...props }: ImageProps) => (
  <NextImage
    src={src}
    alt={alt}
    priority={priority}
    className={cn(imageVariants({ aspectRatio: props.aspectRatio }))}
    {...props}
  />
);
```

#### 4. **Strike Shop Specific Atoms**
```typescript
// components/ui/price.tsx
export const Price = ({ amount, currency = 'USD', variant = 'default' }: PriceProps) => (
  <span className={cn(priceVariants({ variant }))} aria-label={`Price: ${formatPrice(amount, currency)}`}>
    {formatPrice(amount, currency)}
  </span>
);

// components/ui/rating.tsx
export const Rating = ({ value, max = 5, showValue = true }: RatingProps) => (
  <div className="flex items-center gap-1" role="img" aria-label={`${value} out of ${max} stars`}>
    {Array.from({ length: max }, (_, i) => (
      <Star 
        key={i} 
        className={cn('h-4 w-4', i < value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')}
      />
    ))}
    {showValue && <span className="ml-1 text-sm text-muted-foreground">({value})</span>}
  </div>
);
```

---

## 🧪 Level 2: Molecules (Simple Combinations)

### Existing Molecules (To Enhance)
- ✅ **Form Fields** - Input + Label + Error
- ✅ **Loading Skeleton** - Placeholder components
- ✅ **Error Message** - Error display component

### New Molecules to Create

#### 1. **Form Field Molecule**
```typescript
// components/ui/form-field.tsx
export const FormField = ({ 
  label, 
  error, 
  required = false, 
  children, 
  ...props 
}: FormFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={props.id} className={cn(required && 'after:content-["*"] after:text-red-500')}>
      {label}
    </Label>
    {children}
    {error && <ErrorMessage message={error} />}
  </div>
);
```

#### 2. **Search Input Molecule**
```typescript
// components/ui/search-input.tsx
export const SearchInput = ({ onSearch, placeholder = "Search...", ...props }: SearchInputProps) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      type="search"
      placeholder={placeholder}
      className="pl-10"
      onChange={(e) => onSearch(e.target.value)}
      {...props}
    />
  </div>
);
```

#### 3. **Quantity Selector Molecule**
```typescript
// components/ui/quantity-selector.tsx
export const QuantitySelector = ({ value, onChange, min = 1, max = 99 }: QuantitySelectorProps) => (
  <div className="flex items-center border rounded-md">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      aria-label="Decrease quantity"
    >
      <Minus className="h-4 w-4" />
    </Button>
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value) || min)}
      className="w-16 text-center border-0 focus-visible:ring-0"
      min={min}
      max={max}
      aria-label="Quantity"
    />
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      aria-label="Increase quantity"
    >
      <Plus className="h-4 w-4" />
    </Button>
  </div>
);
```

#### 4. **Product Badge Molecule**
```typescript
// components/ui/product-badge.tsx
export const ProductBadge = ({ type, children, ...props }: ProductBadgeProps) => (
  <Badge variant={getBadgeVariant(type)} className={cn(productBadgeVariants({ type }))} {...props}>
    {children}
  </Badge>
);
```

#### 5. **Filter Chip Molecule**
```typescript
// components/ui/filter-chip.tsx
export const FilterChip = ({ label, active, onToggle, onRemove }: FilterChipProps) => (
  <div className={cn(filterChipVariants({ active }))}>
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="h-auto p-2"
    >
      {label}
    </Button>
    {active && (
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-6 w-6 p-0 ml-1"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </Button>
    )}
  </div>
);
```

---

## 🦠 Level 3: Organisms (Complex Components)

### Existing Organisms (To Enhance)
- ✅ **Product Card** - Already using compound pattern
- ✅ **Navigation Menu** - Complex navigation
- ✅ **Sidebar** - Collapsible navigation

### New Organisms to Create

#### 1. **Product Grid Organism**
```typescript
// components/organisms/product-grid.tsx
export const ProductGrid = ({ 
  products, 
  columns = { sm: 2, md: 3, lg: 4 }, 
  loading = false,
  onLoadMore,
  hasMore = false
}: ProductGridProps) => (
  <div className="space-y-6">
    <div className={cn(
      'grid gap-6',
      `grid-cols-${columns.sm}`,
      `md:grid-cols-${columns.md}`,
      `lg:grid-cols-${columns.lg}`
    )}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
      {loading && Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
    
    {hasMore && (
      <div className="flex justify-center">
        <Button onClick={onLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </Button>
      </div>
    )}
  </div>
);
```

#### 2. **Shopping Cart Organism**
```typescript
// components/organisms/shopping-cart.tsx
export const ShoppingCart = ({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout 
}: ShoppingCartProps) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Heading level={2}>Shopping Cart</Heading>
      <Badge variant="secondary">{items.length} items</Badge>
    </div>
    
    <div className="space-y-4">
      {items.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemoveItem}
        />
      ))}
    </div>
    
    <CartSummary items={items} />
    
    <Button 
      onClick={onCheckout} 
      className="w-full" 
      variant="strike"
      disabled={items.length === 0}
    >
      Proceed to Checkout
    </Button>
  </div>
);
```

#### 3. **Product Filter Organism**
```typescript
// components/organisms/product-filter.tsx
export const ProductFilter = ({ 
  filters, 
  activeFilters, 
  onFilterChange,
  onClearAll 
}: ProductFilterProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Heading level={3}>Filters</Heading>
      {activeFilters.length > 0 && (
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          Clear All
        </Button>
      )}
    </div>
    
    {/* Active Filters */}
    {activeFilters.length > 0 && (
      <div className="space-y-2">
        <Text variant="sm" className="font-medium">Active Filters:</Text>
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              active={true}
              onRemove={() => onFilterChange(filter.id, false)}
            />
          ))}
        </div>
      </div>
    )}
    
    {/* Filter Groups */}
    <Accordion type="multiple" className="w-full">
      {filters.map((group) => (
        <AccordionItem key={group.id} value={group.id}>
          <AccordionTrigger>{group.label}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {group.options.map((option) => (
                <FilterOption
                  key={option.id}
                  option={option}
                  selected={activeFilters.some(f => f.id === option.id)}
                  onToggle={(selected) => onFilterChange(option.id, selected)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);
```

#### 4. **Checkout Form Organism**
```typescript
// components/organisms/checkout-form.tsx
export const CheckoutForm = ({ onSubmit, loading = false }: CheckoutFormProps) => {
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema)
  });
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Customer Information */}
      <div className="space-y-4">
        <Heading level={3}>Customer Information</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="First Name" required>
            <Input {...form.register('firstName')} />
          </FormField>
          <FormField label="Last Name" required>
            <Input {...form.register('lastName')} />
          </FormField>
        </div>
        <FormField label="Email" required>
          <Input type="email" {...form.register('email')} />
        </FormField>
      </div>
      
      {/* Shipping Address */}
      <AddressSection 
        title="Shipping Address"
        form={form}
        prefix="shipping"
      />
      
      {/* Payment Method */}
      <PaymentSection form={form} />
      
      {/* Order Summary */}
      <OrderSummary />
      
      <Button 
        type="submit" 
        className="w-full" 
        variant="strike"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Complete Order'}
      </Button>
    </form>
  );
};
```

---

## 📄 Level 4: Templates (Page Layouts)

### Layout Templates to Create

#### 1. **Main Layout Template**
```typescript
// components/templates/main-layout.tsx
export const MainLayout = ({ 
  children, 
  headerVariant = 'default',
  showFooter = true,
  showSidebar = false 
}: MainLayoutProps) => (
  <div className="min-h-screen flex flex-col">
    <Header variant={headerVariant} />
    
    <main className="flex-1 flex">
      {showSidebar && <Sidebar />}
      <div className="flex-1 container mx-auto px-4 py-6">
        {children}
      </div>
    </main>
    
    {showFooter && <Footer />}
  </div>
);
```

#### 2. **Product Listing Template**
```typescript
// components/templates/product-listing-template.tsx
export const ProductListingTemplate = ({ 
  title, 
  products, 
  filters,
  sorting,
  pagination,
  showFilters = true 
}: ProductListingTemplateProps) => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Heading level={1}>{title}</Heading>
      <ProductSorting 
        options={sorting.options}
        value={sorting.current}
        onChange={sorting.onChange}
      />
    </div>
    
    {/* Content */}
    <div className="flex gap-6">
      {showFilters && (
        <aside className="w-64 shrink-0">
          <ProductFilter {...filters} />
        </aside>
      )}
      
      <div className="flex-1">
        <ProductGrid products={products} />
        <Pagination {...pagination} />
      </div>
    </div>
  </div>
);
```

#### 3. **Product Detail Template**
```typescript
// components/templates/product-detail-template.tsx
export const ProductDetailTemplate = ({ 
  product, 
  relatedProducts,
  reviews 
}: ProductDetailTemplateProps) => (
  <div className="space-y-8">
    {/* Breadcrumbs */}
    <Breadcrumb items={getBreadcrumbItems(product)} />
    
    {/* Product Details */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ProductGallery images={product.images} />
      <ProductInfo product={product} />
    </div>
    
    {/* Product Description */}
    <ProductDescription description={product.description} />
    
    {/* Reviews */}
    <ProductReviews reviews={reviews} />
    
    {/* Related Products */}
    <RelatedProducts products={relatedProducts} />
  </div>
);
```

#### 4. **Checkout Template**
```typescript
// components/templates/checkout-template.tsx
export const CheckoutTemplate = ({ 
  cartItems, 
  onUpdateCart, 
  onCheckout 
}: CheckoutTemplateProps) => (
  <div className="max-w-6xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Checkout Form */}
      <div>
        <Heading level={1} className="mb-6">Checkout</Heading>
        <CheckoutForm onSubmit={onCheckout} />
      </div>
      
      {/* Order Summary */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <Heading level={2} className="mb-4">Order Summary</Heading>
        <CheckoutOrderSummary 
          items={cartItems}
          onUpdateCart={onUpdateCart}
        />
      </div>
    </div>
  </div>
);
```

---

## 📱 Level 5: Pages (Complete Compositions)

### Page Components to Create

#### 1. **Home Page**
```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <FeaturedProducts />
      <CategoryGrid />
      <NewsletterSignup />
    </MainLayout>
  );
}
```

#### 2. **Product Listing Page**
```typescript
// app/products/page.tsx
export default function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { products, filters, sorting, pagination } = useProductListing(searchParams);
  
  return (
    <MainLayout>
      <ProductListingTemplate
        title="All Products"
        products={products}
        filters={filters}
        sorting={sorting}
        pagination={pagination}
      />
    </MainLayout>
  );
}
```

#### 3. **Product Detail Page**
```typescript
// app/products/[handle]/page.tsx
export default function ProductPage({ params }: { params: { handle: string } }) {
  const { product, relatedProducts, reviews } = useProductDetail(params.handle);
  
  if (!product) {
    return <ProductNotFound />;
  }
  
  return (
    <MainLayout>
      <ProductDetailTemplate
        product={product}
        relatedProducts={relatedProducts}
        reviews={reviews}
      />
    </MainLayout>
  );
}
```

---

## 🎨 ShadCN/UI Integration Strategy

### Components to Use As-Is
- **Radix UI Primitives** - Dialog, Popover, Tooltip, etc.
- **Form Controls** - Input, Select, Checkbox, etc.
- **Feedback** - Toast, Alert, Progress
- **Layout** - Separator, Aspect Ratio, Scroll Area

### Components to Customize
- **Button** - Add Strike Shop variants ✅ (Already done)
- **Badge** - Add product-specific variants
- **Card** - Add product card variants
- **Sheet** - Add cart drawer variant

### Custom Components to Add
- **Price Display** - Formatted pricing with currency
- **Rating** - Star ratings with accessibility
- **Product Badge** - Sale, new, featured indicators
- **Quantity Selector** - Stepper component
- **Filter Chip** - Removable filter tags

### Extension Patterns
```typescript
// Extend existing ShadCN components
const strikeButtonVariants = cva(
  buttonVariants.base,
  {
    variants: {
      ...buttonVariants.variants,
      variant: {
        ...buttonVariants.variants.variant,
        strike: 'bg-primary text-primary-foreground hover:bg-primary/90 font-typewriter font-bold text-xs uppercase tracking-wider',
        'strike-outline': 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground font-typewriter font-bold text-xs uppercase tracking-wider'
      }
    }
  }
);
```

---

## 🔧 Component Composition Patterns

### 1. Compound Components (Already Implemented)
```typescript
// ✅ Current pattern for Product
<Product.Root product={product}>
  <Product.Image />
  <Product.Badge />
  <Product.Actions />
  <Product.Link>
    <Product.Content />
  </Product.Link>
</Product.Root>
```

### 2. Render Props Pattern
```typescript
// For flexible data rendering
<DataProvider>
  {({ data, loading, error }) => (
    <div>
      {loading && <LoadingSkeleton />}
      {error && <ErrorMessage error={error} />}
      {data && <ProductGrid products={data} />}
    </div>
  )}
</DataProvider>
```

### 3. Hook-Based Logic
```typescript
// Custom hooks for component logic
export const useProductActions = (product: Product) => {
  const { addToCart } = useCart();
  const { addToWishlist } = useWishlist();
  
  return {
    handleAddToCart: () => addToCart(product),
    handleAddToWishlist: () => addToWishlist(product),
    // ... more actions
  };
};
```

### 4. Server vs Client Components
```typescript
// Server Components (default)
export default async function ProductGrid({ category }: { category: string }) {
  const products = await getProducts(category);
  return <ProductList products={products} />;
}

// Client Components (interactive)
'use client';
export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  return <Button onClick={() => addToCart(product)}>Add to Cart</Button>;
}
```

---

## 🛒 Shopify-Specific Components

### Product Components
- **ProductCard** - Main product display ✅
- **ProductGallery** - Image carousel with zoom
- **ProductVariantSelector** - Size, color, etc.
- **ProductReviews** - Customer reviews display
- **RelatedProducts** - Cross-selling component

### Cart Components
- **CartDrawer** - Slide-out cart
- **CartItem** - Individual cart item
- **CartSummary** - Totals and checkout
- **MiniCart** - Header cart icon with count

### Checkout Components
- **CheckoutForm** - Multi-step checkout
- **ShippingCalculator** - Shipping options
- **PaymentForm** - Stripe integration
- **OrderSummary** - Final order review

### Customer Components
- **LoginForm** - Customer authentication
- **AddressBook** - Saved addresses
- **OrderHistory** - Past orders
- **WishlistButton** - Save for later

### Inventory Components
- **StockIndicator** - In stock / out of stock
- **InventoryBar** - Stock level visualization
- **BackInStockNotification** - Email signup
- **PriceComparison** - Sale price vs regular

---

## ⚡ Performance Optimization

### Code Splitting Strategies
```typescript
// Lazy load heavy components
const ProductGallery = lazy(() => import('./product-gallery'));
const CheckoutForm = lazy(() => import('./checkout-form'));

// Route-based splitting (automatic with Next.js app router)
// Page-level components are automatically split
```

### Memoization Patterns
```typescript
// Memo for expensive renders
export const ProductCard = memo(({ product }: ProductCardProps) => {
  return (
    <Product.Root product={product}>
      <Product.Image />
      <Product.Content />
    </Product.Root>
  );
});

// useMemo for expensive calculations
const sortedProducts = useMemo(() => 
  products.sort((a, b) => a.price - b.price),
  [products]
);

// useCallback for stable references
const handleAddToCart = useCallback((product: Product) => {
  addToCart(product);
}, [addToCart]);
```

### Bundle Size Optimization
```typescript
// Tree-shakeable utilities
export { cn } from './utils/cn';
export { formatPrice } from './utils/format-price';

// Avoid importing entire libraries
import { debounce } from 'lodash/debounce'; // ❌
import debounce from 'lodash.debounce';     // ✅
```

### Image Optimization
```typescript
// Next.js Image with proper sizing
<Image
  src={product.image}
  alt={product.title}
  width={400}
  height={400}
  priority={index < 2} // LCP optimization
  sizes="(max-width: 768px) 50vw, 25vw"
/>
```

---

## ♿ Accessibility & Standards

### WCAG 2.1 AA Compliance

#### Keyboard Navigation
```typescript
// All interactive elements support keyboard
<Button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }}
>
  Add to Cart
</Button>
```

#### Screen Reader Support
```typescript
// Proper ARIA labels and descriptions
<Button
  aria-label={`Add ${product.title} to cart`}
  aria-describedby={`price-${product.id}`}
>
  Add to Cart
</Button>
<div id={`price-${product.id}`} aria-live="polite">
  {formatPrice(product.price)}
</div>
```

#### Focus Management
```typescript
// Visible focus indicators
const focusClasses = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

// Skip links for keyboard users
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

#### Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Use tools like Stark or Colour Contrast Analyser

#### Touch Targets
```typescript
// Minimum 44x44px touch targets
const touchTargetClasses = 'min-h-[44px] min-w-[44px] touch-manipulation';
```

---

## 🧪 Testing Strategy

### Component Testing Approach
```typescript
// Jest + React Testing Library
describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
    expect(screen.getByText(formatPrice(mockProduct.price))).toBeInTheDocument();
    expect(screen.getByRole('img', { name: mockProduct.title })).toBeInTheDocument();
  });
  
  it('handles add to cart interaction', async () => {
    const user = userEvent.setup();
    const mockAddToCart = jest.fn();
    
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
    
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
```

### Accessibility Testing
```typescript
// jest-axe for automated a11y testing
import { axe, toHaveNoViolations } from 'jest-axe';

test('ProductCard has no accessibility violations', async () => {
  const { container } = render(<ProductCard product={mockProduct} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Visual Regression Testing
```typescript
// Playwright for visual testing
test('ProductCard visual regression', async ({ page }) => {
  await page.goto('/products/test-product');
  await expect(page.locator('[data-testid="product-card"]')).toHaveScreenshot();
});
```

### Performance Testing
```typescript
// Bundle size testing
import { analyzeBundle } from './test-utils';

test('ProductCard bundle size', () => {
  const bundleSize = analyzeBundle(['ProductCard']);
  expect(bundleSize).toBeLessThan(50); // KB
});
```

---

## 🔨 Developer Experience

### Component Documentation
```typescript
/**
 * ProductCard Component
 * 
 * Displays a product with image, title, price, and actions.
 * Supports compound component pattern for flexible composition.
 * 
 * @example
 * ```tsx
 * <ProductCard product={product} />
 * 
 * // Or with compound pattern
 * <Product.Root product={product}>
 *   <Product.Image />
 *   <Product.Content />
 *   <Product.Actions />
 * </Product.Root>
 * ```
 */
```

### Storybook Integration
```typescript
// ProductCard.stories.tsx
export default {
  title: 'Organisms/ProductCard',
  component: ProductCard,
  parameters: {
    docs: {
      description: {
        component: 'The main product display component with Strike Shop branding.'
      }
    }
  }
};

export const Default = {
  args: {
    product: mockProduct
  }
};

export const OnSale = {
  args: {
    product: { ...mockProduct, salePrice: 25.99 }
  }
};
```

### TypeScript Patterns
```typescript
// Consistent prop patterns
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

interface ProductCardProps extends BaseComponentProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  priority?: boolean;
}

// Variant props with CVA
interface ButtonProps extends 
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

### Development Tools
```typescript
// Component dev tools
export const ProductCard = process.env.NODE_ENV === 'development' 
  ? memo(ProductCardComponent)
  : ProductCardComponent;

// Debug props
if (process.env.NODE_ENV === 'development') {
  ProductCard.displayName = 'ProductCard';
}
```

---

## 📊 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Audit and enhance existing atoms
- [ ] Create missing typography atoms
- [ ] Implement design token system
- [ ] Set up testing infrastructure

### Phase 2: Molecules (Week 3-4)
- [ ] Form field molecules
- [ ] Search and filter molecules
- [ ] Product-specific molecules
- [ ] Cart-related molecules

### Phase 3: Organisms (Week 5-6)
- [ ] Enhanced product components
- [ ] Shopping cart organism
- [ ] Checkout form organism
- [ ] Product filter organism

### Phase 4: Templates (Week 7-8)
- [ ] Page layout templates
- [ ] Product listing template
- [ ] Product detail template
- [ ] Checkout template

### Phase 5: Integration (Week 9-10)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Component documentation
- [ ] Storybook setup

### Phase 6: Polish (Week 11-12)
- [ ] Visual regression testing
- [ ] Bundle size optimization
- [ ] Developer experience improvements
- [ ] Production deployment

---

## 🎯 Success Metrics

### Performance Targets
- **Bundle Size**: < 100KB for critical path
- **LCP**: < 2.5s for product pages
- **CLS**: < 0.1 for all pages
- **FID**: < 100ms for interactions

### Accessibility Targets
- **WCAG 2.1 AA**: 100% compliance
- **Keyboard Navigation**: All interactive elements
- **Screen Reader**: Proper ARIA labels
- **Color Contrast**: 4.5:1 minimum

### Developer Experience
- **Component Reuse**: 80% of UI from design system
- **Documentation**: 100% component coverage
- **Testing**: 90% test coverage
- **Build Time**: < 30s for development builds

### Quality Gates
- **TypeScript**: 0 type errors
- **ESLint**: 0 linting errors
- **Tests**: 100% passing
- **Accessibility**: 0 axe violations

---

## 🔗 Integration Points

### State Management (Zustand)
```typescript
// Cart store integration
const { items, addItem, removeItem } = useCartStore();

// Wishlist store integration
const { items: wishlistItems, addItem: addToWishlist } = useWishlistStore();
```

### Data Fetching (TanStack Query)
```typescript
// Product data fetching
const { data: products, isLoading } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => getProducts(filters)
});
```

### Shopify Integration
```typescript
// Shopify Hydrogen React
import { useShop, useCart } from '@shopify/hydrogen-react';

const { currencyCode } = useShop();
const { lines, linesAdd } = useCart();
```

### Authentication (Supabase)
```typescript
// User authentication
const { user, signIn, signOut } = useAuth();

// Protected components
{user ? <AccountDropdown /> : <LoginButton />}
```

---

## 📝 Conclusion

This atomic component architecture provides a solid foundation for Strike Shop's component system. It builds on the existing ShadCN/UI foundation while introducing Strike Shop's unique design language and ecommerce-specific patterns.

The system emphasizes:
- **Reusability** through atomic design principles
- **Performance** through strategic code splitting and optimization
- **Accessibility** through WCAG 2.1 AA compliance
- **Developer Experience** through comprehensive documentation and testing
- **Maintainability** through consistent patterns and TypeScript safety

By following this plan, Strike Shop will have a robust, scalable component system that can grow with the business while maintaining high quality standards and excellent user experience.

### Next Steps
1. Review and approve this architecture plan
2. Set up project structure and tooling
3. Begin Phase 1 implementation
4. Establish regular review cycles
5. Monitor performance and accessibility metrics

This architecture will enable Strike Shop to deliver a world-class ecommerce experience while maintaining code quality and developer productivity.