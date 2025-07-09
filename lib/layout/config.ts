/**
 * STRIKE SHOP UNIFIED LAYOUT SYSTEM
 * Mobile-first responsive design with consistent spacing
 * Now using design tokens for single source of truth
 * Updated: 2025-01-07 - Integrated with design token system
 */

import { designTokens } from '@/lib/design-tokens';

export const layoutConfig = {
  // Container configuration - using design tokens
  container: {
    maxWidth: designTokens.component.grid.container.maxWidth,
    padding: {
      mobile: designTokens.component.grid.container.padding.mobile,
      tablet: designTokens.component.grid.container.padding.tablet,
      desktop: designTokens.component.grid.container.padding.desktop,
    },
  },

  // Section spacing (vertical rhythm) - using design tokens
  section: {
    padding: {
      // Consistent spacing for ALL sections
      mobile: {
        y: designTokens.semantic.spacing.sectionSpacing.mobile,
      },
      tablet: {
        y: designTokens.semantic.spacing.sectionSpacing.desktop,
      },
      desktop: {
        y: designTokens.semantic.spacing.sectionSpacing.desktop,
      },
    },
    // Special sections (hero, footer)
    hero: {
      height: {
        mobile: '70vh',
        tablet: '80vh',
        desktop: '90vh',
      },
      minHeight: {
        mobile: '500px',
        tablet: '600px',
        desktop: '700px',
      },
    },
  },

  // Component spacing - using design tokens
  components: {
    // Product grid gaps
    productGrid: {
      gap: {
        mobile: designTokens.component.grid.gap.mobile,
        tablet: designTokens.component.grid.gap.tablet,
        desktop: designTokens.component.grid.gap.desktop,
      },
      columns: {
        mobile: designTokens.component.grid.columns.mobile,
        tablet: designTokens.component.grid.columns.tablet,
        desktop: designTokens.component.grid.columns.desktop,
      },
    },
    // Category grid - same as product grid for consistency
    categoryGrid: {
      gap: {
        mobile: designTokens.component.grid.gap.mobile,
        tablet: designTokens.component.grid.gap.tablet,
        desktop: designTokens.component.grid.gap.desktop,
      },
      columns: {
        mobile: designTokens.component.grid.columns.mobile,
        tablet: designTokens.component.grid.columns.tablet,
        desktop: designTokens.component.grid.columns.desktop,
      },
    },
  },

  // Typography spacing - using design tokens
  typography: {
    sectionTitle: {
      marginBottom: {
        mobile: designTokens.primitive.spacing[6],  // 24px
        tablet: designTokens.primitive.spacing[8],  // 32px
        desktop: designTokens.primitive.spacing[10], // 40px
      },
    },
  },

  // Breakpoints (Tailwind defaults)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// PERFECTED MOBILE LAYOUT SYSTEM - USING DESIGN TOKENS
// Mobile: tight spacing like hero categories, Desktop: more breathing room

export const SPACING = {
  // Section spacing using design tokens
  section: {
    vertical: 'py-8 md:py-16', // Using design token values
  },
  
  // Header to product spacing using tokens
  headerToProduct: 'mb-3 md:mb-6', // 12px mobile → 24px desktop
  
  // Product gaps using design tokens - tight like hero
  productGap: 'gap-3 md:gap-4 lg:gap-6', // 12px → 16px → 24px (matches design tokens)
  
  // Container padding using design tokens
  containerPadding: 'px-4 lg:px-6', // 16px → 24px (matches design tokens)
  
  // FIXED: Simplified card sizing using design tokens
  productCard: {
    // Mobile: Perfect 2 cards per row, no complex calculations
    mobile: 'min-w-[140px]', // Simple minimum width
    desktop: 'w-48 md:w-56 lg:w-64', // Progressive sizing
  },
} as const;

// PERFECTED LAYOUT CLASSES - USING DESIGN TOKENS
export const layoutClasses = {
  // Container using design tokens
  container: `w-full max-w-[${designTokens.component.grid.container.maxWidth}] mx-auto ${SPACING.containerPadding}`,
  
  // Container variants
  containerNarrow: `w-full max-w-4xl mx-auto ${SPACING.containerPadding}`,
  containerWide: `w-full max-w-6xl mx-auto ${SPACING.containerPadding}`,
  containerFull: 'w-full',
  
  // Section spacing using design tokens
  section: SPACING.section.vertical,
  
  // PERFECTED PRODUCT GRIDS - using CVA variants
  productGrid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${SPACING.productGap}`,
  productScroll: `flex overflow-x-auto ${SPACING.productGap} scrollbar-hide`,
  
  // SIMPLIFIED CARD SIZING - no more complex calculations
  productCard: {
    carousel: `flex-shrink-0 ${SPACING.productCard.mobile} ${SPACING.productCard.desktop} snap-start`,
    grid: `w-full aspect-[3/4]`, // Fixed aspect ratio from design tokens
  },
  
  // Category grid matching product grid
  categoryGrid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${SPACING.productGap}`,
  
  // Header spacing using design tokens
  headerSpacing: SPACING.headerToProduct,
  
  // Section title with design token typography
  sectionTitle: 'text-lg md:text-2xl lg:text-3xl font-bold tracking-tight mb-3 md:mb-6 lg:mb-8',
  
  // Modern container breakout
  breakout: 'w-dvw relative left-1/2 -translate-x-1/2 max-w-none',
  
  // Full width section
  fullWidth: 'w-full',
  
  // Hero section using design tokens
  hero: 'relative w-full h-[70vh] md:h-[80vh] lg:h-[90vh] min-h-[500px] md:min-h-[600px] lg:min-h-[700px]',
  
  // Background patterns
  strikePattern: 'absolute inset-0 opacity-[0.08] pointer-events-none',
} as const;

// PERFECT HELPER FUNCTIONS - No more variations, everything is consistent

// Get PERFECT section spacing (always the same)
export function getPerfectSectionSpacing() {
  return layoutClasses.section;
}

// Get PERFECT header spacing (always the same)
export function getPerfectHeaderSpacing() {
  return layoutClasses.headerSpacing;
}

// Get PERFECT product card classes
export function getPerfectProductCardClasses(layout: 'carousel' | 'grid' = 'carousel') {
  return layout === 'carousel' 
    ? layoutClasses.productCard.carousel 
    : layoutClasses.productCard.grid;
}

// Get PERFECT product container classes
export function getPerfectProductContainerClasses(layout: 'scroll' | 'grid' = 'scroll') {
  return layout === 'scroll' 
    ? layoutClasses.productScroll 
    : layoutClasses.productGrid;
}

// Helper function to get container variant
export function getContainerClasses(variant: 'default' | 'narrow' | 'wide' | 'full' = 'default') {
  switch (variant) {
    case 'narrow':
      return layoutClasses.containerNarrow;
    case 'wide':
      return layoutClasses.containerWide;
    case 'full':
      return layoutClasses.containerFull;
    default:
      return layoutClasses.container;
  }
}

// Modern breakout utility - replaces negative margin hacks
export function getBreakoutClasses(className?: string) {
  return className ? `${layoutClasses.breakout} ${className}` : layoutClasses.breakout;
}

