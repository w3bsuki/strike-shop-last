import type { StateCreator } from 'zustand';
import type {
  StoreState,
  WishlistSlice,
  WishlistActions,
  WishlistItem,
} from '../types';
import { toast } from 'sonner';

export const createWishlistSlice: StateCreator<
  StoreState,
  [],
  [],
  WishlistSlice & { actions: { wishlist: WishlistActions } }
> = (set, get) => ({
  // Initial state
  items: [],
  isLoading: false,

  actions: {
    wishlist: {
      // Add item to wishlist
      addToWishlist: (item: WishlistItem) => {
        const { wishlist } = get();

        // Check if item already exists
        if (wishlist.items.some((w) => w.id === item.id)) {
          toast.info('Item is already in your wishlist');
          return;
        }

        // Add item
        set((state) => ({
          wishlist: {
            ...state.wishlist,
            items: [...state.wishlist.items, item],
          },
        }));
        toast.success(`${item.name} added to wishlist`);
      },

      // Remove item from wishlist
      removeFromWishlist: (productId: string) => {
        const { wishlist } = get();
        const item = wishlist.items.find((w) => w.id === productId);

        set((state) => ({
          wishlist: {
            ...state.wishlist,
            items: state.wishlist.items.filter((w) => w.id !== productId),
          },
        }));

        if (item) {
          toast.success(`${item.name} removed from wishlist`);
        }
      },

      // Check if item is in wishlist
      isInWishlist: (productId: string) => {
        const { wishlist } = get();
        return wishlist.items.some((w) => w.id === productId);
      },

      // Clear entire wishlist
      clearWishlist: () => {
        set((state) => ({
          wishlist: {
            ...state.wishlist,
            items: [],
          },
        }));
        toast.success('Wishlist cleared');
      },

      // Get wishlist count
      getWishlistCount: () => {
        const { wishlist } = get();
        return wishlist.items.length;
      },
    },
  },
});
