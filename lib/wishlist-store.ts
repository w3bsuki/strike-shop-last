// Legacy compatibility export for wishlist store
// This file provides backward compatibility for components still importing @/lib/wishlist-store
// New components should use @/lib/stores for the unified store

import { useStore } from './stores';

export const useWishlistStore = () => {
  const wishlist = useStore((state) => state.wishlist);
  const actions = useStore((state) => state.actions.wishlist);
  
  return {
    ...wishlist,
    ...actions,
  };
};

export { 
  useWishlistActions,
  useWishlistItems,
  useWishlistCount,
  useIsWishlisted
} from './stores';

// Export types
export type { WishlistItem } from '@/types/store';