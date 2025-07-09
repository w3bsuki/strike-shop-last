/**
 * STRIKE SHOP DESIGN TOKENS
 * Unified design token system - Single source of truth
 * Following 2025 best practices for semantic token architecture
 * 
 * Architecture:
 * 1. PRIMITIVE TOKENS - Raw values (colors, spacing, typography)
 * 2. SEMANTIC TOKENS - Purpose-based aliases (primary, secondary, etc.)
 * 3. COMPONENT TOKENS - Component-specific decisions
 */

// =============================================================================
// PRIMITIVE TOKENS - Foundation layer
// =============================================================================

export const primitiveTokens = {
  // Color Primitives - Strike Brand (90% Black & White)
  colors: {
    white: '#ffffff',
    black: '#000000',
    
    // Gray Scale (8% usage)
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#7f7f7f', // Strike Gray - secondary text
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    
    // Accent Colors (2% usage - strategic only)
    accent: {
      red: '#ff0000',    // Primary CTA, sale badges
      green: '#00ff00',  // Success states
      blue: '#0000ff',   // Links, info
      yellow: '#ffff00', // Warnings, highlights
    },
  },

  // Spacing Primitives - 8px base unit system
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px - Base unit
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px - Touch target
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
  },

  // Typography Primitives
  typography: {
    fontFamily: {
      display: '"Arial Black", "Helvetica Neue", Arial, sans-serif',
      sans: '"Helvetica Neue", Arial, sans-serif',
      mono: '"SF Mono", Monaco, Consolas, monospace',
    },
    fontSize: {
      xs: '0.625rem',   // 10px
      sm: '0.75rem',    // 12px
      base: '0.875rem', // 14px - Mobile body
      lg: '1rem',       // 16px
      xl: '1.25rem',    // 20px
      '2xl': '1.75rem', // 28px
      '3xl': '2.25rem', // 36px
      '4xl': '3rem',    // 48px
      '5xl': '4rem',    // 64px
      '6xl': '5rem',    // 80px
      '7xl': '6rem',    // 96px
      '8xl': '7.5rem',  // 120px
      '9xl': '10rem',   // 160px
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.1',
      snug: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
      strike: '0.05em',      // For uppercase text
      strikeWide: '0.1em',   // For bold statements
    },
  },

  // Border Radius Primitives - BALANCED DESIGN SYSTEM
  borderRadius: {
    none: '0',
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadow Primitives - Bold elevation system
  boxShadow: {
    xs: '0 2px 0 0 rgb(0 0 0 / 1)',
    sm: '0 4px 0 0 rgb(0 0 0 / 1)',
    md: '0 8px 0 0 rgb(0 0 0 / 1)',
    lg: '0 12px 0 0 rgb(0 0 0 / 1)',
    xl: '0 16px 0 0 rgb(0 0 0 / 1)',
    '2xl': '0 24px 0 0 rgb(0 0 0 / 1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.1)',
    none: '0 0 0 0 transparent',
  },

  // Animation Primitives
  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '400ms',
      slowest: '500ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
} as const;

// =============================================================================
// SEMANTIC TOKENS - Purpose-based layer
// =============================================================================

export const semanticTokens = {
  // Core Semantic Colors
  colors: {
    background: primitiveTokens.colors.white,
    foreground: primitiveTokens.colors.black,
    
    primary: {
      DEFAULT: primitiveTokens.colors.black,
      foreground: primitiveTokens.colors.white,
      hover: primitiveTokens.colors.white,
      hoverForeground: primitiveTokens.colors.black,
    },
    
    secondary: {
      DEFAULT: primitiveTokens.colors.white,
      foreground: primitiveTokens.colors.black,
      hover: primitiveTokens.colors.gray[100],
    },
    
    accent: {
      DEFAULT: primitiveTokens.colors.accent.red,
      foreground: primitiveTokens.colors.white,
      hover: '#cc0000', // Darker red
    },
    
    muted: {
      DEFAULT: primitiveTokens.colors.gray[100],
      foreground: primitiveTokens.colors.gray[500],
    },
    
    // Interactive elements
    border: primitiveTokens.colors.black,
    input: primitiveTokens.colors.black,
    ring: primitiveTokens.colors.accent.red,
    
    // Status colors
    destructive: {
      DEFAULT: primitiveTokens.colors.accent.red,
      foreground: primitiveTokens.colors.white,
    },
    success: {
      DEFAULT: primitiveTokens.colors.accent.green,
      foreground: primitiveTokens.colors.black,
    },
    warning: {
      DEFAULT: primitiveTokens.colors.accent.yellow,
      foreground: primitiveTokens.colors.black,
    },
    info: {
      DEFAULT: primitiveTokens.colors.accent.blue,
      foreground: primitiveTokens.colors.white,
    },
  },

  // Semantic Spacing
  spacing: {
    // Standard component spacing
    cardPadding: {
      mobile: primitiveTokens.spacing[4],  // 16px
      desktop: primitiveTokens.spacing[6], // 24px
    },
    buttonPadding: {
      x: primitiveTokens.spacing[4],        // 16px
      y: primitiveTokens.spacing[2],        // 8px
    },
    gridGap: {
      mobile: primitiveTokens.spacing[4],   // 16px
      desktop: primitiveTokens.spacing[6],  // 24px
    },
    sectionSpacing: {
      mobile: primitiveTokens.spacing[8],   // 32px
      desktop: primitiveTokens.spacing[16], // 64px
    },
    touchTarget: {
      min: primitiveTokens.spacing[11],     // 44px
      comfortable: primitiveTokens.spacing[12], // 48px
      large: primitiveTokens.spacing[14],   // 56px
    },
  },

  // Semantic Typography
  typography: {
    // Display hierarchy
    display: {
      xl: {
        fontSize: primitiveTokens.typography.fontSize['5xl'],
        fontWeight: primitiveTokens.typography.fontWeight.bold,
        lineHeight: primitiveTokens.typography.lineHeight.tight,
        letterSpacing: primitiveTokens.typography.letterSpacing.tight,
      },
      lg: {
        fontSize: primitiveTokens.typography.fontSize['4xl'],
        fontWeight: primitiveTokens.typography.fontWeight.bold,
        lineHeight: primitiveTokens.typography.lineHeight.tight,
      },
      md: {
        fontSize: primitiveTokens.typography.fontSize['3xl'],
        fontWeight: primitiveTokens.typography.fontWeight.bold,
        lineHeight: primitiveTokens.typography.lineHeight.tight,
      },
      sm: {
        fontSize: primitiveTokens.typography.fontSize['2xl'],
        fontWeight: primitiveTokens.typography.fontWeight.bold,
        lineHeight: primitiveTokens.typography.lineHeight.tight,
      },
    },
    
    // Body hierarchy
    body: {
      lg: {
        fontSize: primitiveTokens.typography.fontSize.lg,
        lineHeight: primitiveTokens.typography.lineHeight.relaxed,
      },
      base: {
        fontSize: primitiveTokens.typography.fontSize.base,
        lineHeight: primitiveTokens.typography.lineHeight.normal,
      },
      sm: {
        fontSize: primitiveTokens.typography.fontSize.sm,
        lineHeight: primitiveTokens.typography.lineHeight.normal,
      },
      xs: {
        fontSize: primitiveTokens.typography.fontSize.xs,
        lineHeight: primitiveTokens.typography.lineHeight.snug,
      },
    },
    
    // Strike-specific typography
    strike: {
      hero: {
        fontFamily: primitiveTokens.typography.fontFamily.display,
        fontWeight: primitiveTokens.typography.fontWeight.black,
        textTransform: 'uppercase' as const,
        letterSpacing: primitiveTokens.typography.letterSpacing.tight,
        lineHeight: '0.9',
      },
      label: {
        fontSize: primitiveTokens.typography.fontSize.xs,
        fontWeight: primitiveTokens.typography.fontWeight.bold,
        textTransform: 'uppercase' as const,
        letterSpacing: primitiveTokens.typography.letterSpacing.strikeWide,
      },
      button: {
        fontSize: primitiveTokens.typography.fontSize.xs,
        fontWeight: primitiveTokens.typography.fontWeight.bold,
        textTransform: 'uppercase' as const,
        letterSpacing: primitiveTokens.typography.letterSpacing.strike,
      },
      nav: {
        fontSize: primitiveTokens.typography.fontSize.xs,
        fontWeight: primitiveTokens.typography.fontWeight.medium,
        textTransform: 'uppercase' as const,
        letterSpacing: primitiveTokens.typography.letterSpacing.strike,
      },
    },
  },

  // Semantic Border Radius - BALANCED DESIGN SYSTEM
  borderRadius: {
    // Sharp (0-2px) - Content & Structure
    card: primitiveTokens.borderRadius.none,      // Product/category cards
    image: primitiveTokens.borderRadius.none,     // Product images
    section: primitiveTokens.borderRadius.none,   // Page sections
    table: primitiveTokens.borderRadius.none,     // Data tables
    code: primitiveTokens.borderRadius.xs,        // Code blocks

    // Rounded (6-12px) - Interactive Elements
    button: primitiveTokens.borderRadius.lg,      // All buttons (8px)
    buttonLarge: primitiveTokens.borderRadius.xl, // Large CTAs (12px)
    input: primitiveTokens.borderRadius.md,       // Form inputs (6px)
    select: primitiveTokens.borderRadius.md,      // Dropdowns (6px)
    checkbox: primitiveTokens.borderRadius.xs,    // Checkboxes (2px)
    switch: primitiveTokens.borderRadius.full,    // Toggle switches

    // Minimal (4-6px) - UI Elements
    dropdown: primitiveTokens.borderRadius.sm,    // Dropdown menus (4px)
    tooltip: primitiveTokens.borderRadius.sm,     // Tooltips (4px)
    popover: primitiveTokens.borderRadius.md,     // Popovers (6px)
    modal: primitiveTokens.borderRadius.lg,       // Modal dialogs (8px)
    alert: primitiveTokens.borderRadius.md,       // Alert boxes (6px)
    toast: primitiveTokens.borderRadius.md,       // Toast notifications (6px)

    // Special - Brand Elements
    badge: primitiveTokens.borderRadius.full,     // Pills/badges
    avatar: primitiveTokens.borderRadius.full,    // User avatars
    iconButton: primitiveTokens.borderRadius.md,  // Icon-only buttons (6px)
    tag: primitiveTokens.borderRadius.sm,         // Tags/chips (4px)
  },
} as const;

// =============================================================================
// COMPONENT TOKENS - Component-specific layer
// =============================================================================

export const componentTokens = {
  // Product Card Component
  productCard: {
    aspectRatio: '3/4',                          // Fixed: was conflicting with CSS
    padding: semanticTokens.spacing.cardPadding.mobile,
    paddingDesktop: semanticTokens.spacing.cardPadding.desktop,
    borderRadius: semanticTokens.borderRadius.card,
    gap: primitiveTokens.spacing[3],             // 12px between elements
    
    // Product card variants
    variants: {
      default: {
        background: semanticTokens.colors.background,
        border: `1px solid transparent`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      hover: {
        borderColor: semanticTokens.colors.border,
        transform: 'translateY(-8px)',
        boxShadow: primitiveTokens.boxShadow.lg,
      },
    },
  },

  // Grid System Component
  grid: {
    // Perfect mobile-first grid
    columns: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
    },
    gap: {
      mobile: primitiveTokens.spacing[3],        // 12px - tight like hero
      tablet: primitiveTokens.spacing[4],        // 16px
      desktop: primitiveTokens.spacing[6],       // 24px
    },
    container: {
      maxWidth: '1440px',
      padding: {
        mobile: primitiveTokens.spacing[4],      // 16px
        tablet: primitiveTokens.spacing[4],      // 16px
        desktop: primitiveTokens.spacing[6],     // 24px
      },
    },
  },

  // Button Component
  button: {
    height: semanticTokens.spacing.touchTarget.large, // 56px
    borderWidth: '2px',
    borderRadius: semanticTokens.borderRadius.button,
    padding: {
      x: semanticTokens.spacing.buttonPadding.x,
      y: semanticTokens.spacing.buttonPadding.y,
    },
    typography: semanticTokens.typography.strike.button,
    
    variants: {
      primary: {
        background: semanticTokens.colors.primary.DEFAULT,
        color: semanticTokens.colors.primary.foreground,
        borderColor: 'transparent',
        hover: {
          background: semanticTokens.colors.primary.hover,
          color: semanticTokens.colors.primary.hoverForeground,
          borderColor: semanticTokens.colors.border,
          transform: 'translateY(-2px)',
          boxShadow: primitiveTokens.boxShadow.md,
        },
      },
      secondary: {
        background: 'transparent',
        color: semanticTokens.colors.primary.DEFAULT,
        borderColor: semanticTokens.colors.border,
        hover: {
          background: semanticTokens.colors.primary.DEFAULT,
          color: semanticTokens.colors.primary.foreground,
          transform: 'translateY(-2px)',
          boxShadow: primitiveTokens.boxShadow.md,
        },
      },
    },
  },

  // Input Component
  input: {
    height: semanticTokens.spacing.touchTarget.large, // 56px
    borderWidth: '2px',
    borderRadius: semanticTokens.borderRadius.input,
    padding: {
      x: primitiveTokens.spacing[5],              // 20px
      y: primitiveTokens.spacing[4],              // 16px
    },
    fontSize: primitiveTokens.typography.fontSize.base,
    
    states: {
      default: {
        background: semanticTokens.colors.background,
        borderColor: semanticTokens.colors.border,
      },
      focus: {
        borderColor: semanticTokens.colors.ring,
        boxShadow: `0 0 0 1px ${semanticTokens.colors.ring}`,
      },
    },
  },

  // Section Component
  section: {
    spacing: {
      mobile: semanticTokens.spacing.sectionSpacing.mobile,
      desktop: semanticTokens.spacing.sectionSpacing.desktop,
    },
    container: {
      maxWidth: '1440px',
      padding: {
        mobile: primitiveTokens.spacing[4],      // 16px
        tablet: primitiveTokens.spacing[4],      // 16px
        desktop: primitiveTokens.spacing[6],     // 24px
      },
    },
  },
} as const;

// =============================================================================
// BREAKPOINTS - Responsive design
// =============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// EXPORTS - Unified token system
// =============================================================================

export const designTokens = {
  primitive: primitiveTokens,
  semantic: semanticTokens,
  component: componentTokens,
  breakpoints,
} as const;

// Type exports for TypeScript safety
export type PrimitiveTokens = typeof primitiveTokens;
export type SemanticTokens = typeof semanticTokens;
export type ComponentTokens = typeof componentTokens;
export type DesignTokens = typeof designTokens;

// Helper functions for token access
export const getToken = {
  // Spacing helpers
  spacing: (key: keyof typeof primitiveTokens.spacing) => primitiveTokens.spacing[key],
  
  // Color helpers
  color: (path: string) => {
    const keys = path.split('.');
    let value: any = semanticTokens.colors;
    for (const key of keys) {
      value = value[key];
    }
    return value;
  },
  
  // Typography helpers
  fontSize: (key: keyof typeof primitiveTokens.typography.fontSize) => 
    primitiveTokens.typography.fontSize[key],
  
  // Component token helpers
  component: (component: keyof typeof componentTokens, path: string) => {
    const keys = path.split('.');
    let value: any = componentTokens[component];
    for (const key of keys) {
      value = value[key];
    }
    return value;
  },
} as const;