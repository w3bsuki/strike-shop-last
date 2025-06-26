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
  hideOnScroll = true,
}: MobileNavContainerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      const currentScrollY = window.scrollY;
      const threshold = showThreshold || (window.innerWidth < 768 ? 0.65 : 0.70);
      const heroHeight = window.innerHeight * threshold;
      
      // Check if past hero threshold
      const pastThreshold = currentScrollY > heroHeight;
      setIsVisible(pastThreshold);
      
      // Hide-on-scroll logic
      if (hideOnScroll && pastThreshold) {
        const scrollDelta = currentScrollY - lastScrollY.current;
        
        // Hide when scrolling down > 100px
        if (scrollDelta > 100 && currentScrollY > 100) {
          setIsHidden(true);
        }
        // Show when scrolling up
        else if (scrollDelta < -10) {
          setIsHidden(false);
        }
      }
      
      lastScrollY.current = currentScrollY;
    }, 100); // 100ms throttle
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
    'fixed left-0 right-0 lg:hidden transition-all duration-300 ease-out',
    'bottom-nav' // Class for global styling
  );

  const positionStyles = {
    bottom: 'bottom-0',
    top: 'top-0',
  };

  const variantStyles = {
    default: 'bg-black/95 backdrop-blur-sm border-t border-gray-800',
    minimal: 'bg-white/95 backdrop-blur-sm border-t border-gray-200',
    floating: 'bg-black/90 backdrop-blur-md mx-4 mb-4 rounded-full border border-gray-800',
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
      style={{ zIndex: 'var(--z-fixed)' }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div
        className={cn(
          'flex items-center justify-around',
          variant === 'floating' ? 'px-6 py-3' : 'py-2 px-safe',
          // Safe area padding for top/bottom
          position === 'bottom' && variant !== 'floating' && 'pb-safe-4',
          position === 'top' && variant !== 'floating' && 'pt-safe-4'
        )}
      >
        {children}
      </div>
    </nav>
  );
}