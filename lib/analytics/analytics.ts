/**
 * Comprehensive Analytics Service
 * Integrates Shopify, Google Analytics 4, and custom tracking
 */

import { performanceService } from './performance';

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
}

export interface EcommerceEvent {
  event: 'view_item' | 'add_to_cart' | 'remove_from_cart' | 'begin_checkout' | 'purchase' | 'view_item_list';
  ecommerce: {
    currency: string;
    value?: number;
    items: Array<{
      item_id: string;
      item_name: string;
      item_category?: string;
      item_variant?: string;
      price: number;
      quantity: number;
    }>;
    transaction_id?: string;
  };
  userId?: string;
  sessionId?: string;
}

export interface ConversionFunnel {
  step: 'product_view' | 'add_to_cart' | 'checkout_start' | 'checkout_complete';
  value: number;
  userId?: string;
  sessionId?: string;
  metadata: Record<string, any>;
}

export interface CustomerSegment {
  id: string;
  name: string;
  criteria: {
    totalSpent?: { min?: number; max?: number };
    orderCount?: { min?: number; max?: number };
    avgOrderValue?: { min?: number; max?: number };
    lastPurchase?: { days: number };
    location?: string[];
    productCategories?: string[];
  };
  customerIds: string[];
}

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'consent',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private conversionFunnel: ConversionFunnel[] = [];
  private customerSegments: CustomerSegment[] = [];
  private sessionId: string;
  private userId?: string;
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeAnalytics();
  }

  /**
   * Initialize analytics services
   */
  private async initializeAnalytics(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Initialize Google Analytics 4
      await this.initializeGA4();
      
      // Initialize performance monitoring
      this.initializePerformanceTracking();
      
      // Track page view
      this.trackPageView(window.location.pathname);
      
      this.isInitialized = true;
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  /**
   * Initialize Google Analytics 4
   */
  private async initializeGA4(): Promise<void> {
    const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
    if (!GA_ID) return;

    // Load gtag script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      (window as any).gtag = function() {
        window.dataLayer!.push(arguments);
      };
    }

    (window as any).gtag('js', new Date());
    window.gtag!('config', GA_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }

  /**
   * Initialize performance tracking
   */
  private initializePerformanceTracking(): void {
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => this.reportWebVital(metric));
      getFID((metric) => this.reportWebVital(metric));
      getFCP((metric) => this.reportWebVital(metric));
      getLCP((metric) => this.reportWebVital(metric));
      getTTFB((metric) => this.reportWebVital(metric));
    }).catch(console.error);

    // Track page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.track('page_load_time', {
          duration: pageLoadTime,
          url: window.location.pathname,
        });
      }
    });
  }

  /**
   * Report Web Vitals
   */
  private reportWebVital(metric: any): void {
    performanceService.trackCoreWebVitals({
      lcp: metric.name === 'LCP' ? metric.value : 0,
      fid: metric.name === 'FID' ? metric.value : 0,
      cls: metric.name === 'CLS' ? metric.value : 0,
      fcp: metric.name === 'FCP' ? metric.value : 0,
      ttfb: metric.name === 'TTFB' ? metric.value : 0,
    }, window.location.pathname, this.userId);

    // Send to GA4
    if (window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    
    if (window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
        user_id: userId,
      });
    }
  }

  /**
   * Track generic event
   */
  track(event: string, properties: Record<string, any> = {}): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
    };

    this.events.push(analyticsEvent);
    
    // Send to GA4
    if (window.gtag) {
      window.gtag('event', event, properties);
    }

    console.log('Event tracked:', analyticsEvent);
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string): void {
    this.track('page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });

    if (window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
        page_path: path,
        page_title: title,
      });
    }
  }

  /**
   * Track e-commerce events
   */
  trackEcommerce(event: EcommerceEvent): void {
    this.events.push({
      event: event.event,
      properties: event.ecommerce,
      userId: event.userId || this.userId,
      sessionId: event.sessionId || this.sessionId,
      timestamp: new Date(),
    });

    // Send to GA4 Enhanced Ecommerce
    if (window.gtag) {
      window.gtag('event', event.event, {
        currency: event.ecommerce.currency,
        value: event.ecommerce.value,
        items: event.ecommerce.items,
        transaction_id: event.ecommerce.transaction_id,
      });
    }

    console.log('E-commerce event tracked:', event);
  }

  /**
   * Track conversion funnel
   */
  trackConversion(step: ConversionFunnel['step'], value: number, metadata: Record<string, any> = {}): void {
    const conversion: ConversionFunnel = {
      step,
      value,
      userId: this.userId,
      sessionId: this.sessionId,
      metadata,
    };

    this.conversionFunnel.push(conversion);
    
    // Track as regular event
    this.track('conversion_step', {
      step,
      value,
      ...metadata,
    });

    console.log('Conversion tracked:', conversion);
  }

  /**
   * Track product view
   */
  trackProductView(product: {
    id: string;
    name: string;
    category?: string;
    price: number;
    currency: string;
  }): void {
    this.trackEcommerce({
      event: 'view_item',
      ecommerce: {
        currency: product.currency,
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          quantity: 1,
        }],
      },
    });

    this.trackConversion('product_view', product.price, {
      productId: product.id,
      productName: product.name,
    });
  }

  /**
   * Track add to cart
   */
  trackAddToCart(item: {
    id: string;
    name: string;
    category?: string;
    variant?: string;
    price: number;
    quantity: number;
    currency: string;
  }): void {
    this.trackEcommerce({
      event: 'add_to_cart',
      ecommerce: {
        currency: item.currency,
        value: item.price * item.quantity,
        items: [{
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          item_variant: item.variant,
          price: item.price,
          quantity: item.quantity,
        }],
      },
    });

    this.trackConversion('add_to_cart', item.price * item.quantity, {
      productId: item.id,
      quantity: item.quantity,
    });
  }

  /**
   * Track purchase
   */
  trackPurchase(transaction: {
    id: string;
    value: number;
    currency: string;
    items: Array<{
      id: string;
      name: string;
      category?: string;
      variant?: string;
      price: number;
      quantity: number;
    }>;
  }): void {
    this.trackEcommerce({
      event: 'purchase',
      ecommerce: {
        currency: transaction.currency,
        value: transaction.value,
        transaction_id: transaction.id,
        items: transaction.items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          item_variant: item.variant,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    });

    this.trackConversion('checkout_complete', transaction.value, {
      transactionId: transaction.id,
      itemCount: transaction.items.length,
    });
  }

  /**
   * Get conversion funnel analysis
   */
  getConversionFunnelAnalysis(timeRange: 'day' | 'week' | 'month' = 'day'): {
    steps: Array<{
      step: string;
      count: number;
      value: number;
      conversionRate: number;
    }>;
    totalValue: number;
    dropoffPoints: Array<{ from: string; to: string; dropoffRate: number }>;
  } {
    const cutoff = this.getTimeCutoff(timeRange);
    const recentConversions = this.conversionFunnel.filter(c => c.value >= 0 && new Date(c.metadata.timestamp || Date.now()) >= cutoff);

    const stepCounts = recentConversions.reduce((acc, conv) => {
      acc[conv.step] = (acc[conv.step] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stepValues = recentConversions.reduce((acc, conv) => {
      acc[conv.step] = (acc[conv.step] || 0) + conv.value;
      return acc;
    }, {} as Record<string, number>);

    const stepOrder = ['product_view', 'add_to_cart', 'checkout_start', 'checkout_complete'];
    const steps = stepOrder.map((step, index) => {
      const count = stepCounts[step] || 0;
      const previousStep = index > 0 ? stepOrder[index - 1] : undefined;
      const previousCount = previousStep ? (stepCounts[previousStep] || 0) : count;
      const conversionRate = previousCount > 0 ? count / previousCount : 0;

      return {
        step,
        count,
        value: stepValues[step] || 0,
        conversionRate,
      };
    });

    const dropoffPoints = stepOrder.slice(1).map((step, index) => {
      const fromStep = stepOrder[index]; // index 0 refers to stepOrder[0] which is 'product_view'
      const fromCount = fromStep ? (stepCounts[fromStep] || 0) : 0;
      const toCount = stepCounts[step] || 0;
      const dropoffRate = fromCount > 0 ? 1 - (toCount / fromCount) : 0;

      return {
        from: fromStep || '',
        to: step,
        dropoffRate,
      };
    });

    return {
      steps,
      totalValue: Object.values(stepValues).reduce((sum, val) => sum + val, 0),
      dropoffPoints,
    };
  }

  /**
   * Get customer segments
   */
  async segmentCustomers(): Promise<CustomerSegment[]> {
    // This would typically query your customer database
    // For now, return sample segments
    return [
      {
        id: 'high-value',
        name: 'High Value Customers',
        criteria: { totalSpent: { min: 500 } },
        customerIds: [],
      },
      {
        id: 'frequent-buyers',
        name: 'Frequent Buyers',
        criteria: { orderCount: { min: 5 } },
        customerIds: [],
      },
      {
        id: 'at-risk',
        name: 'At Risk Customers',
        criteria: { lastPurchase: { days: 90 } },
        customerIds: [],
      },
    ];
  }

  /**
   * Get analytics dashboard data
   */
  getAnalyticsDashboard(timeRange: 'day' | 'week' | 'month' = 'day'): {
    overview: {
      pageViews: number;
      uniqueUsers: number;
      conversionRate: number;
      averageOrderValue: number;
    };
    topEvents: Array<{ event: string; count: number }>;
    conversionFunnel: {
      steps: Array<{
        step: string;
        count: number;
        value: number;
        conversionRate: number;
      }>;
      totalValue: number;
      dropoffPoints: Array<{
        from: string;
        to: string;
        dropoffRate: number;
      }>;
    };
    performance: {
      coreWebVitals: Record<string, { avg: number; p95: number; rating: string }>;
      apiPerformance: { avgResponseTime: number; slowEndpoints: string[]; errorRate: number };
      userExperience: { pageLoadTime: number; interactionTime: number; conversionRate: number };
    };
  } {
    const cutoff = this.getTimeCutoff(timeRange);
    const recentEvents = this.events.filter(e => e.timestamp >= cutoff);
    const recentConversions = this.conversionFunnel.filter(c => new Date(c.metadata.timestamp || Date.now()) >= cutoff);

    const pageViews = recentEvents.filter(e => e.event === 'page_view').length;
    const uniqueUsers = new Set(recentEvents.map(e => e.userId).filter(Boolean)).size;
    const purchases = recentConversions.filter(c => c.step === 'checkout_complete');
    const visitors = recentConversions.filter(c => c.step === 'product_view');
    const conversionRate = visitors.length > 0 ? purchases.length / visitors.length : 0;
    const averageOrderValue = purchases.length > 0 
      ? purchases.reduce((sum, p) => sum + p.value, 0) / purchases.length 
      : 0;

    const eventCounts = recentEvents.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));

    return {
      overview: {
        pageViews,
        uniqueUsers,
        conversionRate,
        averageOrderValue,
      },
      topEvents,
      conversionFunnel: this.getConversionFunnelAnalysis(timeRange),
      performance: performanceService.getPerformanceSummary(timeRange === 'month' ? 'week' : timeRange),
    };
  }

  /**
   * Export analytics data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      events: this.events,
      conversionFunnel: this.conversionFunnel,
      customerSegments: this.customerSegments,
      dashboard: this.getAnalyticsDashboard(),
      exportedAt: new Date().toISOString(),
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvLines = ['timestamp,event,userId,sessionId,properties'];
      for (const event of this.events) {
        csvLines.push([
          event.timestamp.toISOString(),
          event.event,
          event.userId || '',
          event.sessionId,
          JSON.stringify(event.properties),
        ].join(','));
      }
      return csvLines.join('\n');
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Helper methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTimeCutoff(timeRange: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();