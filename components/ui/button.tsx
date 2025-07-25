import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-typewriter ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 min-h-[48px] min-w-[48px] touch-manipulation active:scale-[0.98] active:transition-none rounded-lg',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-secondary hover:text-secondary-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-secondary hover:text-secondary-foreground focus-visible:bg-secondary focus-visible:text-secondary-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // Strike-specific variants following balanced design system
        strike:
          'bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs uppercase tracking-[0.1em] border-none px-6 py-2.5 disabled:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground',
        'strike-outline':
          'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground font-bold text-xs uppercase tracking-[0.1em] px-6 py-2.5 transition-all',
        'strike-text':
          'text-primary hover:text-primary/80 font-bold text-xs uppercase tracking-[0.1em] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'min-h-[48px] px-4 py-3',
        sm: 'min-h-[44px] min-w-[44px] px-3 py-2',
        lg: 'min-h-[52px] px-8 py-4',
        icon: 'min-h-[48px] min-w-[48px] p-2',
        strike: 'min-h-[48px] px-6 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Whether to render as a child component (using Radix Slot) */
  asChild?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Text to show when loading */
  loadingText?: string;
  /** Left icon element */
  icon?: React.ReactNode;
  /** Right icon element */
  iconRight?: React.ReactNode;
}

/**
 * Button Component
 * 
 * A versatile button component with multiple variants and sizes.
 * Supports Strike Shop's custom design system with typewriter font and touch-friendly sizes.
 * 
 * @component
 * @example
 * // Default button
 * <Button>Click me</Button>
 * 
 * @example
 * // Strike-themed button
 * <Button variant="strike" size="strike">
 *   Add to Cart
 * </Button>
 * 
 * @example
 * // Icon button
 * <Button variant="ghost" size="icon">
 *   <Heart className="h-4 w-4" />
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    icon,
    iconRight,
    disabled,
    children,
    type = 'button',
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    // Show loading spinner if loading
    const leftIcon = loading ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> : icon;
    
    // If using asChild, we need to pass a single child element
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    
    // Regular button with icon support
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        type={type}
        {...props}
      >
        {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {loading && loadingText ? loadingText : children}
        {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
