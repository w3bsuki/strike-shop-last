'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  fcp?: number; // First Contentful Paint
}

/**
 * PERFORMANCE MONITOR: Ensures "Fast as Fuck" Experience
 * 
 * Monitors Web Vitals and performance metrics in real-time
 * Provides alerts if performance degrades below optimal thresholds
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isOptimal, setIsOptimal] = useState(true);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Performance thresholds for "fast as fuck" experience
    const THRESHOLDS = {
      lcp: 2500, // Excellent: < 2.5s
      fid: 100,  // Excellent: < 100ms
      cls: 0.1,  // Excellent: < 0.1
      ttfb: 600, // Good: < 600ms
      fcp: 1800, // Good: < 1.8s
    };

    // Measure performance metrics
    const measurePerformance = () => {
      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.fetchStart;
        setMetrics(prev => ({ ...prev, ttfb }));
      }

      // Get paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
      }
    };

    // Web Vitals observer
    const observeWebVitals = () => {
      // LCP Observer
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            const lcp = lastEntry.startTime;
            setMetrics(prev => ({ ...prev, lcp }));
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // FID Observer
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              const fid = (entry as any).processingStart - entry.startTime;
              setMetrics(prev => ({ ...prev, fid }));
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // CLS Observer
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            });
            setMetrics(prev => ({ ...prev, cls: clsValue }));
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (error) {

        }
      }
    };

    // Check if performance is optimal
    const checkPerformance = () => {
      const currentMetrics = metrics;
      const optimal = Object.entries(THRESHOLDS).every(([key, threshold]) => {
        const value = currentMetrics[key as keyof PerformanceMetrics];
        return !value || value <= threshold;
      });
      setIsOptimal(optimal);
    };

    measurePerformance();
    observeWebVitals();

    // Check performance every 5 seconds
    const interval = setInterval(checkPerformance, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [metrics]);

  return { metrics, isOptimal };
}

/**
 * Performance Alert Component
 * Shows when performance is not optimal (dev mode only)
 */
export function PerformanceAlert() {
  const { metrics, isOptimal } = usePerformanceMonitor();

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || isOptimal) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-500 text-white p-3 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-center mb-2">
        <span className="font-bold">⚠️ Performance Alert</span>
      </div>
      <div className="text-sm space-y-1">
        {metrics.lcp && metrics.lcp > 2500 && (
          <div>LCP: {Math.round(metrics.lcp)}ms (Target: &lt;2500ms)</div>
        )}
        {metrics.fid && metrics.fid > 100 && (
          <div>FID: {Math.round(metrics.fid)}ms (Target: &lt;100ms)</div>
        )}
        {metrics.cls && metrics.cls > 0.1 && (
          <div>CLS: {metrics.cls.toFixed(3)} (Target: &lt;0.1)</div>
        )}
        {metrics.ttfb && metrics.ttfb > 600 && (
          <div>TTFB: {Math.round(metrics.ttfb)}ms (Target: &lt;600ms)</div>
        )}
      </div>
    </div>
  );
}

/**
 * Performance Badge Component
 * Shows current performance status
 */
export function PerformanceBadge() {
  const { isOptimal } = usePerformanceMonitor();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 px-3 py-1 rounded-full text-xs font-bold ${
      isOptimal 
        ? 'bg-green-500 text-white' 
        : 'bg-yellow-500 text-black'
    }`}>
      {isOptimal ? '🚀 FAST AF' : '⚠️ SLOW'}
    </div>
  );
}

/**
 * Preload Critical Resources
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  // Preload critical images
  const criticalImages = [
    '/placeholder.svg',
    '/placeholder-logo.svg',
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });

  // Preload critical fonts
  const criticalFonts = [
    '/fonts/CourierPrime-Regular.ttf',
    '/fonts/CourierPrime-Bold.ttf',
  ];

  criticalFonts.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/ttf';
    link.href = src;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Image Optimization Hook
 */
export function useImageOptimization() {
  useEffect(() => {
    // Lazy load images that are not in viewport
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }

    // Optimize image loading
    const allImages = document.querySelectorAll('img');
    allImages.forEach(img => {
      // Add decoding="async" for better performance
      img.decoding = 'async';
      
      // Add loading="lazy" for non-critical images
      if (!img.hasAttribute('priority')) {
        img.loading = 'lazy';
      }
    });
  }, []);
}