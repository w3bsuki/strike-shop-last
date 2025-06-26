import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dividerTextVariants = cva(
  'inline-block font-typewriter font-bold uppercase tracking-[0.2em]',
  {
    variants: {
      size: {
        xs: 'text-[10px]',
        sm: 'text-xs',
        default: 'text-xs md:text-sm',
        lg: 'text-sm md:text-base',
      },
      color: {
        default: 'text-foreground',
        white: 'text-white',
        black: 'text-black',
        muted: 'text-muted-foreground',
        primary: 'text-primary',
      },
      spacing: {
        tight: 'mx-2',
        default: 'mx-4 md:mx-8',
        loose: 'mx-6 md:mx-12',
      },
    },
    defaultVariants: {
      size: 'default',
      color: 'white',
      spacing: 'default',
    },
  }
);

export interface DividerTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof dividerTextVariants> {
  text?: string;
  repeat?: number;
}

const DividerText = React.forwardRef<HTMLSpanElement, DividerTextProps>(
  ({ className, size, color, spacing, text = 'STRIKE™', repeat = 1, children, ...props }, ref) => {
    const content = children || text;
    
    if (repeat > 1) {
      return (
        <>
          {Array.from({ length: repeat }, (_, i) => (
            <span
              key={i}
              ref={i === 0 ? ref : undefined}
              className={cn(dividerTextVariants({ size, color, spacing, className }))}
              {...props}
            >
              {content}
            </span>
          ))}
        </>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(dividerTextVariants({ size, color, spacing, className }))}
        {...props}
      >
        {content}
      </span>
    );
  }
);

DividerText.displayName = 'DividerText';

export { DividerText, dividerTextVariants };