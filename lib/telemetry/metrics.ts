/**
 * Production-Ready Metrics System
 * Using OpenTelemetry for structured metrics collection
 */

import { metrics, trace, SpanStatusCode } from '@opentelemetry/api';

// Create meter for the application
const meter = metrics.getMeter('strike-shop', '1.0.0');

// Define counters
const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

const errorCounter = meter.createCounter('http_errors_total', {
  description: 'Total number of HTTP errors',
});

const operationCounter = meter.createCounter('operations_total', {
  description: 'Total number of operations performed',
});

// Define histograms for timing metrics
const requestDuration = meter.createHistogram('http_request_duration_ms', {
  description: 'Duration of HTTP requests in milliseconds',
  unit: 'ms',
});

const operationDuration = meter.createHistogram('operation_duration_ms', {
  description: 'Duration of operations in milliseconds',
  unit: 'ms',
});

// Define gauges for current state
const activeConnections = meter.createUpDownCounter('active_connections', {
  description: 'Number of active connections',
});

export interface MetricAttributes {
  [key: string]: string | number | boolean;
}

/**
 * Production-ready metrics collector
 */
export class ProductionMetrics {
  /**
   * Increment a counter metric
   */
  increment(name: string, attributes: MetricAttributes = {}) {
    try {
      switch (name) {
        case 'http_request':
        case 'api_request':
          requestCounter.add(1, attributes);
          break;
        case 'http_error':
        case 'api_error':
          errorCounter.add(1, attributes);
          break;
        default:
          operationCounter.add(1, { operation: name, ...attributes });
          break;
      }
    } catch (error) {
      console.error('[Metrics] Failed to increment counter:', error);
    }
  }

  /**
   * Record timing metric
   */
  timing(name: string, duration: number, attributes: MetricAttributes = {}) {
    try {
      if (name.includes('request') || name.includes('api')) {
        requestDuration.record(duration, attributes);
      } else {
        operationDuration.record(duration, { operation: name, ...attributes });
      }
    } catch (error) {
      console.error('[Metrics] Failed to record timing:', error);
    }
  }

  /**
   * Record gauge metric (up/down counter)
   */
  gauge(name: string, value: number, attributes: MetricAttributes = {}) {
    try {
      if (name === 'active_connections') {
        activeConnections.add(value, attributes);
      } else {
        // For other gauges, we can add them as needed
        operationCounter.add(value, { gauge: name, ...attributes });
      }
    } catch (error) {
      console.error('[Metrics] Failed to record gauge:', error);
    }
  }

  /**
   * Create a trace span for operation tracking
   */
  createSpan(name: string, callback: (span: any) => Promise<any>) {
    const tracer = trace.getTracer('strike-shop');
    return tracer.startActiveSpan(name, async (span) => {
      try {
        const result = await callback(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Track API call metrics
   */
  trackApiCall(endpoint: string, method: string, status: number, duration: number) {
    const attributes = {
      endpoint,
      method,
      status: status.toString(),
      success: (status >= 200 && status < 300).toString(),
    };

    this.increment('api_request', attributes);
    this.timing('api_request_duration', duration, attributes);

    if (status >= 400) {
      this.increment('api_error', attributes);
    }
  }

  /**
   * Track Shopify operation metrics
   */
  trackShopifyOperation(operation: string, success: boolean, duration: number) {
    const attributes = {
      operation,
      success: success.toString(),
      service: 'shopify',
    };

    this.increment('shopify_operation', attributes);
    this.timing('shopify_operation_duration', duration, attributes);

    if (!success) {
      this.increment('shopify_error', attributes);
    }
  }

  /**
   * Track cart operations
   */
  trackCartAction(action: 'add' | 'remove' | 'update' | 'clear', productId?: string) {
    const attributes: MetricAttributes = {
      action,
      category: 'cart',
    };

    if (productId) {
      attributes.productId = productId;
    }

    this.increment('cart_operation', attributes);
  }

  /**
   * Track checkout steps
   */
  trackCheckout(step: string, value?: number) {
    const attributes = {
      step,
      category: 'checkout',
    };

    this.increment('checkout_step', attributes);

    if (value) {
      this.timing('checkout_value', value, attributes);
    }
  }

  /**
   * Track user events
   */
  trackEvent(eventName: string, properties: MetricAttributes = {}) {
    this.increment('user_event', {
      event: eventName,
      ...properties,
    });
  }

  /**
   * Track page views
   */
  trackPageView(page: string, userId?: string) {
    const attributes: MetricAttributes = {
      page,
      category: 'navigation',
    };

    if (userId) {
      attributes.userId = userId;
    }

    this.increment('page_view', attributes);
  }
}

// Export singleton instance
export const productionMetrics = new ProductionMetrics();

// Backward compatibility exports
export const trackEvent = (eventName: string, properties?: MetricAttributes) => {
  productionMetrics.trackEvent(eventName, properties);
};

export const trackPageView = (page: string, userId?: string) => {
  productionMetrics.trackPageView(page, userId);
};

export const trackApiCall = (endpoint: string, method: string, status: number, duration: number) => {
  productionMetrics.trackApiCall(endpoint, method, status, duration);
};

export const trackShopifyOperation = (operation: string, success: boolean, duration: number) => {
  productionMetrics.trackShopifyOperation(operation, success, duration);
};

export const trackCartAction = (action: 'add' | 'remove' | 'update' | 'clear', productId?: string) => {
  productionMetrics.trackCartAction(action, productId);
};

export const trackCheckout = (step: string, value?: number) => {
  productionMetrics.trackCheckout(step, value);
};