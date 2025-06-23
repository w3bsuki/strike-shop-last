import { useEffect, useRef } from 'react';

interface PrefetchOptions {
  onHover?: boolean;
  onVisible?: boolean;
  delay?: number;
}

/**
 * Hook to prefetch dynamic components
 * @param importFn - Dynamic import function
 * @param options - Prefetch options
 */
export function usePrefetch(
  importFn: () => Promise<any>,
  options: PrefetchOptions = {}
) {
  const { onHover = true, onVisible = false, delay = 0 } = options;
  const prefetchedRef = useRef(false);
  const elementRef = useRef<HTMLElement>(null);

  const prefetch = () => {
    if (!prefetchedRef.current) {
      prefetchedRef.current = true;
      if (delay > 0) {
        setTimeout(() => {
          importFn();
        }, delay);
      } else {
        importFn();
      }
    }
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Hover prefetching
    if (onHover) {
      const handleMouseEnter = () => prefetch();
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('focus', handleMouseEnter);

      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('focus', handleMouseEnter);
      };
    }
  }, [onHover]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !onVisible) return;

    // Intersection Observer for visibility prefetching
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetch();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [onVisible]);

  return { elementRef, prefetch };
}
