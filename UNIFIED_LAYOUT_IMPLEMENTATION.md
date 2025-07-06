# Unified Layout System Implementation

## Overview
Implemented a consistent, mobile-first layout system across the Strike Shop e-commerce site to fix inconsistent spacing and create a uniform UI/UX.

## Key Changes

### 1. Created Unified Layout Configuration
- **File**: `/lib/layout/config.ts`
- **Container**: Max-width 1440px (reduced from 1600px for better readability)
- **Container Padding**: 16px → 24px → 32px (mobile → tablet → desktop)
- **Section Padding**: 48px → 64px → 80px (mobile → tablet → desktop)

### 2. Created Reusable Layout Components
- **File**: `/components/layout/section.tsx`
- **Components**:
  - `Section`: Unified wrapper for all page sections
  - `SectionTitle`: Consistent typography for section headings
  - `Container`: Standalone container component

### 3. Updated All Section Components
- `ProductSection` → Now uses unified `Section` component
- `CategorySection` → Now uses unified `Section` component
- `PromoSection` → Now uses unified `Section` component
- `SocialProofSection` → Now uses unified `Section` component
- `Footer` → Now uses unified `Section` component
- `SiteHeader` → Now uses unified container classes

### 4. Updated Hero Configuration
- **File**: `/config/hero.ts`
- **Heights**: More generous viewport heights with min-height constraints
- **Mobile-first**: 70vh → 80vh → 90vh with minimum heights

### 5. Replaced Legacy Container
- Old `strike-container` class replaced with new unified system
- Maintained backward compatibility during transition

## Benefits

### Consistency
- All sections now have the same padding and spacing
- Uniform container width across the site
- Consistent breakpoint usage

### Mobile-First Design
- Proper scaling from mobile to desktop
- Touch-friendly spacing on mobile devices
- Optimal reading width on desktop

### Maintainability
- Single source of truth for layout values
- Easy to adjust spacing globally
- Reusable components reduce duplication

## Usage

```tsx
// Basic section with container
<Section>
  <h2>Section Title</h2>
  <p>Content goes here</p>
</Section>

// Section with custom size
<Section size="lg">
  <h2>Large Section</h2>
</Section>

// Full-width section (no container)
<Section fullWidth>
  <HeroImage />
</Section>

// Section with background
<Section className="bg-black text-white">
  <h2>Dark Section</h2>
</Section>
```

## Layout Values Reference

### Container
- **Max Width**: 1440px
- **Padding**:
  - Mobile: 16px (1rem)
  - Tablet: 24px (1.5rem)
  - Desktop: 32px (2rem)

### Section Spacing
- **Small** (`size="sm"`):
  - Mobile: 32px (2rem)
  - Tablet: 48px (3rem)
  - Desktop: 64px (4rem)

- **Default** (`size="default"`):
  - Mobile: 48px (3rem)
  - Tablet: 64px (4rem)
  - Desktop: 80px (5rem)

- **Large** (`size="lg"`):
  - Mobile: 64px (4rem)
  - Tablet: 80px (5rem)
  - Desktop: 96px (6rem)

### Hero Heights
- **Small**: 60vh / 70vh / 80vh (min: 400px / 500px / 600px)
- **Default**: 70vh / 80vh / 85vh (min: 500px / 600px / 700px)
- **Large**: 80vh / 85vh / 90vh (min: 600px / 700px / 800px)
- **Full**: 100vh (min: 600px)

## Next Steps
1. Remove legacy `strike-container` references after full migration
2. Add more layout utilities as needed (e.g., grid layouts)
3. Consider adding layout presets for common patterns
4. Document in component library