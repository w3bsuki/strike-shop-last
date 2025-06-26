import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const promoSectionVariants = cva(
  'relative overflow-hidden',
  {
    variants: {
      size: {
        sm: 'py-8 md:py-12',
        default: 'py-12 md:py-16 lg:py-20',
        lg: 'py-16 md:py-24 lg:py-32',
      },
      theme: {
        default: 'bg-black text-white',
        inverted: 'bg-white text-black',
        gradient: 'bg-gradient-to-r from-black to-gray-900 text-white',
        custom: '',
      },
    },
    defaultVariants: {
      size: 'default',
      theme: 'default',
    },
  }
);

export interface PromoSectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof promoSectionVariants> {
  asChild?: boolean;
  href?: string;
}

const PromoSection = React.forwardRef<HTMLElement, PromoSectionProps>(
  ({ className, size, theme, children, asChild = false, href, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : 'section';
    
    if (href) {
      return (
        <a href={href} className="block">
          <section
            ref={ref}
            className={cn(promoSectionVariants({ size, theme, className }))}
            {...props}
          >
            {children}
          </section>
        </a>
      );
    }

    return (
      <Comp>
        <section
          ref={ref}
          className={cn(promoSectionVariants({ size, theme, className }))}
          {...props}
        >
          {children}
        </section>
      </Comp>
    );
  }
);

PromoSection.displayName = 'PromoSection';

export { PromoSection, promoSectionVariants };