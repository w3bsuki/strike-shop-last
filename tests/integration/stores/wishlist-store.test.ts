import { renderHook, act } from '@testing-library/react';
import { useWishlistStore, useWishlistActions, useWishlistCount, useIsWishlisted } from '@/lib/wishlist-store';
import type { WishlistItem } from '@/lib/wishlist-store';

describe('Wishlist Store Integration Tests', () => {
  const mockProduct: WishlistItem = {
    id: 'product-1',
    name: 'Test Product',
    price: '$29.99',
    image: '/images/product.jpg',
    slug: 'test-product',
  };

  const mockProduct2: WishlistItem = {
    id: 'product-2',
    name: 'Another Product',
    price: '$49.99',
    image: '/images/another.jpg',
    slug: 'another-product',
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset store state
    const { result } = renderHook(() => useWishlistStore());
    act(() => {
      result.current.clearWishlist();
    });
  });

  describe('Wishlist Basic Operations', () => {
    it('should add item to wishlist', () => {
      const { result } = renderHook(() => useWishlistStore());

      act(() => {
        result.current.addToWishlist(mockProduct);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual(mockProduct);
    });

    it('should not add duplicate items', () => {
      const { result } = renderHook(() => useWishlistStore());

      act(() => {
        result.current.addToWishlist(mockProduct);
        result.current.addToWishlist(mockProduct);
      });

      expect(result.current.items).toHaveLength(1);
    });

    it('should remove item from wishlist', () => {
      const { result } = renderHook(() => useWishlistStore());

      act(() => {
        result.current.addToWishlist(mockProduct);
        result.current.addToWishlist(mockProduct2);
      });

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.removeFromWishlist('product-1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe('product-2');
    });

    it('should clear wishlist', () => {
      const { result } = renderHook(() => useWishlistStore());

      act(() => {
        result.current.addToWishlist(mockProduct);
        result.current.addToWishlist(mockProduct2);
      });

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.clearWishlist();
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('should check if item is wishlisted', () => {
      const { result } = renderHook(() => useWishlistStore());

      act(() => {
        result.current.addToWishlist(mockProduct);
      });

      expect(result.current.isWishlisted('product-1')).toBe(true);
      expect(result.current.isWishlisted('product-2')).toBe(false);
    });
  });

  describe('Wishlist Persistence', () => {
    it('should persist wishlist to localStorage', () => {
      const { result } = renderHook(() => useWishlistStore());

      act(() => {
        result.current.addToWishlist(mockProduct);
      });

      const storedWishlist = localStorage.getItem('wishlist');
      expect(storedWishlist).toBeTruthy();
      
      const parsedWishlist = JSON.parse(storedWishlist!);
      expect(parsedWishlist).toHaveLength(1);
      expect(parsedWishlist[0]).toEqual(mockProduct);
    });

    it('should load wishlist from localStorage on initialization', () => {
      // Pre-populate localStorage
      localStorage.setItem('wishlist', JSON.stringify([mockProduct, mockProduct2]));

      const { result } = renderHook(() => useWishlistStore());

      // Store should be initialized with localStorage data
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0]).toEqual(mockProduct);
      expect(result.current.items[1]).toEqual(mockProduct2);
    });

    it('should handle corrupted localStorage data', () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('wishlist', 'invalid-json');

      const { result } = renderHook(() => useWishlistStore());

      // Should initialize with empty array
      expect(result.current.items).toHaveLength(0);
    });

    it('should handle non-array localStorage data', () => {
      // Set non-array data
      localStorage.setItem('wishlist', JSON.stringify({ not: 'an array' }));

      const { result } = renderHook(() => useWishlistStore());

      // Should initialize with empty array
      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('Wishlist Actions Hook', () => {
    it('should provide action methods', () => {
      const { result } = renderHook(() => useWishlistActions());

      expect(result.current).toHaveProperty('addToWishlist');
      expect(result.current).toHaveProperty('removeFromWishlist');
      expect(result.current).toHaveProperty('clearWishlist');
      expect(typeof result.current.addToWishlist).toBe('function');
      expect(typeof result.current.removeFromWishlist).toBe('function');
      expect(typeof result.current.clearWishlist).toBe('function');
    });

    it('should add item through actions hook', () => {
      const { result: actionsResult } = renderHook(() => useWishlistActions());
      const { result: storeResult } = renderHook(() => useWishlistStore());

      act(() => {
        actionsResult.current.addToWishlist(mockProduct);
      });

      expect(storeResult.current.items).toHaveLength(1);
      expect(storeResult.current.items[0]).toEqual(mockProduct);
    });

    it('should remove item through actions hook', () => {
      const { result: actionsResult } = renderHook(() => useWishlistActions());
      const { result: storeResult } = renderHook(() => useWishlistStore());

      act(() => {
        actionsResult.current.addToWishlist(mockProduct);
        actionsResult.current.addToWishlist(mockProduct2);
        actionsResult.current.removeFromWishlist('product-1');
      });

      expect(storeResult.current.items).toHaveLength(1);
      expect(storeResult.current.items[0].id).toBe('product-2');
    });
  });

  describe('Wishlist Count Hook', () => {
    it('should return correct count', () => {
      const { result: storeResult } = renderHook(() => useWishlistStore());
      const { result: countResult } = renderHook(() => useWishlistCount());

      expect(countResult.current).toBe(0);

      act(() => {
        storeResult.current.addToWishlist(mockProduct);
      });

      expect(countResult.current).toBe(1);

      act(() => {
        storeResult.current.addToWishlist(mockProduct2);
      });

      expect(countResult.current).toBe(2);

      act(() => {
        storeResult.current.clearWishlist();
      });

      expect(countResult.current).toBe(0);
    });

    it('should update count reactively', () => {
      const { result: actionsResult } = renderHook(() => useWishlistActions());
      const { result: countResult } = renderHook(() => useWishlistCount());

      expect(countResult.current).toBe(0);

      act(() => {
        actionsResult.current.addToWishlist(mockProduct);
      });

      expect(countResult.current).toBe(1);
    });
  });

  describe('Is Wishlisted Hook', () => {
    it('should return correct wishlisted state', () => {
      const { result: storeResult } = renderHook(() => useWishlistStore());
      const { result: isWishlistedResult } = renderHook(() => useIsWishlisted('product-1'));

      expect(isWishlistedResult.current).toBe(false);

      act(() => {
        storeResult.current.addToWishlist(mockProduct);
      });

      expect(isWishlistedResult.current).toBe(true);

      act(() => {
        storeResult.current.removeFromWishlist('product-1');
      });

      expect(isWishlistedResult.current).toBe(false);
    });

    it('should update reactively when wishlist changes', () => {
      const { result: actionsResult } = renderHook(() => useWishlistActions());
      const { result: isWishlistedResult } = renderHook(() => useIsWishlisted('product-1'));

      expect(isWishlistedResult.current).toBe(false);

      act(() => {
        actionsResult.current.addToWishlist(mockProduct);
      });

      expect(isWishlistedResult.current).toBe(true);
    });

    it('should handle multiple product checks', () => {
      const { result: storeResult } = renderHook(() => useWishlistStore());
      const { result: isWishlisted1 } = renderHook(() => useIsWishlisted('product-1'));
      const { result: isWishlisted2 } = renderHook(() => useIsWishlisted('product-2'));

      act(() => {
        storeResult.current.addToWishlist(mockProduct);
      });

      expect(isWishlisted1.current).toBe(true);
      expect(isWishlisted2.current).toBe(false);

      act(() => {
        storeResult.current.addToWishlist(mockProduct2);
      });

      expect(isWishlisted1.current).toBe(true);
      expect(isWishlisted2.current).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle removing non-existent item', () => {
      const { result } = renderHook(() => useWishlistStore());

      act(() => {
        result.current.addToWishlist(mockProduct);
      });

      expect(result.current.items).toHaveLength(1);

      act(() => {
        result.current.removeFromWishlist('non-existent-id');
      });

      // Should not affect existing items
      expect(result.current.items).toHaveLength(1);
    });

    it('should handle items with special characters', () => {
      const specialProduct: WishlistItem = {
        id: 'special-!@#$%',
        name: 'Product with "quotes" & symbols',
        price: '$99.99',
        image: '/images/special.jpg',
        slug: 'special-product',
      };

      const { result } = renderHook(() => useWishlistStore());

      act(() => {
        result.current.addToWishlist(specialProduct);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.isWishlisted('special-!@#$%')).toBe(true);

      act(() => {
        result.current.removeFromWishlist('special-!@#$%');
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('should handle very large wishlists', () => {
      const { result } = renderHook(() => useWishlistStore());
      const largeProductList: WishlistItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        price: `$${i}.99`,
        image: `/images/product-${i}.jpg`,
        slug: `product-${i}`,
      }));

      act(() => {
        largeProductList.forEach(product => {
          result.current.addToWishlist(product);
        });
      });

      expect(result.current.items).toHaveLength(100);
      expect(result.current.isWishlisted('product-50')).toBe(true);
    });

    it('should handle concurrent operations', () => {
      const { result } = renderHook(() => useWishlistStore());

      act(() => {
        // Simulate concurrent adds
        result.current.addToWishlist(mockProduct);
        result.current.addToWishlist(mockProduct2);
        result.current.removeFromWishlist('product-1');
        result.current.addToWishlist(mockProduct);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items.find(item => item.id === 'product-1')).toBeTruthy();
      expect(result.current.items.find(item => item.id === 'product-2')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should efficiently check large wishlists', () => {
      const { result } = renderHook(() => useWishlistStore());
      const largeProductList: WishlistItem[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        price: `$${i}.99`,
        image: `/images/product-${i}.jpg`,
        slug: `product-${i}`,
      }));

      act(() => {
        largeProductList.forEach(product => {
          result.current.addToWishlist(product);
        });
      });

      const startTime = performance.now();
      const isWishlisted = result.current.isWishlisted('product-999');
      const endTime = performance.now();

      expect(isWishlisted).toBe(true);
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });

    it('should batch localStorage updates efficiently', () => {
      const { result } = renderHook(() => useWishlistStore());
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      act(() => {
        // Multiple operations in single act
        result.current.addToWishlist(mockProduct);
        result.current.addToWishlist(mockProduct2);
        result.current.removeFromWishlist('product-1');
      });

      // Should batch updates within single render cycle
      expect(setItemSpy).toHaveBeenCalled();
      
      setItemSpy.mockRestore();
    });
  });

  describe('Cross-Tab Synchronization', () => {
    it('should sync wishlist across multiple instances', () => {
      const { result: instance1 } = renderHook(() => useWishlistStore());
      const { result: instance2 } = renderHook(() => useWishlistStore());

      act(() => {
        instance1.current.addToWishlist(mockProduct);
      });

      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'wishlist',
        newValue: JSON.stringify([mockProduct, mockProduct2]),
        storageArea: localStorage,
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      // Both instances should have updated data
      expect(instance1.current.items).toHaveLength(2);
      expect(instance2.current.items).toHaveLength(2);
    });
  });
});