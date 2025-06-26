# Hero Component Guide

## Overview

The hero component system follows shadcn/ui patterns to create flexible, composable hero sections. Instead of a monolithic component, we provide primitive components that can be composed together for different use cases.

## Component Architecture

### Primitive Components

```tsx
import {
  Hero,
  HeroImage,
  HeroContent,
  HeroTitle,
  HeroDescription,
  HeroActions,
  HeroBadge,
  HeroMarquee,
  HeroMarqueeItem
} from "@/components/hero";
```

### 1. Hero Container (`<Hero>`)
The root container that defines the hero section dimensions.

```tsx
<Hero size="lg" className="custom-class">
  {/* Hero content */}
</Hero>
```

**Props:**
- `size`: "sm" | "default" | "lg" | "full"
- `asChild`: boolean (for composition flexibility)

### 2. Hero Image (`<HeroImage>`)
Handles the background image with overlay options.

```tsx
<HeroImage 
  src="/hero-bg.jpg" 
  alt="Hero background" 
  overlay="gradient"
  priority={true}
>
  {/* Content goes here */}
</HeroImage>
```

**Props:**
- `src`: string (required)
- `alt`: string (required)
- `overlay`: "none" | "gradient" | "stark" | "subtle"
- `priority`: boolean (for Next.js image priority)

### 3. Hero Content (`<HeroContent>`)
Positions and contains the hero text content.

```tsx
<HeroContent position="center" width="lg">
  {/* Title, description, actions */}
</HeroContent>
```

**Props:**
- `position`: Multiple options for content positioning
- `width`: "auto" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"

### 4. Hero Title (`<HeroTitle>`)
The main heading with size variants.

```tsx
<HeroTitle size="lg" as="h1">
  STRIKE SS25
</HeroTitle>
```

**Props:**
- `size`: "sm" | "default" | "lg" | "xl" | "massive"
- `as`: "h1" | "h2" | "h3"

### 5. Hero Description (`<HeroDescription>`)
Subtitle or description text.

```tsx
<HeroDescription size="lg">
  Defining the gray area between black and white
</HeroDescription>
```

### 6. Hero Actions (`<HeroActions>`)
Container for CTA buttons.

```tsx
<HeroActions align="center">
  <Button size="lg">Shop Now</Button>
  <Button variant="outline">Learn More</Button>
</HeroActions>
```

### 7. Hero Badge (`<HeroBadge>`)
For promotional badges or labels.

```tsx
<HeroBadge variant="destructive">
  LIMITED TIME
</HeroBadge>
```

### 8. Hero Marquee (`<HeroMarquee>`)
Scrolling text banner, typically at the bottom.

```tsx
<HeroMarquee speed="normal" pauseOnHover>
  <HeroMarqueeItem>FREE SHIPPING</HeroMarqueeItem>
  <span>•</span>
  <HeroMarqueeItem>24/7 SUPPORT</HeroMarqueeItem>
</HeroMarquee>
```

## Usage Examples

### Basic Hero
```tsx
<Hero>
  <HeroImage src="/hero.jpg" alt="Hero">
    <HeroContent>
      <HeroTitle>Welcome to Strike</HeroTitle>
      <HeroDescription>Premium streetwear collection</HeroDescription>
      <HeroActions>
        <Button>Shop Now</Button>
      </HeroActions>
    </HeroContent>
  </HeroImage>
</Hero>
```

### Centered Hero with Marquee
```tsx
<Hero size="lg">
  <HeroImage src="/hero.jpg" alt="Hero" overlay="stark">
    <HeroContent position="center">
      <HeroTitle size="massive">STRIKE SS25</HeroTitle>
      <HeroDescription>
        DEFINING THE GRAY AREA BETWEEN BLACK AND WHITE
      </HeroDescription>
      <HeroActions align="center">
        <Button size="lg">EXPLORE COLLECTION</Button>
      </HeroActions>
    </HeroContent>
  </HeroImage>
  <HeroMarquee>
    <HeroMarqueeItem>FREE SHIPPING</HeroMarqueeItem>
    <span>•</span>
    <HeroMarqueeItem>PREMIUM QUALITY</HeroMarqueeItem>
  </HeroMarquee>
</Hero>
```

### Sale Hero with Badge
```tsx
<Hero>
  <HeroImage src="/sale-hero.jpg" alt="Sale" overlay="gradient">
    <HeroContent position="bottom-left">
      <HeroBadge variant="destructive">LIMITED TIME</HeroBadge>
      <HeroTitle>END OF SEASON SALE</HeroTitle>
      <HeroDescription>Up to 70% off selected items</HeroDescription>
      <HeroActions>
        <Button>Shop Sale</Button>
      </HeroActions>
    </HeroContent>
  </HeroImage>
</Hero>
```

## Pre-composed Component

For convenience, we also provide a pre-composed `HeroSection` component:

```tsx
import { HeroSection } from "@/components/hero/hero-section";

<HeroSection
  title="STRIKE SS25"
  subtitle="DEFINING THE GRAY AREA BETWEEN BLACK AND WHITE"
  image="/hero.jpg"
  cta={{
    text: "EXPLORE COLLECTION",
    href: "/new"
  }}
  variant="centered"
  size="lg"
  overlay="stark"
  showMarquee={true}
/>
```

## Configuration

Hero presets can be defined in `/config/hero.ts`:

```tsx
export const heroPresets = {
  home: {
    title: "STRIKE SS25",
    subtitle: "DEFINING THE GRAY AREA BETWEEN BLACK AND WHITE",
    image: "/hero-home.jpg",
    cta: {
      text: "EXPLORE COLLECTION",
      href: "/new",
    },
    variant: "centered",
    size: "lg",
    overlay: "stark",
  },
  // More presets...
};
```

## Styling

### Size Classes
- `sm`: 40vh mobile / 50vh desktop
- `default`: 65vh mobile / 70vh desktop
- `lg`: 80vh mobile / 85vh desktop
- `full`: 100vh

### Overlay Classes
- `none`: No overlay
- `gradient`: Gradient from black to transparent
- `stark`: 20% black overlay
- `subtle`: 10% black overlay

### Position Options
- Top: `top-left`, `top-center`, `top-right`
- Center: `center-left`, `center`, `center-right`
- Bottom: `bottom-left`, `bottom-center`, `bottom-right`

## Accessibility

- All images include proper alt text
- Decorative elements use `aria-hidden="true"`
- Marquee can be paused on hover
- Proper heading hierarchy with configurable `as` prop
- Focus management for interactive elements

## Performance

- Images use Next.js Image component with optimization
- Priority loading for above-the-fold heroes
- Lazy loading for below-the-fold heroes
- CSS animations use `will-change` and GPU acceleration

## Migration from Old Hero

### Before (Monolithic)
```tsx
<HeroBannerV2
  image="/hero.jpg"
  title="STRIKE SS25"
  subtitle="DEFINING THE GRAY AREA"
  buttonText="SHOP NOW"
  buttonLink="/shop"
/>
```

### After (Composable)
```tsx
<Hero size="lg">
  <HeroImage src="/hero.jpg" alt="STRIKE SS25" overlay="stark">
    <HeroContent position="center">
      <HeroTitle size="massive">STRIKE SS25</HeroTitle>
      <HeroDescription>DEFINING THE GRAY AREA</HeroDescription>
      <HeroActions align="center">
        <Button asChild size="lg">
          <Link href="/shop">SHOP NOW</Link>
        </Button>
      </HeroActions>
    </HeroContent>
  </HeroImage>
</Hero>
```

## Best Practices

1. **Use semantic HTML**: Always use `<Hero>` as a section
2. **Optimize images**: Use appropriate image sizes and formats
3. **Consider mobile**: Test all position and size variants on mobile
4. **Accessibility first**: Include alt text and proper ARIA labels
5. **Performance**: Use `priority` prop for above-the-fold heroes
6. **Consistency**: Use configuration presets for common patterns