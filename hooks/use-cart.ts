import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCart as useCartState, useCartActions } from '@/lib/stores';
import { queryKeys } from '@/lib/query-client';

// Cart API functions for server sync
const cartAPI = {
  addItem: async (item: any, cartId: string | null) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (cartId) {
      headers['x-cart-id'] = cartId;
    }
    
    const response = await fetch('/api/cart/items', {
      method: 'POST',
      headers,
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to add item to cart');
    
    // Get cart ID from response headers
    const newCartId = response.headers.get('x-cart-id');
    const data = await response.json();
    return { ...data, cartId: newCartId };
  },
  
  updateItem: async (itemId: string, quantity: number, cartId: string | null) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (cartId) {
      headers['x-cart-id'] = cartId;
    }
    
    const response = await fetch(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Failed to update cart item');
    return response.json();
  },
  
  removeItem: async (itemId: string, cartId: string | null) => {
    const headers: HeadersInit = {};
    if (cartId) {
      headers['x-cart-id'] = cartId;
    }
    
    const response = await fetch(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to remove cart item');
    return response.json();
  },
  
  sync: async (cartData: any) => {
    const response = await fetch('/api/cart/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cartData),
    });
    if (!response.ok) throw new Error('Failed to sync cart');
    return response.json();
  },
};

// Enhanced cart hook with server sync
export function useCart() {
  const cart = useCartState();
  const actions = useCartActions();
  
  const { addItem, updateQuantity, removeItem, clearCart, getTotalItems, getTotalPrice } = actions;
  
  const queryClient = useQueryClient();

  // Mutation for adding items with server sync
  const addItemMutation = useMutation({
    mutationFn: (newItem: { productId: string; variantId: string; quantity: number }) =>
      cartAPI.addItem(newItem, cart.cartId),
    onMutate: async (newItem) => {
      // Optimistic update - need to pass correct parameters
      // newItem should have productId, variantId, quantity
      await addItem(newItem.productId, newItem.variantId, newItem.quantity);
    },
    onError: (error, _newItem, _context) => {
      // Rollback on error
      console.error('Failed to add item to cart:', error);
      // Could implement rollback logic here
    },
    onSuccess: (data) => {
      // Update cart ID if returned
      if (data.cartId && data.cartId !== cart.cartId) {
        // Cart ID has changed, reinitialize might be needed
        console.log('Cart ID updated:', data.cartId);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });

  // Mutation for updating items
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, size: _size, quantity }: { itemId: string; size: string; quantity: number }) =>
      cartAPI.updateItem(itemId, quantity, cart.cartId),
    onMutate: async ({ itemId, size, quantity }) => {
      await updateQuantity(itemId, size, quantity);
    },
    onError: (error) => {
      console.error('Failed to update cart item:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });

  // Mutation for removing items
  const removeItemMutation = useMutation({
    mutationFn: ({ itemId, size: _size }: { itemId: string; size: string }) => 
      cartAPI.removeItem(itemId, cart.cartId),
    onMutate: async ({ itemId, size }) => {
      await removeItem(itemId, size);
    },
    onError: (error) => {
      console.error('Failed to remove cart item:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });

  return {
    // State
    cart,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    
    // Actions
    addItem: addItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    removeItem: removeItemMutation.mutate,
    clearCart,
    
    // Loading states
    isAddingItem: addItemMutation.isPending,
    isUpdatingItem: updateItemMutation.isPending,
    isRemovingItem: removeItemMutation.isPending,
  };
}