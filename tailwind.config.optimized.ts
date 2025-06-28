import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}', // Include lib for utility components
    './hooks/**/*.{js,ts,jsx,tsx}', // Include hooks that might have JSX
  ],
  theme: {
    extend: {
      // Use CSS variables for all values
      spacing: {
        '0': 'var(--space-0)',
        'px': 'var(--space-px)',
        '0.5': 'var(--space-0-5)',
        '1': 'var(--space-1)',
        '1.5': 'var(--space-1-5)',
        '2': 'var(--space-2)',
        '2.5': 'var(--space-2-5)',
        '3': 'var(--space-3)',
        '3.5': 'var(--space-3-5)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '7': 'var(--space-7)',
        '8': 'var(--space-8)',
        '9': 'var(--space-9)',
        '10': 'var(--space-10)',
        '11': 'var(--space-11)',
        '12': 'var(--space-12)',
        '14': 'var(--space-14)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)',
        '32': 'var(--space-32)',
        '40': 'var(--space-40)',
        '48': 'var(--space-48)',
        '56': 'var(--space-56)',
        '64': 'var(--space-64)',
        // Touch targets
        'touch': 'var(--touch-min)',
        'touch-lg': 'var(--touch-comfortable)',
      },
      
      fontSize: {
        'xs': ['var(--text-xs)', { lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-wide)' }],
        'sm': ['var(--text-sm)', { lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-normal)' }],
        'base': ['var(--text-base)', { lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-normal)' }],
        'lg': ['var(--text-lg)', { lineHeight: 'var(--leading-relaxed)', letterSpacing: 'var(--tracking-tight)' }],
        'xl': ['var(--text-xl)', { lineHeight: 'var(--leading-relaxed)', letterSpacing: 'var(--tracking-tight)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-snug)', letterSpacing: 'var(--tracking-tight)' }],
        '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-snug)', letterSpacing: 'var(--tracking-tight)' }],
        '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)', letterSpacing: 'var(--tracking-tighter)' }],
        '5xl': ['var(--text-5xl)', { lineHeight: 'var(--leading-tight)', letterSpacing: 'var(--tracking-tighter)' }],
        '6xl': ['var(--text-6xl)', { lineHeight: 'var(--leading-none)', letterSpacing: 'var(--tracking-tighter)' }],
        // Strike-specific
        'strike-xs': ['var(--text-xs)', { lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-strike)', fontWeight: 'var(--font-bold)' }],
        'strike-sm': ['var(--text-sm)', { lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-strike)', fontWeight: 'var(--font-bold)' }],
        'strike-base': ['var(--text-base)', { lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-wider)', fontWeight: 'var(--font-medium)' }],
        'strike-lg': ['var(--text-lg)', { lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-wider)', fontWeight: 'var(--font-semibold)' }],
      },
      
      fontFamily: {
        sans: ['var(--font-typewriter)', 'var(--font-system)'],
        mono: ['var(--font-typewriter)', 'var(--font-mono)'],
        display: ['var(--font-typewriter)', 'var(--font-system)'],
        typewriter: ['var(--font-typewriter)'],
      },
      
      fontWeight: {
        normal: 'var(--font-normal)',
        medium: 'var(--font-medium)',
        semibold: 'var(--font-semibold)',
        bold: 'var(--font-bold)',
      },
      
      letterSpacing: {
        tighter: 'var(--tracking-tighter)',
        tight: 'var(--tracking-tight)',
        normal: 'var(--tracking-normal)',
        wide: 'var(--tracking-wide)',
        wider: 'var(--tracking-wider)',
        widest: 'var(--tracking-widest)',
        strike: 'var(--tracking-strike)',
        'strike-wide': 'var(--tracking-strike-wide)',
      },
      
      lineHeight: {
        none: 'var(--leading-none)',
        tight: 'var(--leading-tight)',
        snug: 'var(--leading-snug)',
        normal: 'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
        loose: 'var(--leading-loose)',
      },
      
      colors: {
        // Semantic colors only - no hardcoded values
        background: 'hsl(var(--color-background))',
        foreground: 'hsl(var(--color-foreground))',
        
        // Surface hierarchy
        surface: {
          DEFAULT: 'hsl(var(--color-surface))',
          elevated: 'hsl(var(--color-surface-elevated))',
          overlay: 'hsl(var(--color-surface-overlay))',
          interactive: 'hsl(var(--color-surface-interactive))',
          selected: 'hsl(var(--color-surface-selected))',
        },
        
        // Content hierarchy
        content: {
          primary: 'hsl(var(--color-content-primary))',
          secondary: 'hsl(var(--color-content-secondary))',
          tertiary: 'hsl(var(--color-content-tertiary))',
          disabled: 'hsl(var(--color-content-disabled))',
          inverse: 'hsl(var(--color-content-inverse))',
        },
        
        // Borders
        border: {
          DEFAULT: 'hsl(var(--color-border-primary))',
          secondary: 'hsl(var(--color-border-secondary))',
          interactive: 'hsl(var(--color-border-interactive))',
          focus: 'hsl(var(--color-border-focus))',
        },
        
        // Interactive elements
        interactive: {
          primary: {
            DEFAULT: 'hsl(var(--color-interactive-primary))',
            hover: 'hsl(var(--color-interactive-primary-hover))',
            active: 'hsl(var(--color-interactive-primary-active))',
          },
          secondary: {
            DEFAULT: 'hsl(var(--color-interactive-secondary))',
            hover: 'hsl(var(--color-interactive-secondary-hover))',
            active: 'hsl(var(--color-interactive-secondary-active))',
          },
        },
        
        // Feedback
        success: 'hsl(var(--color-success))',
        warning: 'hsl(var(--color-warning))',
        error: 'hsl(var(--color-error))',
        info: 'hsl(var(--color-info))',
        
        // Legacy support (gradually migrate away from these)
        primary: {
          DEFAULT: 'hsl(var(--color-interactive-primary))',
          foreground: 'hsl(var(--color-content-inverse))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--color-surface-elevated))',
          foreground: 'hsl(var(--color-content-primary))',
        },
        muted: {
          DEFAULT: 'hsl(var(--color-surface-overlay))',
          foreground: 'hsl(var(--color-content-secondary))',
        },
        accent: {
          DEFAULT: 'hsl(var(--color-surface-interactive))',
          foreground: 'hsl(var(--color-content-primary))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--color-error))',
          foreground: 'hsl(var(--color-content-inverse))',
        },
        
        // Component-specific (for gradual migration)
        card: {
          DEFAULT: 'hsl(var(--color-surface))',
          foreground: 'hsl(var(--color-content-primary))',
        },
        popover: {
          DEFAULT: 'hsl(var(--color-surface-overlay))',
          foreground: 'hsl(var(--color-content-primary))',
        },
        
        // Keep these for compatibility
        input: 'hsl(var(--color-border-primary))',
        ring: 'hsl(var(--color-border-focus))',
      },
      
      borderRadius: {
        none: 'var(--radius-none)',
        subtle: 'var(--radius-subtle)',
        soft: 'var(--radius-soft)',
        // Override all default values to maintain sharp edges
        sm: 'var(--radius-none)',
        DEFAULT: 'var(--radius-none)',
        md: 'var(--radius-none)',
        lg: 'var(--radius-none)',
        xl: 'var(--radius-none)',
        '2xl': 'var(--radius-none)',
        '3xl': 'var(--radius-none)',
        full: 'var(--radius-none)',
      },
      
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        inner: 'var(--shadow-inner)',
        none: 'none',
      },
      
      transitionDuration: {
        '0': 'var(--duration-instant)',
        '75': 'var(--duration-fast)',
        '100': 'var(--duration-fast)',
        '150': 'var(--duration-fast)',
        '200': 'var(--duration-base)',
        '300': 'var(--duration-moderate)',
        '500': 'var(--duration-slow)',
        '700': 'var(--duration-slower)',
        '1000': 'var(--duration-slowest)',
      },
      
      transitionTimingFunction: {
        linear: 'var(--ease-linear)',
        in: 'var(--ease-in)',
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        bounce: 'var(--ease-bounce)',
      },
      
      zIndex: {
        '0': 'var(--z-base)',
        '10': 'var(--z-raised)',
        '20': 'calc(var(--z-raised) * 2)',
        '30': 'calc(var(--z-raised) * 3)',
        '40': 'calc(var(--z-raised) * 4)',
        '50': 'var(--z-dropdown)',
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'fixed': 'var(--z-fixed)',
        'backdrop': 'var(--z-modal-backdrop)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-modal)',
        'notification': 'var(--z-notification)',
        'tooltip': 'var(--z-tooltip)',
      },
      
      // Container sizes
      maxWidth: {
        xs: 'var(--container-xs)',
        sm: 'var(--container-sm)',
        md: 'var(--container-md)',
        lg: 'var(--container-lg)',
        xl: 'var(--container-xl)',
        '2xl': 'var(--container-2xl)',
        '3xl': 'var(--container-3xl)',
        '4xl': 'var(--container-4xl)',
        '5xl': 'var(--container-5xl)',
        '6xl': 'var(--container-6xl)',
        '7xl': 'var(--container-7xl)',
        full: 'var(--container-full)',
      },
      
      // Animations (keep existing)
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-in-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-down': {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down var(--duration-base) var(--ease-out)',
        'accordion-up': 'accordion-up var(--duration-base) var(--ease-out)',
        'fade-in': 'fade-in var(--duration-base) var(--ease-out)',
        'fade-out': 'fade-out var(--duration-base) var(--ease-out)',
        'slide-in-up': 'slide-in-up var(--duration-moderate) var(--ease-out)',
        'slide-in-down': 'slide-in-down var(--duration-moderate) var(--ease-out)',
        'scale-in': 'scale-in var(--duration-base) var(--ease-out)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // Custom plugin for design token utilities
    function({ addUtilities, addComponents, theme }) {
      // Add utility classes for common patterns
      const newUtilities = {
        // Touch target utilities
        '.touch-target': {
          minWidth: 'var(--touch-min)',
          minHeight: 'var(--touch-min)',
        },
        '.touch-target-lg': {
          minWidth: 'var(--touch-comfortable)',
          minHeight: 'var(--touch-comfortable)',
        },
        // Safe area utilities
        '.safe-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.safe-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-x': {
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.safe-y': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-all': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
        },
        // Performance optimizations
        '.gpu-accelerated': {
          transform: 'translateZ(0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        },
        '.contain-layout': {
          contain: 'layout',
        },
        '.contain-paint': {
          contain: 'paint',
        },
        '.contain-strict': {
          contain: 'strict',
        },
      };
      
      // Add component classes for common patterns
      const newComponents = {
        '.strike-container': {
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@screen sm': {
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@screen lg': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
            maxWidth: theme('maxWidth.7xl'),
          },
        },
        '.strike-card': {
          backgroundColor: theme('colors.surface.DEFAULT'),
          borderWidth: '1px',
          borderColor: theme('colors.border.DEFAULT'),
          borderRadius: theme('borderRadius.none'),
          padding: theme('spacing.4'),
          transition: 'box-shadow var(--duration-base) var(--ease-out)',
          '&:hover': {
            boxShadow: theme('boxShadow.md'),
          },
        },
        '.strike-button': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: theme('fontWeight.bold'),
          fontSize: theme('fontSize.sm[0]'),
          letterSpacing: theme('letterSpacing.strike'),
          textTransform: 'uppercase',
          paddingLeft: theme('spacing.6'),
          paddingRight: theme('spacing.6'),
          paddingTop: theme('spacing.2.5'),
          paddingBottom: theme('spacing.2.5'),
          minHeight: theme('spacing.touch'),
          borderRadius: theme('borderRadius.none'),
          transition: 'all var(--duration-base) var(--ease-out)',
          touchAction: 'manipulation',
          userSelect: 'none',
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: theme('colors.border.focus'),
            outlineOffset: '2px',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
      };
      
      addUtilities(newUtilities);
      addComponents(newComponents);
    },
  ],
};