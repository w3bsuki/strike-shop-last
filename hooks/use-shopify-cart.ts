/**
 * useShopifyCart Hook
 * Client-side hook for interacting with Shopify cart using the cookie system
 */

import { useState, useEffect, useCallback } from 'react';
import type { Cart } from '@/lib/shopify/types';

interface UseShopifyCartReturn {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (merchandiseId: string, quantity?: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

export function useShopifyCart(): UseShopifyCartReturn {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cart on mount
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/cart');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load cart');
      }
      
      setCart(data.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add to cart
  const addToCart = useCallback(async (merchandiseId: string, quantity = 1) => {
    try {
      setError(null);
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchandiseId, quantity }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to cart');
      }
      
      setCart(data.cart);
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('cart-updated', { 
        detail: { cart: data.cart } 
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
      throw err;
    }
  }, []);

  // Update quantity
  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    try {
      setError(null);
      
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lineId, quantity }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update cart');
      }
      
      setCart(data.cart);
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('cart-updated', { 
        detail: { cart: data.cart } 
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cart');
      throw err;
    }
  }, []);

  // Remove from cart
  const removeFromCart = useCallback(async (lineId: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/cart?lineId=${lineId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove from cart');
      }
      
      setCart(data.cart);
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('cart-updated', { 
        detail: { cart: data.cart } 
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from cart');
      throw err;
    }
  }, []);

  // Clear cart (useful for after checkout)
  const clearCart = useCallback(async () => {
    try {
      setError(null);
      setCart(null);
      
      // Call checkout complete endpoint
      await fetch('/api/checkout', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: 'manual-clear' }),
      });
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('cart-cleared'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
    }
  }, []);

  // Refresh cart from server
  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      if (event.detail?.cart) {
        setCart(event.detail.cart);
      }
    };

    const handleCartClear = () => {
      setCart(null);
    };

    window.addEventListener('cart-updated', handleCartUpdate as EventListener);
    window.addEventListener('cart-cleared', handleCartClear);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
      window.removeEventListener('cart-cleared', handleCartClear);
    };
  }, []);

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  return {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };
}

/**
 * useCartRecovery Hook
 * Check for and recover abandoned carts
 */
export function useCartRecovery() {
  const [hasRecoverableCart, setHasRecoverableCart] = useState(false);
  const [recoverableCartId, setRecoverableCartId] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);

  // Check for recoverable cart
  const checkRecovery = useCallback(async () => {
    try {
      const response = await fetch('/api/checkout/status');
      const data = await response.json();
      
      if (data.hasRecoverableCart) {
        setHasRecoverableCart(true);
        setRecoverableCartId(data.recoverableCartId);
      }
    } catch (error) {
      console.error('Failed to check cart recovery:', error);
    }
  }, []);

  // Recover cart
  const recoverCart = useCallback(async () => {
    if (!recoverableCartId) return;
    
    try {
      setRecovering(true);
      
      const response = await fetch('/api/checkout', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartId: recoverableCartId }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setHasRecoverableCart(false);
        setRecoverableCartId(null);
        
        // Dispatch event to update cart
        window.dispatchEvent(new CustomEvent('cart-updated', { 
          detail: { cart: data.cart } 
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to recover cart:', error);
      return false;
    } finally {
      setRecovering(false);
    }
  }, [recoverableCartId]);

  // Dismiss recovery
  const dismissRecovery = useCallback(() => {
    setHasRecoverableCart(false);
    setRecoverableCartId(null);
  }, []);

  // Check on mount
  useEffect(() => {
    checkRecovery();
  }, [checkRecovery]);

  return {
    hasRecoverableCart,
    recoverableCartId,
    recovering,
    recoverCart,
    dismissRecovery,
  };
}