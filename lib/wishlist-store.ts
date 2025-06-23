import { useStore } from './stores';

// Re-export the WishlistItem interface for backward compatibility
export interface WishlistItem {
  id: string;
  name: string;
  price: string;
  image: string;
  slug: string;
}

interface WishlistStore {
  // State
  wishlist: WishlistItem[];

  // Actions
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getWishlistCount: () => number;
}

// Create a facade that maintains the exact same API as the original store
export const useWishlistStore = (): WishlistStore => {
  const wishlist = useStore((state) => state.wishlist);
  const actions = useStore((state) => state.actions.wishlist);

  return {
    // State
    wishlist: wishlist.items,

    // Actions - all delegated to the unified store
    addToWishlist: actions.addToWishlist,
    removeFromWishlist: actions.removeFromWishlist,
    isInWishlist: actions.isInWishlist,
    clearWishlist: actions.clearWishlist,
    getWishlistCount: actions.getWishlistCount,
  };
};

// Selector hooks for better performance - now using the unified store
export const useWishlistCount = () =>
  useStore((state) => state.wishlist.items.length);
export const useIsWishlisted = (productId: string) =>
  useStore((state) => state.actions.wishlist.isInWishlist(productId));
export const useWishlistItems = () => useStore((state) => state.wishlist.items);
