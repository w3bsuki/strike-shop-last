# Strike Shop Design System

A comprehensive design system for the Strike Shop e-commerce platform, built with consistency, maintainability, and the typewriter aesthetic in mind.

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Color System](#color-system)
6. [Border Radius](#border-radius)
7. [Components](#components)
8. [Usage Guidelines](#usage-guidelines)
9. [Migration Guide](#migration-guide)

## Overview

The Strike Shop Design System eliminates the chaos of 47+ different spacing values and inconsistent styling by providing:

- **Consistent spacing scale**: 0.25rem to 6rem
- **Responsive typography**: Using CSS `clamp()` for fluid scaling
- **Semantic color tokens**: Strike brand colors with proper gray scale
- **Mobile-first approach**: Touch-friendly targets and responsive utilities
- **TypeScript support**: Full type safety with design tokens

## Core Principles

1. **Consistency over creativity**: Use established tokens instead of arbitrary values
2. **Mobile-first design**: All components optimized for touch devices
3. **Typewriter aesthetic**: Monospace font throughout, minimal rounded corners
4. **Performance**: Minimal CSS, no runtime overhead
5. **Accessibility**: WCAG 2.1 AA compliant, 48px touch targets

## Typography

### Font Family
```css
font-family: 'Typewriter', 'Courier Prime', ui-monospace, monospace;
```

### Font Sizes (Responsive with clamp())

| Token | Min | Preferred | Max | Usage |
|-------|-----|-----------|-----|--------|
| `text-xs` | 0.625rem | 0.5rem + 0.5vw | 0.75rem | Small labels, captions |
| `text-sm` | 0.75rem | 0.625rem + 0.5vw | 0.875rem | Body text, buttons |
| `text-base` | 0.875rem | 0.75rem + 0.5vw | 1rem | Default body text |
| `text-lg` | 1rem | 0.875rem + 0.5vw | 1.125rem | Emphasized text |
| `text-xl` | 1.125rem | 1rem + 0.5vw | 1.25rem | Small headings |
| `text-2xl` | 1.25rem | 1.125rem + 0.75vw | 1.5rem | Section headings |
| `text-3xl` | 1.5rem | 1.25rem + 1vw | 1.875rem | Page headings |
| `text-4xl` | 1.875rem | 1.5rem + 1.5vw | 2.25rem | Hero headings |
| `text-5xl` | 2.25rem | 1.875rem + 2vw | 3rem | Display text |
| `text-6xl` | 3rem | 2.25rem + 3vw | 3.75rem | Large display |

### Strike-Specific Typography

```css
/* Strike XS - Uppercase labels */
.text-strike-xs {
  font-size: clamp(0.625rem, 0.5rem + 0.5vw, 0.75rem);
  letter-spacing: 0.1em;
  font-weight: 700;
  text-transform: uppercase;
}

/* Strike SM - Navigation, buttons */
.text-strike-sm {
  font-size: clamp(0.75rem, 0.625rem + 0.5vw, 0.875rem);
  letter-spacing: 0.1em;
  font-weight: 700;
  text-transform: uppercase;
}

/* Strike Base - Product titles */
.text-strike-base {
  font-size: clamp(0.875rem, 0.75rem + 0.5vw, 1rem);
  letter-spacing: 0.05em;
  font-weight: 500;
}
```

## Spacing System

A consistent 4px-based spacing scale from 0.25rem to 6rem:

| Token | Value | Pixels | Usage |
|-------|-------|--------|--------|
| `space-0` | 0 | 0px | Reset |
| `space-px` | 1px | 1px | Borders |
| `space-0.5` | 0.125rem | 2px | Micro spacing |
| `space-1` | 0.25rem | 4px | Tight spacing |
| `space-1.5` | 0.375rem | 6px | Small gaps |
| `space-2` | 0.5rem | 8px | Default padding |
| `space-2.5` | 0.625rem | 10px | Button padding |
| `space-3` | 0.75rem | 12px | Card padding |
| `space-3.5` | 0.875rem | 14px | Medium gaps |
| `space-4` | 1rem | 16px | Section spacing |
| `space-5` | 1.25rem | 20px | Large padding |
| `space-6` | 1.5rem | 24px | Section gaps |
| `space-7` | 1.75rem | 28px | |
| `space-8` | 2rem | 32px | Large sections |
| `space-9` | 2.25rem | 36px | |
| `space-10` | 2.5rem | 40px | |
| `space-11` | 2.75rem | 44px | Min touch target |
| `space-12` | 3rem | 48px | Touch target |
| `space-14` | 3.5rem | 56px | |
| `space-16` | 4rem | 64px | Hero spacing |
| `space-20` | 5rem | 80px | |
| `space-24` | 6rem | 96px | Max spacing |

### Special Spacing Tokens

- `space-touch`: 2.75rem (44px) - Minimum touch target
- `space-touch-lg`: 3rem (48px) - Comfortable touch target

## Color System

### Strike Brand Colors

```css
/* Primary */
--color-strike-black: hsl(0 0% 0%);
--color-strike-white: hsl(0 0% 100%);

/* Gray Scale */
--color-strike-gray-50: hsl(0 0% 98%);   /* Near white */
--color-strike-gray-100: hsl(0 0% 96%);  /* Light gray */
--color-strike-gray-200: hsl(0 0% 90%);  /* Border light */
--color-strike-gray-300: hsl(0 0% 80%);  /* Border default */
--color-strike-gray-400: hsl(0 0% 65%);  /* Muted text */
--color-strike-gray-500: hsl(0 0% 50%);  /* Mid gray */
--color-strike-gray-600: hsl(0 0% 40%);  /* Dark muted */
--color-strike-gray-700: hsl(0 0% 30%);  /* Dark gray */
--color-strike-gray-800: hsl(0 0% 20%);  /* Very dark */
--color-strike-gray-900: hsl(0 0% 10%);  /* Near black */
--color-strike-gray-950: hsl(0 0% 5%);   /* Darkest */
```

### Semantic Colors

```css
--color-error: hsl(0 84% 60%);      /* Red for errors */
--color-warning: hsl(38 92% 50%);   /* Orange for warnings */
--color-success: hsl(142 71% 45%);  /* Green for success */
--color-info: hsl(210 100% 50%);    /* Blue for info */
```

## Border Radius

Maintaining the sharp, brutalist aesthetic:

```css
--radius-none: 0;        /* Default - sharp corners */
--radius-subtle: 2px;    /* Very subtle rounding when needed */
--radius-soft: 4px;      /* Soft rounding for special cases */
```

## Components

### Buttons

```css
/* Base button */
.strike-button {
  min-height: var(--space-10);        /* 40px */
  padding: var(--space-2-5) var(--space-6);
  font-size: var(--font-size-sm);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 0;
}

/* Size variants */
.strike-button-sm {
  min-height: var(--space-8);         /* 32px */
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-xs);
}

.strike-button-lg {
  min-height: var(--space-12);        /* 48px */
  padding: var(--space-3) var(--space-8);
  font-size: var(--font-size-base);
}
```

### Inputs

```css
.strike-input {
  min-height: var(--space-10);        /* 40px */
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-base);
  border: 1px solid var(--color-strike-gray-300);
  border-radius: 0;
}
```

### Cards

```css
.strike-card {
  padding: var(--space-4);
  border: 1px solid var(--color-strike-gray-200);
  border-radius: 0;
  background: var(--color-strike-white);
}
```

## Usage Guidelines

### DO:
- Use design tokens for all spacing, colors, and typography
- Maintain 48px minimum touch targets on mobile
- Use semantic color names (e.g., `border` not `gray-300`)
- Test responsive typography on various screen sizes
- Follow the established spacing scale

### DON'T:
- Use arbitrary values (e.g., `p-[17px]`, `gap-[13px]`)
- Mix different spacing systems
- Override the typewriter font family
- Add rounded corners unless absolutely necessary
- Create new color variations without updating the system

## Migration Guide

### Before (Inconsistent):
```jsx
<div className="p-[17px] gap-[13px] text-[14px]">
  <button className="px-[23px] py-[11px] rounded-md">
    Click me
  </button>
</div>
```

### After (Design System):
```jsx
<div className="p-4 gap-3 text-sm">
  <button className="px-6 py-2.5 rounded-none">
    Click me
  </button>
</div>
```

### Common Replacements:

| Old Value | New Token | Notes |
|-----------|-----------|--------|
| `p-[17px]` | `p-4` | Use closest standard value |
| `gap-[13px]` | `gap-3` | 12px is close enough |
| `text-[14px]` | `text-sm` | Responsive sizing |
| `px-[23px]` | `px-6` | 24px standard |
| `rounded-md` | `rounded-none` | Sharp corners |
| `space-x-4` | `gap-4` | Use gap for consistency |

### TypeScript Usage:

```typescript
import { spacing, typography, colors } from '@/lib/design-tokens';

// Get spacing value
const padding = spacing[4]; // "1rem"

// Get typography
const fontSize = typography.fontSize.base; // "clamp(...)"

// Get color
const borderColor = colors.strike.gray[300]; // "hsl(0 0% 80%)"
```

### CSS Variable Usage:

```css
.custom-component {
  padding: var(--space-4);
  font-size: var(--font-size-base);
  color: var(--color-strike-black);
  border: 1px solid var(--color-strike-gray-300);
}
```

## Component Libraries Integration

When using with shadcn/ui or other component libraries:

1. Override their CSS variables with our design tokens
2. Use our spacing scale in component configs
3. Disable rounded corners in component themes
4. Apply our typography scale to all text elements

Example shadcn/ui integration:
```css
:root {
  --radius: 0;  /* Override all radii */
  --primary: var(--color-strike-black);
  --border: var(--color-strike-gray-300);
}
```

## Performance Considerations

- All responsive typography uses CSS `clamp()` - no JavaScript needed
- Design tokens are CSS custom properties - runtime changeable
- Minimal CSS footprint - under 10KB
- No external font downloads - system monospace fallbacks

## Accessibility

- All interactive elements meet 48px touch target on mobile
- Color contrast ratios meet WCAG 2.1 AA standards
- Focus states are clearly visible
- Reduced motion preferences respected

## Future Enhancements

- [ ] Dark mode color tokens
- [ ] Animation presets
- [ ] Grid system tokens
- [ ] Icon sizing scale
- [ ] Component-specific tokens library

---

For questions or suggestions about the design system, please create an issue in the repository.