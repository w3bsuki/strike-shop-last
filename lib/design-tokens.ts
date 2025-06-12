/**
 * Design Token System for Strike Shop
 * Centralized design tokens following best practices
 */

export const tokens = {
  // Typography
  fonts: {
    base: '"Inter", system-ui, sans-serif',
    mono: '"Typewriter", "Courier Prime", ui-monospace, monospace',
    display: '"Typewriter", "Courier Prime", ui-monospace, monospace',
  },

  // Font Sizes with line heights and letter spacing
  fontSize: {
    'xs': { size: '0.75rem', lineHeight: '1rem', letterSpacing: '0.05em' },
    'sm': { size: '0.875rem', lineHeight: '1.25rem', letterSpacing: '0.025em' },
    'base': { size: '1rem', lineHeight: '1.5rem', letterSpacing: '0' },
    'lg': { size: '1.125rem', lineHeight: '1.75rem', letterSpacing: '-0.025em' },
    'xl': { size: '1.25rem', lineHeight: '1.75rem', letterSpacing: '-0.025em' },
    '2xl': { size: '1.5rem', lineHeight: '2rem', letterSpacing: '-0.05em' },
    '3xl': { size: '1.875rem', lineHeight: '2.25rem', letterSpacing: '-0.05em' },
    '4xl': { size: '2.25rem', lineHeight: '2.5rem', letterSpacing: '-0.075em' },
    '5xl': { size: '3rem', lineHeight: '1.2', letterSpacing: '-0.075em' },
    '6xl': { size: '3.75rem', lineHeight: '1.1', letterSpacing: '-0.1em' },
    // Strike-specific sizes
    'strike-xs': { size: '0.625rem', lineHeight: '0.875rem', letterSpacing: '0.1em', fontWeight: '700' },
    'strike-sm': { size: '0.75rem', lineHeight: '1rem', letterSpacing: '0.1em', fontWeight: '700' },
    'strike-base': { size: '0.875rem', lineHeight: '1.25rem', letterSpacing: '0.05em', fontWeight: '500' },
  },

  // Spacing Scale
  spacing: {
    '0': '0',
    'px': '1px',
    '0.5': '0.125rem',
    '1': '0.25rem',
    '1.5': '0.375rem',
    '2': '0.5rem',
    '2.5': '0.625rem',
    '3': '0.75rem',
    '3.5': '0.875rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '7': '1.75rem',
    '8': '2rem',
    '9': '2.25rem',
    '10': '2.5rem',
    '11': '2.75rem',
    '12': '3rem',
    '14': '3.5rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
    '28': '7rem',
    '32': '8rem',
    '36': '9rem',
    '40': '10rem',
    '44': '11rem',
    '48': '12rem',
    '52': '13rem',
    '56': '14rem',
    '60': '15rem',
    '64': '16rem',
    '72': '18rem',
    '80': '20rem',
    '96': '24rem',
  },

  // Border Radius
  borderRadius: {
    'none': '0',
    'sm': '0.125rem',
    'base': '0.25rem',
    'md': '0.375rem',
    'lg': '0.5rem',
    'xl': '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    'full': '9999px',
  },

  // Shadows
  shadows: {
    'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'base': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'md': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'lg': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    'xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
    'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    'none': '0 0 #0000',
  },

  // Transitions
  transitions: {
    'fast': '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    'base': '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    'slow': '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    'slower': '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Z-index Scale
  zIndex: {
    'base': 0,
    'dropdown': 1000,
    'sticky': 1020,
    'fixed': 1030,
    'modalBackdrop': 1040,
    'modal': 1050,
    'popover': 1060,
    'tooltip': 1070,
  },

  // Breakpoints
  breakpoints: {
    'xs': '475px',
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px',
  },

  // Container
  container: {
    'xs': '475px',
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px',
    'fluid': '100%',
  },

  // Aspect Ratios
  aspectRatio: {
    'square': '1 / 1',
    'video': '16 / 9',
    'portrait': '3 / 4',
    'landscape': '4 / 3',
    'wide': '2 / 1',
  },
} as const

// Type exports for TypeScript
export type FontSize = keyof typeof tokens.fontSize
export type Spacing = keyof typeof tokens.spacing
export type BorderRadius = keyof typeof tokens.borderRadius
export type Shadow = keyof typeof tokens.shadows
export type Transition = keyof typeof tokens.transitions
export type ZIndex = keyof typeof tokens.zIndex
export type Breakpoint = keyof typeof tokens.breakpoints
export type Container = keyof typeof tokens.container
export type AspectRatio = keyof typeof tokens.aspectRatio

// Utility functions for using tokens
export const getSpacing = (size: Spacing) => tokens.spacing[size]
export const getFontSize = (size: FontSize) => tokens.fontSize[size]
export const getBorderRadius = (size: BorderRadius) => tokens.borderRadius[size]
export const getShadow = (size: Shadow) => tokens.shadows[size]
export const getTransition = (speed: Transition) => tokens.transitions[speed]