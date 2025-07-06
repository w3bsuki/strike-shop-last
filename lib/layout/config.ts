/**
 * STRIKE SHOP UNIFIED LAYOUT SYSTEM
 * Mobile-first responsive design with consistent spacing
 * All sections use the same padding, margins, and containers
 */

export const layoutConfig = {
  // Container configuration
  container: {
    maxWidth: '1440px', // Slightly smaller for better readability
    padding: {
      mobile: '1rem',    // 16px
      tablet: '1.5rem',  // 24px 
      desktop: '2rem',   // 32px
    },
  },

  // Section spacing (vertical rhythm)
  section: {
    padding: {
      // Consistent spacing for ALL sections
      mobile: {
        y: '3rem',  // 48px top/bottom
      },
      tablet: {
        y: '4rem',  // 64px top/bottom
      },
      desktop: {
        y: '5rem',  // 80px top/bottom
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

  // Component spacing
  components: {
    // Product grid gaps
    productGrid: {
      gap: {
        mobile: '1rem',    // 16px
        tablet: '1.5rem',  // 24px
        desktop: '2rem',   // 32px
      },
      columns: {
        mobile: 2,
        tablet: 3,
        desktop: 4,
      },
    },
    // Category grid
    categoryGrid: {
      gap: {
        mobile: '1rem',
        tablet: '1.5rem', 
        desktop: '2rem',
      },
      columns: {
        mobile: 2,
        tablet: 3,
        desktop: 4,
      },
    },
  },

  // Typography spacing
  typography: {
    sectionTitle: {
      marginBottom: {
        mobile: '1.5rem',  // 24px
        tablet: '2rem',    // 32px
        desktop: '2.5rem', // 40px
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

// TIGHT MOBILE LAYOUT SYSTEM - MATCHES HERO GRID
// Mobile: tight spacing like hero categories, Desktop: more breathing room

export const SPACING = {
  // TIGHT mobile spacing that matches hero categories (py-6 px-4 = 24px vertical, 16px horizontal)
  section: {
    // Much tighter sections on mobile, matches hero
    vertical: 'py-4 md:py-12 lg:py-16', // 16px mobile → 48px tablet → 64px desktop
  },
  
  // Minimal header to product spacing 
  headerToProduct: 'mb-2 md:mb-6', // 8px mobile → 24px desktop
  
  // Tight product gaps matching hero categories
  productGap: 'gap-3 md:gap-4 lg:gap-6', // 12px mobile → 16px tablet → 24px desktop
  
  // Minimal container padding like hero
  containerPadding: 'px-4 sm:px-4 lg:px-6', // 16px mobile → 16px tablet → 24px desktop
  
  // Perfect 2x grid card sizing for mobile
  productCard: {
    // Mobile: Show 2.2 cards for better scroll indication
    mobile: 'w-[45vw] max-w-[200px]', // Show 2+ cards on mobile
    desktop: 'w-48 md:w-56 lg:w-64', // 192px → 224px → 256px desktop
  },
} as const;

// TIGHT MOBILE LAYOUT CLASSES - MATCHES HERO
export const layoutClasses = {
  // Tight container padding like hero
  container: `w-full max-w-[1440px] mx-auto ${SPACING.containerPadding}`,
  
  // Container variants
  containerNarrow: `w-full max-w-4xl mx-auto ${SPACING.containerPadding}`,
  containerWide: `w-full max-w-6xl mx-auto ${SPACING.containerPadding}`,
  containerFull: 'w-full',
  
  // TIGHT SECTION SPACING - matches hero tight layout
  section: SPACING.section.vertical,
  
  // TIGHT PRODUCT SPACING - matches hero categories
  productGrid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${SPACING.productGap}`,
  productScroll: `flex overflow-x-auto ${SPACING.productGap}`,
  
  // PERFECT 2X CARD SIZING - optimized for mobile grid
  productCard: {
    // Mobile: perfect 2x grid, Desktop: larger carousel cards
    carousel: `flex-shrink-0 ${SPACING.productCard.mobile} ${SPACING.productCard.desktop} snap-start`,
    grid: `w-full`, // Always use full width of grid cell
  },
  
  // Category grid with tight spacing
  categoryGrid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${SPACING.productGap}`,
  
  // TIGHT HEADER SPACING - minimal on mobile
  headerSpacing: SPACING.headerToProduct,
  
  // Section title
  sectionTitle: 'text-lg md:text-2xl lg:text-3xl font-bold tracking-tight mb-2 md:mb-6 lg:mb-8',
  
  // Modern container breakout (replaces negative margin hacks)
  breakout: 'w-dvw relative left-1/2 -translate-x-1/2 max-w-none',
  
  // Full width section (no container)
  fullWidth: 'w-full',
  
  // Hero section
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

