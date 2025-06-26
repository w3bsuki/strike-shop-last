# Category Component Guide

## Overview

The category component system follows shadcn/ui patterns to create flexible, composable category sections. Instead of monolithic components, we provide primitive components that can be composed together for different layouts and use cases.

## Component Architecture

### Primitive Components

```tsx
import {
  CategorySection,
  CategoryHeader,
  CategoryGrid,
  CategoryScroll,
  CategoryCard,
  CategoryCarousel
} from "@/components/category";
```

### 1. CategorySection (`<CategorySection>`)
The root container that wraps category content with consistent spacing and optional background.

```tsx
<CategorySection spacing="default" background="subtle">
  {/* Category content */}
</CategorySection>
```

**Props:**
- `spacing`: "none" | "sm" | "default" | "lg"
- `background`: "none" | "subtle" | "contrast" | "gradient"
- `container`: boolean (wraps in container)
- `as`: "section" | "div"

### 2. CategoryHeader (`<CategoryHeader>`)
Section header with title, description, and optional "View All" link.

```tsx
<CategoryHeader
  title="Shop by Category"
  description="Browse our curated collections"
  viewAllText="View All"
  viewAllHref="/categories"
  align="left"
/>
```

**Props:**
- `title`: string
- `description`: string
- `viewAllText`: string
- `viewAllHref`: string
- `align`: "left" | "center" | "right"

### 3. CategoryGrid (`<CategoryGrid>`)
Responsive grid layout for category cards.

```tsx
<CategoryGrid columns="4">
  {/* Category cards */}
</CategoryGrid>
```

**Props:**
- `columns`: "1" | "2" | "3" | "4" | "5" | "6" | "auto"

### 4. CategoryScroll (`<CategoryScroll>`)
Horizontal scrolling container with navigation controls.

```tsx
<CategoryScroll showControls controlsPosition="outside">
  {categories.map(category => (
    <div className="flex-none w-[280px]">
      <CategoryCard {...category} />
    </div>
  ))}
</CategoryScroll>
```

**Props:**
- `showControls`: boolean
- `controlsPosition`: "inside" | "outside"
- `gap`: "sm" | "default" | "lg"

### 5. CategoryCard (`<CategoryCard>`)
Individual category card with image, overlay, and content.

```tsx
<CategoryCard
  name="Menswear"
  image="/category-men.jpg"
  href="/men"
  count={245}
  description="Contemporary luxury"
  aspectRatio="portrait"
  overlay="gradient"
  variant="elevated"
/>
```

**Props:**
- `name`: string (required)
- `image`: string (required)
- `href`: string (required)
- `count`: number
- `description`: string
- `aspectRatio`: "square" | "portrait" | "landscape" | "wide" | "golden"
- `overlay`: "none" | "gradient" | "dark" | "light"
- `variant`: "default" | "minimal" | "elevated" | "bordered"
- `radius`: "none" | "sm" | "md" | "lg" | "xl"
- `contentPosition`: Position of text content
- `priority`: boolean (for image loading)

### 6. CategoryCarousel (`<CategoryCarousel>`)
Auto-scrolling carousel with smooth animation.

```tsx
<CategoryCarousel
  autoPlay
  duration={30}
  pauseOnHover
  direction="left"
>
  {categories.map(category => (
    <CategoryCard key={category.id} {...category} />
  ))}
</CategoryCarousel>
```

**Props:**
- `autoPlay`: boolean
- `duration`: number (seconds)
- `pauseOnHover`: boolean
- `direction`: "left" | "right"
- `gap`: "sm" | "default" | "lg"

## Usage Examples

### Basic Grid Layout
```tsx
<CategorySection>
  <CategoryHeader title="Categories" />
  <CategoryGrid columns="4">
    {categories.map(category => (
      <CategoryCard
        key={category.id}
        name={category.name}
        image={category.image}
        href={category.href}
        count={category.count}
      />
    ))}
  </CategoryGrid>
</CategorySection>
```

### Horizontal Scroll with Controls
```tsx
<CategorySection spacing="lg">
  <CategoryHeader
    title="Shop by Category"
    viewAllText="View All"
    viewAllHref="/categories"
  />
  <CategoryScroll showControls>
    {categories.map((category, index) => (
      <div key={category.id} className="flex-none w-[280px]">
        <CategoryCard
          name={category.name}
          image={category.image}
          href={`/${category.slug}`}
          count={category.count}
          priority={index < 3}
        />
      </div>
    ))}
  </CategoryScroll>
</CategorySection>
```

### Auto-Scrolling Carousel
```tsx
<CategorySection background="subtle">
  <CategoryHeader title="Popular Categories" align="center" />
  <CategoryCarousel>
    {categories.map(category => (
      <div key={category.id} className="w-[320px]">
        <CategoryCard {...category} variant="elevated" />
      </div>
    ))}
  </CategoryCarousel>
</CategorySection>
```

### Mixed Layout
```tsx
<CategorySection>
  <CategoryHeader
    title="Featured Collections"
    description="Hand-picked by our curators"
  />
  
  {/* Featured categories in grid */}
  <CategoryGrid columns="3" className="mb-8">
    {featuredCategories.map(category => (
      <CategoryCard
        key={category.id}
        {...category}
        variant="elevated"
        aspectRatio="square"
      />
    ))}
  </CategoryGrid>
  
  {/* All categories in scroll */}
  <CategoryScroll>
    {allCategories.map(category => (
      <div key={category.id} className="flex-none w-[240px]">
        <CategoryCard {...category} variant="minimal" />
      </div>
    ))}
  </CategoryScroll>
</CategorySection>
```

## Pre-composed Component

For convenience, we provide a pre-composed `CategoryShowcase` component:

```tsx
import { CategoryShowcase } from "@/components/category/category-showcase";

<CategoryShowcase
  categories={categories}
  title="Shop by Category"
  viewAllText="View All"
  viewAllHref="/categories"
  variant="scroll" // or "grid" | "carousel"
  cardProps={{
    aspectRatio: "portrait",
    overlay: "gradient"
  }}
/>
```

## Configuration

Category configurations can be defined in `/config/categories.ts`:

```tsx
export const categoryConfig = {
  title: "Shop by Category",
  viewAllText: "View All",
  viewAllHref: "/categories",
  columns: {
    mobile: 2,
    tablet: 3,
    desktop: 4,
  },
};
```

## Styling

### Aspect Ratios
- `square`: 1:1
- `portrait`: 3:4 (default)
- `landscape`: 4:3
- `wide`: 16:9
- `golden`: 1.618:1

### Overlay Options
- `none`: No overlay
- `gradient`: Gradient from bottom (default)
- `dark`: 40% black overlay
- `light`: 40% white overlay

### Content Positions
- `top-left`, `top-center`
- `center`
- `bottom-left`, `bottom-center` (default)

## Accessibility

- All cards have proper `aria-label` with category name and count
- Scroll controls have descriptive labels
- Keyboard navigation supported
- Focus indicators on interactive elements
- Proper heading hierarchy

## Performance

- Images use Next.js Image with optimization
- Priority loading for first 3 items
- Lazy loading for below-fold content
- Smooth scrolling with CSS transforms
- GPU-accelerated animations

## Migration from Old CategoryScroll

### Before (Monolithic)
```tsx
<CategoryScroll
  title="Shop by Category"
  categories={categories}
/>
```

### After (Composable)
```tsx
<CategorySection>
  <CategoryHeader title="Shop by Category" />
  <CategoryScroll>
    {categories.map(category => (
      <div key={category.id} className="flex-none w-[280px]">
        <CategoryCard
          name={category.name}
          image={category.image}
          href={`/${category.slug}`}
          count={category.count}
        />
      </div>
    ))}
  </CategoryScroll>
</CategorySection>
```

## Best Practices

1. **Use semantic HTML**: CategorySection renders as `<section>` by default
2. **Set image priorities**: Use `priority` prop for above-fold categories
3. **Consistent sizing**: Use flex-none width classes for scroll items
4. **Accessibility first**: Always include alt text and aria labels
5. **Performance**: Limit visible items and use lazy loading
6. **Responsive design**: Test all layouts on mobile devices

## Component Composition Patterns

### Pattern 1: Section with Header
```tsx
<CategorySection>
  <CategoryHeader {...headerProps} />
  <CategoryGrid>{/* cards */}</CategoryGrid>
</CategorySection>
```

### Pattern 2: Custom Layouts
```tsx
<CategorySection container={false}>
  <div className="custom-container">
    <CategoryHeader />
    <div className="custom-grid">
      {/* Custom layout */}
    </div>
  </div>
</CategorySection>
```

### Pattern 3: Multiple Sections
```tsx
<>
  <CategorySection spacing="sm">
    <CategoryHeader title="New Arrivals" />
    <CategoryScroll>{/* cards */}</CategoryScroll>
  </CategorySection>
  
  <CategorySection spacing="sm" background="subtle">
    <CategoryHeader title="Popular Categories" />
    <CategoryGrid>{/* cards */}</CategoryGrid>
  </CategorySection>
</>
```

## Theming

Categories inherit theme colors but can be customized:

```tsx
<CategoryCard
  className="hover:shadow-primary"
  // Custom overlay
  overlay="none"
  // Custom styles via className
/>
```

## Future Enhancements

- Masonry grid layout option
- Filter/sort functionality
- Animated card reveals
- Loading skeletons per component
- A11y announcements for interactions