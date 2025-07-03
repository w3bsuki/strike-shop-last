import { useStore } from '.';

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
        actions.addToWishlist(item);
      }
    },
    isInWishlist: (id: string) => wishlist.items.some(item => item.id === id),
  };
};