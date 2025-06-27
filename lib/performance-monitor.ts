/**
 * Performance monitoring utilities for Strike Shop
 */

// Type definitions for performance entries
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

interface LargestContentfulPaintEntry extends PerformanceEntry {
  startTime: number;
}

interface ResourceTimingEntry extends PerformanceResourceTiming {
  transferSize?: number;
}

// Performance metrics storage
const metrics = new Map<string, number[]>();

// Measure component render time
export const measureRenderTime = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (!metrics.has(componentName)) {
      metrics.set(componentName, []);
    }
    
    metrics.get(componentName)?.push(renderTime);
    
    // Log slow renders
    if (renderTime > 50) {

    }
  };
};

// Get average render time for a component
export const getAverageRenderTime = (componentName: string): number => {
  const times = metrics.get(componentName);
  if (!times || times.length === 0) return 0;
  
  const sum = times.reduce((a, b) => a + b, 0);
  return sum / times.length;
};

// Log performance report
export const logPerformanceReport = () => {
  // Performance report disabled in production
};

// Web Vitals tracking
export const trackWebVitals = () => {
  if (typeof window === 'undefined') return;
  
  // Track First Contentful Paint
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {

      }
    }
  });
  
  observer.observe({ entryTypes: ['paint'] });
  
  // Track Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];

  });
  
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
};

// Reset metrics
export const resetMetrics = () => {
  metrics.clear();
};

// Enhanced Web Vitals collection with more comprehensive metrics
interface WebVitals {
  lcp?: number;
  fcp?: number;
  ttfb?: number;
  cls?: number;
  fid?: number;
  tti?: number;
  tbt?: number;
  si?: number;
}

interface PerformanceMetrics {
  webVitals: WebVitals;
  resourceMetrics: ResourceMetrics;
  userMetrics: UserMetrics;
  timestamp: number;
}

interface ResourceMetrics {
  totalResources: number;
  totalSize: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  slowResources: Array<{
    name: string;
    duration: number;
    size?: number;
  }>;
}

interface UserMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  bounceRate: boolean;
  sessionDuration: number;
}

const webVitalsData: WebVitals = {};
let performanceMetrics: PerformanceMetrics | null = null;
let clsValue = 0;
const clsEntries: any[] = [];
let fidValue = 0;

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // CLS Observer
  if ('PerformanceObserver' in window) {
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as LayoutShiftEntry;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
            clsEntries.push(entry);
          }
        }
        webVitalsData.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {

    }

    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const firstInputEntry = entry as FirstInputEntry;
          fidValue = firstInputEntry.processingStart - entry.startTime;
          webVitalsData.fid = fidValue;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {

    }

    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1] as LargestContentfulPaintEntry;
          webVitalsData.lcp = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {

    }

    // Long task observer for TTI calculation
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Track long tasks for TTI calculation

        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {

    }
  }
};

// Calculate Time to Interactive
const calculateTTI = (): number => {
  if (typeof window === 'undefined') return 0;
  
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigationEntry) return 0;
  
  // Simplified TTI calculation - in production, use a proper TTI library
  const domContentLoaded = navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart;
  const loadComplete = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
  
  // Estimate TTI as the later of DCL + 2s or Load Complete
  return Math.max(domContentLoaded + 2000, loadComplete);
};

// Calculate Total Blocking Time
const calculateTBT = (): number => {
  // This would require tracking long tasks - simplified implementation
  return 0;
};

// Collect comprehensive Web Vitals
export const getWebVitals = async (): Promise<WebVitals> => {
  if (typeof window === 'undefined') return {};

  return new Promise((resolve) => {
    // Collect existing metrics
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigationEntry) {
      webVitalsData.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    }

    // Get paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      webVitalsData.fcp = fcpEntry.startTime;
    }

    // Calculate TTI
    webVitalsData.tti = calculateTTI();
    
    // Calculate TBT
    webVitalsData.tbt = calculateTBT();

    // Return current data
    resolve(webVitalsData);
  });
};

// Collect resource metrics
export const getResourceMetrics = (): ResourceMetrics => {
  if (typeof window === 'undefined') {
    return {
      totalResources: 0,
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      slowResources: [],
    };
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;
  let imageSize = 0;
  const slowResources: Array<{ name: string; duration: number; size?: number }> = [];

  resources.forEach((resource) => {
    const duration = resource.responseEnd - resource.startTime;
    const resourceTiming = resource as ResourceTimingEntry;
    const transferSize = resourceTiming.transferSize || 0;
    
    totalSize += transferSize;
    
    // Categorize by type
    if (resource.name.includes('.js') || resource.initiatorType === 'script') {
      jsSize += transferSize;
    } else if (resource.name.includes('.css') || resource.initiatorType === 'stylesheet') {
      cssSize += transferSize;
    } else if (resource.initiatorType === 'img' || /\.(jpg|jpeg|png|gif|webp|svg)/.test(resource.name)) {
      imageSize += transferSize;
    }
    
    // Track slow resources (> 1s)
    if (duration > 1000) {
      slowResources.push({
        name: resource.name,
        duration,
        size: transferSize,
      });
    }
  });

  return {
    totalResources: resources.length,
    totalSize,
    jsSize,
    cssSize,
    imageSize,
    slowResources,
  };
};

// Collect user metrics
export const getUserMetrics = (): UserMetrics => {
  if (typeof window === 'undefined') {
    return {
      pageLoadTime: 0,
      timeToInteractive: 0,
      bounceRate: false,
      sessionDuration: 0,
    };
  }

  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const pageLoadTime = navigationEntry ? navigationEntry.loadEventEnd - navigationEntry.fetchStart : 0;
  
  return {
    pageLoadTime,
    timeToInteractive: webVitalsData.tti || 0,
    bounceRate: false, // Would need analytics integration to determine
    sessionDuration: Date.now() - (performance.timeOrigin || 0),
  };
};

// Get comprehensive performance metrics
export const getPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
  const webVitals = await getWebVitals();
  const resourceMetrics = getResourceMetrics();
  const userMetrics = getUserMetrics();
  
  performanceMetrics = {
    webVitals,
    resourceMetrics,
    userMetrics,
    timestamp: Date.now(),
  };
  
  return performanceMetrics;
};

// Performance budget checking
export const checkPerformanceBudget = async (): Promise<{
  passed: boolean;
  violations: string[];
  score: number;
}> => {
  const metrics = await getPerformanceMetrics();
  const violations: string[] = [];
  let score = 100;

  // Core Web Vitals thresholds
  const thresholds = {
    lcp: 2500,  // 2.5s
    fcp: 1800,  // 1.8s
    cls: 0.1,   // 0.1
    fid: 100,   // 100ms
    ttfb: 800,  // 800ms
    tti: 3500,  // 3.5s
  };

  // Check LCP
  if (metrics.webVitals.lcp && metrics.webVitals.lcp > thresholds.lcp) {
    violations.push(`LCP (${metrics.webVitals.lcp.toFixed(0)}ms) exceeds budget (${thresholds.lcp}ms)`);
    score -= 20;
  }

  // Check FCP
  if (metrics.webVitals.fcp && metrics.webVitals.fcp > thresholds.fcp) {
    violations.push(`FCP (${metrics.webVitals.fcp.toFixed(0)}ms) exceeds budget (${thresholds.fcp}ms)`);
    score -= 15;
  }

  // Check CLS
  if (metrics.webVitals.cls && metrics.webVitals.cls > thresholds.cls) {
    violations.push(`CLS (${metrics.webVitals.cls.toFixed(3)}) exceeds budget (${thresholds.cls})`);
    score -= 25;
  }

  // Check FID
  if (metrics.webVitals.fid && metrics.webVitals.fid > thresholds.fid) {
    violations.push(`FID (${metrics.webVitals.fid.toFixed(0)}ms) exceeds budget (${thresholds.fid}ms)`);
    score -= 20;
  }

  // Check TTFB
  if (metrics.webVitals.ttfb && metrics.webVitals.ttfb > thresholds.ttfb) {
    violations.push(`TTFB (${metrics.webVitals.ttfb.toFixed(0)}ms) exceeds budget (${thresholds.ttfb}ms)`);
    score -= 10;
  }

  // Check TTI
  if (metrics.webVitals.tti && metrics.webVitals.tti > thresholds.tti) {
    violations.push(`TTI (${metrics.webVitals.tti.toFixed(0)}ms) exceeds budget (${thresholds.tti}ms)`);
    score -= 10;
  }

  // Resource budget checks
  const resourceBudgets = {
    totalSize: 3000000,   // 3MB
    jsSize: 1000000,      // 1MB
    cssSize: 500000,      // 500KB
    imageSize: 2000000,   // 2MB
  };

  if (metrics.resourceMetrics.totalSize > resourceBudgets.totalSize) {
    violations.push(`Total resource size (${(metrics.resourceMetrics.totalSize / 1024 / 1024).toFixed(1)}MB) exceeds budget (${(resourceBudgets.totalSize / 1024 / 1024).toFixed(1)}MB)`);
    score -= 10;
  }

  if (metrics.resourceMetrics.jsSize > resourceBudgets.jsSize) {
    violations.push(`JavaScript size (${(metrics.resourceMetrics.jsSize / 1024).toFixed(0)}KB) exceeds budget (${(resourceBudgets.jsSize / 1024).toFixed(0)}KB)`);
    score -= 10;
  }

  return {
    passed: violations.length === 0,
    violations,
    score: Math.max(0, score),
  };
};

// Export performance data for analytics
export const exportPerformanceData = async (): Promise<string> => {
  const metrics = await getPerformanceMetrics();
  const budget = await checkPerformanceBudget();
  
  return JSON.stringify({
    ...metrics,
    performanceBudget: budget,
  }, null, 2);
};

// Initialize monitoring when module loads
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPerformanceMonitoring);
  } else {
    initPerformanceMonitoring();
  }
}

// Performance monitor object for compatibility
export const performanceMonitor = {
  getWebVitals,
  measureRenderTime,
  getAverageRenderTime,
  logPerformanceReport,
  trackWebVitals,
  resetMetrics,
};