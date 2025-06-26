# Product Display Components

A modular system of product display components following shadcn/ui patterns for maximum flexibility and composability.

## Components

### ProductSection
Container component for product displays with configurable spacing and background.

```tsx
<ProductSection spacing="default" background="subtle">
  {children}
</ProductSection>
```

Props:
- `spacing`: "none" | "sm" | "default" | "lg"
- `background`: "none" | "subtle" | "contrast" | "gradient"
- `container`: boolean (default: true)
- `as`: "section" | "div"

### ProductHeader
Header component for product sections with title, description, and view all link.

```tsx
<ProductHeader
  title="NEW ARRIVALS"
  description="Fresh drops for the season"
  viewAllText="VIEW ALL"
  viewAllHref="/new"
  align="left"
  badge={<ProductBadge variant="new">NEW</ProductBadge>}
/>
```

Props:
- `title`: string
- `description`: string
- `viewAllText`: string
- `viewAllHref`: string
- `align`: "left" | "center" | "right"
- `badge`: ReactNode

### ProductGrid
Grid layout for products with responsive columns.

```tsx
<ProductGrid cols={4} gap="default">
  {products.map(product => <ProductCard key={product.id} product={product} />)}
</ProductGrid>
```

Props:
- `cols`: 2 | 3 | 4 | 5 | 6
- `gap`: "none" | "sm" | "default" | "lg"

### ProductScroll
Horizontal scroll container with navigation controls.

```tsx
<ProductScroll showControls controlsPosition="outside">
  {products.map(product => <ProductCard key={product.id} product={product} />)}
</ProductScroll>
```

Props:
- `gap`: "sm" | "default" | "lg"
- `showControls`: boolean
- `controlsPosition`: "inside" | "outside"

### ProductBadge
Badge component for product status indicators.

```tsx
<ProductBadge variant="sale" position="topLeft">
  SALE
</ProductBadge>
```

Props:
- `variant`: "sale" | "new" | "soldOut" | "limited" | "exclusive"
- `size`: "sm" | "default" | "lg"
- `position`: "none" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight"

### ProductPrice
Price display component with support for original prices.

```tsx
<ProductPrice
  price="99.99"
  originalPrice="149.99"
  currency="€"
  showCurrency={true}
/>
```

Props:
- `price`: string
- `originalPrice`: string
- `currency`: string
- `showCurrency`: boolean
- `size`: "sm" | "default" | "lg" | "xl"

### ProductActions
Action buttons for products (wishlist, quick view, add to cart).

```tsx
<ProductActions
  product={product}
  layout="horizontal"
  showQuickView={true}
  showWishlist={true}
  showAddToCart={false}
/>
```

Props:
- `product`: Product object
- `layout`: "horizontal" | "vertical" | "overlay"
- `showQuickView`: boolean
- `showWishlist`: boolean
- `showAddToCart`: boolean
- `size`: "sm" | "default" | "lg"

### ProductShowcase
High-level composed component that combines all primitives.

```tsx
<ProductShowcase
  title="NEW ARRIVALS"
  description="Fresh drops for the season"
  products={products}
  viewAllLink="/new"
  layout="scroll"
  showBadge={true}
  badgeText="NEW"
  badgeVariant="new"
  sectionSpacing="default"
  sectionBackground="subtle"
/>
```

Props:
- All ProductHeader props
- `products`: Product[]
- `layout`: "scroll" | "grid"
- `gridCols`: 2 | 3 | 4 | 5 | 6
- `showBadge`: boolean
- `badgeText`: string
- `badgeVariant`: BadgeVariant
- `sectionSpacing`: SectionSpacing
- `sectionBackground`: SectionBackground
- `priority`: boolean

## Usage Examples

### Basic Scroll Layout
```tsx
<ProductShowcase
  title="SALE ITEMS"
  products={saleProducts}
  viewAllLink="/sale"
  layout="scroll"
/>
```

### Grid Layout with Badge
```tsx
<ProductShowcase
  title="NEW ARRIVALS"
  products={newProducts}
  layout="grid"
  gridCols={4}
  showBadge={true}
  badgeText="NEW"
  badgeVariant="new"
/>
```

### Custom Composed Layout
```tsx
<ProductSection spacing="lg" background="gradient">
  <ProductHeader
    title="EXCLUSIVE DROPS"
    align="center"
  />
  <ProductGrid cols={3}>
    {products.map(product => (
      <div key={product.id} className="relative">
        <ProductCard product={product} />
        <ProductBadge variant="limited" position="topLeft">
          LIMITED
        </ProductBadge>
      </div>
    ))}
  </ProductGrid>
</ProductSection>
```

## Performance Considerations

1. **Lazy Loading**: All showcase components support lazy loading via dynamic imports
2. **Memoization**: ProductCard is heavily memoized to prevent unnecessary re-renders
3. **Optimized Images**: Uses ProductImage component with Next.js Image optimization
4. **Scroll Performance**: Horizontal scroll uses CSS-only scrolling with hardware acceleration
5. **Priority Loading**: Support for priority prop to optimize LCP

## Accessibility

- Full keyboard navigation support
- ARIA labels and roles
- Screen reader announcements
- Focus management
- Haptic feedback on mobile devices