import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dividerSectionVariants = cva(
  'relative overflow-hidden',
  {
    variants: {
      size: {
        xs: 'py-1',
        sm: 'py-2',
        default: 'py-3',
        lg: 'py-4',
        xl: 'py-6',
      },
      theme: {
        default: 'bg-black',
        inverted: 'bg-white',
        muted: 'bg-muted',
        transparent: 'bg-transparent',
        gradient: 'bg-gradient-to-r from-black via-gray-900 to-black',
      },
    },
    defaultVariants: {
      size: 'default',
      theme: 'default',
    },
  }
);

export interface DividerSectionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerSectionVariants> {}

const DividerSection = React.forwardRef<HTMLDivElement, DividerSectionProps>(
  ({ className, size, theme, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(dividerSectionVariants({ size, theme, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DividerSection.displayName = 'DividerSection';

export { DividerSection, dividerSectionVariants };