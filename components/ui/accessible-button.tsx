import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { accessibilityConfig } from '@/lib/accessibility-config';
import { useLiveRegion } from '@/components/accessibility/live-region';

const accessibleButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-typewriter ring-offset-background transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        strike: 'bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs uppercase tracking-[0.1em] rounded-none border-none px-6 py-2.5 disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground',
        'strike-outline': 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground font-bold text-xs uppercase tracking-[0.1em] rounded-none px-6 py-2.5 transition-all',
        'strike-text': 'text-primary hover:text-primary/80 font-bold text-xs uppercase tracking-[0.1em] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10 p-0',
        strike: 'h-auto px-6 py-2.5',
      },
      // Accessibility-specific variants
      touchTarget: {
        minimum: 'min-h-[44px] min-w-[44px]',
        comfortable: 'min-h-[48px] min-w-[48px]',
        auto: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      touchTarget: 'minimum',
    },
  }
);

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof accessibleButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  announceClick?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      className,
      variant,
      size,
      touchTarget,
      asChild = false,
      loading = false,
      loadingText = 'Loading...',
      announceClick = false,
      successMessage,
      errorMessage,
      disabled,
      onClick,
      children,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const { announce } = useLiveRegion();
    const Comp = asChild ? Slot : 'button';
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e);
      }
      
      // Announce the click action to screen readers if requested
      if (announceClick && ariaLabel) {
        announce(`${ariaLabel} activated`);
      }
    };

    // Ensure proper ARIA attributes
    const ariaProps = {
      ...(loading && { 'aria-busy': true }),
      ...((disabled || loading) && { 'aria-disabled': true }),
      ...(loading && { 'aria-live': 'polite' as const }),
    };

    return (
      <Comp
        className={cn(
          accessibleButtonVariants({ variant, size, touchTarget, className }),
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        ref={ref}
        type={props.type || 'button'}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-label={ariaLabel}
        {...ariaProps}
        style={{
          minHeight: touchTarget === 'auto' ? undefined : accessibilityConfig.touchTargets[touchTarget as 'minimum' | 'comfortable'],
          minWidth: touchTarget === 'auto' ? undefined : accessibilityConfig.touchTargets[touchTarget as 'minimum' | 'comfortable'],
        }}
        {...props}
      >
        {loading ? (
          <>
            <span className="sr-only">{loadingText}</span>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span aria-hidden="true">{loadingText}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// Icon button with proper accessibility
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps & { iconLabel: string }
>(({ iconLabel, children, ...props }, ref) => {
  return (
    <AccessibleButton
      ref={ref}
      size="icon"
      aria-label={iconLabel}
      {...props}
    >
      {children}
    </AccessibleButton>
  );
});

IconButton.displayName = 'IconButton';

export { AccessibleButton, accessibleButtonVariants };