'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileFixedPositionProps {
  children: ReactNode;
  position?: 'top' | 'bottom';
  offset?: number;
  useSafeArea?: boolean;
  hideOnScroll?: boolean;
  className?: string;
  zIndex?: number;
}

export function MobileFixedPosition({
  children,
  position = 'bottom',
  offset = 0,
  useSafeArea = true,
  hideOnScroll = false,
  className,
  zIndex = 40,
}: MobileFixedPositionProps) {
  const positionStyles = {
    top: {
      top: offset,
      paddingTop: useSafeArea ? 'env(safe-area-inset-top)' : undefined,
    },
    bottom: {
      bottom: offset,
      paddingBottom: useSafeArea ? 'env(safe-area-inset-bottom)' : undefined,
    },
  };

  return (
    <div
      className={cn(
        'fixed left-0 right-0',
        hideOnScroll && 'transition-transform duration-300',
        className
      )}
      style={{
        ...positionStyles[position],
        zIndex,
      }}
    >
      {children}
    </div>
  );
}