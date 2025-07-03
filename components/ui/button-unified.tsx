import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-typewriter ring-offset-background transition-all duration-200 touch-manipulation select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline focus-visible:underline',
        // Strike-specific variants
        strike: 'bg-black text-white hover:bg-gray-800 focus-visible:bg-gray-800 font-bold text-xs uppercase tracking-[0.1em] rounded-none border-none',
        'strike-outline': 'border-2 border-black text-black bg-transparent hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white font-bold text-xs uppercase tracking-[0.1em] rounded-none',
        'strike-text': 'text-black hover:text-gray-700 focus-visible:text-gray-700 font-bold text-xs uppercase tracking-[0.1em] underline-offset-4 hover:underline p-0 h-auto min-h-0',
      },
      size: {
        default: 'min-h-[48px] px-6 py-3',
        sm: 'min-h-[48px] px-4 py-2 text-xs',
        lg: 'min-h-[56px] px-8 py-4 text-base',
        icon: 'min-h-[48px] min-w-[48px] p-3',
        'icon-sm': 'min-h-[40px] min-w-[40px] p-2',
        'icon-lg': 'min-h-[56px] min-w-[56px] p-4',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
);

// Common focus styles for all buttons
const focusStyles = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a child component using Radix Slot */
  asChild?: boolean;
  /** Show loading state */
  loading?: boolean;
  /** Text to show while loading */
  loadingText?: string;
  /** Icon-only button - MUST provide aria-label */
  iconOnly?: boolean;
  /** Announce state changes to screen readers */
  announceStateChange?: boolean;
}

/**
 * Unified Button Component
 * 
 * Combines all button functionality with built-in accessibility.
 * Enforces 48px minimum touch targets and proper ARIA attributes.
 * 
 * @example
 * // Default button
 * <Button>Click me</Button>
 * 
 * @example
 * // Loading state
 * <Button loading loadingText="Processing...">
 *   Submit
 * </Button>
 * 
 * @example
 * // Icon-only button (aria-label required)
 * <Button variant="ghost" size="icon" iconOnly aria-label="Add to wishlist">
 *   <Heart className="h-4 w-4" />
 * </Button>
 * 
 * @example
 * // Strike-themed full-width button
 * <Button variant="strike" fullWidth>
 *   Add to Cart
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      loadingText = 'Loading...',
      iconOnly = false,
      announceStateChange = false,
      disabled,
      children,
      'aria-label': ariaLabel,
      onClick,
      ...props
    },
    ref
  ) => {
    // Validation: Icon-only buttons must have aria-label
    React.useEffect(() => {
      if (iconOnly && !ariaLabel && process.env.NODE_ENV === 'development') {
        console.error('Button: Icon-only buttons must have an aria-label for accessibility');
      }
    }, [iconOnly, ariaLabel]);

    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    // Enhanced ARIA attributes
    const ariaProps = {
      'aria-label': ariaLabel,
      'aria-busy': loading || undefined,
      'aria-disabled': isDisabled || undefined,
      'aria-live': announceStateChange && loading ? 'polite' as const : undefined,
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled && onClick) {
        onClick(e);
      }
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth, className }),
          focusStyles
        )}
        ref={ref}
        type={props.type || 'button'}
        disabled={isDisabled}
        onClick={handleClick}
        {...ariaProps}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className={iconOnly ? 'sr-only' : ''}>
              {loadingText}
            </span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

/**
 * Icon Button Component
 * 
 * Convenience wrapper for icon-only buttons with enforced accessibility.
 * Automatically sets size="icon" and iconOnly={true}.
 * 
 * @example
 * <IconButton aria-label="Close dialog">
 *   <X className="h-4 w-4" />
 * </IconButton>
 */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'iconOnly' | 'size'> & {
    size?: 'icon' | 'icon-sm' | 'icon-lg';
  }
>(({ size = 'icon', ...props }, ref) => {
  return (
    <Button
      ref={ref}
      size={size}
      iconOnly
      {...props}
    />
  );
});

IconButton.displayName = 'IconButton';

export { Button, buttonVariants };