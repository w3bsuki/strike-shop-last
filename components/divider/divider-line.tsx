import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dividerLineVariants = cva(
  'border-0',
  {
    variants: {
      orientation: {
        horizontal: 'w-full h-px',
        vertical: 'h-full w-px',
      },
      variant: {
        solid: 'bg-current',
        dashed: 'bg-gradient-to-r from-transparent via-current to-transparent',
        dotted: '',
        double: 'border-t-2 border-b-2 border-current h-1',
      },
      color: {
        default: 'text-border',
        primary: 'text-primary',
        muted: 'text-muted-foreground',
        white: 'text-white',
        black: 'text-black',
      },
      spacing: {
        none: '',
        sm: 'my-2',
        default: 'my-4',
        lg: 'my-8',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'solid',
      color: 'default',
      spacing: 'default',
    },
  }
);

export interface DividerLineProps
  extends React.HTMLAttributes<HTMLHRElement>,
    VariantProps<typeof dividerLineVariants> {}

const DividerLine = React.forwardRef<HTMLHRElement, DividerLineProps>(
  ({ className, orientation, variant, color, spacing, ...props }, ref) => {
    // Use a div for dotted pattern
    if (variant === 'dotted') {
      return (
        <div
          ref={ref as any}
          className={cn(
            orientation === 'horizontal' ? 'w-full h-px' : 'h-full w-px',
            'bg-repeat',
            spacing && (orientation === 'horizontal' ? `my-${spacing}` : `mx-${spacing}`),
            color && `text-${color}`,
            className
          )}
          style={{
            backgroundImage: orientation === 'horizontal' 
              ? 'radial-gradient(circle, currentColor 1px, transparent 1px)'
              : 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: orientation === 'horizontal' ? '8px 1px' : '1px 8px',
            backgroundPosition: 'center',
          }}
          {...props}
        />
      );
    }

    return (
      <hr
        ref={ref}
        className={cn(dividerLineVariants({ orientation, variant, color, spacing, className }))}
        {...props}
      />
    );
  }
);

DividerLine.displayName = 'DividerLine';

export { DividerLine, dividerLineVariants };