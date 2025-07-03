# Strike Shop Design Token System Guide

## Overview

Strike Shop uses a modern design token architecture built on Tailwind CSS v4's @theme directive. This guide documents our token system, naming conventions, and best practices.

## Architecture

Our design tokens follow a three-layer architecture:

### 1. Primitive Tokens (Foundation)
Raw values that form the foundation of our design system.

```css
/* Color Primitives */
--color-black: #000000;
--color-white: #ffffff;
--color-gray-50: #fafafa;
--color-gray-900: #1a1a1a;
```

### 2. Semantic Tokens (Purpose)
Aliases that describe the purpose rather than the value.

```css
/* Semantic Colors */
--color-background: var(--color-white);
--color-foreground: var(--color-black);
--color-primary: var(--color-black);
--color-primary-foreground: var(--color-white);
```

### 3. Component Tokens (Context)
Specific tokens for components, defined in :root.

```css
/* Component-specific */
--sidebar-background: var(--color-gray-50);
--chart-1: var(--color-black);
```

## Token Categories

### Colors

#### Primitives
- **Black & White**: `--color-black`, `--color-white`
- **Gray Scale**: `--color-gray-50` through `--color-gray-950` (11 steps)
- **Status Colors**: Red, Green, Orange, Blue variants

#### Semantic (shadcn Convention)
- **background/foreground**: Main page colors
- **primary/primary-foreground**: Primary action colors
- **secondary/secondary-foreground**: Secondary action colors
- **muted/muted-foreground**: Subdued content
- **accent/accent-foreground**: Accent highlights
- **destructive/destructive-foreground**: Destructive actions
- **card/card-foreground**: Card surfaces
- **popover/popover-foreground**: Popover surfaces
- **border**: Border color
- **input**: Input border color
- **ring**: Focus ring color

### Spacing

8px base unit system:
- `--spacing-0`: 0px
- `--spacing-1`: 0.25rem (4px)
- `--spacing-2`: 0.5rem (8px)
- `--spacing-4`: 1rem (16px)
- ... up to `--spacing-96`: 24rem (384px)

### Typography

#### Font Families
- `--font-sans`: Inter, system fonts
- `--font-mono`: "Courier Prime", monospace fonts
- `--font-typewriter`: Strike brand typewriter font
- `--font-professional`: Professional body font

#### Font Sizes
- `--text-xs`: 0.75rem (12px)
- `--text-sm`: 0.875rem (14px)
- `--text-base`: 1rem (16px)
- ... up to `--text-9xl`: 8rem (128px)

#### Font Weights
- `--font-normal`: 400
- `--font-medium`: 500
- `--font-semibold`: 600
- `--font-bold`: 700

#### Letter Spacing
- `--letter-spacing-tight`: -0.025em
- `--letter-spacing-normal`: 0
- `--letter-spacing-wide`: 0.025em
- `--letter-spacing-strike`: 0.1em (brand-specific)

### Layout

#### Border Radius
- `--radius-none`: 0 (Strike brand sharp edges)
- `--radius-sm`: 0.125rem
- `--radius-full`: 9999px

#### Shadows
- `--shadow-xs` through `--shadow-2xl`
- `--shadow-inner`: Inset shadow
- `--shadow-none`: No shadow

#### Z-Index
- `--z-base`: 0
- `--z-dropdown`: 50
- `--z-sticky`: 100
- `--z-modal`: 400
- `--z-tooltip`: 600

### Animation

#### Durations
- `--duration-instant`: 0ms
- `--duration-fast`: 150ms
- `--duration-normal`: 200ms
- `--duration-slow`: 300ms

#### Easings
- `--ease-linear`: linear
- `--ease-in`: cubic-bezier(0.4, 0, 1, 1)
- `--ease-out`: cubic-bezier(0, 0, 0.2, 1)
- `--ease-in-out`: cubic-bezier(0.4, 0, 0.2, 1)

## Usage Examples

### In CSS
```css
.custom-component {
  background: var(--color-background);
  color: var(--color-foreground);
  padding: var(--spacing-4);
  border-radius: var(--radius-none);
  font-size: var(--text-base);
}
```

### With Tailwind Utilities
```jsx
<div className="bg-primary text-primary-foreground p-4 text-base">
  {/* Tailwind generates these from our @theme tokens */}
</div>
```

### Component-Specific Tokens
```css
:root {
  /* Define component tokens using semantic tokens */
  --button-primary-bg: var(--color-primary);
  --button-primary-text: var(--color-primary-foreground);
}
```

## Best Practices

### 1. **Always Use Tokens**
Never hardcode values. Always reference design tokens.

```jsx
// ❌ Bad
<div className="bg-white text-black">

// ✅ Good
<div className="bg-background text-foreground">
```

### 2. **Follow the Token Hierarchy**
Start with semantic tokens, fall back to primitives only when necessary.

```css
/* ✅ Preferred - semantic token */
background: var(--color-card);

/* ⚠️ Only if no semantic token exists */
background: var(--color-gray-100);

/* ❌ Never - hardcoded value */
background: #f5f5f5;
```

### 3. **Use Consistent Naming**
Follow the established naming patterns:
- Colors: `--color-[name]`
- Spacing: `--spacing-[size]`
- Typography: `--text-[size]`, `--font-[weight]`

### 4. **Component Tokens in :root**
Define component-specific tokens in the :root selector, not @theme.

```css
@theme {
  /* Primitives and semantic tokens */
}

:root {
  /* Component-specific tokens */
  --sidebar-width: 240px;
  --navbar-height: 64px;
}
```

### 5. **Maintain WCAG Compliance**
Ensure color combinations meet accessibility standards:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- Interactive elements: Clear focus indicators

## Migration Guide

### From Old System
```css
/* Old - HSL components */
--primary: 0 0% 0%;
background: hsl(var(--primary));

/* New - Hex values */
--color-primary: #000000;
background: var(--color-primary);
```

### Component Updates
```jsx
// Old
<Card className="bg-white border-gray-200">

// New
<Card className="bg-card border">
```

## Token Reference Location

All design tokens are defined in:
- **Primary source**: `/app/globals.css` in the @theme directive
- **Component tokens**: `/app/globals.css` in :root
- **Legacy reference**: `/styles/design-tokens.css` (deprecated)

## Future Enhancements

1. **Dark Mode Support**: Tokens are structured to easily support dark mode
2. **Theme Variations**: Easy to create brand variations
3. **Dynamic Tokens**: Runtime token modification for user preferences

## Common Issues

### Issue: Colors not applying
**Solution**: Ensure you're not using `hsl()` wrapper with hex values.

### Issue: Spacing looks wrong
**Solution**: Use the spacing scale tokens, not arbitrary values.

### Issue: Typography inconsistent
**Solution**: Use the font stack tokens and size tokens together.

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Theming Guide](https://ui.shadcn.com/docs/theming)
- [Design Tokens W3C Spec](https://design-tokens.github.io/community-group/format/)