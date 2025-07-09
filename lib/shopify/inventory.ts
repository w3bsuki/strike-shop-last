/**
 * Shopify Inventory Management Service
 * Handles real-time inventory tracking, reservation, and synchronization
 */

import { shopifyClient } from './client';
import { INVENTORY_TRACKING_QUERY, INVENTORY_LEVELS_QUERY } from './queries/inventory';
import { ShopifyError } from './errors';

export interface InventoryItem {
  variantId: string;
  quantity: number;
  available: number;
  reserved: number;
  locationId?: string;
}

export interface InventoryReservation {
  id: string;
  items: InventoryItem[];
  reservedAt: Date;
  expiresAt: Date;
  checkoutId?: string;
  customerId?: string;
}

export interface InventoryLevel {
  locationId: string;
  locationName: string;
  available: number;
  onHand: number;
  committed: number;
  incoming: number;
  variantId: string;
}

export class InventoryService {
  private reservations = new Map<string, InventoryReservation>();
  private reservationTimeout = 15 * 60 * 1000; // 15 minutes

  /**
   * Get current inventory levels for a product variant
   */
  async getInventoryLevels(variantId: string): Promise<InventoryLevel[]> {
    try {
      if (!shopifyClient) {
        throw new ShopifyError('Shopify client not initialized');
      }
      
      const response = await shopifyClient.query(INVENTORY_LEVELS_QUERY, {
        variantId: `gid://shopify/ProductVariant/${variantId}`,
      });

      const data = response as any;
      const variant = data.data.productVariant;
      if (!variant) {
        throw new ShopifyError(`Variant ${variantId} not found`);
      }

      return variant.inventoryItem.inventoryLevels.edges.map(({ node }: any) => ({
        locationId: node.location.id,
        locationName: node.location.name,
        available: node.available,
        onHand: node.quantities.find((q: any) => q.name === 'on_hand')?.quantity || 0,
        committed: node.quantities.find((q: any) => q.name === 'committed')?.quantity || 0,
        incoming: node.quantities.find((q: any) => q.name === 'incoming')?.quantity || 0,
        variantId,
      }));
    } catch (error) {
      console.error('Error fetching inventory levels:', error);
      throw new ShopifyError('Failed to fetch inventory levels');
    }
  }

  /**
   * Check if items are available for purchase
   */
  async checkAvailability(items: { variantId: string; quantity: number }[]): Promise<boolean> {
    try {
      for (const item of items) {
        const levels = await this.getInventoryLevels(item.variantId);
        const totalAvailable = levels.reduce((sum, level) => sum + level.available, 0);
        
        if (totalAvailable < item.quantity) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  /**
   * Reserve inventory for a checkout
   */
  async reserveInventory(
    items: { variantId: string; quantity: number }[],
    checkoutId?: string,
    customerId?: string
  ): Promise<string> {
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + this.reservationTimeout);

    // Check availability before reserving
    const isAvailable = await this.checkAvailability(items);
    if (!isAvailable) {
      throw new ShopifyError('Insufficient inventory');
    }

    // Create reservation
    const reservation: InventoryReservation = {
      id: reservationId,
      items: items.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
        available: 0, // Will be updated
        reserved: item.quantity,
      })),
      reservedAt: new Date(),
      expiresAt,
      checkoutId,
      customerId,
    };

    this.reservations.set(reservationId, reservation);

    // Set timeout to auto-release reservation
    setTimeout(() => {
      this.releaseReservation(reservationId);
    }, this.reservationTimeout);

    console.log(`Inventory reserved: ${reservationId} for ${items.length} items`);
    return reservationId;
  }

  /**
   * Release inventory reservation
   */
  async releaseReservation(reservationId: string): Promise<void> {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      console.warn(`Reservation ${reservationId} not found`);
      return;
    }

    this.reservations.delete(reservationId);
    console.log(`Inventory released: ${reservationId}`);
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(threshold: number = 10): Promise<InventoryLevel[]> {
    try {
      if (!shopifyClient) {
        throw new ShopifyError('Shopify client not initialized');
      }
      
      // This would typically query all products, but for demo we'll use a simple implementation
      const response = await shopifyClient.query(INVENTORY_TRACKING_QUERY, {
        first: 50,
      });

      const data = response as any;
      const lowStockItems: InventoryLevel[] = [];
      
      for (const { node: product } of data.data.products.edges) {
        for (const { node: variant } of product.variants.edges) {
          const levels = await this.getInventoryLevels(variant.id.split('/').pop());
          
          for (const level of levels) {
            if (level.available <= threshold) {
              lowStockItems.push(level);
            }
          }
        }
      }

      return lowStockItems;
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      throw new ShopifyError('Failed to fetch low stock alerts');
    }
  }

  /**
   * Enable pre-orders for out-of-stock items
   */
  async enablePreOrder(variantId: string, expectedDate?: Date): Promise<void> {
    try {
      // This would typically use Shopify Admin API to update product settings
      console.log(`Pre-order enabled for variant ${variantId}`, {
        expectedDate: expectedDate?.toISOString(),
      });
      
      // Store pre-order settings in database or cache
      // Implementation depends on your pre-order business logic
    } catch (error) {
      console.error('Error enabling pre-order:', error);
      throw new ShopifyError('Failed to enable pre-order');
    }
  }

  /**
   * Get reserved inventory summary
   */
  getReservationSummary(): { total: number; expiring: number; active: number } {
    const now = new Date();
    const reservations = Array.from(this.reservations.values());
    
    return {
      total: reservations.length,
      expiring: reservations.filter(r => r.expiresAt.getTime() - now.getTime() < 5 * 60 * 1000).length,
      active: reservations.filter(r => r.expiresAt > now).length,
    };
  }

  /**
   * Clean up expired reservations
   */
  cleanupExpiredReservations(): void {
    const now = new Date();
    const expiredReservations = Array.from(this.reservations.entries())
      .filter(([, reservation]) => reservation.expiresAt <= now);

    for (const [reservationId] of expiredReservations) {
      this.releaseReservation(reservationId);
    }

    if (expiredReservations.length > 0) {
      console.log(`Cleaned up ${expiredReservations.length} expired reservations`);
    }
  }

  /**
   * Multi-location inventory tracking
   */
  async getMultiLocationInventory(variantId: string): Promise<{
    total: number;
    locations: Array<{
      id: string;
      name: string;
      available: number;
      fulfillmentService: string;
    }>;
  }> {
    try {
      const levels = await this.getInventoryLevels(variantId);
      
      return {
        total: levels.reduce((sum, level) => sum + level.available, 0),
        locations: levels.map(level => ({
          id: level.locationId,
          name: level.locationName,
          available: level.available,
          fulfillmentService: 'manual', // Would come from Shopify API
        })),
      };
    } catch (error) {
      console.error('Error fetching multi-location inventory:', error);
      throw new ShopifyError('Failed to fetch multi-location inventory');
    }
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();

// Start cleanup interval
setInterval(() => {
  inventoryService.cleanupExpiredReservations();
}, 5 * 60 * 1000); // Clean up every 5 minutes