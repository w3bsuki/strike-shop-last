'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileTouchTargetProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  expand?: boolean; // Expand touch target beyond visual bounds
  preventDoubleTap?: boolean;
  spacing?: 'tight' | 'normal' | 'loose'; // Controls spacing between touch targets
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

export function MobileTouchTarget({
  children,
  className,
  size = 'md',
  expand = false,
  preventDoubleTap = true,
  spacing = 'normal',
  onTouchStart,
  onTouchEnd,
}: MobileTouchTargetProps) {
  const sizeClasses = {
    sm: 'min-h-[40px] min-w-[40px]', // Increased from 36px for better accessibility
    md: 'min-h-[48px] min-w-[48px]', // Increased from 44px for comfortable mobile use
    lg: 'min-h-[52px] min-w-[52px]',
    xl: 'min-h-[56px] min-w-[56px]',
  };

  const spacingClasses = {
    tight: 'm-1', // 4px spacing
    normal: 'm-2', // 8px spacing (WCAG minimum)
    loose: 'm-3', // 12px spacing
  };

  const expandClasses = expand && 'relative before:absolute before:-inset-2 before:content-[""]';

  const doubleTapStyles = preventDoubleTap && 'touch-manipulation';

  return (
    <div
      className={cn(
        sizeClasses[size],
        spacingClasses[spacing],
        expandClasses,
        doubleTapStyles,
        'inline-flex items-center justify-center select-none',
        className
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        // Only prevent double-tap zoom, allow scrolling
        touchAction: preventDoubleTap ? 'manipulation' : 'auto',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  );
}