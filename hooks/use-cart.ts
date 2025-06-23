import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCart as useCartState, useCartActions } from '@/lib/stores';
import { queryKeys } from '@/lib/query-client';

// Cart API functions for server sync
const cartAPI = {
  addItem: async (item: any) => {
    const response = await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to add item to cart');
    return response.json();
  },
  
  updateItem: async (itemId: string, quantity: number) => {
    const response = await fetch(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Failed to update cart item');
    return response.json();
  },
  
  removeItem: async (itemId: string) => {
    const response = await fetch(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
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
    mutationFn: cartAPI.addItem,
    onMutate: async (newItem) => {
      // Optimistic update - need to pass correct parameters
      // newItem should have productId, variantId, quantity
      addItem(newItem.productId, newItem.variantId, newItem.quantity);
    },
    onError: (error, newItem, context) => {
      // Rollback on error
      console.error('Failed to add item to cart:', error);
      // Could implement rollback logic here
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });

  // Mutation for updating items
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, size, quantity }: { itemId: string; size: string; quantity: number }) =>
      cartAPI.updateItem(itemId, quantity),
    onMutate: ({ itemId, size, quantity }) => {
      updateQuantity(itemId, size, quantity);
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
    mutationFn: ({ itemId, size }: { itemId: string; size: string }) => cartAPI.removeItem(itemId),
    onMutate: ({ itemId, size }) => {
      removeItem(itemId, size);
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