/**
 * Performance metrics collection for monitoring
 * Tracks Core Web Vitals and custom business metrics
 */

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface WebVitals {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private webVitals: WebVitals = {};
  private isEnabled = process.env.NODE_ENV === 'production';

  // Core Web Vitals collection
  collectWebVitals(metric: { name: string; value: number }) {
    if (!this.isEnabled) return;

    const { name, value } = metric;
    
    switch (name) {
      case 'FCP':
        this.webVitals.fcp = value;
        break;
      case 'LCP':
        this.webVitals.lcp = value;
        break;
      case 'FID':
        this.webVitals.fid = value;
        break;
      case 'CLS':
        this.webVitals.cls = value;
        break;
      case 'TTFB':
        this.webVitals.ttfb = value;
        break;
    }

    this.record(`web_vitals_${name.toLowerCase()}`, value, {
      page: window.location.pathname,
    });
  }

  // Record custom metric
  record(name: string, value: number, tags?: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // In production, send metrics to monitoring service
    if (this.isEnabled) {
      this.sendToMonitoring([metric]);
    }
  }

  // Increment counter metric
  increment(name: string, tags?: Record<string, string>) {
    this.record(name, 1, tags);
  }

  // Record timing metric
  timing(name: string, duration: number, tags?: Record<string, string>) {
    this.record(`${name}_duration`, duration, tags);
  }

  // Send metrics to monitoring service
  private async sendToMonitoring(metrics: Metric[]) {
    try {
      // In production, this would send to your monitoring service
      // For now, we'll just log to console in production
      if (this.isEnabled) {
        console.log('[Metrics]', JSON.stringify(metrics));
      }
    } catch (error) {
      console.error('[Metrics] Failed to send metrics:', error);
    }
  }

  // Flush all pending metrics
  async flush() {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    await this.sendToMonitoring(metricsToSend);
  }

  // Get current web vitals
  getWebVitals(): WebVitals {
    return { ...this.webVitals };
  }
}

// Export singleton instance
export const metrics = new MetricsCollector();

// Business metrics helpers
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  metrics.increment(`event_${eventName}`, properties);
};

export const trackPageView = (page: string) => {
  metrics.increment('page_view', { page });
};

export const trackApiCall = (endpoint: string, status: number, duration: number) => {
  metrics.timing('api_call', duration, {
    endpoint,
    status: status.toString(),
    success: (status >= 200 && status < 300).toString(),
  });
};

export const trackShopifyOperation = (operation: string, success: boolean, duration: number) => {
  metrics.timing('shopify_operation', duration, {
    operation,
    success: success.toString(),
  });
};

export const trackCartAction = (action: 'add' | 'remove' | 'update', productId: string) => {
  metrics.increment(`cart_${action}`, { productId });
};

export const trackCheckout = (step: string, value?: number) => {
  metrics.increment('checkout_step', { step });
  if (value) {
    metrics.record('checkout_value', value, { step });
  }
};

// Performance observer for automatic Core Web Vitals collection
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  try {
    // FCP and LCP
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          metrics.collectWebVitals({ name: 'FCP', value: entry.startTime });
        }
        if (entry.entryType === 'largest-contentful-paint') {
          metrics.collectWebVitals({ name: 'LCP', value: entry.startTime });
        }
      }
    });
    paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });

    // FID
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const eventEntry = entry as PerformanceEventTiming;
        if (eventEntry.processingStart && eventEntry.startTime) {
          const delay = eventEntry.processingStart - eventEntry.startTime;
          metrics.collectWebVitals({ name: 'FID', value: delay });
        }
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          metrics.collectWebVitals({ name: 'CLS', value: clsValue });
        }
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // TTFB
    if (window.performance && window.performance.timing) {
      const navigationTiming = window.performance.timing;
      const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
      if (ttfb > 0) {
        metrics.collectWebVitals({ name: 'TTFB', value: ttfb });
      }
    }
  } catch (error) {
    console.error('[Metrics] Failed to setup performance observers:', error);
  }
}