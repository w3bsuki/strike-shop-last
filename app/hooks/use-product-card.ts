/**
 * Product Card Hook
 * Clean Architecture Implementation - Application Layer
 * 
 * This hook demonstrates proper separation of concerns:
 * - Encapsulates all product card related logic
 * - Provides clean interface for components
 * - Handles state management and side effects
 * - Integrates with domain services through dependency injection
 */

'use client';

import { useCallback, useState, useMemo } from 'react';
import { ServiceLocator } from '@/infrastructure';
import type { BaseProduct } from '@/components/product/types';
import { ProductId } from '@/shared/domain/value-objects/id';

// Hook configuration interface
interface UseProductCardConfig {
  enableAnalytics?: boolean;
  enableHapticFeedback?: boolean;
  optimisticUpdates?: boolean;
}

// Define simple action interfaces
interface WishlistActions {
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

interface QuickViewActions {
  openQuickView: (product: BaseProduct) => void;
  closeQuickView: () => void;
}

interface AnalyticsActions {
  trackProductView: (productId: string) => void;
  trackWishlistToggle: (productId: string, action: 'add' | 'remove') => void;
  trackQuickView: (productId: string) => void;
}

// Hook return type
interface UseProductCardReturn {
  wishlistActions: WishlistActions;
  quickViewActions: QuickViewActions;
  analyticsActions: AnalyticsActions;
  isLoading: boolean;
  error: string | null;
}

/**
 * Product Card Hook
 * Provides all actions and state needed for product card components
 */
export function useProductCard(config: UseProductCardConfig = {}): UseProductCardReturn {
  const {
    enableAnalytics = true,
    enableHapticFeedback = true,
    optimisticUpdates = true,
  } = config;

  // State Management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticWishlist, setOptimisticWishlist] = useState<Set<string>>(new Set());

  // Service Dependencies (Clean Architecture - Dependency Inversion)
  // const cartService = useMemo(() => ServiceLocator.cartService, []);
  // const productService = useMemo(() => ServiceLocator.productService, []);

  // Error Handling Utility
  const handleError = useCallback((error: unknown, defaultMessage: string): void => {
    const message = error instanceof Error ? error.message : defaultMessage;
    setError(message);
    console.error(defaultMessage, error);
    
    // Clear error after timeout
    setTimeout(() => setError(null), 5000);
  }, []);

  // Haptic Feedback Utility
  const triggerHapticFeedback = useCallback((pattern: number | number[]): void => {
    if (!enableHapticFeedback || !navigator.vibrate) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Silently fail if haptic feedback is not supported
    }
  }, [enableHapticFeedback]);

  // Wishlist Actions Implementation
  const wishlistActions: WishlistActions = useMemo(() => ({
    isInWishlist: (productId: string): boolean => {
      // Check optimistic state first, then actual state
      if (optimisticWishlist.has(productId)) {
        return true;
      }
      
      // In a real implementation, this would check the actual wishlist state
      // from the wishlist service or store
      return false;
    },

    addToWishlist: async (productId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Optimistic update
        if (optimisticUpdates) {
          setOptimisticWishlist(prev => new Set(prev).add(productId));
          triggerHapticFeedback([100, 50, 100]); // Double vibration for add
        }

        // In a real implementation, this would call the wishlist service
        // const result = await wishlistService.addToWishlist(productId);
        // if (!result.success) throw new Error(result.error.message);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Success feedback
        if (!optimisticUpdates) {
          triggerHapticFeedback([100, 50, 100]);
        }

      } catch (error) {
        // Revert optimistic update on error
        if (optimisticUpdates) {
          setOptimisticWishlist(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        }
        
        handleError(error, 'Failed to add product to wishlist');
        throw error; // Re-throw for component error handling
      } finally {
        setIsLoading(false);
      }
    },

    removeFromWishlist: async (productId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Optimistic update
        if (optimisticUpdates) {
          setOptimisticWishlist(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
          triggerHapticFeedback(50); // Single vibration for remove
        }

        // In a real implementation, this would call the wishlist service
        // const result = await wishlistService.removeFromWishlist(productId);
        // if (!result.success) throw new Error(result.error.message);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));

        // Success feedback
        if (!optimisticUpdates) {
          triggerHapticFeedback(50);
        }

      } catch (error) {
        // Revert optimistic update on error
        if (optimisticUpdates) {
          setOptimisticWishlist(prev => new Set(prev).add(productId));
        }
        
        handleError(error, 'Failed to remove product from wishlist');
        throw error; // Re-throw for component error handling
      } finally {
        setIsLoading(false);
      }
    },
  }), [optimisticWishlist, optimisticUpdates, triggerHapticFeedback, handleError]);

  // Quick View Actions Implementation
  const quickViewActions: QuickViewActions = useMemo(() => ({
    openQuickView: (product: BaseProduct): void => {
      try {
        // In a real implementation, this would:
        // 1. Fetch product details if not already loaded
        // 2. Open quick view modal/drawer
        // 3. Prefetch related products
        
        // Example: Dispatch event to open quick view modal
        window.dispatchEvent(new CustomEvent('open-quick-view', {
          detail: { product }
        }));

      } catch (error) {
        handleError(error, 'Failed to open quick view');
      }
    },
    
    closeQuickView: (): void => {
      try {
        window.dispatchEvent(new CustomEvent('close-quick-view'));
      } catch (error) {
        handleError(error, 'Failed to close quick view');
      }
    },
  }), [handleError]);

  // Analytics Actions Implementation
  const analyticsActions: AnalyticsActions = useMemo(() => ({
    trackProductView: (productId: string): void => {
      if (!enableAnalytics) return;

      try {
        // In a real implementation, this would send analytics events
        // analytics.track('Product Viewed', {
        //   productId: productId,
        //   timestamp: new Date().toISOString(),
        //   source: 'product-card',
        // });

        console.log('Analytics: Product viewed', productId);
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    },

    trackWishlistToggle: (productId: string, action: 'add' | 'remove'): void => {
      if (!enableAnalytics) return;

      try {
        // analytics.track('Wishlist Updated', {
        //   productId: productId,
        //   action,
        //   timestamp: new Date().toISOString(),
        //   source: 'product-card',
        // });

        console.log('Analytics: Wishlist toggled', productId, action);
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    },

    trackQuickView: (productId: string): void => {
      if (!enableAnalytics) return;

      try {
        // analytics.track('Quick View Opened', {
        //   productId: productId,
        //   timestamp: new Date().toISOString(),
        //   source: 'product-card',
        // });

        console.log('Analytics: Quick view opened', productId);
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    },
  }), [enableAnalytics]);

  return {
    wishlistActions,
    quickViewActions,
    analyticsActions,
    isLoading,
    error,
  };
}

/**
 * Product Data Transformer Hook
 * Transforms domain entities to component-friendly data structures
 */
export function useProductCardData(domainProduct: any): BaseProduct {
  return useMemo(() => {
    if (!domainProduct) {
      throw new Error('Product data is required');
    }

    const featuredImage = domainProduct.getFeaturedImage?.();
    const priceRange = domainProduct.getPriceRange?.();

    return {
      id: domainProduct.id,
      name: domainProduct.title || domainProduct.name,
      price: priceRange?.min?.toString() || '0',
      originalPrice: priceRange?.max?.toString(),
      image: featuredImage?.url || '',
      images: [featuredImage?.url].filter(Boolean),
      isNew: domainProduct.isNew || false,
      soldOut: !domainProduct.isAvailable?.() || false,
      slug: domainProduct.handle || domainProduct.slug,
      colors: domainProduct.variants?.length || 0,
      description: domainProduct.description,
      sizes: domainProduct.variants?.map((v: any) => v.title) || [],
      sku: domainProduct.sku,
      variants: domainProduct.variants,
    };
  }, [domainProduct]);
}

/**
 * Batch Product Operations Hook
 * Handles operations on multiple products efficiently
 */
export function useBatchProductOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addMultipleToWishlist = useCallback(async (productIds: string[]): Promise<void> => {
    setIsLoading(true);
    setErrors({});

    const results = await Promise.allSettled(
      productIds.map(async (productId) => {
        // Batch wishlist operation logic
        await new Promise(resolve => setTimeout(resolve, 100));
        return productId;
      })
    );

    const newErrors: Record<string, string> = {};
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        newErrors[productIds[index] || ''] = 'Failed to add to wishlist';
      }
    });

    setErrors(newErrors);
    setIsLoading(false);
  }, []);

  const prefetchProductData = useCallback(async (productIds: string[]): Promise<void> => {
    // Prefetch product data for better UX
    try {
      const productService = ServiceLocator.productService;
      await Promise.all(
        productIds.map(id => 
          // In a real implementation, this would prefetch product data
          productService.getProductAnalytics?.(ProductId.create(id))
        )
      );
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }, []);

  return {
    addMultipleToWishlist,
    prefetchProductData,
    isLoading,
    errors,
  };
}

// Export hook types for external usage
export type {
  UseProductCardConfig,
  UseProductCardReturn,
};