'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * LazyLoad component that renders children when they come into viewport
 */
export function LazyLoad({
  children,
  fallback = null,
  threshold = 0.1,
  rootMargin = '100px',
  triggerOnce = true,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const hasBeenVisible = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (triggerOnce) {
              if (!hasBeenVisible.current) {
                setIsVisible(true);
                hasBeenVisible.current = true;
              }
            } else {
              setIsVisible(true);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return <div ref={elementRef}>{isVisible ? children : fallback}</div>;
}
