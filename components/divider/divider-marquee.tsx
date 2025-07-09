import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { DividerText } from './divider-text';

const dividerMarqueeVariants = cva(
  'marquee-container',
  {
    variants: {
      speed: {
        slow: '[--marquee-duration:60s]',
        default: '[--marquee-duration:30s]',
        fast: '[--marquee-duration:15s]',
      },
      direction: {
        left: '',
        right: '[animation-direction:reverse]',
      },
      pauseOnHover: {
        true: 'hover:[animation-play-state:paused]',
        false: '',
      },
    },
    defaultVariants: {
      speed: 'default',
      direction: 'left',
      pauseOnHover: false,
    },
  }
);

export interface DividerMarqueeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerMarqueeVariants> {
  text?: string;
  separator?: React.ReactNode;
  count?: number;
}

const DividerMarquee = React.forwardRef<HTMLDivElement, DividerMarqueeProps>(
  ({ 
    className, 
    speed, 
    direction, 
    pauseOnHover, 
    text = 'STRIKE™', 
    separator = '•',
    count = 20,
    children, 
    ...props 
  }, ref) => {
    // Generate content at render time (server-side)
    const content = [];
    for (let i = 0; i < count; i++) {
      content.push(
        <React.Fragment key={i}>
          {children || <DividerText text={text} />}
          {i < count - 1 && separator && (
            <span className="mx-4 opacity-50">{separator}</span>
          )}
        </React.Fragment>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(dividerMarqueeVariants({ speed, direction, pauseOnHover, className }))}
        {...props}
      >
        <div className="marquee-content">
          {content}
        </div>
      </div>
    );
  }
);

DividerMarquee.displayName = 'DividerMarquee';

export { DividerMarquee, dividerMarqueeVariants };