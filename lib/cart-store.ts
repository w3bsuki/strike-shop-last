"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { MedusaCart, MedusaLineItem } from "@/types/medusa"
import type { IntegratedCartItem } from "@/types/integrated"

const MEDUSA_API_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:8000"
const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "reg_01JXFMWZWX24XQD1BYNTS3N15Q"
const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

if (!MEDUSA_PUBLISHABLE_KEY && typeof window !== 'undefined') {
  console.error('Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY environment variable')
}

export type CartItem = IntegratedCartItem

// Helper function to convert MedusaLineItem to IntegratedCartItem
const convertMedusaItemToCartItem = (item: MedusaLineItem, fallbackImage?: string, fallbackSlug?: string, fallbackSize?: string): CartItem => ({
  id: `${item.variant_id}-${item.variant?.title || 'default'}`, // Unique local identifier
  lineItemId: item.id, // Medusa line item ID for API calls
  productId: item.variant?.product?.id || '', // Product ID
  variantId: item.variant_id || '', // Variant ID
  name: item.title,
  image: item.thumbnail || fallbackImage || '',
  slug: item.variant?.product?.handle || fallbackSlug || '',
  size: item.variant?.title || fallbackSize || '',
  quantity: item.quantity,
  sku: item.variant?.sku || undefined,
  pricing: {
    currency: 'EUR',
    unitPrice: item.unit_price / 100,
    unitSalePrice: item.variant?.original_price ? (item.variant.original_price / 100) : undefined,
    displayUnitPrice: `€${(item.unit_price / 100).toFixed(2)}`,
    displayUnitSalePrice: item.variant?.original_price ? `€${(item.variant.original_price / 100).toFixed(2)}` : undefined,
    totalPrice: (item.unit_price * item.quantity) / 100,
    displayTotalPrice: `€${((item.unit_price * item.quantity) / 100).toFixed(2)}`,
  },
})

type CartStore = {
  items: CartItem[]
  isOpen: boolean
  cartId: string | null
  isLoading: boolean
  error: string | null
  openCart: () => void
  closeCart: () => void
  clearError: () => void
  addItem: (item: {
    variantId: string
    name: string
    image: string
    slug: string
    size: string
    quantity: number
    sku?: string
    unitPrice: number
    originalUnitPrice?: number
  }) => Promise<void>
  updateQuantity: (id: string, size: string, quantity: number) => Promise<void>
  removeItem: (id: string, size: string) => Promise<void>
  refreshCart: () => Promise<void>
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      cartId: null,
      isLoading: false,
      error: null,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      clearError: () => set({ error: null }),

      addItem: async (itemData) => {
        set({ isLoading: true })
        try {
          let currentCartId = get().cartId

          // Create cart if none exists
          if (!currentCartId) {
            const createResponse = await fetch(`${MEDUSA_API_URL}/store/carts`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
              },
              body: JSON.stringify({
                region_id: REGION_ID
              })
            })
            
            if (createResponse.ok) {
              const { cart } = await createResponse.json()
              currentCartId = cart.id
              set({ cartId: currentCartId })
            } else {
              throw new Error('Failed to create cart')
            }
          }

          // Add line item to cart
          const addItemResponse = await fetch(`${MEDUSA_API_URL}/store/carts/${currentCartId}/line-items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
            },
            body: JSON.stringify({
              variant_id: itemData.variantId,
              quantity: itemData.quantity
            })
          })

          if (addItemResponse.ok) {
            // Retrieve updated cart
            const cartResponse = await fetch(`${MEDUSA_API_URL}/store/carts/${currentCartId}?fields=*items.variant,*items.variant.product`, {
              headers: {
                'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
              }
            })
            
            if (cartResponse.ok) {
              const { cart } = await cartResponse.json()
              
              // Convert to CartItem format using helper function
              const newItems: CartItem[] = cart.items?.map((item: MedusaLineItem) => 
                convertMedusaItemToCartItem(item, itemData.image, itemData.slug, itemData.size)
              ) || []

              set({ items: newItems })
            }
          }
        } catch (error) {
          console.error("Error adding item to cart:", error)
          set({ error: error instanceof Error ? error.message : "Failed to add item to cart" })
        } finally {
          set({ isLoading: false })
        }
      },

      updateQuantity: async (id, size, quantity) => {
        const { cartId, items } = get()
        if (!cartId) {
          set({ error: "No cart found" })
          return
        }

        // Find the item to update
        const itemToUpdate = items.find(item => item.id === id && item.size === size)
        if (!itemToUpdate || !itemToUpdate.lineItemId) {
          set({ error: "Item not found" })
          return
        }

        const newQuantity = Math.max(0, quantity)
        
        // Optimistic update
        const optimisticItems = items.map(item => 
          item.id === id && item.size === size 
            ? { 
                ...item, 
                quantity: newQuantity,
                pricing: {
                  ...item.pricing,
                  totalPrice: item.pricing.unitPrice * newQuantity,
                  displayTotalPrice: `£${(item.pricing.unitPrice * newQuantity).toFixed(2)}`,
                }
              }
            : item
        ).filter(item => item.quantity > 0)
        
        set({ items: optimisticItems, isLoading: true })

        try {
          if (newQuantity === 0) {
            // Remove item if quantity is 0
            await get().removeItem(id, size)
            return
          }

          // Update quantity via Medusa API
          const response = await fetch(`${MEDUSA_API_URL}/store/carts/${cartId}/line-items/${itemToUpdate.lineItemId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
            },
            body: JSON.stringify({
              quantity: newQuantity
            })
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error('Cart update error:', response.status, errorText)
            throw new Error(`Failed to update cart: ${response.status} - ${errorText}`)
          }

          const { cart } = await response.json()
          // Update with real data from server
          const newItems: CartItem[] = cart.items?.map((item: MedusaLineItem) => 
            convertMedusaItemToCartItem(item)
          ) || []
          set({ items: newItems })
        } catch (error) {
          console.error("Error updating quantity:", error)
          // Rollback optimistic update
          set({ items, error: error instanceof Error ? error.message : "Failed to update quantity" })
        } finally {
          set({ isLoading: false })
        }
      },

      removeItem: async (id, size) => {
        const { cartId, items } = get()
        if (!cartId) {
          set({ error: "No cart found" })
          return
        }

        // Find the item to remove
        const itemToRemove = items.find(item => item.id === id && item.size === size)
        if (!itemToRemove || !itemToRemove.lineItemId) {
          set({ error: "Item not found" })
          return
        }

        // Optimistic update - remove item immediately
        const optimisticItems = items.filter(item => 
          !(item.id === id && item.size === size)
        )
        set({ items: optimisticItems, isLoading: true })

        try {
          // Remove item via Medusa API
          const response = await fetch(`${MEDUSA_API_URL}/store/carts/${cartId}/line-items/${itemToRemove.lineItemId}`, {
            method: 'DELETE',
            headers: {
              'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
            }
          })

          if (response.ok) {
            const { cart } = await response.json()
            // Update with real data from server
            const newItems: CartItem[] = cart.items?.map((item: MedusaLineItem) => 
              convertMedusaItemToCartItem(item)
            ) || []
            set({ items: newItems })
          } else {
            throw new Error(`Failed to remove item: ${response.status}`)
          }
        } catch (error) {
          console.error("Error removing item:", error)
          // Rollback optimistic update
          set({ items, error: error instanceof Error ? error.message : "Failed to remove item" })
        } finally {
          set({ isLoading: false })
        }
      },

      refreshCart: async () => {
        const { cartId } = get()
        if (!cartId) return

        set({ isLoading: true })
        try {
          const response = await fetch(`${MEDUSA_API_URL}/store/carts/${cartId}?fields=*items.variant,*items.variant.product`, {
            headers: {
              'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
            }
          })

          if (response.ok) {
            const { cart } = await response.json()
            const newItems: CartItem[] = cart.items?.map((item: MedusaLineItem) => 
              convertMedusaItemToCartItem(item)
            ) || []
            set({ items: newItems })
          } else {
            throw new Error(`Failed to refresh cart: ${response.status}`)
          }
        } catch (error) {
          console.error("Error refreshing cart:", error)
          set({ error: error instanceof Error ? error.message : "Failed to refresh cart" })
        } finally {
          set({ isLoading: false })
        }
      },

      clearCart: () => {
        set({ items: [], cartId: null })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + item.pricing.totalPrice
        }, 0)
      },
    }),
    {
      name: "strike-cart",
      partialize: (state) => ({
        items: state.items,
        cartId: state.cartId,
      }),
    }
  )
)