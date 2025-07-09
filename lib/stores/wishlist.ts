import { useStore } from '.';
import type { WishlistItem } from '@/types/store';

// Simple facade for wishlist store that matches production-card expectations
export const useWishlistStore = () => {
  const wishlist = useStore((state) => state.wishlist);
  const actions = useStore((state) => state.actions.wishlist);

  return {
    items: wishlist.items,
    toggleItem: (item: {
      id: string;
      name: string;
      price: string;
      image: string;
      slug: string;
    }) => {
      const existingItem = wishlist.items.find(i => i.id === item.id);
      if (existingItem) {
        actions.removeFromWishlist(item.id);
      } else {
        // Convert to WishlistItem format
        const wishlistItem: WishlistItem = {
          id: item.id as any,
          productId: item.id as any,
          variantId: 'default' as any,
          title: item.name,
          image: item.image as any,
          price: parseFloat(item.price.replace('$', '')),
          addedAt: Date.now(),
        };
        actions.addToWishlist(wishlistItem);
      }
    },
    isInWishlist: (id: string) => wishlist.items.some(item => item.id === id),
  };
};