import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dividerIconVariants = cva(
  'inline-flex items-center justify-center',
  {
    variants: {
      size: {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        default: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8',
      },
      color: {
        default: 'text-foreground',
        white: 'text-white',
        black: 'text-black',
        muted: 'text-muted-foreground',
        primary: 'text-primary',
      },
      spacing: {
        tight: 'mx-2',
        default: 'mx-4',
        loose: 'mx-6',
      },
      animation: {
        none: '',
        spin: 'animate-spin',
        pulse: 'animate-pulse',
        bounce: 'animate-bounce',
      },
    },
    defaultVariants: {
      size: 'default',
      color: 'default',
      spacing: 'default',
      animation: 'none',
    },
  }
);

export interface DividerIconProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof dividerIconVariants> {
  icon?: React.ReactNode;
}

const DividerIcon = React.forwardRef<HTMLDivElement, DividerIconProps>(
  ({ className, size, color, spacing, animation, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(dividerIconVariants({ size, color, spacing, animation, className }))}
        {...props}
      >
        {icon || children || (
          // Default icon - a simple diamond shape
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full h-full"
          >
            <path d="M12 2L2 12L12 22L22 12L12 2Z" />
          </svg>
        )}
      </div>
    );
  }
);

DividerIcon.displayName = 'DividerIcon';

export { DividerIcon, dividerIconVariants };