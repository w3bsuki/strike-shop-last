'use client';

import { useEffect } from 'react';

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  entries: PerformanceEntry[];
}

/**
 * Core Web Vitals monitoring component
 * Tracks LCP, FID, CLS, FCP, TTFB in production
 */
export function CoreWebVitalsMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    const reportWebVitals = async () => {
      try {
        // Dynamically import web-vitals to reduce bundle size
        const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals');

        // Helper to send metrics to analytics
        const sendToAnalytics = (metric: Metric) => {
          const body = {
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          };

          // Log to console in development
          if (process.env.NODE_ENV === 'development') {
            console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
          }

          // Send to analytics endpoint
          if ('sendBeacon' in navigator) {
            navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(body));
          } else {
            fetch('/api/analytics/vitals', {
              body: JSON.stringify(body),
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              keepalive: true,
            }).catch(() => {
              // Silently fail - don't impact user experience
            });
          }
        };

        // Track all Core Web Vitals
        onCLS(sendToAnalytics);
        onFID(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);

        // Additional performance metrics
        if ('PerformanceObserver' in window) {
          // Track long tasks
          try {
            const longTaskObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.duration > 50) {
                  sendToAnalytics({
                    name: 'long-task',
                    value: entry.duration,
                    rating: entry.duration > 100 ? 'poor' : 'needs-improvement',
                    delta: 0,
                    id: `lt-${Date.now()}`,
                    entries: [entry],
                  });
                }
              }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
          } catch (e) {
            // Some browsers don't support longtask
          }

          // Track resource timing
          try {
            const resourceObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.name.includes('.js') || entry.name.includes('.css')) {
                  const resourceEntry = entry as PerformanceResourceTiming;
                  if (resourceEntry.duration > 1000) {
                    sendToAnalytics({
                      name: 'slow-resource',
                      value: resourceEntry.duration,
                      rating: 'poor',
                      delta: 0,
                      id: `sr-${Date.now()}`,
                      entries: [entry],
                    });
                  }
                }
              }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
          } catch (e) {
            // Some browsers don't support resource timing
          }
        }

        // Monitor memory usage (Chrome only)
        if ('memory' in performance) {
          const checkMemory = () => {
            const memory = (performance as any).memory;
            const usedJSHeapSize = memory.usedJSHeapSize / 1048576; // Convert to MB
            
            if (usedJSHeapSize > 50) {
              sendToAnalytics({
                name: 'high-memory',
                value: usedJSHeapSize,
                rating: usedJSHeapSize > 100 ? 'poor' : 'needs-improvement',
                delta: 0,
                id: `hm-${Date.now()}`,
                entries: [],
              });
            }
          };

          // Check memory every 30 seconds
          setInterval(checkMemory, 30000);
        }
      } catch (error) {
        // Silently fail - don't impact user experience
        console.error('[Web Vitals] Failed to load:', error);
      }
    };

    reportWebVitals();
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Development-only performance logger
 */
export function PerformanceLogger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    console.log('[Performance] Initial metrics:');
    
    // Log navigation timing
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navTiming) {
      console.table({
        'DNS Lookup': `${(navTiming.domainLookupEnd - navTiming.domainLookupStart).toFixed(2)}ms`,
        'TCP Connection': `${(navTiming.connectEnd - navTiming.connectStart).toFixed(2)}ms`,
        'Request Time': `${(navTiming.responseStart - navTiming.requestStart).toFixed(2)}ms`,
        'Response Time': `${(navTiming.responseEnd - navTiming.responseStart).toFixed(2)}ms`,
        'DOM Processing': `${(navTiming.domComplete - navTiming.domInteractive).toFixed(2)}ms`,
        'Load Complete': `${navTiming.loadEventEnd.toFixed(2)}ms`,
      });
    }

    // Log resource timing
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    const cssResources = resources.filter(r => r.name.endsWith('.css'));
    const imageResources = resources.filter(r => 
      r.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)
    );

    console.log('[Performance] Resource Summary:');
    console.table({
      'JS Files': `${jsResources.length} files, ${jsResources.reduce((sum, r) => sum + r.transferSize, 0) / 1024}KB`,
      'CSS Files': `${cssResources.length} files, ${cssResources.reduce((sum, r) => sum + r.transferSize, 0) / 1024}KB`,
      'Images': `${imageResources.length} files, ${imageResources.reduce((sum, r) => sum + r.transferSize, 0) / 1024}KB`,
    });

    // Log slowest resources
    const slowResources = resources
      .filter(r => r.duration > 100)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    if (slowResources.length > 0) {
      console.log('[Performance] Slowest Resources:');
      slowResources.forEach(r => {
        console.log(`  ${r.name.split('/').pop()} - ${r.duration.toFixed(2)}ms`);
      });
    }
  }, []);

  return null;
}