# Strike Shop Design System Migration Guide

## Quick Reference

This guide helps you migrate existing code to use the new consolidated design token system.

## 1. Color Migration

### Before → After

```tsx
// ❌ Old way
<div className="bg-white text-black">
<div className="bg-strike-gray-100">
<div className="border-gray-200">

// ✅ New way
<div className="bg-background text-foreground">
<div className="bg-surface-elevated">
<div className="border-border">
```

### Color Token Mapping

| Old Class | New Class | Purpose |
|-----------|-----------|---------|
| `bg-white` | `bg-background` | Main background |
| `bg-strike-gray-50` | `bg-surface-elevated` | Raised surfaces |
| `bg-strike-gray-100` | `bg-surface-overlay` | Overlays, modals |
| `text-black` | `text-content-primary` | Primary text |
| `text-strike-gray-700` | `text-content-secondary` | Secondary text |
| `text-strike-gray-400` | `text-content-disabled` | Disabled states |
| `border-gray-200` | `border-border` | Default borders |
| `bg-primary` | `bg-interactive-primary` | Primary buttons |
| `hover:bg-primary/90` | `hover:bg-interactive-primary-hover` | Button hover |

## 2. Spacing Migration

### Replace Hardcoded Values

```tsx
// ❌ Old way
<div style={{ padding: '16px' }}>
<div className="p-[16px]">
<div className="mb-[18px]">

// ✅ New way
<div className="p-4">
<div className="p-4">
<div className="mb-5">
```

### Common Spacing Conversions

| Pixels | Rem | Token | Class |
|--------|-----|-------|-------|
| 0px | 0 | `--space-0` | `p-0`, `m-0` |
| 4px | 0.25rem | `--space-1` | `p-1`, `m-1` |
| 8px | 0.5rem | `--space-2` | `p-2`, `m-2` |
| 12px | 0.75rem | `--space-3` | `p-3`, `m-3` |
| 16px | 1rem | `--space-4` | `p-4`, `m-4` |
| 20px | 1.25rem | `--space-5` | `p-5`, `m-5` |
| 24px | 1.5rem | `--space-6` | `p-6`, `m-6` |
| 32px | 2rem | `--space-8` | `p-8`, `m-8` |
| 44px | 2.75rem | `--space-11` | `p-11` (touch target) |
| 48px | 3rem | `--space-12` | `p-12` (touch comfortable) |

## 3. Typography Migration

### Font Size Updates

```tsx
// ❌ Old way
<h1 style={{ fontSize: '2rem' }}>
<p className="text-[14px]">
<span className="text-sm">

// ✅ New way
<h1 className="text-4xl">
<p className="text-base">
<span className="text-sm">
```

### Typography Classes

| Purpose | Class | Size (Mobile → Desktop) |
|---------|-------|------------------------|
| Body text | `text-base` | 14px → 16px |
| Small text | `text-sm` | 12px → 14px |
| Large text | `text-lg` | 16px → 18px |
| Heading 1 | `text-4xl` | 30px → 36px |
| Heading 2 | `text-3xl` | 24px → 30px |
| Heading 3 | `text-2xl` | 20px → 24px |
| Button text | `text-strike-sm` | 12px → 14px + uppercase |
| Label text | `text-strike-xs` | 10px → 12px + uppercase |

## 4. Component Patterns

### Buttons

```tsx
// ❌ Old way
<button className="bg-black text-white px-6 py-2.5 text-xs uppercase tracking-[0.1em] font-bold">

// ✅ New way
<button className="strike-button">
// or with Tailwind
<button className="bg-interactive-primary text-content-inverse px-6 py-2.5 text-strike-sm">
```

### Cards

```tsx
// ❌ Old way
<div className="bg-white border border-gray-200 p-4 hover:shadow-md">

// ✅ New way
<div className="strike-card">
// or with Tailwind
<div className="bg-surface border border-border p-4 hover:shadow-md">
```

### Form Inputs

```tsx
// ❌ Old way
<input className="border border-gray-300 px-3 py-2 text-sm">

// ✅ New way
<input className="border border-border-interactive px-3 py-2 text-base">
```

## 5. Z-Index Migration

```tsx
// ❌ Old way
<div style={{ zIndex: 50 }}>
<div className="z-[100]">

// ✅ New way
<div className="z-dropdown">
<div className="z-sticky">
```

### Z-Index Scale

| Value | Token | Class | Use Case |
|-------|-------|-------|----------|
| 0 | `--z-base` | `z-0` | Base content |
| 10 | `--z-raised` | `z-10` | Raised elements |
| 50 | `--z-dropdown` | `z-dropdown` | Dropdowns |
| 100 | `--z-sticky` | `z-sticky` | Sticky headers |
| 200 | `--z-fixed` | `z-fixed` | Fixed navigation |
| 300 | `--z-modal-backdrop` | `z-backdrop` | Modal backdrop |
| 400 | `--z-modal` | `z-modal` | Modals |
| 500 | `--z-notification` | `z-notification` | Toasts |
| 600 | `--z-tooltip` | `z-tooltip` | Tooltips |

## 6. Animation Duration Migration

```tsx
// ❌ Old way
<div className="transition-all duration-200">
<div style={{ transition: 'all 0.3s ease' }}>

// ✅ New way
<div className="transition-all duration-200"> // Already uses token
<div className="transition-all duration-300">
```

## 7. Common Patterns

### Touch Targets

```tsx
// ❌ Old way
<button className="min-h-[44px] min-w-[44px]">

// ✅ New way
<button className="touch-target">
// or for larger targets
<button className="touch-target-lg">
```

### Safe Areas

```tsx
// ❌ Old way
<div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

// ✅ New way
<div className="safe-bottom">
// or for all sides
<div className="safe-all">
```

### Responsive Typography

```tsx
// ❌ Old way
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// ✅ New way (automatic with clamp)
<h1 className="text-4xl">
```

## 8. ESLint Rules

The new ESLint configuration will catch:
- Hardcoded pixel values in style props
- Arbitrary Tailwind values
- Direct color references (black/white)
- Inline styles

## 9. Quick Checklist

When migrating a component:

- [ ] Replace all color classes with semantic tokens
- [ ] Convert hardcoded spacing to token classes
- [ ] Update typography to use fluid scales
- [ ] Replace z-index values with token classes
- [ ] Remove arbitrary Tailwind values
- [ ] Update animations to use duration tokens
- [ ] Ensure touch targets meet minimum sizes
- [ ] Test in both light and dark modes

## 10. VSCode Snippets

Add these to your VSCode snippets for faster migration:

```json
{
  "Strike Button": {
    "prefix": "sbtn",
    "body": "className=\"strike-button\"",
    "description": "Strike button class"
  },
  "Strike Card": {
    "prefix": "scard",
    "body": "className=\"strike-card\"",
    "description": "Strike card class"
  },
  "Touch Target": {
    "prefix": "touch",
    "body": "className=\"touch-target\"",
    "description": "Touch target minimum size"
  }
}
```

## Need Help?

- Check `/styles/tokens/design-tokens.css` for all available tokens
- Use the browser DevTools to inspect CSS variable values
- Run `npm run lint` to catch migration issues
- Ask in #frontend-team for specific migration questions