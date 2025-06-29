/**
 * Strike Shop Design System Tokens
 * Centralized design tokens for consistent theming and styling
 */

// ============================================================================
// Typography Tokens
// ============================================================================

export const typography = {
  // Font families
  fontFamily: {
    base: '"Typewriter", "Courier Prime", ui-monospace, monospace',
    display: '"Typewriter", "Courier Prime", ui-monospace, monospace',
    mono: '"Typewriter", "Courier Prime", ui-monospace, monospace',
  },
  
  // Font sizes with responsive clamp
  fontSize: {
    xs: 'clamp(0.625rem, 0.5rem + 0.5vw, 0.75rem)',
    sm: 'clamp(0.75rem, 0.625rem + 0.5vw, 0.875rem)',
    base: 'clamp(0.875rem, 0.75rem + 0.5vw, 1rem)',
    lg: 'clamp(1rem, 0.875rem + 0.5vw, 1.125rem)',
    xl: 'clamp(1.125rem, 1rem + 0.5vw, 1.25rem)',
    '2xl': 'clamp(1.25rem, 1.125rem + 0.75vw, 1.5rem)',
    '3xl': 'clamp(1.5rem, 1.25rem + 1vw, 1.875rem)',
    '4xl': 'clamp(1.875rem, 1.5rem + 1.5vw, 2.25rem)',
    '5xl': 'clamp(2.25rem, 1.875rem + 2vw, 3rem)',
    '6xl': 'clamp(3rem, 2.25rem + 3vw, 3.75rem)',
  },
  
  // Line heights
  lineHeight: {
    tight: '1.1',
    snug: '1.2',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.75',
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    strike: '0.1em',
    strikeWide: '0.15em',
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ============================================================================
// Spacing Tokens
// ============================================================================

export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  // Touch targets
  touch: '2.75rem', // 44px - minimum touch target
  touchLg: '3rem',  // 48px - comfortable touch target
} as const;

// ============================================================================
// Color Tokens
// ============================================================================

export const colors = {
  // Strike brand colors
  strike: {
    black: 'hsl(0 0% 0%)',
    white: 'hsl(0 0% 100%)',
    gray: {
      50: 'hsl(0 0% 98%)',
      100: 'hsl(0 0% 96%)',
      200: 'hsl(0 0% 90%)',
      300: 'hsl(0 0% 80%)',
      400: 'hsl(0 0% 65%)',
      500: 'hsl(0 0% 50%)',
      600: 'hsl(0 0% 40%)',
      700: 'hsl(0 0% 30%)',
      800: 'hsl(0 0% 20%)',
      900: 'hsl(0 0% 10%)',
      950: 'hsl(0 0% 5%)',
    },
  },
  
  // Semantic colors
  semantic: {
    error: 'hsl(0 84% 60%)',
    warning: 'hsl(38 92% 50%)',
    success: 'hsl(142 71% 45%)',
    info: 'hsl(210 100% 50%)',
  },
} as const;

// ============================================================================
// Border Radius Tokens
// ============================================================================

export const borderRadius = {
  none: '0',
  subtle: '2px',
  soft: '4px',
} as const;

// ============================================================================
// Shadow Tokens
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// ============================================================================
// Animation Tokens
// ============================================================================

export const animation = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ============================================================================
// Z-Index Tokens
// ============================================================================

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ============================================================================
// Breakpoint Tokens
// ============================================================================

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// CSS Custom Properties Generator
// ============================================================================

export function generateCSSVariables(): string {
  const cssVars: string[] = [];
  
  // Typography variables
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    cssVars.push(`--font-size-${key}: ${value};`);
  });
  
  Object.entries(typography.lineHeight).forEach(([key, value]) => {
    cssVars.push(`--line-height-${key}: ${value};`);
  });
  
  Object.entries(typography.letterSpacing).forEach(([key, value]) => {
    cssVars.push(`--letter-spacing-${key}: ${value};`);
  });
  
  // Spacing variables
  Object.entries(spacing).forEach(([key, value]) => {
    const varKey = key.replace('.', '-');
    cssVars.push(`--space-${varKey}: ${value};`);
  });
  
  // Color variables
  cssVars.push(`--color-strike-black: ${colors.strike.black};`);
  cssVars.push(`--color-strike-white: ${colors.strike.white};`);
  
  Object.entries(colors.strike.gray).forEach(([key, value]) => {
    cssVars.push(`--color-strike-gray-${key}: ${value};`);
  });
  
  Object.entries(colors.semantic).forEach(([key, value]) => {
    cssVars.push(`--color-${key}: ${value};`);
  });
  
  // Border radius variables
  Object.entries(borderRadius).forEach(([key, value]) => {
    cssVars.push(`--radius-${key}: ${value};`);
  });
  
  // Shadow variables
  Object.entries(shadows).forEach(([key, value]) => {
    cssVars.push(`--shadow-${key}: ${value};`);
  });
  
  // Animation variables
  Object.entries(animation.duration).forEach(([key, value]) => {
    cssVars.push(`--duration-${key}: ${value};`);
  });
  
  Object.entries(animation.easing).forEach(([key, value]) => {
    cssVars.push(`--easing-${key}: ${value};`);
  });
  
  // Z-index variables
  Object.entries(zIndex).forEach(([key, value]) => {
    cssVars.push(`--z-${key}: ${value};`);
  });
  
  return cssVars.join('\n  ');
}

// ============================================================================
// TypeScript Types
// ============================================================================

export type FontSize = keyof typeof typography.fontSize;
export type LineHeight = keyof typeof typography.lineHeight;
export type LetterSpacing = keyof typeof typography.letterSpacing;
export type FontWeight = keyof typeof typography.fontWeight;
export type SpacingScale = keyof typeof spacing;
export type ColorScale = keyof typeof colors.strike.gray;
export type SemanticColor = keyof typeof colors.semantic;
export type BorderRadiusScale = keyof typeof borderRadius;
export type ShadowScale = keyof typeof shadows;
export type AnimationDuration = keyof typeof animation.duration;
export type AnimationEasing = keyof typeof animation.easing;
export type ZIndexScale = keyof typeof zIndex;
export type Breakpoint = keyof typeof breakpoints;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a spacing value by key
 */
export function getSpacing(key: SpacingScale): string {
  return spacing[key];
}

/**
 * Get a color value by path
 */
export function getColor(path: string): string {
  const parts = path.split('.');
  let value: any = colors;
  
  for (const part of parts) {
    if (value[part]) {
      value = value[part];
    } else {
      console.warn(`Color path "${path}" not found`);
      return '';
    }
  }
  
  return typeof value === 'string' ? value : '';
}

/**
 * Get a typography value
 */
export function getTypography(property: 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontWeight', key: string): string {
  return (typography[property] as any)[key] || '';
}

/**
 * Create a responsive font size CSS variable
 */
export function responsiveFontSize(size: FontSize): string {
  return `var(--font-size-${size})`;
}

/**
 * Create a spacing CSS variable
 */
export function spacingVar(size: SpacingScale): string {
  const varKey = String(size).replace('.', '-');
  return `var(--space-${varKey})`;
}

/**
 * Create a color CSS variable
 */
export function colorVar(path: string): string {
  return `var(--color-${path.replace(/\./g, '-')})`;
}

// ============================================================================
// Media Query Helpers
// ============================================================================

export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  
  // Utility queries
  touch: '@media (hover: none) and (pointer: coarse)',
  mouse: '@media (hover: hover) and (pointer: fine)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  highContrast: '@media (prefers-contrast: high)',
  darkMode: '@media (prefers-color-scheme: dark)',
} as const;

// ============================================================================
// Component Token Presets
// ============================================================================

export const componentTokens = {
  button: {
    height: {
      sm: spacing[8],    // 32px
      base: spacing[10], // 40px
      lg: spacing[12],   // 48px
    },
    padding: {
      sm: `${spacing[2]} ${spacing[4]}`,
      base: `${spacing[2.5]} ${spacing[6]}`,
      lg: `${spacing[3]} ${spacing[8]}`,
    },
    fontSize: {
      sm: typography.fontSize.xs,
      base: typography.fontSize.sm,
      lg: typography.fontSize.base,
    },
  },
  
  input: {
    height: {
      sm: spacing[8],    // 32px
      base: spacing[10], // 40px
      lg: spacing[12],   // 48px
    },
    padding: {
      sm: `${spacing[1.5]} ${spacing[3]}`,
      base: `${spacing[2]} ${spacing[3]}`,
      lg: `${spacing[2.5]} ${spacing[4]}`,
    },
    fontSize: {
      sm: typography.fontSize.sm,
      base: typography.fontSize.base,
      lg: typography.fontSize.lg,
    },
  },
  
  card: {
    padding: {
      sm: spacing[3],
      base: spacing[4],
      lg: spacing[6],
    },
    gap: {
      sm: spacing[2],
      base: spacing[3],
      lg: spacing[4],
    },
  },
} as const;

export default {
  typography,
  spacing,
  colors,
  borderRadius,
  shadows,
  animation,
  zIndex,
  breakpoints,
  generateCSSVariables,
  getSpacing,
  getColor,
  getTypography,
  responsiveFontSize,
  spacingVar,
  colorVar,
  mediaQueries,
  componentTokens,
};