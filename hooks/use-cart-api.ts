import { useState, useCallback, useEffect } from 'react';
import { ShopifyCart } from '@/lib/shopify/client';
import { cartApi, getOrCreateCart, clearStoredCart } from '@/lib/cart-api';

interface UseCartApiReturn {
  cart: ShopifyCart | null;
  loading: boolean;
  error: string | null;
  addToCart: (merchandiseId: string, quantity?: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

export function useCartApi(): UseCartApiReturn {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize cart on mount
  useEffect(() => {
    initializeCart();
  }, []);

  const initializeCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const cartData = await getOrCreateCart();
      if (cartData) {
        setCart(cartData);
      } else {
        setError('Failed to initialize cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback(async (merchandiseId: string, quantity: number = 1) => {
    if (!cart) {
      setError('Cart not initialized');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.addToCart(cart.id, merchandiseId, quantity);
      
      if (response.success && response.data) {
        setCart(response.data);
      } else {
        setError(response.error || 'Failed to add item to cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    if (!cart) {
      setError('Cart not initialized');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.updateCart(cart.id, lineId, quantity);
      
      if (response.success && response.data) {
        setCart(response.data);
      } else {
        setError(response.error || 'Failed to update cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cart');
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const removeFromCart = useCallback(async (lineId: string) => {
    if (!cart) {
      setError('Cart not initialized');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.removeSingleItem(cart.id, lineId);
      
      if (response.success && response.data) {
        setCart(response.data);
      } else {
        setError(response.error || 'Failed to remove item from cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item from cart');
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const clearCart = useCallback(() => {
    clearStoredCart();
    setCart(null);
    setError(null);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!cart) {
      await initializeCart();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.getCart(cart.id);
      
      if (response.success && response.data) {
        setCart(response.data);
      } else {
        // Cart might have expired, create a new one
        await initializeCart();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh cart');
    } finally {
      setLoading(false);
    }
  }, [cart]);

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