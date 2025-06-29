'use client';

import React, { useEffect, useRef } from 'react';
import { useMobileTouch, useTouchPreventDefaults } from '@/hooks/use-mobile-touch';
import { cn } from '@/lib/utils';

interface MobileInteractionOptimizerProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Optimization level:
   * - 'basic': Basic touch optimizations (default)
   * - 'enhanced': Enhanced touch feedback and interactions
   * - 'performance': Maximum performance optimizations for scrolling
   */
  optimizationLevel?: 'basic' | 'enhanced' | 'performance';
  /**
   * Scroll direction optimization
   */
  scrollDirection?: 'vertical' | 'horizontal' | 'both' | 'none';
  /**
   * Prevent common mobile interaction issues
   */
  preventDefaults?: {
    zoom?: boolean;
    selection?: boolean;
    callout?: boolean;
    drag?: boolean;
  };
  /**
   * Enable haptic feedback for interactions
   */
  enableHaptics?: boolean;
  /**
   * Touch target enhancement for child elements
   */
  enhanceTouchTargets?: boolean;
}

/**
 * Mobile Interaction Optimizer
 * 
 * A wrapper component that automatically optimizes mobile interactions
 * for any content area. Handles touch targets, scroll behavior, and
 * performance optimizations based on device capabilities.
 */
export function MobileInteractionOptimizer({
  children,
  className,
  optimizationLevel = 'basic',
  scrollDirection = 'vertical',
  preventDefaults = {},
  enableHaptics = true,
  enhanceTouchTargets = true
}: MobileInteractionOptimizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    prefersTouchInteraction, 
    supportsVibration 
  } = useMobileTouch();
  const { preventTouchDefaults } = useTouchPreventDefaults();

  // Apply touch optimizations to container
  useEffect(() => {
    if (containerRef.current && prefersTouchInteraction) {
      preventTouchDefaults(containerRef.current, {
        preventZoom: preventDefaults.zoom ?? true,
        preventSelection: preventDefaults.selection ?? true,
        preventCallout: preventDefaults.callout ?? true,
        preventDrag: preventDefaults.drag ?? false
      });
    }
  }, [prefersTouchInteraction, preventDefaults, preventTouchDefaults]);

  // Enhance touch targets for interactive elements
  useEffect(() => {
    if (!enhanceTouchTargets || !containerRef.current || !prefersTouchInteraction) {
      return;
    }

    const container = containerRef.current;
    const interactiveElements = container.querySelectorAll(
      'button, [role="button"], a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlElement);
      
      // Check if element is too small for touch
      const rect = htmlElement.getBoundingClientRect();
      const minSize = optimizationLevel === 'performance' ? 44 : 48;
      
      if (rect.width < minSize || rect.height < minSize) {
        // Add minimum touch target sizing
        htmlElement.style.minHeight = `${minSize}px`;
        htmlElement.style.minWidth = `${minSize}px`;
        
        // Add padding if element is inline
        if (computedStyle.display === 'inline') {
          htmlElement.style.display = 'inline-flex';
          htmlElement.style.alignItems = 'center';
          htmlElement.style.justifyContent = 'center';
        }
      }

      // Ensure proper spacing between touch targets
      if (optimizationLevel === 'enhanced' || optimizationLevel === 'performance') {
        const hasMargin = parseFloat(computedStyle.margin) > 0;
        if (!hasMargin) {
          htmlElement.style.margin = '4px';
        }
      }

      // Add touch-specific classes
      htmlElement.classList.add('touch-manipulation');
      
      if (optimizationLevel === 'enhanced') {
        htmlElement.classList.add('touch-feedback');
      }
    });
  }, [enhanceTouchTargets, prefersTouchInteraction, optimizationLevel]);

  // Get optimized styles based on configuration
  const getOptimizedStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      WebkitTouchCallout: preventDefaults.callout !== false ? 'none' : undefined,
      WebkitUserSelect: preventDefaults.selection !== false ? 'none' : undefined,
      userSelect: preventDefaults.selection !== false ? 'none' : undefined,
      touchAction: preventDefaults.zoom !== false ? 'manipulation' : undefined
    };

    // Scroll optimizations
    if (scrollDirection !== 'none') {
      const scrollStyles: React.CSSProperties = {
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      };

      if (scrollDirection === 'horizontal') {
        Object.assign(scrollStyles, {
          touchAction: 'pan-x',
          overscrollBehaviorX: 'contain',
          overscrollBehaviorY: 'none'
        });
      } else if (scrollDirection === 'vertical') {
        Object.assign(scrollStyles, {
          touchAction: 'pan-y',
          overscrollBehaviorX: 'none',
          overscrollBehaviorY: 'contain'
        });
      }

      Object.assign(baseStyles, scrollStyles);
    }

    // Performance optimizations
    if (optimizationLevel === 'performance') {
      Object.assign(baseStyles, {
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        contain: 'layout style paint'
      });
    }

    return baseStyles;
  };

  // Haptic feedback handler
  const handleTouchStart = () => {
    if (enableHaptics && supportsVibration && navigator.vibrate) {
      // Subtle feedback for touch start
      navigator.vibrate(10);
    }
  };

  // Get CSS classes based on optimization level
  const getOptimizationClasses = () => {
    const classes = [];

    if (prefersTouchInteraction) {
      classes.push('mobile-optimized');
      
      if (optimizationLevel === 'enhanced') {
        classes.push('touch-enhanced');
      }
      
      if (optimizationLevel === 'performance') {
        classes.push('performance-optimized', 'will-change-transform');
      }
    }

    if (scrollDirection === 'horizontal') {
      classes.push('horizontal-scroll-optimized');
    }

    return classes;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'mobile-interaction-optimizer',
        ...getOptimizationClasses(),
        className
      )}
      style={getOptimizedStyles()}
      onTouchStart={enableHaptics ? handleTouchStart : undefined}
      data-mobile-optimized={prefersTouchInteraction}
      data-optimization-level={optimizationLevel}
    >
      {children}
    </div>
  );
}

/**
 * Specialized wrapper for product grids
 */
export function MobileProductGridOptimizer({ 
  children, 
  className,
  ...props 
}: Omit<MobileInteractionOptimizerProps, 'scrollDirection' | 'optimizationLevel'>) {
  return (
    <MobileInteractionOptimizer
      className={cn('product-grid-mobile-optimized', className)}
      optimizationLevel="enhanced"
      scrollDirection="vertical"
      preventDefaults={{
        zoom: true,
        selection: true,
        callout: true,
        drag: false
      }}
      {...props}
    >
      {children}
    </MobileInteractionOptimizer>
  );
}

/**
 * Specialized wrapper for horizontal scroll sections
 */
export function MobileScrollOptimizer({ 
  children, 
  className,
  ...props 
}: Omit<MobileInteractionOptimizerProps, 'scrollDirection' | 'optimizationLevel'>) {
  return (
    <MobileInteractionOptimizer
      className={cn('mobile-scroll-optimized', className)}
      optimizationLevel="performance"
      scrollDirection="horizontal"
      preventDefaults={{
        zoom: true,
        selection: true,
        callout: true,
        drag: false
      }}
      {...props}
    >
      {children}
    </MobileInteractionOptimizer>
  );
}