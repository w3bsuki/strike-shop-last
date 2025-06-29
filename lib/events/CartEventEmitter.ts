/**
 * Observer Pattern Implementation for Cart Events
 * Handles event-driven communication for cart operations
 */

import type { CartItem } from '@/lib/cart-store';
import type { IntegratedProduct } from '@/types/integrated';

/**
 * Cart event types
 */
export type CartEventType =
  | 'item-added'
  | 'item-removed'
  | 'item-updated'
  | 'quantity-changed'
  | 'cart-cleared'
  | 'cart-initialized'
  | 'cart-error'
  | 'cart-loading-start'
  | 'cart-loading-end'
  | 'checkout-started'
  | 'checkout-completed'
  | 'checkout-failed';

/**
 * Cart event data structures
 */
export interface CartEventData {
  'item-added': {
    item: CartItem;
    product?: IntegratedProduct;
    timestamp: Date;
    source: 'user' | 'system' | 'api';
  };
  'item-removed': {
    itemId: string;
    item?: CartItem;
    timestamp: Date;
    source: 'user' | 'system' | 'api';
  };
  'item-updated': {
    itemId: string;
    oldItem: CartItem;
    newItem: CartItem;
    changes: Partial<CartItem>;
    timestamp: Date;
    source: 'user' | 'system' | 'api';
  };
  'quantity-changed': {
    itemId: string;
    oldQuantity: number;
    newQuantity: number;
    item: CartItem;
    timestamp: Date;
    source: 'user' | 'system' | 'api';
  };
  'cart-cleared': {
    clearedItems: CartItem[];
    timestamp: Date;
    source: 'user' | 'system' | 'api';
  };
  'cart-initialized': {
    cartId: string | null;
    items: CartItem[];
    timestamp: Date;
    source: 'user' | 'system' | 'api';
  };
  'cart-error': {
    error: Error | string;
    context?: any;
    timestamp: Date;
    source: 'user' | 'system' | 'api';
  };
  'cart-loading-start': {
    operation: string;
    timestamp: Date;
  };
  'cart-loading-end': {
    operation: string;
    duration: number;
    timestamp: Date;
  };
  'checkout-started': {
    cartId: string;
    items: CartItem[];
    totalAmount: number;
    timestamp: Date;
  };
  'checkout-completed': {
    orderId: string;
    cartId: string;
    items: CartItem[];
    totalAmount: number;
    timestamp: Date;
  };
  'checkout-failed': {
    cartId: string;
    error: Error | string;
    timestamp: Date;
  };
}

/**
 * Event listener function type
 */
export type CartEventListener<T extends CartEventType> = (
  data: CartEventData[T]
) => void | Promise<void>;

/**
 * Event subscription interface
 */
export interface CartEventSubscription {
  unsubscribe: () => void;
}

/**
 * Event emitter configuration
 */
export interface CartEventEmitterConfig {
  maxListeners?: number;
  enableHistory?: boolean;
  historySize?: number;
  enableMetrics?: boolean;
  enableDebugLogging?: boolean;
}

/**
 * Event metrics
 */
export interface EventMetrics {
  eventType: CartEventType;
  count: number;
  lastTriggered: Date | null;
  averageListenerExecutionTime: number;
  errorCount: number;
}

/**
 * Cart Event Emitter - Observer Pattern Implementation
 */
export class CartEventEmitter {
  private listeners = new Map<CartEventType, Set<CartEventListener<any>>>();
  private eventHistory: Array<{
    type: CartEventType;
    data: any;
    timestamp: Date;
  }> = [];
  private metrics = new Map<CartEventType, EventMetrics>();
  private config: Required<CartEventEmitterConfig>;

  constructor(config: CartEventEmitterConfig = {}) {
    this.config = {
      maxListeners: config.maxListeners || 50,
      enableHistory: config.enableHistory ?? true,
      historySize: config.historySize || 100,
      enableMetrics: config.enableMetrics ?? true,
      enableDebugLogging: config.enableDebugLogging ?? false,
    };

    // Initialize metrics for all event types
    const eventTypes: CartEventType[] = [
      'item-added',
      'item-removed',
      'item-updated',
      'quantity-changed',
      'cart-cleared',
      'cart-initialized',
      'cart-error',
      'cart-loading-start',
      'cart-loading-end',
      'checkout-started',
      'checkout-completed',
      'checkout-failed',
    ];

    eventTypes.forEach((eventType) => {
      this.metrics.set(eventType, {
        eventType,
        count: 0,
        lastTriggered: null,
        averageListenerExecutionTime: 0,
        errorCount: 0,
      });
    });
  }

  /**
   * Subscribe to cart events
   */
  on<T extends CartEventType>(
    eventType: T,
    listener: CartEventListener<T>
  ): CartEventSubscription {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const eventListeners = this.listeners.get(eventType)!;

    if (eventListeners.size >= this.config.maxListeners) {
      throw new Error(
        `Maximum listeners (${this.config.maxListeners}) exceeded for event type: ${eventType}`
      );
    }

    eventListeners.add(listener);

    // Listener added for debugging

    return {
      unsubscribe: () => this.off(eventType, listener),
    };
  }

  /**
   * Subscribe to a cart event once
   */
  once<T extends CartEventType>(
    eventType: T,
    listener: CartEventListener<T>
  ): CartEventSubscription {
    const onceListener: CartEventListener<T> = async (data) => {
      this.off(eventType, onceListener);
      await listener(data);
    };

    return this.on(eventType, onceListener);
  }

  /**
   * Unsubscribe from cart events
   */
  off<T extends CartEventType>(
    eventType: T,
    listener: CartEventListener<T>
  ): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(listener);

      // Listener removed for debugging

      if (eventListeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit a cart event
   */
  async emit<T extends CartEventType>(
    eventType: T,
    data: CartEventData[T]
  ): Promise<void> {
    const startTime = Date.now();

    if (this.config.enableDebugLogging) {

    }

    // Add to history
    if (this.config.enableHistory) {
      this.eventHistory.push({
        type: eventType,
        data,
        timestamp: new Date(),
      });

      // Maintain history size limit
      if (this.eventHistory.length > this.config.historySize) {
        this.eventHistory.splice(
          0,
          this.eventHistory.length - this.config.historySize
        );
      }
    }

    // Update metrics
    if (this.config.enableMetrics) {
      const metric = this.metrics.get(eventType);
      if (metric) {
        metric.count++;
        metric.lastTriggered = new Date();
      }
    }

    // Get listeners
    const eventListeners = this.listeners.get(eventType);
    if (!eventListeners || eventListeners.size === 0) {
      return;
    }

    // Execute all listeners
    const listenerPromises = Array.from(eventListeners).map(
      async (listener) => {
        try {
          await listener(data);
        } catch (error) {
          // Error in listener

          if (this.config.enableMetrics) {
            const metric = this.metrics.get(eventType);
            if (metric) {
              metric.errorCount++;
            }
          }

          // Emit error event
          this.emit('cart-error', {
            error: error instanceof Error ? error : new Error(String(error)),
            context: { eventType, originalData: data },
            timestamp: new Date(),
            source: 'system',
          }).catch(() => {});
        }
      }
    );

    await Promise.all(listenerPromises);

    // Update execution time metrics
    if (this.config.enableMetrics) {
      const executionTime = Date.now() - startTime;
      const metric = this.metrics.get(eventType);
      if (metric) {
        // Simple moving average
        metric.averageListenerExecutionTime =
          (metric.averageListenerExecutionTime + executionTime) / 2;
      }
    }
  }

  /**
   * Remove all listeners for an event type
   */
  removeAllListeners(eventType?: CartEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
      // Removed all listeners for event type
    } else {
      this.listeners.clear();
      if (this.config.enableDebugLogging) {

      }
    }
  }

  /**
   * Get listener count for an event type
   */
  listenerCount(eventType: CartEventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }

  /**
   * Get all active event types
   */
  eventTypes(): CartEventType[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get event history
   */
  getEventHistory(
    eventType?: CartEventType
  ): Array<{ type: CartEventType; data: any; timestamp: Date }> {
    if (!this.config.enableHistory) {
      return [];
    }

    if (eventType) {
      return this.eventHistory.filter((event) => event.type === eventType);
    }

    return [...this.eventHistory];
  }

  /**
   * Get event metrics
   */
  getMetrics(
    eventType?: CartEventType
  ): EventMetrics | Map<CartEventType, EventMetrics> {
    if (!this.config.enableMetrics) {
      return eventType
        ? {
            eventType: eventType,
            count: 0,
            lastTriggered: null,
            averageListenerExecutionTime: 0,
            errorCount: 0,
          }
        : new Map();
    }

    if (eventType) {
      return (
        this.metrics.get(eventType) || {
          eventType,
          count: 0,
          lastTriggered: null,
          averageListenerExecutionTime: 0,
          errorCount: 0,
        }
      );
    }

    return new Map(this.metrics);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics.forEach((metric) => {
      metric.count = 0;
      metric.lastTriggered = null;
      metric.averageListenerExecutionTime = 0;
      metric.errorCount = 0;
    });
  }

  /**
   * Helper methods for common cart events
   */

  onItemAdded(
    callback: (data: CartEventData['item-added']) => void
  ): CartEventSubscription {
    return this.on('item-added', callback);
  }

  onItemRemoved(
    callback: (data: CartEventData['item-removed']) => void
  ): CartEventSubscription {
    return this.on('item-removed', callback);
  }

  onItemUpdated(
    callback: (data: CartEventData['item-updated']) => void
  ): CartEventSubscription {
    return this.on('item-updated', callback);
  }

  onQuantityChanged(
    callback: (data: CartEventData['quantity-changed']) => void
  ): CartEventSubscription {
    return this.on('quantity-changed', callback);
  }

  onCartCleared(
    callback: (data: CartEventData['cart-cleared']) => void
  ): CartEventSubscription {
    return this.on('cart-cleared', callback);
  }

  onCartInitialized(
    callback: (data: CartEventData['cart-initialized']) => void
  ): CartEventSubscription {
    return this.on('cart-initialized', callback);
  }

  onCartError(
    callback: (data: CartEventData['cart-error']) => void
  ): CartEventSubscription {
    return this.on('cart-error', callback);
  }

  onCheckoutStarted(
    callback: (data: CartEventData['checkout-started']) => void
  ): CartEventSubscription {
    return this.on('checkout-started', callback);
  }

  onCheckoutCompleted(
    callback: (data: CartEventData['checkout-completed']) => void
  ): CartEventSubscription {
    return this.on('checkout-completed', callback);
  }

  onCheckoutFailed(
    callback: (data: CartEventData['checkout-failed']) => void
  ): CartEventSubscription {
    return this.on('checkout-failed', callback);
  }
}

// Global cart event emitter instance
export const cartEventEmitter = new CartEventEmitter({
  enableHistory: true,
  enableMetrics: true,
  enableDebugLogging: process.env.NODE_ENV === 'development',
  maxListeners: 100,
  historySize: 50,
});

/**
 * Analytics event listener - tracks cart events for analytics
 */
export class CartAnalyticsListener {
  private eventEmitter: CartEventEmitter;
  private analytics: any; // Replace with your analytics service

  constructor(eventEmitter: CartEventEmitter, analytics?: any) {
    this.eventEmitter = eventEmitter;
    this.analytics = analytics;
    this.setupListeners();
  }

  private setupListeners(): void {
    // Track add to cart events
    this.eventEmitter.onItemAdded((data) => {
      this.trackEvent('add_to_cart', {
        item_id: data.item.id,
        item_name: data.item.name,
        item_category: data.item.slug,
        quantity: data.item.quantity,
        value: data.item.pricing.unitPrice / 100,
        currency: 'GBP',
        timestamp: data.timestamp.toISOString(),
      });
    });

    // Track remove from cart events
    this.eventEmitter.onItemRemoved((data) => {
      this.trackEvent('remove_from_cart', {
        item_id: data.itemId,
        timestamp: data.timestamp.toISOString(),
      });
    });

    // Track quantity changes
    this.eventEmitter.onQuantityChanged((data) => {
      this.trackEvent('quantity_changed', {
        item_id: data.itemId,
        old_quantity: data.oldQuantity,
        new_quantity: data.newQuantity,
        value_change:
          (data.newQuantity - data.oldQuantity) *
          (data.item.pricing.unitPrice / 100),
        currency: 'GBP',
        timestamp: data.timestamp.toISOString(),
      });
    });

    // Track checkout events
    this.eventEmitter.onCheckoutStarted((data) => {
      this.trackEvent('begin_checkout', {
        cart_id: data.cartId,
        value: data.totalAmount,
        currency: 'GBP',
        num_items: data.items.length,
        timestamp: data.timestamp.toISOString(),
      });
    });

    this.eventEmitter.onCheckoutCompleted((data) => {
      this.trackEvent('purchase', {
        transaction_id: data.orderId,
        value: data.totalAmount,
        currency: 'GBP',
        num_items: data.items.length,
        timestamp: data.timestamp.toISOString(),
      });
    });

    // Track errors
    this.eventEmitter.onCartError((data) => {
      this.trackEvent('cart_error', {
        error_message:
          data.error instanceof Error ? data.error.message : String(data.error),
        timestamp: data.timestamp.toISOString(),
      });
    });
  }

  private trackEvent(eventName: string, eventData: any): void {
    try {
      if (this.analytics) {
        this.analytics.track(eventName, eventData);
      } else {
        // Fallback to console logging in development
        if (process.env.NODE_ENV === 'development') {

        }
      }
    } catch (error) {

    }
  }
}

// Initialize analytics listener
export const cartAnalyticsListener = new CartAnalyticsListener(
  cartEventEmitter
);
