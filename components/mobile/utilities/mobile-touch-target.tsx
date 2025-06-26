'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileTouchTargetProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  expand?: boolean; // Expand touch target beyond visual bounds
  preventDoubleTap?: boolean;
}

export function MobileTouchTarget({
  children,
  className,
  size = 'md',
  expand = false,
  preventDoubleTap = true,
}: MobileTouchTargetProps) {
  const sizeClasses = {
    sm: 'min-h-[36px] min-w-[36px]',
    md: 'min-h-[44px] min-w-[44px]', // Apple HIG recommended minimum
    lg: 'min-h-[48px] min-w-[48px]',
    xl: 'min-h-[56px] min-w-[56px]',
  };

  const expandClasses = expand && 'relative before:absolute before:-inset-2 before:content-[""]';

  const doubleTapStyles = preventDoubleTap && 'touch-manipulation';

  return (
    <div
      className={cn(
        sizeClasses[size],
        expandClasses,
        doubleTapStyles,
        'inline-flex items-center justify-center',
        className
      )}
    >
      {children}
    </div>
  );
}