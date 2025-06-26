import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '@/lib/cart-store';
import { medusaService } from '@/lib/medusa';
import type { ProductId, VariantId, Quantity } from '@/types/branded';

// Mock medusa service
jest.mock('@/lib/medusa', () => ({
  medusaService: {
    createCart: jest.fn(),
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeFromCart: jest.fn(),
  },
}));

const mockMedusaService = medusaService as jest.Mocked<typeof medusaService>;

describe('Cart Store Integration Tests', () => {
  const mockCart = {
    id: 'cart-123' as any,
    items: [
      {
        id: 'item-1',
        product_id: 'prod-1',
        variant_id: 'var-1',
        quantity: 2,
        unit_price: 2999,
        metadata: {
          product_title: 'Test Product',
          variant_title: 'Size M',
          thumbnail: '/images/product.jpg',
          product_handle: 'test-product',
        },
      },
    ],
    subtotal: 5998,
    total: 5998,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Reset store state
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
      result.current.clearError();
    });
  });

  describe('Cart Initialization', () => {
    it('should initialize cart from localStorage if available', async () => {
      localStorage.setItem('cart_id', 'stored-cart-123');
      mockMedusaService.getCart.mockResolvedValueOnce(mockCart);

      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.initializeCart();
      });

      expect(mockMedusaService.getCart).toHaveBeenCalledWith('stored-cart-123');
      expect(result.current.cartId).toBe('cart-123');
      expect(result.current.items).toHaveLength(1);
      expect(result.current.getTotalItems()).toBe(2);
    });

    it('should create new cart if no cart in localStorage', async () => {
      mockMedusaService.createCart.mockResolvedValueOnce({ id: 'new-cart-123' as any });

      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.initializeCart();
      });

      expect(mockMedusaService.createCart).toHaveBeenCalled();
      expect(localStorage.getItem('cart_id')).toBe('new-cart-123');
      expect(result.current.cartId).toBe('new-cart-123');
    });

    it('should handle initialization errors gracefully', async () => {
      mockMedusaService.createCart.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.initializeCart();
      });

      expect(result.current.error).toBe('Failed to initialize cart');
      expect(result.current.isLoading).toBe(false);
    });

    it('should create new cart if stored cart is not found', async () => {
      localStorage.setItem('cart_id', 'invalid-cart-id');
      mockMedusaService.getCart.mockRejectedValueOnce(new Error('Cart not found'));
      mockMedusaService.createCart.mockResolvedValueOnce({ id: 'new-cart-123' as any });

      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.initializeCart();
      });

      expect(mockMedusaService.createCart).toHaveBeenCalled();
      expect(result.current.cartId).toBe('new-cart-123');
    });
  });

  describe('Add to Cart', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useCartStore());
      await act(async () => {
        result.current.cartId = 'cart-123' as any;
      });
    });

    it('should add item to cart successfully', async () => {
      mockMedusaService.addToCart.mockResolvedValueOnce({
        ...mockCart,
        items: [...mockCart.items, {
          id: 'item-2',
          product_id: 'prod-2',
          variant_id: 'var-2',
          quantity: 1,
          unit_price: 3999,
          metadata: {
            product_title: 'Another Product',
            variant_title: 'Size L',
            thumbnail: '/images/another.jpg',
            product_handle: 'another-product',
          },
        }],
      });

      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem(
          'prod-2' as ProductId,
          'var-2' as VariantId,
          1 as Quantity
        );
      });

      expect(mockMedusaService.addToCart).toHaveBeenCalledWith('cart-123', 'var-2', 1);
      expect(result.current.items).toHaveLength(2);
      expect(result.current.getTotalItems()).toBe(3);
    });

    it('should open cart after adding item', async () => {
      mockMedusaService.addToCart.mockResolvedValueOnce(mockCart);

      const { result } = renderHook(() => useCartStore());
      expect(result.current.isOpen).toBe(false);

      await act(async () => {
        await result.current.addItem(
          'prod-1' as ProductId,
          'var-1' as VariantId,
          1 as Quantity
        );
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should handle add to cart errors', async () => {
      mockMedusaService.addToCart.mockRejectedValueOnce(new Error('Out of stock'));

      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem(
          'prod-1' as ProductId,
          'var-1' as VariantId,
          1 as Quantity
        );
      });

      expect(result.current.error).toBe('Failed to add item to cart');
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize cart if not exists when adding item', async () => {
      mockMedusaService.createCart.mockResolvedValueOnce({ id: 'new-cart-123' as any });
      mockMedusaService.addToCart.mockResolvedValueOnce(mockCart);

      const { result } = renderHook(() => useCartStore());
      
      // Clear cart ID to simulate uninitialized state
      await act(async () => {
        result.current.cartId = null as any;
      });

      await act(async () => {
        await result.current.addItem(
          'prod-1' as ProductId,
          'var-1' as VariantId,
          1 as Quantity
        );
      });

      expect(mockMedusaService.createCart).toHaveBeenCalled();
      expect(mockMedusaService.addToCart).toHaveBeenCalled();
    });
  });

  describe('Update Cart Item Quantity', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useCartStore());
      await act(async () => {
        result.current.cartId = 'cart-123' as any;
        result.current.items = mockCart.items.map(item => ({
          lineItemId: item.id,
          id: item.product_id,
          variantId: item.variant_id,
          name: item.metadata.product_title,
          size: item.metadata.variant_title.replace('Size ', ''),
          quantity: item.quantity,
          price: item.unit_price / 100,
          image: item.metadata.thumbnail,
          slug: item.metadata.product_handle,
          sku: `SKU-${item.product_id}`,
          pricing: {
            displayUnitPrice: `£${(item.unit_price / 100).toFixed(2)}`,
            displayUnitSalePrice: null,
          },
        }));
      });
    });

    it('should update item quantity successfully', async () => {
      const updatedCart = {
        ...mockCart,
        items: [{
          ...mockCart.items[0],
          quantity: 3,
        }],
      };

      mockMedusaService.updateCartItem.mockResolvedValueOnce(updatedCart);

      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.updateQuantity(
          'prod-1' as ProductId,
          'M',
          3 as Quantity
        );
      });

      expect(mockMedusaService.updateCartItem).toHaveBeenCalledWith('cart-123', 'item-1', 3);
      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.getTotalItems()).toBe(3);
    });

    it('should handle update errors gracefully', async () => {
      mockMedusaService.updateCartItem.mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.updateQuantity(
          'prod-1' as ProductId,
          'M',
          5 as Quantity
        );
      });

      expect(result.current.error).toBe('Failed to update item quantity');
      expect(result.current.isLoading).toBe(false);
    });

    it('should not update if item not found', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.updateQuantity(
          'non-existent' as ProductId,
          'M',
          2 as Quantity
        );
      });

      expect(mockMedusaService.updateCartItem).not.toHaveBeenCalled();
    });
  });

  describe('Remove from Cart', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useCartStore());
      await act(async () => {
        result.current.cartId = 'cart-123' as any;
        result.current.items = mockCart.items.map(item => ({
          lineItemId: item.id,
          id: item.product_id,
          variantId: item.variant_id,
          name: item.metadata.product_title,
          size: item.metadata.variant_title.replace('Size ', ''),
          quantity: item.quantity,
          price: item.unit_price / 100,
          image: item.metadata.thumbnail,
          slug: item.metadata.product_handle,
          sku: `SKU-${item.product_id}`,
          pricing: {
            displayUnitPrice: `£${(item.unit_price / 100).toFixed(2)}`,
            displayUnitSalePrice: null,
          },
        }));
      });
    });

    it('should remove item from cart successfully', async () => {
      mockMedusaService.removeFromCart.mockResolvedValueOnce({
        ...mockCart,
        items: [],
      });

      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.removeItem('prod-1' as ProductId, 'M');
      });

      expect(mockMedusaService.removeFromCart).toHaveBeenCalledWith('cart-123', 'item-1');
      expect(result.current.items).toHaveLength(0);
      expect(result.current.getTotalItems()).toBe(0);
    });

    it('should handle remove errors gracefully', async () => {
      mockMedusaService.removeFromCart.mockRejectedValueOnce(new Error('Remove failed'));

      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.removeItem('prod-1' as ProductId, 'M');
      });

      expect(result.current.error).toBe('Failed to remove item from cart');
      expect(result.current.isLoading).toBe(false);
    });

    it('should not remove if item not found', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.removeItem('non-existent' as ProductId, 'M');
      });

      expect(mockMedusaService.removeFromCart).not.toHaveBeenCalled();
    });
  });

  describe('Cart UI State', () => {
    it('should toggle cart open/close state', () => {
      const { result } = renderHook(() => useCartStore());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.openCart();
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.closeCart();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.error = 'Test error';
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate total items correctly', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.items = [
          { quantity: 2 } as any,
          { quantity: 3 } as any,
          { quantity: 1 } as any,
        ];
      });

      expect(result.current.getTotalItems()).toBe(6);
    });

    it('should calculate total price correctly', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.items = [
          { quantity: 2, price: 29.99 } as any,
          { quantity: 1, price: 49.99 } as any,
        ];
      });

      expect(result.current.getTotalPrice()).toBe(109.97);
    });

    it('should handle empty cart calculations', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.items = [];
      });

      expect(result.current.getTotalItems()).toBe(0);
      expect(result.current.getTotalPrice()).toBe(0);
    });
  });

  describe('Cart Persistence', () => {
    it('should persist cart ID to localStorage', async () => {
      mockMedusaService.createCart.mockResolvedValueOnce({ id: 'persisted-cart-123' as any });

      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.initializeCart();
      });

      expect(localStorage.getItem('cart_id')).toBe('persisted-cart-123');
    });

    it('should clear cart and localStorage on clearCart', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.cartId = 'cart-123' as any;
        result.current.items = mockCart.items as any;
        localStorage.setItem('cart_id', 'cart-123');
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cartId).toBeNull();
      expect(result.current.items).toHaveLength(0);
      expect(localStorage.getItem('cart_id')).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should set loading state during operations', async () => {
      mockMedusaService.addToCart.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockCart), 100))
      );

      const { result } = renderHook(() => useCartStore());
      
      act(() => {
        result.current.cartId = 'cart-123' as any;
      });

      let loadingDuringOperation = false;

      const promise = act(async () => {
        await result.current.addItem(
          'prod-1' as ProductId,
          'var-1' as VariantId,
          1 as Quantity
        );
      });

      // Check loading state immediately after starting operation
      loadingDuringOperation = result.current.isLoading;

      await promise;

      expect(loadingDuringOperation).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from errors and allow retry', async () => {
      const { result } = renderHook(() => useCartStore());
      
      act(() => {
        result.current.cartId = 'cart-123' as any;
      });

      // First attempt fails
      mockMedusaService.addToCart.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.addItem(
          'prod-1' as ProductId,
          'var-1' as VariantId,
          1 as Quantity
        );
      });

      expect(result.current.error).toBe('Failed to add item to cart');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      // Second attempt succeeds
      mockMedusaService.addToCart.mockResolvedValueOnce(mockCart);

      await act(async () => {
        await result.current.addItem(
          'prod-1' as ProductId,
          'var-1' as VariantId,
          1 as Quantity
        );
      });

      expect(result.current.error).toBeNull();
      expect(result.current.items).toHaveLength(1);
    });
  });
});