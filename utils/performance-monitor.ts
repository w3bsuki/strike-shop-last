/**
 * Performance monitoring utilities for Core Web Vitals
 */

export interface PerformanceMetrics {
  lcp: number | null;
  fcp: number | null;
  cls: number | null;
  fid: number | null;
  ttfb: number | null;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEventTiming;
          this.metrics.lcp = lastEntry.startTime;
          this.reportMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              this.reportMetric('FCP', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (e) {
        console.warn('FCP observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries() as PerformanceEventTiming[];
          entries.forEach((entry) => {
            // Only count layout shifts without recent user input
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          });
          this.metrics.cls = clsValue;
          this.reportMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
            this.reportMetric('FID', this.metrics.fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }
    }

    // Time to First Byte (TTFB)
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        this.metrics.ttfb = nav.responseStart - nav.requestStart;
        this.reportMetric('TTFB', this.metrics.ttfb);
      }
    }
  }

  private reportMetric(name: string, value: number) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${Math.round(value)}ms`);
      
      // Color-coded console logging for quick identification
      const color = this.getMetricColor(name, value);
      console.log(`%c${name}: ${Math.round(value)}ms`, `color: ${color}; font-weight: bold;`);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Example: Send to Google Analytics
      if ('gtag' in window) {
        (window as any).gtag('event', 'web_vitals', {
          custom_map: { metric_name: name },
          metric_name: name,
          value: Math.round(value),
          event_category: 'Web Vitals'
        });
      }
    }
  }

  private getMetricColor(name: string, value: number): string {
    switch (name) {
      case 'LCP':
        return value < 2500 ? 'green' : value < 4000 ? 'orange' : 'red';
      case 'FCP':
        return value < 1800 ? 'green' : value < 3000 ? 'orange' : 'red';
      case 'CLS':
        return value < 0.1 ? 'green' : value < 0.25 ? 'orange' : 'red';
      case 'FID':
        return value < 100 ? 'green' : value < 300 ? 'orange' : 'red';
      case 'TTFB':
        return value < 800 ? 'green' : value < 1800 ? 'orange' : 'red';
      default:
        return 'blue';
    }
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Manual metric reporting for custom events
  public reportCustomMetric(name: string, value: number, category = 'Custom') {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${Math.round(value)}ms`);
    }

    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      if ('gtag' in window) {
        (window as any).gtag('event', name, {
          value: Math.round(value),
          event_category: category
        });
      }
    }
  }

  // Image loading performance
  public trackImageLoad(src: string, startTime: number) {
    const loadTime = performance.now() - startTime;
    this.reportCustomMetric(`image_load_${src.split('/').pop()}`, loadTime, 'Image Performance');
  }

  // API call performance
  public trackApiCall(endpoint: string, startTime: number) {
    const callTime = performance.now() - startTime;
    this.reportCustomMetric(`api_call_${endpoint.replace(/[\/\?]/g, '_')}`, callTime, 'API Performance');
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility function to measure execution time
export function measurePerformance<T>(fn: () => T, name: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  performanceMonitor.reportCustomMetric(name, end - start, 'Function Performance');
  return result;
}

// Hook for React components
export function usePerformanceMonitor() {
  return {
    getMetrics: () => performanceMonitor.getMetrics(),
    trackImageLoad: (src: string, startTime: number) => performanceMonitor.trackImageLoad(src, startTime),
    trackApiCall: (endpoint: string, startTime: number) => performanceMonitor.trackApiCall(endpoint, startTime),
    reportCustomMetric: (name: string, value: number, category?: string) => 
      performanceMonitor.reportCustomMetric(name, value, category)
  };
}