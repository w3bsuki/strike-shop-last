"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { medusaClient } from "@/lib/medusa" // Import the Medusa client

// Type definitions for Medusa cart items
type MedusaLineItem = {
  id: string
  title: string
  unit_price: number
  quantity: number
  thumbnail?: string
  variant: {
    id: string
    title: string
    sku?: string
    original_price?: number
    product: {
      handle: string
    }
  }
}

type MedusaCart = {
  id: string
  items?: MedusaLineItem[]
}

export type CartItem = {
  id: string // Medusa product variant ID
  name: string
  price: string // Formatted price string
  originalPrice?: string
  image: string
  slug: string
  size: string
  quantity: number
  sku?: string
}

type CartStore = {
  items: CartItem[]
  isOpen: boolean
  medusaCartId: string | null // Store Medusa's cart ID
  isLoading: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (
    item: Omit<CartItem, "id" | "price" | "originalPrice"> & {
      variantId: string
      unitPrice: number
      originalUnitPrice?: number
    },
  ) => Promise<void>
  updateQuantity: (variantId: string, size: string, quantity: number) => Promise<void>
  removeItem: (variantId: string, size: string) => Promise<void>
  clearCart: () => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
  initializeCart: () => Promise<void> // New function to initialize cart from Medusa
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      medusaCartId: null,
      isLoading: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      initializeCart: async () => {
        set({ isLoading: true })
        try {
          let cartId = get().medusaCartId
          let medusaCart

          if (cartId) {
            try {
              // Attempt to retrieve existing cart
              const { cart } = await medusaClient.carts.retrieve(cartId)
              medusaCart = cart
            } catch (error) {
              console.error("Failed to retrieve existing cart, creating new one:", error)
              cartId = null // Force creation of a new cart if retrieval fails
            }
          }

          if (!cartId || !medusaCart) {
            // Create a new cart if none exists or retrieval failed
            const { cart } = await medusaClient.carts.create()
            medusaCart = cart
            set({ medusaCartId: cart.id })
          }

          // Map Medusa cart items to our CartItem type
          const newItems: CartItem[] =
            medusaCart.items?.map((item: MedusaLineItem) => ({
              id: item.variant.id,
              name: item.title,
              price: `£${(item.unit_price / 100).toFixed(2)}`, // Medusa prices are in cents
              originalPrice: item.variant.original_price && `£${(item.variant.original_price / 100).toFixed(2)}`,
              image: item.thumbnail || "/placeholder.svg", // Assuming thumbnail exists
              slug: item.variant.product.handle, // Medusa uses handle for product slug
              size: item.variant.title, // Assuming variant title is the size
              quantity: item.quantity,
              sku: item.variant.sku,
            })) || []

          set({ items: newItems })
        } catch (error) {
          console.error("Error initializing cart:", error)
          // Optionally clear cart state if initialization fails
          set({ items: [], medusaCartId: null })
        } finally {
          set({ isLoading: false })
        }
      },

      addItem: async ({ variantId, unitPrice, originalUnitPrice, ...itemData }) => {
        set({ isLoading: true })
        const { medusaCartId } = get()

        try {
          let cart = null
          if (medusaCartId) {
            const { cart: existingCart } = await medusaClient.carts.retrieve(medusaCartId)
            cart = existingCart
          } else {
            const { cart: newCart } = await medusaClient.carts.create()
            set({ medusaCartId: newCart.id })
            cart = newCart
          }

          const { cart: updatedCart } = await medusaClient.carts.lineItems.create(cart.id, {
            variant_id: variantId,
            quantity: itemData.quantity,
          })

          const newItems: CartItem[] =
            updatedCart.items?.map((item: MedusaLineItem) => ({
              id: item.variant.id,
              name: item.title,
              price: `£${(item.unit_price / 100).toFixed(2)}`,
              originalPrice: item.variant.original_price && `£${(item.variant.original_price / 100).toFixed(2)}`,
              image: item.thumbnail || "/placeholder.svg",
              slug: item.variant.product.handle,
              size: item.variant.title,
              quantity: item.quantity,
              sku: item.variant.sku,
            })) || []

          set({ items: newItems })
        } catch (error) {
          console.error("Error adding item to cart:", error)
        } finally {
          set({ isLoading: false })
        }
      },

      updateQuantity: async (variantId, size, quantity) => {
        set({ isLoading: true })
        const { medusaCartId } = get()

        if (!medusaCartId) {
          console.error("No Medusa cart ID found to update quantity.")
          set({ isLoading: false })
          return
        }

        try {
          // First retrieve the cart to get the correct line item ID
          const { cart } = await medusaClient.carts.retrieve(medusaCartId)
          
          // Find the line item by variant ID and size
          const lineItem = cart.items?.find((item: MedusaLineItem) => 
            item.variant.id === variantId && item.variant.title === size
          )
          
          if (!lineItem) {
            console.error("Item not found in cart to update quantity.")
            set({ isLoading: false })
            return
          }

          const { cart: updatedCart } = await medusaClient.carts.lineItems.update(
            medusaCartId,
            lineItem.id, // Use the actual line item ID from Medusa
            { quantity },
          )

          const newItems: CartItem[] =
            updatedCart.items?.map((item: MedusaLineItem) => ({
              id: item.variant.id,
              name: item.title,
              price: `£${(item.unit_price / 100).toFixed(2)}`,
              originalPrice: item.variant.original_price && `£${(item.variant.original_price / 100).toFixed(2)}`,
              image: item.thumbnail || "/placeholder.svg",
              slug: item.variant.product.handle,
              size: item.variant.title,
              quantity: item.quantity,
              sku: item.variant.sku,
            })) || []

          set({ items: newItems })
        } catch (error) {
          console.error("Error updating item quantity:", error)
        } finally {
          set({ isLoading: false })
        }
      },

      removeItem: async (variantId, size) => {
        set({ isLoading: true })
        const { medusaCartId } = get()

        if (!medusaCartId) {
          console.error("No Medusa cart ID found to remove item.")
          set({ isLoading: false })
          return
        }

        try {
          // First retrieve the cart to get the correct line item ID
          const { cart } = await medusaClient.carts.retrieve(medusaCartId)
          
          // Find the line item by variant ID and size
          const lineItem = cart.items?.find((item: MedusaLineItem) => 
            item.variant.id === variantId && item.variant.title === size
          )
          
          if (!lineItem) {
            console.error("Item not found in cart to remove.")
            set({ isLoading: false })
            return
          }

          const { cart: updatedCart } = await medusaClient.carts.lineItems.delete(
            medusaCartId,
            lineItem.id, // Use the actual line item ID from Medusa
          )

          const newItems: CartItem[] =
            updatedCart.items?.map((item: MedusaLineItem) => ({
              id: item.variant.id,
              name: item.title,
              price: `£${(item.unit_price / 100).toFixed(2)}`,
              originalPrice: item.variant.original_price && `£${(item.variant.original_price / 100).toFixed(2)}`,
              image: item.thumbnail || "/placeholder.svg",
              slug: item.variant.product.handle,
              size: item.variant.title,
              quantity: item.quantity,
              sku: item.variant.sku,
            })) || []

          set({ items: newItems })
        } catch (error) {
          console.error("Error removing item from cart:", error)
        } finally {
          set({ isLoading: false })
        }
      },

      clearCart: async () => {
        set({ isLoading: true })
        const { medusaCartId } = get()

        if (medusaCartId) {
          try {
            // Clear all items from the cart by removing each item individually
            const { cart } = await medusaClient.carts.retrieve(medusaCartId)
            if (cart.items) {
              for (const item of cart.items) {
                await medusaClient.carts.lineItems.delete(medusaCartId, item.id)
              }
            }
            set({ items: [], medusaCartId: null })
          } catch (error) {
            console.error("Error clearing Medusa cart:", error)
          }
        } else {
          set({ items: [], medusaCartId: null })
        }
        set({ isLoading: false })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        // This will need to be updated to use Medusa's calculated total
        // For now, it sums client-side prices (which are strings)
        return get().items.reduce((total, item) => {
          const price = Number.parseFloat(item.price.replace(/[^0-9.]/g, ""))
          return total + price * item.quantity
        }, 0)
      },
    }),
    {
      name: "strike-cart",
      partialize: (state) => ({
        items: state.items,
        medusaCartId: state.medusaCartId, // Persist the Medusa cart ID
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, initialize the cart from Medusa
        if (state) {
          state.initializeCart()
        }
      },
    },
  ),
)
