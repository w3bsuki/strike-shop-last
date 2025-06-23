// Performance monitoring utilities for Strike Shop

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Web Vitals observer
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      this.observeMetric('largest-contentful-paint', (entries) => {
        const lastEntry = entries[entries.length - 1] as any;
        this.recordMetric('LCP', lastEntry.startTime, 'ms', {
          element: lastEntry.element?.tagName,
          url: lastEntry.url,
          size: lastEntry.size,
        });
      });

      // First Input Delay (FID)
      this.observeMetric('first-input', (entries) => {
        const firstEntry = entries[0] as any;
        this.recordMetric(
          'FID',
          firstEntry.processingStart - firstEntry.startTime,
          'ms',
          {
            eventType: firstEntry.name,
            target: firstEntry.target?.tagName,
          }
        );
      });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsEntries: any[] = [];
      this.observeMetric('layout-shift', (entries) => {
        for (const entry of entries as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        }
        this.recordMetric('CLS', clsValue, 'score', {
          entries: clsEntries.length,
        });
      });
    }
  }

  private observeMetric(
    type: string,
    callback: (entries: PerformanceEntryList) => void
  ) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (e) {

    }
  }

  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, any>
  ) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    this.reportMetric(metric);
  }

  private reportMetric(metric: PerformanceMetric) {
    // Performance metrics logging disabled

    // Send to analytics service in production
    if (
      process.env.NODE_ENV === 'production' &&
      typeof window !== 'undefined'
    ) {
      // Google Analytics
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'performance_metric', {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_unit: metric.unit,
          ...metric.metadata,
        });
      }

      // Custom analytics endpoint
      this.sendToAnalytics(metric);
    }
  }

  private async sendToAnalytics(metric: PerformanceMetric) {
    try {
      // Use sendBeacon for reliability
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          metric,
          page: window.location.pathname,
          timestamp: metric.timestamp,
          sessionId: this.getSessionId(),
        });
        navigator.sendBeacon('/api/analytics/performance', data);
      }
    } catch (error) {

    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('strike-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('strike-session-id', sessionId);
    }
    return sessionId;
  }

  // Manual timing methods
  startTiming(label: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  }

  endTiming(label: string, metadata?: Record<string, any>) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);

      const measure = performance.getEntriesByName(label, 'measure')[0];
      if (measure) {
        this.recordMetric(label, measure.duration, 'ms', metadata);
      }
    }
  }

  // Resource timing
  getResourceTimings() {
    if (typeof performance === 'undefined') return [];

    const resources = performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[];
    return resources.map((resource) => ({
      name: resource.name,
      type: resource.initiatorType,
      duration: resource.duration,
      size: resource.transferSize,
      cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
    }));
  }

  // Page load metrics
  getPageLoadMetrics() {
    if (typeof performance === 'undefined') return null;

    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (!navigation) return null;

    return {
      // Page load phases
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ssl: navigation.connectEnd - navigation.secureConnectionStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      download: navigation.responseEnd - navigation.responseStart,
      domParsing: navigation.domInteractive - navigation.responseEnd,
      domContentLoaded:
        navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart,
      onLoad: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.fetchStart,

      // Key metrics
      fp: this.getFirstPaint(),
      fcp: this.getFirstContentfulPaint(),
      domInteractive: navigation.domInteractive - navigation.fetchStart,
      domComplete: navigation.domComplete - navigation.fetchStart,
    };
  }

  private getFirstPaint(): number | null {
    if (typeof performance === 'undefined') return null;

    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(
      (entry) => entry.name === 'first-paint'
    );
    return firstPaint?.startTime || null;
  }

  private getFirstContentfulPaint(): number | null {
    if (typeof performance === 'undefined') return null;

    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(
      (entry) => entry.name === 'first-contentful-paint'
    );
    return fcp?.startTime || null;
  }

  // Memory usage (Chrome only)
  getMemoryUsage() {
    if (typeof performance === 'undefined' || !(performance as any).memory) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }

  // Get all metrics
  getMetrics() {
    return this.metrics;
  }

  // Disconnect all observers
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hooks for performance monitoring
export function usePerformanceTiming(label: string) {
  useEffect(() => {
    performanceMonitor.startTiming(label);
    return () => {
      performanceMonitor.endTiming(label);
    };
  }, [label]);
}

export function useComponentPerformance(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef<number>();

  useEffect(() => {
    renderCount.current++;
    mountTime.current = Date.now();

    return () => {
      if (mountTime.current) {
        const lifetime = Date.now() - mountTime.current;
        performanceMonitor.recordMetric(
          `${componentName}-lifetime`,
          lifetime,
          'ms',
          { renders: renderCount.current }
        );
      }
    };
  }, [componentName]);

  useEffect(() => {
    performanceMonitor.recordMetric(`${componentName}-render`, 1, 'count', {
      renderNumber: renderCount.current,
    });
  });
}

// Utility functions
export function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  performanceMonitor.startTiming(label);
  return fn().finally(() => {
    performanceMonitor.endTiming(label);
  });
}

export function reportWebVitals(metric: any) {
  const { name, value, id } = metric;
  performanceMonitor.recordMetric(name, value, 'ms', { id });
}

// Performance budgets
export const PERFORMANCE_BUDGETS = {
  LCP: 2500, // 2.5s
  FID: 100, // 100ms
  CLS: 0.1, // 0.1 score
  TTFB: 600, // 600ms
  FCP: 1800, // 1.8s
  JS_BUNDLE_SIZE: 300 * 1024, // 300KB
  IMAGE_SIZE: 200 * 1024, // 200KB per image
  TOTAL_PAGE_SIZE: 2 * 1024 * 1024, // 2MB
};

// Check if metric exceeds budget
export function checkPerformanceBudget(
  metricName: keyof typeof PERFORMANCE_BUDGETS,
  value: number
): boolean {
  const budget = PERFORMANCE_BUDGETS[metricName];
  if (!budget) return true;

  const exceeds = value > budget;
  // Performance budget warnings disabled

  return !exceeds;
}

import { useEffect, useRef } from 'react';

// Export for use in app
export default performanceMonitor;
