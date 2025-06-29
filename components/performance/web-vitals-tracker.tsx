'use client';

import { useEffect } from 'react';
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

interface WebVitalsData {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

// PERFORMANCE: Advanced Web Vitals tracking for Real User Monitoring
export function WebVitalsTracker() {
  useEffect(() => {
    // Only run in browser and production
    if (typeof window === 'undefined') return;

    // CRITICAL: Send vitals data to analytics (replace with your analytics service)
    const sendToAnalytics = (metric: { name: string; value: number; delta: number; id: string; navigationType?: string }) => {
      const data: WebVitalsData = {
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType || 'navigate',
      };

      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Web Vital:', data);
      }

      // PRODUCTION: Send to your analytics service
      if (process.env.NODE_ENV === 'production' && window.gtag) {
        window.gtag('event', metric.name, {
          custom_parameter_value: metric.value,
          custom_parameter_delta: metric.delta,
          custom_parameter_id: metric.id,
        });
      }

      // ANALYTICS: Send to custom endpoint
      try {
        fetch('/api/analytics/web-vitals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          keepalive: true, // Ensure data is sent even if page unloads
        }).catch(() => {
          // Silently fail - don't block user experience
        });
      } catch (error) {
        // Silently fail - don't block user experience
      }
    };

    // CRITICAL: Track all Core Web Vitals
    try {
      onCLS((metric) => sendToAnalytics({
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        navigationType: (metric as any).navigationType,
      }));
      onFID((metric) => sendToAnalytics({
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        navigationType: (metric as any).navigationType,
      }));
      onFCP((metric) => sendToAnalytics({
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        navigationType: (metric as any).navigationType,
      }));
      onLCP((metric) => sendToAnalytics({
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        navigationType: (metric as any).navigationType,
      }));
      onTTFB((metric) => sendToAnalytics({
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        navigationType: (metric as any).navigationType,
      }));
    } catch (error) {
      console.warn('Web Vitals tracking failed:', error);
    }

    // ADVANCED: Custom performance monitoring
    const trackCustomMetrics = () => {
      if ('performance' in window) {
        // Track page load time
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
          sendToAnalytics({
            name: 'page_load_time',
            value: pageLoadTime,
            delta: pageLoadTime,
            id: `page-load-${Date.now()}`,
            navigationType: navigation.type,
          });
        }

        // Track resource loading performance
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources.filter((resource: PerformanceResourceTiming) => {
          return resource.duration > 1000; // Resources taking more than 1 second
        });

        if (slowResources.length > 0) {
          sendToAnalytics({
            name: 'slow_resources',
            value: slowResources.length,
            delta: slowResources.length,
            id: `slow-resources-${Date.now()}`,
            navigationType: 'navigate',
          });
        }
      }
    };

    // Track custom metrics after page load
    if (document.readyState === 'complete') {
      trackCustomMetrics();
    } else {
      window.addEventListener('load', trackCustomMetrics);
    }

    // MONITORING: Track JavaScript errors
    const errorHandler = (_event: ErrorEvent) => {
      sendToAnalytics({
        name: 'javascript_error',
        value: 1,
        delta: 1,
        id: `error-${Date.now()}`,
        navigationType: 'navigate',
      });
    };

    window.addEventListener('error', errorHandler);

    // MONITORING: Track unhandled promise rejections
    const rejectionHandler = (_event: PromiseRejectionEvent) => {
      sendToAnalytics({
        name: 'unhandled_rejection',
        value: 1,
        delta: 1,
        id: `rejection-${Date.now()}`,
        navigationType: 'navigate',
      });
    };

    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
      window.removeEventListener('load', trackCustomMetrics);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

// PERFORMANCE: Hook for component-level performance tracking
export function usePerformanceTracker(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Track slow components (>100ms render time)
      if (renderTime > 100) {
        console.warn(`Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`);
        
        // Send to analytics if needed
        if (process.env.NODE_ENV === 'production') {
          try {
            fetch('/api/analytics/component-performance', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                component: componentName,
                renderTime,
                timestamp: Date.now(),
              }),
              keepalive: true,
            }).catch(() => {
              // Silently fail
            });
          } catch (error) {
            // Silently fail
          }
        }
      }
    };
  }, [componentName]);
}

// PERFORMANCE: Advanced user interaction tracking
export function useInteractionTracker() {
  useEffect(() => {
    let interactionCount = 0;
    let lastInteractionTime = 0;

    const trackInteraction = (event: Event) => {
      interactionCount++;
      const currentTime = performance.now();
      const timeSinceLastInteraction = currentTime - lastInteractionTime;
      lastInteractionTime = currentTime;

      // Track interaction patterns
      if (process.env.NODE_ENV === 'development') {
        console.log(`Interaction ${interactionCount}: ${event.type}, delay: ${timeSinceLastInteraction.toFixed(2)}ms`);
      }

      // Track slow interactions (>200ms delay)
      if (timeSinceLastInteraction > 200 && interactionCount > 1) {
        try {
          fetch('/api/analytics/interaction-delay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: event.type,
              delay: timeSinceLastInteraction,
              count: interactionCount,
            }),
            keepalive: true,
          }).catch(() => {
            // Silently fail
          });
        } catch (error) {
          // Silently fail
        }
      }
    };

    // Track key user interactions
    ['click', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, trackInteraction, { passive: true });
    });

    return () => {
      ['click', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
        document.removeEventListener(eventType, trackInteraction);
      });
    };
  }, []);
}

// Global type for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}