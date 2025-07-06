// Tracking Analytics Module

// Event Interfaces
export interface TrackingEvent {
  type: string;
  userId?: string;
  sessionId?: string;
  productId?: string;
  event: string;
  productCount?: number;
  responseTime?: number;
  cached?: boolean;
  confidence?: number;
  error?: string;
}

export interface GenericEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface ProductData {
  id: string;
  name: string;
  category: string;
  price?: number;
  currency?: string;
  brand?: string;
  variant?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
}

export interface PurchaseData {
  orderId: string;
  items: ProductData[];
  total: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

// Helper function to log events in development
function logEvent(eventType: string, data: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventType}:`, data);
  }
}

// Main tracking analytics object with all required methods
export const trackingAnalytics = {
  // Track generic events
  trackEvent(event: GenericEvent): Promise<void> {
    logEvent('Event', event);
    
    // TODO: Send to analytics service (GA4, Segment, etc.)
    // Example: window.gtag('event', event.action, {
    //   event_category: event.category,
    //   event_label: event.label,
    //   value: event.value,
    //   ...event.metadata
    // });
    
    return Promise.resolve();
  },

  // Track product view
  trackViewItem(product: ProductData): Promise<void> {
    logEvent('View Item', product);
    
    // TODO: Send view_item event to analytics
    // Example: window.gtag('event', 'view_item', {
    //   currency: product.currency,
    //   value: product.price,
    //   items: [product]
    // });
    
    return Promise.resolve();
  },

  // Track add to cart
  trackAddToCart(product: ProductData): Promise<void> {
    logEvent('Add to Cart', product);
    
    // TODO: Send add_to_cart event to analytics
    // Example: window.gtag('event', 'add_to_cart', {
    //   currency: product.currency,
    //   value: product.price * (product.quantity || 1),
    //   items: [product]
    // });
    
    return Promise.resolve();
  },

  // Track remove from cart
  trackRemoveFromCart(product: ProductData): Promise<void> {
    logEvent('Remove from Cart', product);
    
    // TODO: Send remove_from_cart event to analytics
    // Example: window.gtag('event', 'remove_from_cart', {
    //   currency: product.currency,
    //   value: product.price * (product.quantity || 1),
    //   items: [product]
    // });
    
    return Promise.resolve();
  },

  // Track purchase
  trackPurchase(purchase: PurchaseData): Promise<void> {
    logEvent('Purchase', purchase);
    
    // TODO: Send purchase event to analytics
    // Example: window.gtag('event', 'purchase', {
    //   transaction_id: purchase.orderId,
    //   value: purchase.total,
    //   currency: purchase.currency,
    //   items: purchase.items,
    //   ...purchase.metadata
    // });
    
    return Promise.resolve();
  }
};

// Legacy functions for backward compatibility
export function trackRecommendationEvent(event: TrackingEvent) {
  return trackingAnalytics.trackEvent({
    action: event.event,
    category: event.type,
    metadata: {
      userId: event.userId,
      sessionId: event.sessionId,
      productId: event.productId,
      productCount: event.productCount,
      responseTime: event.responseTime,
      cached: event.cached,
      confidence: event.confidence,
      error: event.error
    }
  });
}

export function trackProductView(event: TrackingEvent) {
  return trackRecommendationEvent({ ...event, type: 'product_view' });
}

export function trackInteraction(event: TrackingEvent) {
  return trackRecommendationEvent({ ...event, type: 'interaction' });
}