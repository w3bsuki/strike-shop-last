'use client';

import { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MobileNavContainerProps {
  children: ReactNode;
  className?: string;
  showThreshold?: number; // Hero height percentage (default: 0.65 for mobile, 0.70 for desktop)
  position?: 'bottom' | 'top';
  variant?: 'default' | 'minimal' | 'floating';
  hideOnScroll?: boolean; // Enable hide-on-scroll behavior
}

export function MobileNavContainer({
  children,
  className,
  showThreshold,
  position = 'bottom',
  variant = 'default',
  hideOnScroll = false,
}: MobileNavContainerProps) {
  const [isVisible, setIsVisible] = useState(showThreshold === 0); // Show immediately if threshold is 0
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      const currentScrollY = window.scrollY;
      
      // If showThreshold is 0, always show
      if (showThreshold === 0) {
        setIsVisible(true);
        setIsHidden(false);
        return;
      }
      
      // Show nav when user scrolls past the hero section (aligned with hero height)
      const threshold = showThreshold || 0.50; // Match hero min-h-[50vh] on mobile
      const heroHeight = window.innerHeight * threshold;
      const pastThreshold = currentScrollY > heroHeight;
      setIsVisible(pastThreshold);
      
      // Hide-on-scroll logic only when enabled
      if (hideOnScroll && pastThreshold) {
        const scrollDelta = currentScrollY - lastScrollY.current;
        
        // Hide when scrolling down fast
        if (scrollDelta > 50 && currentScrollY > 200) {
          setIsHidden(true);
        }
        // Show when scrolling up
        else if (scrollDelta < -10) {
          setIsHidden(false);
        }
      }
      
      lastScrollY.current = currentScrollY;
    }, 50); // 50ms throttle for smoother response
  }, [showThreshold, hideOnScroll]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [handleScroll]);

  const baseStyles = cn(
    'fixed left-0 right-0 lg:hidden transition-transform duration-base ease-out',
    'bottom-nav' // Class for global styling
  );

  const positionStyles = {
    bottom: 'bottom-0',
    top: 'top-0',
  };

  const variantStyles = {
    default: 'bg-background border-t border-border shadow-sm',
    minimal: 'bg-background/95 backdrop-blur-sm border-t border-border',
    floating: 'bg-primary mx-4 mb-4 border border-border',
  };

  const visibilityStyles = !isVisible
    ? position === 'bottom'
      ? 'translate-y-full opacity-0'
      : '-translate-y-full opacity-0'
    : isHidden
    ? position === 'bottom'
      ? 'translate-y-full opacity-0'
      : '-translate-y-full opacity-0'
    : 'translate-y-0 opacity-100';

  return (
    <nav
      className={cn(
        baseStyles,
        positionStyles[position],
        variantStyles[variant],
        visibilityStyles,
        className
      )}
      style={{ zIndex: 50 }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div
        className={cn(
          'flex items-center justify-around h-14', // 56px height
          variant === 'floating' ? 'px-6' : 'px-4',
          // Safe area padding for iOS devices
          position === 'bottom' && 'pb-safe'
        )}
      >
        {children}
      </div>
    </nav>
  );
}