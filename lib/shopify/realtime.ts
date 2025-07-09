/**
 * Real-time WebSocket Service for Live Updates
 * Handles inventory changes, cart updates, and customer notifications
 */

import { EventEmitter } from 'events';

export interface RealtimeEvent {
  type: 'inventory_update' | 'cart_update' | 'order_update' | 'customer_notification' | 'connected' | 'pong';
  data: any;
  timestamp: Date;
  sessionId?: string;
  customerId?: string;
}

export interface InventoryUpdateEvent {
  variantId: string;
  productId: string;
  quantity: number;
  available: number;
  locationId: string;
}

export interface CartUpdateEvent {
  cartId: string;
  customerId?: string;
  action: 'add' | 'remove' | 'update';
  item: {
    variantId: string;
    quantity: number;
    price: string;
  };
}

export interface OrderUpdateEvent {
  orderId: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
}

export interface CustomerNotificationEvent {
  customerId: string;
  type: 'low_stock' | 'back_in_stock' | 'price_drop' | 'order_update' | 'wishlist_sale';
  message: string;
  productId?: string;
  variantId?: string;
  orderId?: string;
}

export class RealtimeService extends EventEmitter {
  private connections = new Map<string, WebSocket>();
  private subscriptions = new Map<string, Set<string>>();
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectAttempts = new Map<string, number>();
  private maxReconnectAttempts = 5;

  constructor() {
    super();
    this.startHeartbeat();
  }

  /**
   * Add WebSocket connection
   */
  addConnection(sessionId: string, ws: WebSocket): void {
    this.connections.set(sessionId, ws);
    this.reconnectAttempts.set(sessionId, 0);

    ws.onclose = () => {
      this.removeConnection(sessionId);
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for session ${sessionId}:`, error);
      this.handleConnectionError(sessionId, error);
    };

    ws.onmessage = (event) => {
      const data = event.data;
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(sessionId, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Send welcome message
    this.sendToConnection(sessionId, {
      type: 'connected',
      data: { sessionId },
      timestamp: new Date(),
    });

    console.log(`WebSocket connection added: ${sessionId}`);
  }

  /**
   * Remove WebSocket connection
   */
  removeConnection(sessionId: string): void {
    this.connections.delete(sessionId);
    this.subscriptions.delete(sessionId);
    this.reconnectAttempts.delete(sessionId);
    console.log(`WebSocket connection removed: ${sessionId}`);
  }

  /**
   * Subscribe to specific events
   */
  subscribe(sessionId: string, eventTypes: string[]): void {
    if (!this.subscriptions.has(sessionId)) {
      this.subscriptions.set(sessionId, new Set());
    }

    const sessionSubs = this.subscriptions.get(sessionId)!;
    eventTypes.forEach(type => sessionSubs.add(type));

    console.log(`Session ${sessionId} subscribed to:`, eventTypes);
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(sessionId: string, eventTypes: string[]): void {
    const sessionSubs = this.subscriptions.get(sessionId);
    if (!sessionSubs) return;

    eventTypes.forEach(type => sessionSubs.delete(type));
    console.log(`Session ${sessionId} unsubscribed from:`, eventTypes);
  }

  /**
   * Broadcast inventory update
   */
  broadcastInventoryUpdate(event: InventoryUpdateEvent): void {
    const realtimeEvent: RealtimeEvent = {
      type: 'inventory_update',
      data: event,
      timestamp: new Date(),
    };

    this.broadcast(realtimeEvent);
    
    // Also emit for internal listeners
    this.emit('inventory_update', event);
  }

  /**
   * Broadcast cart update
   */
  broadcastCartUpdate(event: CartUpdateEvent): void {
    const realtimeEvent: RealtimeEvent = {
      type: 'cart_update',
      data: event,
      timestamp: new Date(),
      customerId: event.customerId,
    };

    // Send to specific customer or all sessions with this cart
    if (event.customerId) {
      this.sendToCustomer(event.customerId, realtimeEvent);
    } else {
      this.broadcast(realtimeEvent);
    }

    this.emit('cart_update', event);
  }

  /**
   * Broadcast order update
   */
  broadcastOrderUpdate(event: OrderUpdateEvent): void {
    const realtimeEvent: RealtimeEvent = {
      type: 'order_update',
      data: event,
      timestamp: new Date(),
      customerId: event.customerId,
    };

    this.sendToCustomer(event.customerId, realtimeEvent);
    this.emit('order_update', event);
  }

  /**
   * Send customer notification
   */
  sendCustomerNotification(event: CustomerNotificationEvent): void {
    const realtimeEvent: RealtimeEvent = {
      type: 'customer_notification',
      data: event,
      timestamp: new Date(),
      customerId: event.customerId,
    };

    this.sendToCustomer(event.customerId, realtimeEvent);
    this.emit('customer_notification', event);
  }

  /**
   * Broadcast to all connections
   */
  private broadcast(event: RealtimeEvent): void {
    for (const [sessionId, ws] of this.connections) {
      if (this.shouldReceiveEvent(sessionId, event)) {
        this.sendToConnection(sessionId, event);
      }
    }
  }

  /**
   * Send to specific customer
   */
  private sendToCustomer(customerId: string, event: RealtimeEvent): void {
    // This would typically require a mapping of customer IDs to session IDs
    // For now, we'll broadcast to all connections
    this.broadcast(event);
  }

  /**
   * Send to specific connection
   */
  private sendToConnection(sessionId: string, event: RealtimeEvent): void {
    const ws = this.connections.get(sessionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      ws.send(JSON.stringify(event));
    } catch (error) {
      console.error(`Error sending to connection ${sessionId}:`, error);
      this.handleConnectionError(sessionId, error);
    }
  }

  /**
   * Check if session should receive event
   */
  private shouldReceiveEvent(sessionId: string, event: RealtimeEvent): boolean {
    const subscriptions = this.subscriptions.get(sessionId);
    if (!subscriptions) return false;

    return subscriptions.has(event.type);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(sessionId: string, message: any): void {
    switch (message.type) {
      case 'subscribe':
        this.subscribe(sessionId, message.events || []);
        break;
        
      case 'unsubscribe':
        this.unsubscribe(sessionId, message.events || []);
        break;
        
      case 'ping':
        this.sendToConnection(sessionId, {
          type: 'pong',
          data: { timestamp: new Date() },
          timestamp: new Date(),
        });
        break;
        
      case 'heartbeat':
        // Client heartbeat received
        break;
        
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(sessionId: string, error: any): void {
    const attempts = this.reconnectAttempts.get(sessionId) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(sessionId, attempts + 1);
      console.log(`Connection error for ${sessionId}, attempt ${attempts + 1}:`, error);
    } else {
      console.error(`Max reconnection attempts reached for ${sessionId}`);
      this.removeConnection(sessionId);
    }
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const heartbeatEvent: RealtimeEvent = {
        type: 'heartbeat' as any,
        data: { timestamp: new Date() },
        timestamp: new Date(),
      };

      for (const [sessionId, ws] of this.connections) {
        if (ws.readyState === WebSocket.OPEN) {
          this.sendToConnection(sessionId, heartbeatEvent);
        } else {
          this.removeConnection(sessionId);
        }
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Close all connections
   */
  close(): void {
    this.stopHeartbeat();
    
    for (const [sessionId, ws] of this.connections) {
      ws.close();
    }
    
    this.connections.clear();
    this.subscriptions.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    totalSubscriptions: number;
    connectionsByType: Record<string, number>;
  } {
    const activeConnections = Array.from(this.connections.values())
      .filter(ws => ws.readyState === WebSocket.OPEN).length;

    const totalSubscriptions = Array.from(this.subscriptions.values())
      .reduce((sum, subs) => sum + subs.size, 0);

    const connectionsByType: Record<string, number> = {};
    for (const subs of this.subscriptions.values()) {
      for (const type of subs) {
        connectionsByType[type] = (connectionsByType[type] || 0) + 1;
      }
    }

    return {
      totalConnections: this.connections.size,
      activeConnections,
      totalSubscriptions,
      connectionsByType,
    };
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Integration with inventory service
export function setupRealtimeInventorySync() {
  // This would typically integrate with your inventory service
  // to broadcast real-time updates
  
  console.log('Setting up real-time inventory sync...');
  
  // Example: Listen to inventory changes and broadcast
  // inventoryService.on('inventory_changed', (event) => {
  //   realtimeService.broadcastInventoryUpdate(event);
  // });
}

// Integration with cart service
export function setupRealtimeCartSync() {
  console.log('Setting up real-time cart sync...');
  
  // Example: Listen to cart changes and broadcast
  // cartService.on('cart_updated', (event) => {
  //   realtimeService.broadcastCartUpdate(event);
  // });
}

// Integration with order service
export function setupRealtimeOrderSync() {
  console.log('Setting up real-time order sync...');
  
  // Example: Listen to order changes and broadcast
  // orderService.on('order_updated', (event) => {
  //   realtimeService.broadcastOrderUpdate(event);
  // });
}