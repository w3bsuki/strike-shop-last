import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const promoTitleVariants = cva(
  'font-typewriter font-bold uppercase tracking-tighter leading-tight',
  {
    variants: {
      size: {
        sm: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
        default: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
        lg: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
        xl: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
      },
      color: {
        inherit: '',
        white: 'text-white',
        black: 'text-black',
        primary: 'text-primary',
      },
    },
    defaultVariants: {
      size: 'default',
      color: 'inherit',
    },
  }
);

export interface PromoTitleProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'color'>,
    VariantProps<typeof promoTitleVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const PromoTitle = React.forwardRef<HTMLHeadingElement, PromoTitleProps>(
  ({ className, size, color, as: Comp = 'h2', children, ...props }, ref) => {
    return (
      <Comp
        ref={ref}
        className={cn(promoTitleVariants({ size, color, className }), 'mb-2')}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

PromoTitle.displayName = 'PromoTitle';

export { PromoTitle, promoTitleVariants };