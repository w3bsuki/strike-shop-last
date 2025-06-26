import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const promoContentVariants = cva(
  'relative z-10',
  {
    variants: {
      layout: {
        default: 'grid grid-cols-1 md:grid-cols-2 gap-8 items-center',
        centered: 'flex flex-col items-center justify-center text-center',
        split: 'grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16',
        stacked: 'flex flex-col gap-6',
      },
      container: {
        default: 'strike-container',
        full: 'w-full px-6 md:px-12',
        narrow: 'max-w-4xl mx-auto px-6',
      },
    },
    defaultVariants: {
      layout: 'default',
      container: 'default',
    },
  }
);

export interface PromoContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof promoContentVariants> {}

const PromoContent = React.forwardRef<HTMLDivElement, PromoContentProps>(
  ({ className, layout, container, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(promoContentVariants({ layout, container, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PromoContent.displayName = 'PromoContent';

export { PromoContent, promoContentVariants };