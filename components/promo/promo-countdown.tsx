'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const promoCountdownVariants = cva(
  'font-typewriter uppercase tracking-wider',
  {
    variants: {
      size: {
        sm: 'text-xs',
        default: 'text-xs md:text-sm',
        lg: 'text-sm md:text-base',
      },
      variant: {
        default: 'opacity-60',
        prominent: 'opacity-80 font-bold',
        timer: 'opacity-80 tabular-nums',
      },
      color: {
        inherit: '',
        white: 'text-white',
        black: 'text-black',
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

export interface PromoCountdownProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof promoCountdownVariants> {
  endDate?: string | Date;
  prefix?: string;
  format?: 'date' | 'timer' | 'custom';
  onExpire?: () => void;
}

const PromoCountdown = React.forwardRef<HTMLDivElement, PromoCountdownProps>(
  ({ className, size, variant, color, endDate, prefix = 'ENDS', format = 'date', onExpire, ...props }, ref) => {
    const [timeLeft, setTimeLeft] = React.useState<string>('');

    React.useEffect(() => {
      if (!endDate || format !== 'timer') return;

      const calculateTimeLeft = () => {
        const end = new Date(endDate).getTime();
        const now = new Date().getTime();
        const difference = end - now;

        if (difference <= 0) {
          onExpire?.();
          return 'EXPIRED';
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          return `${days}D ${hours}H ${minutes}M`;
        } else if (hours > 0) {
          return `${hours}H ${minutes}M ${seconds}S`;
        } else {
          return `${minutes}M ${seconds}S`;
        }
      };

      const interval = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);

      setTimeLeft(calculateTimeLeft());

      return () => clearInterval(interval);
    }, [endDate, format, onExpire]);

    const displayText = React.useMemo(() => {
      if (!endDate) return '';

      if (format === 'timer') {
        return `${prefix} ${timeLeft}`;
      }

      if (format === 'date') {
        const date = new Date(endDate);
        const options: Intl.DateTimeFormatOptions = { 
          month: 'long', 
          day: 'numeric' 
        };
        return `${prefix} ${date.toLocaleDateString('en-US', options).toUpperCase()}`;
      }

      return `${prefix} ${endDate}`;
    }, [endDate, format, prefix, timeLeft]);

    if (!displayText) return null;

    return (
      <p
        ref={ref}
        className={cn(promoCountdownVariants({ size, variant, color, className }))}
        {...props}
      >
        {displayText}
      </p>
    );
  }
);

PromoCountdown.displayName = 'PromoCountdown';

export { PromoCountdown, promoCountdownVariants };