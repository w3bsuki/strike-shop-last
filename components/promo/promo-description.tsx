import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const promoDescriptionVariants = cva(
  'font-typewriter uppercase tracking-wider',
  {
    variants: {
      size: {
        sm: 'text-xs md:text-sm',
        default: 'text-sm md:text-base',
        lg: 'text-base md:text-lg',
      },
      opacity: {
        default: 'opacity-80',
        full: 'opacity-100',
        subtle: 'opacity-60',
      },
      color: {
        inherit: '',
        white: 'text-white',
        black: 'text-black',
        muted: 'text-muted-foreground',
      },
    },
    defaultVariants: {
      size: 'default',
      opacity: 'default',
      color: 'inherit',
    },
  }
);

export interface PromoDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof promoDescriptionVariants> {}

const PromoDescription = React.forwardRef<HTMLParagraphElement, PromoDescriptionProps>(
  ({ className, size, opacity, color, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(promoDescriptionVariants({ size, opacity, color, className }), 'mb-4')}
        {...props}
      >
        {children}
      </p>
    );
  }
);

PromoDescription.displayName = 'PromoDescription';

export { PromoDescription, promoDescriptionVariants };