import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Section } from '@/components/layout/section';

const promoSectionVariants = cva(
  'relative overflow-hidden',
  {
    variants: {
      theme: {
        default: 'bg-black text-white',
        inverted: 'bg-white text-black',
        gradient: 'bg-gradient-to-r from-black to-gray-900 text-white',
        custom: '',
      },
    },
    defaultVariants: {
      theme: 'default',
    },
  }
);

export interface PromoSectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof promoSectionVariants> {
  asChild?: boolean;
  href?: string;
  size?: 'sm' | 'default' | 'lg';
  container?: boolean;
}

const PromoSection = React.forwardRef<HTMLElement, PromoSectionProps>(
  ({ className, size = 'default', theme, children, asChild = false, href, container = true, ...props }, ref) => {
    const content = (
      <Section
        ref={ref}
        size={size}
        container={container}
        className={cn(promoSectionVariants({ theme }), className)}
        {...props}
      >
        {children}
      </Section>
    );
    
    if (href) {
      return (
        <a href={href} className="block">
          {content}
        </a>
      );
    }

    return content;
  }
);

PromoSection.displayName = 'PromoSection';

export { PromoSection, promoSectionVariants };