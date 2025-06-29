'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface IntersectionOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

interface ProgressiveEnhancementProps {
  children: (isIntersecting: boolean) => ReactNode;
  options?: IntersectionOptions;
  onIntersect?: () => void;
}

/**
 * Advanced intersection observer hook for progressive enhancement
 * Optimized for Core Web Vitals with smart preloading
 */
export function useIntersectionObserver(
  options: IntersectionOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    root = null,
    rootMargin = '200px', // Aggressive preloading for better performance
    threshold = 0.01, // Low threshold for early triggering
    triggerOnce = true,
  } = options;

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    // Skip if already triggered and triggerOnce is true
    if (triggerOnce && hasIntersected) return;

    // Create observer with performance optimizations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const intersecting = entry.isIntersecting;
          setIsIntersecting(intersecting);
          
          if (intersecting && triggerOnce) {
            setHasIntersected(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    // Start observing
    observerRef.current.observe(target);

    // Cleanup
    return () => {
      observerRef.current?.disconnect();
    };
  }, [root, rootMargin, threshold, triggerOnce, hasIntersected]);

  // Return both ref and state
  return {
    ref: targetRef,
    isIntersecting: triggerOnce ? hasIntersected : isIntersecting,
  };
}

/**
 * Progressive Enhancement Component
 * Renders content when it comes into viewport with performance optimizations
 */
export function ProgressiveEnhancement({
  children,
  options = {},
  onIntersect,
}: ProgressiveEnhancementProps) {
  const { ref, isIntersecting } = useIntersectionObserver(options);
  const hasCalledCallback = useRef(false);

  useEffect(() => {
    if (isIntersecting && onIntersect && !hasCalledCallback.current) {
      hasCalledCallback.current = true;
      onIntersect();
    }
  }, [isIntersecting, onIntersect]);

  return (
    <div ref={ref as any}>
      {children(isIntersecting)}
    </div>
  );
}

/**
 * Progressive Image Loading Component
 * Implements advanced lazy loading with blur placeholders
 */
interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
}

export function ProgressiveImage({
  src,
  alt,
  className = '',
  priority = false,
  onLoad,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Use intersection observer for non-priority images
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: '300px', // Even more aggressive for images
    threshold: 0.01,
    triggerOnce: true,
  });

  // Load image when in viewport or priority
  useEffect(() => {
    if (priority || isIntersecting) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
    }
  }, [src, priority, isIntersecting, onLoad]);

  return (
    <div ref={ref as any} className={`relative ${className}`}>
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Actual image */}
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...(!priority && { loading: 'lazy' })}
          {...{ decoding: 'async' }}
          {...(priority ? { fetchPriority: 'high' } : { fetchPriority: 'low' })}
        />
      )}
    </div>
  );
}

/**
 * Progressive Component Loading
 * Delays rendering of non-critical components
 */
interface ProgressiveComponentProps {
  children: ReactNode;
  delay?: number;
  fallback?: ReactNode;
}

export function ProgressiveComponent({
  children,
  delay = 0,
  fallback = null,
}: ProgressiveComponentProps) {
  const [shouldRender, setShouldRender] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, delay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [delay]);

  return <>{shouldRender ? children : fallback}</>;
}

/**
 * Viewport Priority Manager
 * Prioritizes loading based on viewport position
 */
export function useViewportPriority() {
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      if (scrollY < viewportHeight) {
        setPriority('high');
      } else if (scrollY < viewportHeight * 2) {
        setPriority('medium');
      } else {
        setPriority('low');
      }
    };

    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  return priority;
}