'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileNavLabelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'minimal' | 'hidden';
  size?: 'xs' | 'sm' | 'md';
}

export function MobileNavLabel({
  children,
  className,
  variant = 'default',
  size = 'xs',
}: MobileNavLabelProps) {
  if (variant === 'hidden') {
    return <span className="sr-only">{children}</span>;
  }

  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
  };

  const variantStyles = {
    default: 'font-bold uppercase tracking-wider',
    minimal: 'font-medium',
  };

  return (
    <span
      className={cn(
        sizeStyles[size],
        variantStyles[variant],
        'block mt-1',
        className
      )}
    >
      {children}
    </span>
  );
}