/**
 * Shopify Customer Experience Service
 * Handles wishlist, recently viewed, recommendations, and customer segmentation
 */

import { shopifyClient } from './client';
import { ShopifyError } from './errors';
import { CUSTOMER_WISHLIST_QUERY, PRODUCT_RECOMMENDATIONS_QUERY } from './queries/customer-experience';

export interface WishlistItem {
  id: string;
  variantId: string;
  productId: string;
  title: string;
  handle: string;
  price: string;
  image?: string;
  addedAt: Date;
  available: boolean;
}

export interface RecentlyViewedItem {
  productId: string;
  variantId?: string;
  title: string;
  handle: string;
  price: string;
  image?: string;
  viewedAt: Date;
}

export interface ProductRecommendation {
  productId: string;
  title: string;
  handle: string;
  price: string;
  image?: string;
  reason: 'viewed_together' | 'purchased_together' | 'similar_products' | 'trending';
  score: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    totalSpent?: { min?: number; max?: number };
    orderCount?: { min?: number; max?: number };
    lastOrderDate?: { before?: Date; after?: Date };
    tags?: string[];
    location?: string[];
  };
  customerCount: number;
}

export class CustomerExperienceService {
  private recentlyViewedCache = new Map<string, RecentlyViewedItem[]>();
  private maxRecentlyViewed = 20;

  /**
   * Add product to wishlist
   */
  async addToWishlist(customerId: string, variantId: string): Promise<void> {
    try {
      // This would typically use Shopify Admin API or custom metafields
      // For now, we'll use a simulated approach
      const wishlistKey = `wishlist:${customerId}`;
      
      // In a real implementation, this would be stored in:
      // 1. Shopify customer metafields
      // 2. Your database
      // 3. External service like Redis
      
      console.log(`Added variant ${variantId} to wishlist for customer ${customerId}`);
      
      // Trigger wishlist sync webhook if configured
      await this.triggerWishlistSync(customerId, 'add', variantId);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw new ShopifyError('Failed to add to wishlist');
    }
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(customerId: string, variantId: string): Promise<void> {
    try {
      console.log(`Removed variant ${variantId} from wishlist for customer ${customerId}`);
      
      // Trigger wishlist sync webhook if configured
      await this.triggerWishlistSync(customerId, 'remove', variantId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw new ShopifyError('Failed to remove from wishlist');
    }
  }

  /**
   * Get customer's wishlist
   */
  async getWishlist(customerId: string): Promise<WishlistItem[]> {
    try {
      // This would fetch from your storage method
      // For demo purposes, returning empty array
      return [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw new ShopifyError('Failed to fetch wishlist');
    }
  }

  /**
   * Track recently viewed product
   */
  async trackRecentlyViewed(
    customerId: string,
    productId: string,
    variantId?: string
  ): Promise<void> {
    try {
      // Get product details
      const product = await this.getProductDetails(productId);
      
      const recentItem: RecentlyViewedItem = {
        productId,
        variantId,
        title: product.title,
        handle: product.handle,
        price: product.price,
        image: product.image || undefined,
        viewedAt: new Date(),
      };

      // Update cache
      const existing = this.recentlyViewedCache.get(customerId) || [];
      const filtered = existing.filter(item => item.productId !== productId);
      
      filtered.unshift(recentItem);
      
      // Keep only the most recent items
      if (filtered.length > this.maxRecentlyViewed) {
        filtered.splice(this.maxRecentlyViewed);
      }
      
      this.recentlyViewedCache.set(customerId, filtered);
      
      // Persist to storage (database, Redis, etc.)
      await this.persistRecentlyViewed(customerId, filtered);
    } catch (error) {
      console.error('Error tracking recently viewed:', error);
      // Don't throw error for tracking - it's not critical
    }
  }

  /**
   * Get recently viewed products
   */
  async getRecentlyViewed(customerId: string): Promise<RecentlyViewedItem[]> {
    try {
      // First check cache
      const cached = this.recentlyViewedCache.get(customerId);
      if (cached) {
        return cached;
      }

      // Load from persistent storage
      const items = await this.loadRecentlyViewed(customerId);
      this.recentlyViewedCache.set(customerId, items);
      
      return items;
    } catch (error) {
      console.error('Error fetching recently viewed:', error);
      return [];
    }
  }

  /**
   * Get product recommendations
   */
  async getRecommendations(
    customerId: string,
    productId?: string,
    type: 'personal' | 'product' | 'trending' = 'personal'
  ): Promise<ProductRecommendation[]> {
    try {
      switch (type) {
        case 'personal':
          return await this.getPersonalRecommendations(customerId);
        case 'product':
          return await this.getProductRecommendations(productId!);
        case 'trending':
          return await this.getTrendingRecommendations();
        default:
          return [];
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  /**
   * Get personal recommendations based on customer history
   */
  private async getPersonalRecommendations(customerId: string): Promise<ProductRecommendation[]> {
    try {
      // This would analyze customer's purchase history, browsing behavior, etc.
      // For now, return trending products
      return await this.getTrendingRecommendations();
    } catch (error) {
      console.error('Error fetching personal recommendations:', error);
      return [];
    }
  }

  /**
   * Get product-based recommendations
   */
  private async getProductRecommendations(productId: string): Promise<ProductRecommendation[]> {
    try {
      if (!shopifyClient) {
        console.warn('Shopify client not initialized');
        return [];
      }
      
      const response = await shopifyClient.query(PRODUCT_RECOMMENDATIONS_QUERY, {
        productId: `gid://shopify/Product/${productId}`,
        intent: 'RELATED',
      });

      const data = response as any;
      return data.data.productRecommendations.map((product: any) => ({
        productId: product.id.split('/').pop(),
        title: product.title,
        handle: product.handle,
        price: product.priceRange.minVariantPrice.amount,
        image: product.featuredImage?.url,
        reason: 'similar_products' as const,
        score: 0.8,
      }));
    } catch (error) {
      console.error('Error fetching product recommendations:', error);
      return [];
    }
  }

  /**
   * Get trending recommendations
   */
  private async getTrendingRecommendations(): Promise<ProductRecommendation[]> {
    try {
      // This would typically come from analytics or be pre-computed
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching trending recommendations:', error);
      return [];
    }
  }

  /**
   * Segment customers based on criteria
   */
  async segmentCustomers(criteria: CustomerSegment['criteria']): Promise<string[]> {
    try {
      // This would typically use Shopify Admin API to query customers
      // with GraphQL filters based on the criteria
      
      const filters: string[] = [];
      
      if (criteria.totalSpent) {
        if (criteria.totalSpent.min) {
          filters.push(`total_spent:>=${criteria.totalSpent.min}`);
        }
        if (criteria.totalSpent.max) {
          filters.push(`total_spent:<=${criteria.totalSpent.max}`);
        }
      }
      
      if (criteria.orderCount) {
        if (criteria.orderCount.min) {
          filters.push(`orders_count:>=${criteria.orderCount.min}`);
        }
        if (criteria.orderCount.max) {
          filters.push(`orders_count:<=${criteria.orderCount.max}`);
        }
      }
      
      if (criteria.tags) {
        filters.push(`tag:${criteria.tags.join(' OR tag:')}`);
      }
      
      // Query customers with filters
      // const customers = await shopifyClient.query(CUSTOMER_SEGMENT_QUERY, { query: filters.join(' AND ') });
      
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error segmenting customers:', error);
      return [];
    }
  }

  /**
   * Apply customer segment tags
   */
  async applySegmentTags(customerId: string, tags: string[]): Promise<void> {
    try {
      // This would use Shopify Admin API to update customer tags
      console.log(`Applied tags ${tags.join(', ')} to customer ${customerId}`);
    } catch (error) {
      console.error('Error applying segment tags:', error);
      throw new ShopifyError('Failed to apply segment tags');
    }
  }

  /**
   * Trigger loyalty program actions
   */
  async triggerLoyaltyAction(
    customerId: string,
    action: 'purchase' | 'review' | 'referral' | 'birthday',
    data?: any
  ): Promise<void> {
    try {
      // This would integrate with your loyalty program provider
      // Examples: Smile.io, LoyaltyLion, Yotpo, etc.
      
      console.log(`Triggered loyalty action ${action} for customer ${customerId}`, data);
      
      // Example integrations:
      // await smileIO.recordActivity(customerId, action, data);
      // await loyaltyLion.trackEvent(customerId, action, data);
    } catch (error) {
      console.error('Error triggering loyalty action:', error);
      // Don't throw error for loyalty actions - they're not critical
    }
  }

  /**
   * Helper methods
   */
  private async getProductDetails(productId: string) {
    // This would fetch product details from Shopify
    // For now, return placeholder
    return {
      title: 'Product Title',
      handle: 'product-handle',
      price: '99.99',
      image: null,
    };
  }

  private async triggerWishlistSync(customerId: string, action: 'add' | 'remove', variantId: string) {
    // This would sync wishlist with external services or trigger webhooks
    console.log(`Wishlist sync: ${action} variant ${variantId} for customer ${customerId}`);
  }

  private async persistRecentlyViewed(customerId: string, items: RecentlyViewedItem[]) {
    // This would save to database, Redis, or other persistent storage
    console.log(`Persisted ${items.length} recently viewed items for customer ${customerId}`);
  }

  private async loadRecentlyViewed(customerId: string): Promise<RecentlyViewedItem[]> {
    // This would load from database, Redis, or other persistent storage
    return [];
  }
}

// Export singleton instance
export const customerExperienceService = new CustomerExperienceService();