import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { createCartSlice } from './slices/cart';
import { createWishlistSlice } from './slices/wishlist';
import { createAuthSlice } from './slices/auth';
import { executeMigrations } from './migrations';
import type { StoreState, PersistedState } from './types';

// Create the unified store with all slices
export const useStore = create<StoreState>()(
  devtools(
    persist<StoreState, [], [], PersistedState>(
      (set, get, api) => {
        // Create slices once to avoid duplication
        const cartSlice = createCartSlice(set, get, api);
        const wishlistSlice = createWishlistSlice(set, get, api);
        const authSlice = createAuthSlice(set, get, api);

        return {
          // Cart state
          cart: {
            cartId: cartSlice.cartId,
            items: cartSlice.items || [],
            isOpen: cartSlice.isOpen,
            isLoading: cartSlice.isLoading,
            error: cartSlice.error,
          },

          // Wishlist state
          wishlist: {
            items: wishlistSlice.items || [],
            isLoading: wishlistSlice.isLoading,
          },

          // Auth state
          auth: {
            user: authSlice.user,
            isAuthenticated: authSlice.isAuthenticated,
            isLoading: authSlice.isLoading,
            error: authSlice.error,
          },

          // Combine all actions
          actions: {
            cart: cartSlice.actions.cart,
            wishlist: wishlistSlice.actions.wishlist,
            auth: authSlice.actions.auth,
          },
        };
      },
      {
        name: 'strike-shop-storage',
        partialize: (state): PersistedState => ({
          cart: {
            cartId: state.cart.cartId,
          },
          wishlist: {
            items: state.wishlist.items,
          },
          auth: {
            user: state.auth.user,
          },
        }),
        onRehydrateStorage: () => (state) => {
          // Handle rehydration
          if (state) {
            // Ensure auth state is properly set after rehydration
            if (state.auth.user) {
              state.auth.isAuthenticated = true;
            }
          }
        },
        version: 4, // Current version with all migrations
        migrate: (persistedState: any, version: number) => {
          // Use the migration system
          return executeMigrations(persistedState, version, 4);
        },
        storage: createJSONStorage(() => {
          // Safe localStorage access that works with SSR
          if (typeof window !== 'undefined') {
            return localStorage;
          }
          // Return a no-op storage for SSR
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }),
      }
    ),
    {
      name: 'strike-shop-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Memoized selectors for better performance
const cartSelector = (state: StoreState) => state.cart;
const wishlistSelector = (state: StoreState) => state.wishlist;
const authSelector = (state: StoreState) => state.auth;
const cartActionsSelector = (state: StoreState) => state.actions.cart;
const wishlistActionsSelector = (state: StoreState) => state.actions.wishlist;
const authActionsSelector = (state: StoreState) => state.actions.auth;

// Export selectors for better performance and convenience
export const useCart = () => useStore(cartSelector);
export const useWishlist = () => useStore(wishlistSelector);
export const useAuth = () => useStore(authSelector);

export const useCartActions = () => useStore(cartActionsSelector);
export const useWishlistActions = () => useStore(wishlistActionsSelector);
export const useAuthActions = () => useStore(authActionsSelector);

// Specific selectors for common use cases - memoized for performance
export const useCartItems = () => useStore((state) => state.cart.items || []);
export const useCartIsOpen = () => useStore((state) => state.cart.isOpen);
export const useCartTotalItems = () =>
  useStore((state) => state.cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
export const useCartTotalPrice = () =>
  useStore((state) => 
    state.cart.items?.reduce((sum, item) => sum + (item.pricing.unitPrice * item.quantity), 0) || 0
  );

export const useWishlistItems = () => useStore((state) => state.wishlist.items || []);
export const useWishlistCount = () =>
  useStore((state) => state.wishlist.items?.length || 0);
export const useIsWishlisted = (productId: string) =>
  useStore((state) => state.wishlist.items?.some(item => item.id === productId) || false);

export const useUser = () => useStore((state) => state.auth.user);
export const useIsAuthenticated = () =>
  useStore((state) => state.auth.isAuthenticated);
export const useAuthLoading = () => useStore((state) => state.auth.isLoading);

// Legacy compatibility - for backward compatibility with existing components
export const useCartStore = useStore;
