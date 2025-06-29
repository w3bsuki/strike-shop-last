import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Typewriter font system
      fontFamily: {
        sans: ['"Typewriter"', '"Courier Prime"', 'ui-monospace', 'monospace'],
        mono: ['"Typewriter"', '"Courier Prime"', 'ui-monospace', 'monospace'],
        display: ['"Typewriter"', '"Courier Prime"', 'ui-monospace', 'monospace'],
        typewriter: ['"Typewriter"', '"Courier Prime"', 'ui-monospace', 'monospace'],
      },
      
      // Typography scale with responsive clamp()
      fontSize: {
        // Base scale with clamp for responsive sizing - MOBILE OPTIMIZED (16px minimum)
        'xs': ['clamp(0.75rem, 0.625rem + 0.5vw, 0.875rem)', { lineHeight: '1.6', letterSpacing: '0.05em' }],
        'sm': ['clamp(0.875rem, 0.75rem + 0.5vw, 1rem)', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'base': ['clamp(1rem, 0.875rem + 0.5vw, 1.125rem)', { lineHeight: '1.5', letterSpacing: '0' }],
        'lg': ['clamp(1.125rem, 1rem + 0.5vw, 1.25rem)', { lineHeight: '1.4', letterSpacing: '-0.025em' }],
        'xl': ['clamp(1.25rem, 1.125rem + 0.5vw, 1.375rem)', { lineHeight: '1.4', letterSpacing: '-0.025em' }],
        '2xl': ['clamp(1.5rem, 1.25rem + 0.75vw, 1.75rem)', { lineHeight: '1.3', letterSpacing: '-0.05em' }],
        '3xl': ['clamp(1.75rem, 1.5rem + 1vw, 2.125rem)', { lineHeight: '1.2', letterSpacing: '-0.05em' }],
        '4xl': ['clamp(2.125rem, 1.75rem + 1.5vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.075em' }],
        '5xl': ['clamp(2.5rem, 2rem + 2vw, 3.25rem)', { lineHeight: '1.1', letterSpacing: '-0.075em' }],
        '6xl': ['clamp(3.25rem, 2.5rem + 3vw, 4rem)', { lineHeight: '1', letterSpacing: '-0.1em' }],
        
        // Strike-specific typography tokens - also updated to 16px minimum
        'strike-xs': ['clamp(0.75rem, 0.625rem + 0.5vw, 0.875rem)', { lineHeight: '1.4', letterSpacing: '0.1em', fontWeight: '700' }],
        'strike-sm': ['clamp(0.875rem, 0.75rem + 0.5vw, 1rem)', { lineHeight: '1.4', letterSpacing: '0.1em', fontWeight: '700' }],
        'strike-base': ['clamp(1rem, 0.875rem + 0.5vw, 1.125rem)', { lineHeight: '1.5', letterSpacing: '0.05em', fontWeight: '500' }],
        'strike-lg': ['clamp(1.125rem, 1rem + 0.5vw, 1.25rem)', { lineHeight: '1.4', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      
      // Consistent spacing scale (0.25rem to 6rem)
      spacing: {
        '0': '0px',
        'px': '1px',
        '0.5': '0.125rem', // 2px
        '1': '0.25rem',    // 4px
        '1.5': '0.375rem', // 6px
        '2': '0.5rem',     // 8px
        '2.5': '0.625rem', // 10px
        '3': '0.75rem',    // 12px
        '3.5': '0.875rem', // 14px
        '4': '1rem',       // 16px
        '5': '1.25rem',    // 20px
        '6': '1.5rem',     // 24px
        '7': '1.75rem',    // 28px
        '8': '2rem',       // 32px
        '9': '2.25rem',    // 36px
        '10': '2.5rem',    // 40px
        '11': '2.75rem',   // 44px
        '12': '3rem',      // 48px
        '14': '3.5rem',    // 56px
        '16': '4rem',      // 64px
        '20': '5rem',      // 80px
        '24': '6rem',      // 96px
        // Touch targets
        'touch': '2.75rem', // 44px - minimum touch target
        'touch-lg': '3rem', // 48px - comfortable touch target
      },
      
      // Letter spacing
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
        'strike': '0.1em',
        'strike-wide': '0.15em',
      },
      
      // Semantic color tokens
      colors: {
        // Strike brand colors
        'strike-black': 'hsl(0 0% 0%)',
        'strike-white': 'hsl(0 0% 100%)',
        'strike-gray': {
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
        
        // System colors (mapped to CSS variables)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      
      // Border radius - mostly 0 with subtle options
      borderRadius: {
        'none': '0',
        'sm': '0',
        DEFAULT: '0',
        'md': '0',
        'lg': '0',
        'xl': '0',
        '2xl': '0',
        '3xl': '0',
        'full': '0',
        // Subtle radius options when needed
        'subtle': '2px',
        'soft': '4px',
      },
      
      // Animation timings
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      
      // Z-index scale
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
      
      // Safe area utilities handled by plugin below
      
      // Animations
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
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'slide-in-up': 'slide-in-up 0.3s ease-out',
        'slide-in-down': 'slide-in-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // Minimal safe area utilities
    function({ addUtilities }) {
      addUtilities({
        '.pb-safe': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.px-safe': {
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
      });
    },
  ],
};
export default config;
