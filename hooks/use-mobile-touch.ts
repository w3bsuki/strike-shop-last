'use client';

import { useEffect, useState, useCallback } from 'react';

interface MobileTouchCapabilities {
  isMobile: boolean;
  isTouch: boolean;
  hasHover: boolean;
  supportsVibration: boolean;
  prefersTouchInteraction: boolean;
  screenSize: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Enhanced mobile touch detection hook
 * 
 * Provides comprehensive mobile and touch capability detection
 * for optimizing user interactions based on device capabilities.
 */
export function useMobileTouch(): MobileTouchCapabilities {
  const [capabilities, setCapabilities] = useState<MobileTouchCapabilities>({
    isMobile: false,
    isTouch: false,
    hasHover: false,
    supportsVibration: false,
    prefersTouchInteraction: false,
    screenSize: 'desktop'
  });
  const detectCapabilities = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTouch: false,
        hasHover: true, // Assume desktop during SSR
        supportsVibration: false,
        prefersTouchInteraction: false,
        screenSize: 'desktop' as const
      };
    }

    // Screen size detection
    const width = window.innerWidth;
    const screenSize: 'mobile' | 'tablet' | 'desktop' = 
      width < 640 ? 'mobile' : 
      width < 1024 ? 'tablet' : 
      'desktop';

    // Touch capability detection
    const isTouch = 'ontouchstart' in window || 
                   navigator.maxTouchPoints > 0 || 
                   window.TouchEvent !== undefined;

    // Hover capability detection (more reliable than CSS media queries)
    const hasHover = window.matchMedia?.('(hover: hover)').matches ?? false;

    // Mobile device detection (combination of touch, screen size, and user agent)
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    const isMobile = (isTouch && screenSize === 'mobile') || 
                     (screenSize === 'mobile' && isMobileUserAgent);

    // Vibration support
    const supportsVibration = 'vibrate' in navigator;

    // Prefer touch interaction if device has touch but limited/no hover
    const prefersTouchInteraction = isTouch && (!hasHover || screenSize !== 'desktop');

    return {
      isMobile,
      isTouch,
      hasHover,
      supportsVibration,
      prefersTouchInteraction,
      screenSize
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initial detection
    setCapabilities(detectCapabilities());

    // Listen for viewport changes
    const handleResize = () => {
      setCapabilities(detectCapabilities());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [detectCapabilities]);

  return capabilities;
}

/**
 * Hook for enhanced touch event handling with haptic feedback
 */
export function useEnhancedTouch() {
  const { supportsVibration, prefersTouchInteraction } = useMobileTouch();

  const triggerHapticFeedback = useCallback((
    pattern: number | number[] = 50
  ) => {
    if (supportsVibration && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [supportsVibration]);

  const createTouchHandler = useCallback((
    callback: (e: React.TouchEvent | React.MouseEvent) => void,
    options: {
      hapticPattern?: number | number[];
      preventDefault?: boolean;
      stopPropagation?: boolean;
    } = {}
  ) => {
    return (e: React.TouchEvent | React.MouseEvent) => {
      const { 
        hapticPattern = 50, 
        preventDefault = false, 
        stopPropagation = false 
      } = options;

      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();

      // Trigger haptic feedback on touch devices
      if (prefersTouchInteraction && 'touches' in e) {
        triggerHapticFeedback(hapticPattern);
      }

      callback(e);
    };
  }, [prefersTouchInteraction, triggerHapticFeedback]);

  return {
    triggerHapticFeedback,
    createTouchHandler,
    prefersTouchInteraction
  };
}

/**
 * Hook for optimized scroll behavior on mobile
 */
export function useMobileScroll() {
  const { isMobile, isTouch } = useMobileTouch();

  const getScrollStyles = useCallback((direction: 'x' | 'y' | 'both' = 'both') => {
    const baseStyles: React.CSSProperties = {
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain'
    };

    if (direction === 'x') {
      return {
        ...baseStyles,
        touchAction: 'pan-x',
        overflowX: 'auto',
        overflowY: 'hidden',
        overscrollBehaviorX: 'contain',
        overscrollBehaviorY: 'none'
      };
    }

    if (direction === 'y') {
      return {
        ...baseStyles,
        touchAction: 'pan-y',
        overflowX: 'hidden',
        overflowY: 'auto',
        overscrollBehaviorX: 'none',
        overscrollBehaviorY: 'contain'
      };
    }

    return {
      ...baseStyles,
      touchAction: 'pan-x pan-y'
    };
  }, []);

  const getSnapScrollStyles = useCallback((axis: 'x' | 'y' = 'x') => {
    return {
      scrollSnapType: isMobile ? `${axis} proximity` : `${axis} mandatory`,
      scrollBehavior: isMobile ? 'auto' : 'smooth'
    } as React.CSSProperties;
  }, [isMobile]);

  return {
    isMobile,
    isTouch,
    getScrollStyles,
    getSnapScrollStyles
  };
}

/**
 * Hook for preventing unwanted touch behaviors
 */
export function useTouchPreventDefaults() {
  const { prefersTouchInteraction } = useMobileTouch();

  const preventTouchDefaults = useCallback((
    element: HTMLElement | null,
    options: {
      preventZoom?: boolean;
      preventSelection?: boolean;
      preventCallout?: boolean;
      preventDrag?: boolean;
    } = {}
  ) => {
    if (!element || !prefersTouchInteraction) return;

    const {
      preventZoom = true,
      preventSelection = true,
      preventCallout = true,
      preventDrag = false
    } = options;

    if (preventZoom) {
      element.style.touchAction = 'manipulation';
    }

    if (preventSelection) {
      element.style.webkitUserSelect = 'none';
      element.style.userSelect = 'none';
    }

    if (preventCallout) {
      (element.style as any).webkitTouchCallout = 'none';
    }

    if (preventDrag) {
      (element.style as any).webkitUserDrag = 'none';
      element.addEventListener('dragstart', (e) => e.preventDefault());
    }
  }, [prefersTouchInteraction]);

  return { preventTouchDefaults };
}