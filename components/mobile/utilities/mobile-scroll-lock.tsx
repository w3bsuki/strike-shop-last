'use client';

import { useEffect } from 'react';

interface MobileScrollLockProps {
  isLocked: boolean;
  reserveScrollBarGap?: boolean;
}

export function MobileScrollLock({
  isLocked,
  reserveScrollBarGap = true,
}: MobileScrollLockProps) {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll
    document.body.style.overflow = 'hidden';
    
    // Prevent iOS bounce
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    // Reserve space for scrollbar to prevent layout shift
    if (reserveScrollBarGap && scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // Handle iOS specific issues
    const handleTouchMove = (e: TouchEvent) => {
      if (isLocked) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isLocked, reserveScrollBarGap]);

  return null;
}