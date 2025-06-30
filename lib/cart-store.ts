import { useStore } from './stores';
import type { CartItem as TypedCartItem, CartState } from '@/types/store';
import type { ProductId, VariantId, Quantity } from '@/types/branded';
import { createCartId } from '@/types/branded';

// Re-export the CartItem interface for backward compatibility
export type CartItem = TypedCartItem;

interface CartStore extends CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  clearError: () => void;

  // Cart operations
  initializeCart: () => Promise<void>;
  addItem: (
    productId: ProductId,
    variantId: VariantId,
    quantity: Quantity
  ) => Promise<void>;
  updateQuantity: (
    itemId: ProductId,
    size: string,
    quantity: Quantity
  ) => Promise<void>;
  removeItem: (itemId: ProductId, size: string) => Promise<void>;
  clearCart: () => void;

  // Getters
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// Create a facade that maintains the exact same API as the original store
export const useCartStore = (): CartStore => {
  const cart = useStore((state) => state.cart);
  const actions = useStore((state) => state.actions.cart);

  return {
    // State
    cartId: cart.cartId ? createCartId(cart.cartId) : null,
    items: cart.items,
    isOpen: cart.isOpen,
    isLoading: cart.isLoading,
    error: cart.error,

    // Actions - mapped to unified store methods with signature adaptation
    openCart: () => actions.setCartOpen(true),
    closeCart: () => actions.setCartOpen(false),
    clearError: () => {}, // Not implemented in current store
    initializeCart: actions.initializeCart,
    addItem: actions.addItem,
    updateQuantity: async (itemId: ProductId, _size: string, quantity: Quantity) => {
      // Convert to the new signature - ignore size for now since new store only uses itemId
      return actions.updateItemQuantity(itemId as string, quantity as number);
    },
    removeItem: async (itemId: ProductId, _size: string) => {
      // Convert to the new signature - ignore size for now
      return actions.removeItem(itemId as string);
    },
    clearCart: actions.clearCart,
    getTotalItems: actions.getItemCount,
    getTotalPrice: () => actions.getTotals().total,
  };
};
