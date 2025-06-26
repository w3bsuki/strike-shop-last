'use client';

import { cn } from '@/lib/utils';

interface MobileNavIndicatorProps {
  isActive?: boolean;
  className?: string;
  variant?: 'line' | 'dot' | 'pill' | 'glow';
  position?: 'bottom' | 'top' | 'center';
  color?: 'primary' | 'secondary' | 'accent' | 'white' | 'black';
}

export function MobileNavIndicator({
  isActive = false,
  className,
  variant = 'line',
  position = 'bottom',
  color = 'white',
}: MobileNavIndicatorProps) {
  if (!isActive) return null;

  const baseStyles = 'absolute transition-all duration-300';

  const positionStyles = {
    bottom: 'bottom-0 left-0 right-0',
    top: 'top-0 left-0 right-0',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  const colorStyles = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    white: 'bg-white',
    black: 'bg-black',
  };

  const variantStyles = {
    line: cn('h-0.5', position === 'center' && 'w-6'),
    dot: 'w-1 h-1 rounded-full left-1/2 -translate-x-1/2',
    pill: 'h-1 rounded-full mx-auto w-8 left-1/2 -translate-x-1/2',
    glow: cn(
      'h-0.5 blur-sm',
      position === 'center' && 'w-6',
      color === 'white' && 'shadow-[0_0_8px_rgba(255,255,255,0.8)]',
      color === 'primary' && 'shadow-[0_0_8px_rgba(var(--primary),0.8)]'
    ),
  };

  return (
    <div
      className={cn(
        baseStyles,
        positionStyles[position],
        colorStyles[color],
        variantStyles[variant],
        className
      )}
      aria-hidden="true"
    />
  );
}