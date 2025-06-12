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

interface OptimisticUpdate {
  id: string
  type: 'add' | 'update' | 'remove'
  timestamp: number
  data?: any
}

type CartStore = {
  // State
  items: CartItem[]
  isOpen: boolean
  cartId: string | null
  isLoading: boolean
  error: string | null
  optimisticUpdates: OptimisticUpdate[]
  
  // Actions
  openCart: () => void
  closeCart: () => void
  clearError: () => void
  addItem: (item: {
    variantId: string
    productId: string
    name: string
    image: string
    slug: string
    size: string
    quantity: number
    sku?: string
    pricing: {
      currency: string
      unitPrice: number
      unitSalePrice?: number
      displayUnitPrice: string
      displayUnitSalePrice?: string
      totalPrice: number
      displayTotalPrice: string
    }
  }) => Promise<void>
  updateQuantity: (id: string, size: string, quantity: number) => Promise<void>
  removeItem: (id: string, size: string) => Promise<void>
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  syncCart: () => Promise<void>
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      cartId: null,
      isLoading: false,
      error: null,
      optimisticUpdates: [],

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      clearError: () => set({ error: null }),

      addItem: async (itemData) => {
        const optimisticId = `optimistic-${Date.now()}`
        
        // Optimistic update - add item immediately
        const optimisticItem: CartItem = {
          id: itemData.variantId,
          variantId: itemData.variantId,
          productId: itemData.productId,
          lineItemId: optimisticId,
          name: itemData.name,
          image: itemData.image,
          slug: itemData.slug,
          size: itemData.size,
          quantity: itemData.quantity,
          sku: itemData.sku,
          pricing: itemData.pricing,
        }

        // Check if item already exists
        const existingItem = get().items.find(
          item => item.variantId === itemData.variantId && item.size === itemData.size
        )

        if (existingItem) {
          // Update quantity optimistically
          set(state => ({
            items: state.items.map(item =>
              item.variantId === itemData.variantId && item.size === itemData.size
                ? { 
                    ...item, 
                    quantity: item.quantity + itemData.quantity,
                    pricing: {
                      ...item.pricing,
                      totalPrice: item.pricing.unitPrice * (item.quantity + itemData.quantity),
                      displayTotalPrice: `£${(item.pricing.unitPrice * (item.quantity + itemData.quantity)).toFixed(2)}`
                    }
                  }
                : item
            ),
            optimisticUpdates: [...state.optimisticUpdates, {
              id: optimisticId,
              type: 'update' as const,
              timestamp: Date.now(),
              data: { variantId: itemData.variantId, size: itemData.size, quantity: itemData.quantity }
            }]
          }))
        } else {
          // Add item optimistically
          set(state => ({
            items: [...state.items, optimisticItem],
            optimisticUpdates: [...state.optimisticUpdates, {
              id: optimisticId,
              type: 'add' as const,
              timestamp: Date.now(),
              data: optimisticItem
            }]
          }))
        }

        // Perform API call in background
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
            
            if (!createResponse.ok) {
              throw new Error('Failed to create cart')
            }
            
            const { cart } = await createResponse.json()
            currentCartId = cart.id
            set({ cartId: currentCartId })
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

          if (!addItemResponse.ok) {
            throw new Error('Failed to add item to cart')
          }

          // Sync cart to get real data
          await get().syncCart()
          
          // Remove optimistic update
          set(state => ({
            optimisticUpdates: state.optimisticUpdates.filter(u => u.id !== optimisticId)
          }))
        } catch (error) {
          // Rollback optimistic update on error
          if (existingItem) {
            set(state => ({
              items: state.items.map(item =>
                item.variantId === itemData.variantId && item.size === itemData.size
                  ? existingItem
                  : item
              ),
              error: error instanceof Error ? error.message : "Failed to add item to cart",
              optimisticUpdates: state.optimisticUpdates.filter(u => u.id !== optimisticId)
            }))
          } else {
            set(state => ({
              items: state.items.filter(item => item.lineItemId !== optimisticId),
              error: error instanceof Error ? error.message : "Failed to add item to cart",
              optimisticUpdates: state.optimisticUpdates.filter(u => u.id !== optimisticId)
            }))
          }
        }
      },

      updateQuantity: async (id, size, quantity) => {
        const items = get().items
        const item = items.find(i => i.id === id && i.size === size)
        
        if (!item || !item.lineItemId || item.lineItemId.startsWith('optimistic-')) return

        // Optimistic update
        const previousQuantity = item.quantity
        set(state => ({
          items: state.items.map(i => 
            i.id === id && i.size === size 
              ? { 
                  ...i, 
                  quantity: Math.max(0, quantity),
                  pricing: {
                    ...i.pricing,
                    totalPrice: i.pricing.unitPrice * Math.max(0, quantity),
                    displayTotalPrice: `£${(i.pricing.unitPrice * Math.max(0, quantity)).toFixed(2)}`
                  }
                }
              : i
          ).filter(i => i.quantity > 0)
        }))

        try {
          const cartId = get().cartId
          if (!cartId) throw new Error('No cart found')

          if (quantity === 0) {
            // Delete item
            await fetch(`${MEDUSA_API_URL}/store/carts/${cartId}/line-items/${item.lineItemId}`, {
              method: 'DELETE',
              headers: {
                'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
              }
            })
          } else {
            // Update quantity
            await fetch(`${MEDUSA_API_URL}/store/carts/${cartId}/line-items/${item.lineItemId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
              },
              body: JSON.stringify({ quantity })
            })
          }

          await get().syncCart()
        } catch (error) {
          // Rollback on error
          set(state => ({
            items: state.items.map(i => 
              i.id === id && i.size === size 
                ? { ...i, quantity: previousQuantity }
                : i
            ),
            error: error instanceof Error ? error.message : "Failed to update quantity"
          }))
        }
      },

      removeItem: async (id, size) => {
        const items = get().items
        const item = items.find(i => i.id === id && i.size === size)
        
        if (!item || !item.lineItemId || item.lineItemId.startsWith('optimistic-')) {
          // Just remove optimistic items
          set(state => ({
            items: state.items.filter(i => !(i.id === id && i.size === size))
          }))
          return
        }

        // Optimistic removal
        set(state => ({
          items: state.items.filter(i => !(i.id === id && i.size === size))
        }))

        try {
          const cartId = get().cartId
          if (!cartId) throw new Error('No cart found')

          await fetch(`${MEDUSA_API_URL}/store/carts/${cartId}/line-items/${item.lineItemId}`, {
            method: 'DELETE',
            headers: {
              'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
            }
          })

          await get().syncCart()
        } catch (error) {
          // Restore item on error
          set(state => ({
            items: [...state.items, item],
            error: error instanceof Error ? error.message : "Failed to remove item"
          }))
        }
      },

      clearCart: async () => {
        const cartId = get().cartId
        
        // Clear optimistically
        set({ items: [], cartId: null })

        if (cartId) {
          try {
            // Delete cart on server
            await fetch(`${MEDUSA_API_URL}/store/carts/${cartId}`, {
              method: 'DELETE',
              headers: {
                'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
              }
            })
          } catch (error) {
            console.error('Failed to delete cart:', error)
          }
        }
      },

      syncCart: async () => {
        const cartId = get().cartId
        if (!cartId) return

        set({ isLoading: true })
        
        try {
          const response = await fetch(
            `${MEDUSA_API_URL}/store/carts/${cartId}?fields=*items.variant,*items.variant.product`,
            {
              headers: {
                'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
              }
            }
          )

          if (!response.ok) {
            throw new Error('Failed to fetch cart')
          }

          const { cart } = await response.json()
          
          // Convert to CartItem format
          const newItems: CartItem[] = cart.items?.map((item: MedusaLineItem) => ({
            id: item.variant_id,
            variantId: item.variant_id,
            productId: item.variant?.product_id || '',
            lineItemId: item.id,
            name: item.title,
            pricing: {
              currency: 'GBP',
              unitPrice: item.unit_price / 100,
              unitSalePrice: item.variant?.original_price ? (item.variant.original_price / 100) : undefined,
              displayUnitPrice: `£${(item.unit_price / 100).toFixed(2)}`,
              displayUnitSalePrice: item.variant?.original_price ? `£${(item.variant.original_price / 100).toFixed(2)}` : undefined,
              totalPrice: (item.unit_price * item.quantity) / 100,
              displayTotalPrice: `£${((item.unit_price * item.quantity) / 100).toFixed(2)}`,
            },
            image: item.thumbnail || '/placeholder.svg',
            slug: item.variant?.product?.handle || '',
            size: item.variant?.title || '',
            quantity: item.quantity,
            sku: item.variant?.sku,
          })) || []

          set({ items: newItems, error: null })
        } catch (error) {
          console.error("Error syncing cart:", error)
          set({ error: error instanceof Error ? error.message : "Failed to sync cart" })
        } finally {
          set({ isLoading: false })
        }
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
      name: "strike-cart-optimized",
      partialize: (state) => ({
        items: state.items,
        cartId: state.cartId,
      }),
    }
  )
)