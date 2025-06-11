import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface WishlistItem {
  id: string
  name: string
  price: string
  image: string
  slug: string
}

interface WishlistStore {
  wishlist: WishlistItem[]
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (id: string) => void
  clearWishlist: () => void
  isInWishlist: (id: string) => boolean
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      wishlist: [],
      addToWishlist: (item) =>
        set((state) => {
          const exists = state.wishlist.some((wishlistItem) => wishlistItem.id === item.id)
          if (exists) return state
          return { wishlist: [...state.wishlist, item] }
        }),
      removeFromWishlist: (id) =>
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== id),
        })),
      clearWishlist: () => set({ wishlist: [] }),
      isInWishlist: (id) => {
        const state = get()
        return state.wishlist?.some((item) => item.id === id) || false
      },
    }),
    {
      name: "strike-wishlist",
      // Add error handling for localStorage
      onRehydrateStorage: () => (state) => {
        // Ensure wishlist is always an array
        if (state && !state.wishlist) {
          return { ...state, wishlist: [] }
        }
        return state
      },
    },
  ),
)
