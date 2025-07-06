import { renderHook, act, waitFor } from '@testing-library/react';
import { createEnhancedCartSlice } from './enhanced-cart';
import { toast } from '@/hooks/use-toast';
import { cartEventEmitter } from '@/lib/events';
import { mockCartItem, mockFetchResponse } from '@/__tests__/utils/mock-data';

// Mock dependencies
jest.mock('@/hooks/use-toast');
jest.mock('@/lib/events');
jest.mock('@/lib/error-handling', () => ({
  retry: jest.fn((fn) => fn()),
  handleError: jest.fn(),
  NetworkError: class NetworkError extends Error {},
}));

// Mock fetch
global.fetch = jest.fn();

describe('Enhanced Cart Slice', () => {
  let store: any;
  let slice: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse({ success: true }));
    
    // Create a mock store
    store = {
      cart: {
        cartId: 'test-cart-id',
        items: [mockCartItem],
        isOpen: false,
        isLoading: false,
        error: null,
        bulkOperations: [],
        savedCarts: [],
        recommendations: [],
        inventoryStatus: [],
        taxEstimate: null,
        shareToken: null,
        shareExpiry: null,
        savedForLater: [],
        abandonmentTracking: {
          startTime: null,
          events: [],
        },
      },
      actions: {
        cart: {
          addItem: jest.fn(),
        },
      },
    };

    const set = jest.fn((fn) => {
      if (typeof fn === 'function') {
        const newState = fn(store);
        Object.assign(store, newState);
      } else {
        Object.assign(store, fn);
      }
    });

    const get = jest.fn(() => store);

    slice = createEnhancedCartSlice(set, get, {} as any);
  });

  describe('bulkAddToCart', () => {
    it('successfully adds multiple items to cart', async () => {
      const items = [
        { productId: '1', variantId: 'v1', quantity: 2 },
        { productId: '2', variantId: 'v2', quantity: 1 },
      ];

      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({
          success: true,
          cart: { items: [...store.cart.items, ...items] },
        })
      );

      const result = await slice.actions.enhancedCart.bulkAddToCart(items);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/cart/bulk-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: 'test-cart-id',
          items,
        }),
      });

      expect(toast).toHaveBeenCalledWith({
        title: 'Items added to cart',
        description: 'Successfully added 2 items to your cart.',
      });

      expect(cartEventEmitter.emit).toHaveBeenCalledWith('bulk-operation-completed', {
        operation: 'add',
        itemCount: 2,
        success: true,
      });
    });

    it('handles bulk add failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ success: false, error: 'Failed to add items' }, false)
      );

      const items = [{ productId: '1', variantId: 'v1', quantity: 1 }];
      const result = await slice.actions.enhancedCart.bulkAddToCart(items);

      expect(result).toBe(false);
      expect(toast).toHaveBeenCalledWith({
        title: 'Failed to add items',
        description: 'Some items could not be added to your cart.',
        variant: 'destructive',
      });
    });

    it('tracks bulk operations in state', async () => {
      const items = [{ productId: '1', variantId: 'v1', quantity: 1 }];
      
      await slice.actions.enhancedCart.bulkAddToCart(items);

      const operations = store.cart.bulkOperations;
      expect(operations).toHaveLength(1);
      expect(operations[0]).toMatchObject({
        type: 'add',
        items,
        status: 'completed',
      });
    });
  });

  describe('createShareableCart', () => {
    it('creates shareable cart link', async () => {
      const shareToken = 'share-token-123';
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ success: true, shareToken })
      );

      const result = await slice.actions.enhancedCart.createShareableCart(48);

      expect(result).toBe(shareToken);
      expect(global.fetch).toHaveBeenCalledWith('/api/cart/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: 'test-cart-id',
          expiryHours: 48,
        }),
      });

      expect(store.cart.shareToken).toBe(shareToken);
      expect(store.cart.shareExpiry).toBeGreaterThan(Date.now());

      expect(cartEventEmitter.emit).toHaveBeenCalledWith('cart-shared', {
        shareToken,
        expiryHours: 48,
      });
    });

    it('handles share creation failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ success: false })
      );

      const result = await slice.actions.enhancedCart.createShareableCart();

      expect(result).toBeNull();
    });
  });

  describe('validateInventory', () => {
    it('validates inventory and updates status', async () => {
      const inventoryStatus = [
        { variantId: 'v1', available: true, quantity: 10, policy: 'continue' },
        { variantId: 'v2', available: false, quantity: 0, policy: 'deny', message: 'Out of stock' },
      ];

      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ success: true, inventoryStatus })
      );

      await slice.actions.enhancedCart.validateInventory();

      expect(store.cart.inventoryStatus).toEqual(inventoryStatus);

      expect(toast).toHaveBeenCalledWith({
        title: 'Inventory Update',
        description: '1 item(s) in your cart are no longer available.',
        variant: 'destructive',
      });

      expect(cartEventEmitter.emit).toHaveBeenCalledWith('inventory-validated', {
        unavailableCount: 1,
        items: [inventoryStatus[1]],
      });
    });
  });

  describe('estimateTax', () => {
    it('calculates tax estimate for cart', async () => {
      const taxEstimate = {
        subtotal: 100,
        tax: 20,
        total: 120,
        shipping: 10,
        currency: 'EUR',
        regionCode: 'BG',
        taxRate: 0.2,
      };

      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ success: true, taxEstimate })
      );

      await slice.actions.enhancedCart.estimateTax('BG', 'Sofia');

      expect(global.fetch).toHaveBeenCalledWith('/api/cart/calculate-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: 'test-cart-id',
          countryCode: 'BG',
          provinceCode: 'Sofia',
        }),
      });

      expect(store.cart.taxEstimate).toEqual(taxEstimate);
    });
  });

  describe('saveForLater', () => {
    it('moves item from cart to saved for later', async () => {
      const itemToSave = mockCartItem;
      const result = await slice.actions.enhancedCart.saveForLater(itemToSave.lineItemId);

      expect(result).toBe(true);
      expect(store.cart.savedForLater).toContainEqual(itemToSave);
      expect(store.cart.items).not.toContainEqual(itemToSave);

      expect(toast).toHaveBeenCalledWith({
        title: 'Saved for later',
        description: `${itemToSave.name} has been saved for later.`,
      });
    });

    it('returns false when item not found', async () => {
      const result = await slice.actions.enhancedCart.saveForLater('non-existent');

      expect(result).toBe(false);
      expect(store.cart.savedForLater).toHaveLength(0);
    });
  });

  describe('moveToCart', () => {
    it('moves item from saved back to cart', async () => {
      const savedItem = { ...mockCartItem, id: 'saved-1' };
      store.cart.savedForLater = [savedItem];
      store.cart.items = [];

      const result = await slice.actions.enhancedCart.moveToCart('saved-1');

      expect(result).toBe(true);
      expect(store.cart.items).toContainEqual(savedItem);
      expect(store.cart.savedForLater).not.toContainEqual(savedItem);
    });
  });

  describe('abandonmentTracking', () => {
    it('starts abandonment tracking', () => {
      slice.actions.enhancedCart.startAbandonmentTracking();

      expect(store.cart.abandonmentTracking.startTime).toBeTruthy();
      expect(store.cart.abandonmentTracking.events).toEqual([]);
    });

    it('tracks events', () => {
      const eventData = { productId: '123', action: 'view' };
      slice.actions.enhancedCart.trackEvent('product-viewed', eventData);

      expect(store.cart.abandonmentTracking.events).toHaveLength(1);
      expect(store.cart.abandonmentTracking.events[0]).toMatchObject({
        event: 'product-viewed',
        data: eventData,
      });
    });
  });

  describe('recommendations', () => {
    it('loads product recommendations', async () => {
      const recommendations = [
        {
          id: 'rec-1',
          type: 'frequently_bought',
          reason: 'frequently-bought-together',
          productId: 'prod-1',
          name: 'Recommended Product',
          image: 'https://example.com/rec.jpg',
          price: '50.00',
          relevanceScore: 0.95,
          confidence: 0.9,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ success: true, recommendations })
      );

      await slice.actions.enhancedCart.loadRecommendations();

      expect(store.cart.recommendations).toEqual(recommendations);
    });

    it('adds recommendation to cart', async () => {
      store.cart.recommendations = [{
        id: 'rec-1',
        type: 'similar',
        reason: 'similar-products',
        productId: 'prod-1',
        name: 'Recommended Product',
        image: 'https://example.com/rec.jpg',
        price: '50.00',
        relevanceScore: 0.9,
        confidence: 0.85,
      }];

      const result = await slice.actions.enhancedCart.addRecommendationToCart('rec-1');

      expect(result).toBe(true);
      expect(store.actions.cart.addItem).toHaveBeenCalledWith('prod-1', 'default-variant', 1);
      
      expect(cartEventEmitter.emit).toHaveBeenCalledWith('recommendation-added', {
        recommendationId: 'rec-1',
        type: 'similar',
      });
    });
  });
});