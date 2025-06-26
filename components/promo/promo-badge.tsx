import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const promoBadgeVariants = cva(
  'inline-block font-typewriter font-bold leading-none transition-transform duration-300',
  {
    variants: {
      size: {
        sm: 'text-[60px] md:text-[80px] lg:text-[100px]',
        default: 'text-[100px] md:text-[150px] lg:text-[200px]',
        lg: 'text-[150px] md:text-[200px] lg:text-[250px]',
      },
      variant: {
        default: '',
        animated: 'group-hover:scale-110',
        pulsing: 'animate-pulse',
      },
      color: {
        inherit: '',
        white: 'text-white',
        black: 'text-black',
        primary: 'text-primary',
        danger: 'text-red-600',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
      color: 'inherit',
    },
  }
);

const promoBadgeUnitVariants = cva(
  'font-typewriter font-bold align-top',
  {
    variants: {
      size: {
        sm: 'text-xl md:text-2xl lg:text-3xl',
        default: 'text-2xl md:text-3xl lg:text-4xl',
        lg: 'text-3xl md:text-4xl lg:text-5xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface PromoBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof promoBadgeVariants> {
  value: string | number;
  unit?: string;
  suffix?: string;
}

const PromoBadge = React.forwardRef<HTMLDivElement, PromoBadgeProps>(
  ({ className, size, variant, color, value, unit = '%', suffix, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('text-right', className)} {...props}>
        <div className="inline-block">
          <span className={cn(promoBadgeVariants({ size, variant, color }))}>
            {value}
          </span>
          {unit && (
            <span className={cn(promoBadgeUnitVariants({ size }), color && `text-${color}`)}>
              {unit}
            </span>
          )}
        </div>
        {suffix && (
          <p className={cn(
            'font-typewriter uppercase tracking-wider mt-2',
            size === 'sm' && 'text-xs md:text-sm',
            size === 'default' && 'text-sm md:text-base',
            size === 'lg' && 'text-base md:text-lg',
            color && `text-${color}`
          )}>
            {suffix}
          </p>
        )}
        {children}
      </div>
    );
  }
);

PromoBadge.displayName = 'PromoBadge';

export { PromoBadge, promoBadgeVariants };