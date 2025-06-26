import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const promoBackgroundVariants = cva(
  'absolute inset-0',
  {
    variants: {
      variant: {
        pattern: 'opacity-5',
        gradient: 'opacity-20',
        image: 'opacity-30',
        solid: 'opacity-100',
      },
      animation: {
        none: '',
        pulse: 'animate-pulse',
        slide: 'animate-slide-left',
        rotate: 'animate-spin-slow',
      },
    },
    defaultVariants: {
      variant: 'pattern',
      animation: 'none',
    },
  }
);

export interface PromoBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof promoBackgroundVariants> {
  pattern?: 'stripes' | 'dots' | 'grid' | 'custom';
  image?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

const PromoBackground = React.forwardRef<HTMLDivElement, PromoBackgroundProps>(
  ({ className, variant, animation, pattern = 'stripes', image, gradientFrom, gradientTo, style, children, ...props }, ref) => {
    const getPatternStyle = (): React.CSSProperties => {
      switch (pattern) {
        case 'stripes':
          return {
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,.1) 10px,
              rgba(255,255,255,.1) 20px
            )`,
          };
        case 'dots':
          return {
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          };
        case 'grid':
          return {
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          };
        default:
          return {};
      }
    };

    const backgroundStyle: React.CSSProperties = React.useMemo(() => {
      if (image) {
        return {
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          ...style,
        };
      }

      if (gradientFrom && gradientTo) {
        return {
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          ...style,
        };
      }

      if (pattern !== 'custom') {
        return {
          ...getPatternStyle(),
          ...style,
        };
      }

      return style || {};
    }, [image, gradientFrom, gradientTo, pattern, style]);

    return (
      <div
        ref={ref}
        className={cn(promoBackgroundVariants({ variant, animation, className }))}
        style={backgroundStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PromoBackground.displayName = 'PromoBackground';

export { PromoBackground, promoBackgroundVariants };