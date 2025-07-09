import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const promoActionsVariants = cva(
  'flex gap-4',
  {
    variants: {
      align: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
      },
      direction: {
        row: 'flex-row',
        column: 'flex-col',
      },
      spacing: {
        sm: 'gap-2',
        default: 'gap-4',
        lg: 'gap-6',
      },
    },
    defaultVariants: {
      align: 'start',
      direction: 'row',
      spacing: 'default',
    },
  }
);

export interface PromoActionsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof promoActionsVariants> {}

const PromoActions = React.forwardRef<HTMLDivElement, PromoActionsProps>(
  ({ className, align, direction, spacing, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(promoActionsVariants({ align, direction, spacing, className }), 'mt-6')}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PromoActions.displayName = 'PromoActions';

export { PromoActions, promoActionsVariants };