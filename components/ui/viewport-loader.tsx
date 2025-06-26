'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface ViewportLoaderProps {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
  threshold?: number | number[];
  onVisible?: () => void;
  className?: string;
  triggerOnce?: boolean;
}

/**
 * BUNDLE OPTIMIZATION: ViewportLoader component for lazy loading below-fold content
 * 
 * This component uses IntersectionObserver to detect when content enters the viewport
 * and only renders it when visible, significantly reducing initial bundle size and
 * improving performance for long pages.
 * 
 * Usage:
 * <ViewportLoader
 *   placeholder={<div className="h-96 bg-gray-100 animate-pulse" />}
 *   rootMargin="100px" // Start loading 100px before visible
 * >
 *   <ExpensiveComponent />
 * </ViewportLoader>
 */
export function ViewportLoader({
  children,
  placeholder = <div className="min-h-[200px]" />,
  rootMargin = '100px',
  threshold = 0,
  onVisible,
  className,
  triggerOnce = true,
}: ViewportLoaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || (triggerOnce && hasTriggeredRef.current)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            hasTriggeredRef.current = true;
            
            if (onVisible) {
              onVisible();
            }

            // If triggerOnce is true, disconnect after first trigger
            if (triggerOnce) {
              observer.disconnect();
            }
          } else if (!triggerOnce) {
            // Allow hiding content again if triggerOnce is false
            setIsVisible(false);
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, onVisible, triggerOnce]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? children : placeholder}
    </div>
  );
}

/**
 * Utility hook for viewport detection
 * Can be used independently of ViewportLoader component
 */
export function useInViewport(
  ref: React.RefObject<Element>,
  options?: {
    rootMargin?: string;
    threshold?: number | number[];
    triggerOnce?: boolean;
  }
) {
  const [isInViewport, setIsInViewport] = useState(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || (options?.triggerOnce && hasTriggeredRef.current)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInViewport(true);
            hasTriggeredRef.current = true;

            if (options?.triggerOnce) {
              observer.disconnect();
            }
          } else if (!options?.triggerOnce) {
            setIsInViewport(false);
          }
        });
      },
      {
        rootMargin: options?.rootMargin || '0px',
        threshold: options?.threshold || 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options?.rootMargin, options?.threshold, options?.triggerOnce]);

  return isInViewport;
}

/**
 * Higher-order component for viewport-based lazy loading
 * Useful for wrapping existing components without modifying them
 */
export function withViewportLoader<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ViewportLoaderProps, 'children'>
) {
  return function ViewportLoadedComponent(props: P) {
    return (
      <ViewportLoader {...options}>
        <Component {...props} />
      </ViewportLoader>
    );
  };
}