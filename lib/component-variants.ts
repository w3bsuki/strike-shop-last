/**
 * COMPONENT VARIANTS SYSTEM
 * Using Class Variance Authority (CVA) for type-safe component variants
 * Following shadcn/ui best practices for 2025
 */

import { type VariantProps, cva } from "class-variance-authority";

// =============================================================================
// PRODUCT CARD VARIANTS
// =============================================================================

export const productCardVariants = cva(
  // Base classes - shared across all variants
  "group relative overflow-hidden cursor-pointer transition-all duration-300 ease-in-out",
  {
    variants: {
      // Layout variants
      layout: {
        grid: "w-full", // Grid layout takes full width of container
        carousel: "flex-shrink-0 w-[calc(50vw-1.5rem)] sm:w-48 md:w-56 lg:w-64 snap-start", // Carousel specific sizing
        featured: "w-full", // Featured cards
      },
      
      // Visual style variants
      style: {
        default: "bg-white border border-transparent rounded-none", // Sharp edges, Strike style
        minimal: "bg-white border-0 rounded-none",
        outlined: "bg-white border border-black rounded-none",
        elevated: "bg-white border border-transparent rounded-none shadow-sm",
      },
      
      // Size variants
      size: {
        sm: "min-w-[140px]",
        md: "min-w-[160px]", 
        lg: "min-w-[180px]",
        xl: "min-w-[200px]",
      },
      
      // Hover effect variants
      hover: {
        none: "",
        lift: "hover:border-black hover:-translate-y-2 hover:shadow-[0_12px_0_0_#000]",
        scale: "hover:scale-[1.02]",
        glow: "hover:border-black hover:shadow-lg",
      },
      
      // State variants
      state: {
        default: "",
        loading: "animate-pulse",
        disabled: "opacity-50 cursor-not-allowed",
        soldOut: "opacity-75",
      },
      
      // Density variants for different contexts
      density: {
        compact: "py-2", // For list views
        normal: "py-3",  // Default
        spacious: "py-4" // Featured products
      },
      
      // Quick Add button position variants
      quickAddPosition: {
        bottom: "absolute bottom-0",
        floating: "absolute bottom-4 left-4 right-4",
        inline: "relative mt-3"
      }
    },
    defaultVariants: {
      layout: "grid",
      style: "default", 
      size: "md",
      hover: "lift",
      state: "default",
      density: "normal",
      quickAddPosition: "bottom"
    },
  }
);

// Export types for ProductCard - moved to bottom with other exports

// =============================================================================
// PRODUCT GRID VARIANTS
// =============================================================================

export const productGridVariants = cva(
  "grid w-full",
  {
    variants: {
      // Column variants - mobile-first responsive
      columns: {
        1: "grid-cols-1",
        2: "grid-cols-2", // Perfect mobile default
        3: "grid-cols-2 sm:grid-cols-3",
        4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4", // Standard e-commerce
        5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
        6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
      },
      
      // Gap variants - using design tokens
      gap: {
        tight: "gap-3", // 12px - mobile hero style
        normal: "gap-4 md:gap-6", // 16px → 24px responsive
        loose: "gap-6 md:gap-8", // 24px → 32px
        spacious: "gap-8 md:gap-12", // 32px → 48px
      },
      
      // Alignment variants
      align: {
        start: "justify-items-start",
        center: "justify-items-center", 
        end: "justify-items-end",
        stretch: "justify-items-stretch",
      },
    },
    defaultVariants: {
      columns: 4,
      gap: "tight", // Matches hero tight spacing
      align: "stretch",
    },
  }
);

// =============================================================================
// BUTTON VARIANTS - Strike Brand
// =============================================================================

export const buttonVariants = cva(
  // Base button classes - Strike brand styling
  "inline-flex items-center justify-center font-bold text-xs uppercase tracking-wide transition-all duration-300 ease-in-out border-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
  {
    variants: {
      // Visual variants
      variant: {
        primary: "bg-black text-white border-transparent hover:bg-white hover:text-black hover:border-black hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_#000]",
        secondary: "bg-transparent text-black border-black hover:bg-black hover:text-white hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_#000]",
        outline: "bg-transparent text-black border-black hover:bg-gray-50",
        ghost: "bg-transparent text-black border-transparent hover:bg-gray-100",
        destructive: "bg-red-600 text-white border-transparent hover:bg-red-700",
        success: "bg-green-600 text-white border-transparent hover:bg-green-700",
      },
      
      // Size variants - touch-friendly
      size: {
        sm: "h-10 px-3 text-xs", // 40px height
        md: "h-11 px-4 text-xs", // 44px height - minimum touch
        lg: "h-14 px-6 text-sm", // 56px height - Strike standard
        xl: "h-16 px-8 text-base", // 64px height - hero CTAs
        icon: "h-11 w-11", // Square icon buttons
      },
      
      // Width variants
      width: {
        auto: "w-auto",
        full: "w-full",
        fit: "w-fit",
      },
      
      // Border radius variants - following Strike design system
      radius: {
        none: "rounded-none", // Sharp Strike style
        sm: "rounded-sm",
        md: "rounded-md", // Default for interactive elements
        lg: "rounded-lg",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg", // Strike standard 56px
      width: "auto",
      radius: "md", // Rounded for interactive elements
    },
  }
);

// =============================================================================
// INPUT VARIANTS - Strike Form System
// =============================================================================

export const inputVariants = cva(
  "w-full border-2 transition-all duration-200 ease-in-out placeholder:text-gray-400 placeholder:uppercase placeholder:tracking-wide placeholder:text-sm focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      // Visual variants
      variant: {
        default: "bg-white border-black focus:border-red-500 focus:ring-1 focus:ring-red-500",
        outline: "bg-transparent border-black focus:border-red-500 focus:bg-white",
        filled: "bg-gray-50 border-gray-300 focus:border-red-500 focus:bg-white",
        ghost: "bg-transparent border-transparent focus:border-red-500 focus:bg-white",
      },
      
      // Size variants - consistent with buttons
      size: {
        sm: "h-10 px-3 text-sm",
        md: "h-11 px-4 text-base", // 44px minimum touch
        lg: "h-14 px-5 text-base", // 56px Strike standard
      },
      
      // Border radius - following Strike system
      radius: {
        none: "rounded-none",
        sm: "rounded-sm", 
        md: "rounded-md", // Default for inputs
        lg: "rounded-lg",
      },
      
      // State variants
      state: {
        default: "",
        error: "border-red-500 focus:border-red-500 focus:ring-red-500",
        success: "border-green-500 focus:border-green-500 focus:ring-green-500",
        warning: "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "lg", // Strike standard
      radius: "md",
      state: "default",
    },
  }
);

// =============================================================================
// BADGE VARIANTS - Status and Labels
// =============================================================================

export const badgeVariants = cva(
  "inline-flex items-center font-bold text-xs uppercase tracking-widest",
  {
    variants: {
      // Visual variants
      variant: {
        default: "bg-gray-100 text-gray-900",
        primary: "bg-black text-white",
        secondary: "bg-gray-200 text-gray-900", 
        accent: "bg-red-600 text-white",
        success: "bg-green-600 text-white",
        warning: "bg-yellow-500 text-black",
        destructive: "bg-red-600 text-white",
        outline: "border-2 border-black text-black bg-transparent",
      },
      
      // Size variants
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-xs", 
        lg: "px-4 py-1.5 text-sm",
      },
      
      // Shape variants
      shape: {
        square: "rounded-none", // Sharp Strike style
        rounded: "rounded-sm",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      shape: "square", // Strike brand style
    },
  }
);

// =============================================================================
// SECTION VARIANTS - Layout Components
// =============================================================================

export const sectionVariants = cva(
  "w-full",
  {
    variants: {
      // Spacing variants - using design tokens
      spacing: {
        none: "",
        tight: "py-8", // 32px
        normal: "py-12 md:py-16", // 48px → 64px
        loose: "py-16 md:py-20", // 64px → 80px
        spacious: "py-20 md:py-24", // 80px → 96px
      },
      
      // Container variants
      container: {
        none: "", // No container
        default: "container mx-auto px-4 lg:px-6", // Standard container
        narrow: "max-w-4xl mx-auto px-4 lg:px-6", // Narrow content
        wide: "max-w-6xl mx-auto px-4 lg:px-6", // Wide content
        full: "w-full", // Full width
      },
      
      // Background variants
      background: {
        none: "",
        white: "bg-white",
        gray: "bg-gray-50",
        black: "bg-black text-white",
      },
    },
    defaultVariants: {
      spacing: "normal",
      container: "default", 
      background: "none",
    },
  }
);

// =============================================================================
// TYPE EXPORTS - TypeScript safety
// =============================================================================

export type ProductCardVariants = VariantProps<typeof productCardVariants>;
export type ProductGridVariants = VariantProps<typeof productGridVariants>;
export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type InputVariants = VariantProps<typeof inputVariants>;
export type BadgeVariants = VariantProps<typeof badgeVariants>;
export type SectionVariants = VariantProps<typeof sectionVariants>;

// =============================================================================
// COMPONENT COMPOSITION HELPERS
// =============================================================================

// Helper to combine product card and grid variants
export function getProductCardClasses(
  cardVariants?: ProductCardVariants,
  className?: string
) {
  return productCardVariants(cardVariants) + (className ? ` ${className}` : "");
}

// Helper to get grid classes with proper gaps
export function getProductGridClasses(
  gridVariants?: ProductGridVariants,
  className?: string  
) {
  return productGridVariants(gridVariants) + (className ? ` ${className}` : "");
}

// Helper for button composition
export function getButtonClasses(
  buttonProps?: ButtonVariants,
  className?: string
) {
  return buttonVariants(buttonProps) + (className ? ` ${className}` : "");
}

// Helper for input composition  
export function getInputClasses(
  inputProps?: InputVariants,
  className?: string
) {
  return inputVariants(inputProps) + (className ? ` ${className}` : "");
}