"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { medusaClient } from "@/lib/medusa"
import { toast } from "@/hooks/use-toast"

// Enhanced type definitions for Medusa integration
type MedusaLineItem = {
  id: string // Line item ID (needed for updates/deletes)
  cart_id: string
  order_id?: string
  title: string
  description?: string
  thumbnail?: string
  unit_price: number
  quantity: number
  subtotal?: number
  total?: number
  original_total?: number
  discount_total?: number
  variant: {
    id: string
    title: string
    sku?: string
    barcode?: string
    ean?: string
    upc?: string
    inventory_quantity?: number
    allow_backorder?: boolean
    manage_inventory?: boolean
    product: {
      id: string
      title: string
      handle: string
      thumbnail?: string
      images?: Array<{ url: string }>
    }
    prices?: Array<{
      amount: number
      currency_code: string
      min_quantity?: number
      max_quantity?: number
    }>
    original_price?: number
    calculated_price?: number
  }
  adjustments?: Array<{
    amount: number
    discount_code?: string
    description?: string
  }>
  metadata?: Record<string, any>
}

type MedusaCart = {
  id: string
  email?: string
  billing_address_id?: string
  billing_address?: any
  shipping_address_id?: string
  shipping_address?: any
  region_id?: string
  region?: {
    id: string
    name: string
    currency_code: string
    tax_rate: number
  }
  country_code?: string
  gift_cards?: any[]
  discounts?: any[]
  items?: MedusaLineItem[]
  payment_sessions?: any[]
  payment?: any
  shipping_methods?: any[]
  type?: "default" | "swap" | "draft_order" | "payment_link" | "claim"
  completed_at?: string
  payment_authorized_at?: string
  idempotency_key?: string
  context?: Record<string, any>
  metadata?: Record<string, any>
  sales_channel_id?: string
  sales_channel?: any
  subtotal?: number
  discount_total?: number
  gift_card_total?: number
  tax_total?: number
  shipping_total?: number
  total?: number
}

export type CartItem = {
  lineItemId: string // Medusa line item ID (for updates/deletes)
  variantId: string // Product variant ID
  productId: string // Product ID
  name: string
  description?: string
  price: number // Raw price in smallest currency unit
  formattedPrice: string // Formatted price string
  originalPrice?: number
  formattedOriginalPrice?: string
  image: string
  slug: string
  size: string
  quantity: number
  sku?: string
  inventory?: number
  allowBackorder?: boolean
  subtotal: number
  formattedSubtotal: string
  discounts?: Array<{
    code: string
    amount: number
  }>
}

type CartStore = {
  // State
  cart: MedusaCart | null
  items: CartItem[]
  isOpen: boolean
  isLoading: boolean
  error: string | null
  
  // Cart info getters
  getSubtotal: () => number
  getDiscountTotal: () => number
  getTaxTotal: () => number
  getShippingTotal: () => number
  getTotal: () => number
  getTotalItems: () => number
  getCurrency: () => string
  
  // Actions
  openCart: () => void
  closeCart: () => void
  initializeCart: () => Promise<void>
  addItem: (variantId: string, quantity?: number, metadata?: Record<string, any>) => Promise<void>
  updateQuantity: (lineItemId: string, quantity: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  applyDiscount: (code: string) => Promise<void>
  removeDiscount: (code: string) => Promise<void>
  updateCart: (updates: Partial<MedusaCart>) => Promise<void>
  refreshCart: () => Promise<void>
  
  // Checkout process
  setEmail: (email: string) => Promise<void>
  setAddresses: (shipping: any, billing?: any) => Promise<void>
  selectShippingMethod: (optionId: string) => Promise<void>
  createPaymentSession: () => Promise<void>
  completeCart: (paymentDetails?: any) => Promise<{ order: any } | null>
}

// Helper function to format currency
const formatCurrency = (amount: number, currencyCode: string = "GBP"): string => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode,
  }).format(amount / 100) // Convert from cents to currency units
}

// Helper function to map Medusa items to our format
const mapMedusaItemToCartItem = (item: MedusaLineItem, currencyCode: string = "GBP"): CartItem => ({
  lineItemId: item.id,
  variantId: item.variant.id,
  productId: item.variant.product.id,
  name: item.title,
  description: item.description,
  price: item.unit_price,
  formattedPrice: formatCurrency(item.unit_price, currencyCode),
  originalPrice: item.variant.original_price,
  formattedOriginalPrice: item.variant.original_price 
    ? formatCurrency(item.variant.original_price, currencyCode)
    : undefined,
  image: item.thumbnail || item.variant.product.thumbnail || "/placeholder.svg",
  slug: item.variant.product.handle,
  size: item.variant.title,
  quantity: item.quantity,
  sku: item.variant.sku,
  inventory: item.variant.inventory_quantity,
  allowBackorder: item.variant.allow_backorder,
  subtotal: item.subtotal || item.unit_price * item.quantity,
  formattedSubtotal: formatCurrency(item.subtotal || item.unit_price * item.quantity, currencyCode),
  discounts: item.adjustments?.map(adj => ({
    code: adj.discount_code || "discount",
    amount: adj.amount,
  })),
})

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: null,
      items: [],
      isOpen: false,
      isLoading: false,
      error: null,
      
      // Getters
      getSubtotal: () => get().cart?.subtotal || 0,
      getDiscountTotal: () => get().cart?.discount_total || 0,
      getTaxTotal: () => get().cart?.tax_total || 0,
      getShippingTotal: () => get().cart?.shipping_total || 0,
      getTotal: () => get().cart?.total || 0,
      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getCurrency: () => get().cart?.region?.currency_code || "GBP",
      
      // UI Actions
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      
      // Cart initialization
      initializeCart: async () => {
        set({ isLoading: true, error: null })
        try {
          const cartId = localStorage.getItem("medusa_cart_id")
          let cart: MedusaCart
          
          if (cartId) {
            try {
              const { cart: existingCart } = await medusaClient.carts.retrieve(cartId)
              cart = existingCart
            } catch (error) {
              // Cart not found or expired, create new one
              const { cart: newCart } = await medusaClient.carts.create({
                region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID,
              })
              cart = newCart
              localStorage.setItem("medusa_cart_id", cart.id)
            }
          } else {
            // Create new cart
            const { cart: newCart } = await medusaClient.carts.create({
              region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID,
            })
            cart = newCart
            localStorage.setItem("medusa_cart_id", cart.id)
          }
          
          const items = cart.items?.map(item => 
            mapMedusaItemToCartItem(item, cart.region?.currency_code)
          ) || []
          
          set({ cart, items })
        } catch (error) {
          console.error("Failed to initialize cart:", error)
          set({ error: "Failed to initialize cart" })
          toast({
            title: "Cart Error",
            description: "Failed to initialize your cart. Please refresh the page.",
            variant: "destructive",
          })
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Add item to cart
      addItem: async (variantId: string, quantity: number = 1, metadata?: Record<string, any>) => {
        set({ isLoading: true, error: null })
        try {
          let { cart } = get()
          
          // Initialize cart if not exists
          if (!cart) {
            await get().initializeCart()
            cart = get().cart
          }
          
          if (!cart) throw new Error("Failed to create cart")
          
          // Add line item
          const { cart: updatedCart } = await medusaClient.carts.lineItems.create(cart.id, {
            variant_id: variantId,
            quantity,
            metadata,
          })
          
          const items = updatedCart.items?.map(item => 
            mapMedusaItemToCartItem(item, updatedCart.region?.currency_code)
          ) || []
          
          set({ cart: updatedCart, items })
          
          toast({
            title: "Added to cart",
            description: "Item has been added to your cart.",
          })
          
          // Open cart drawer
          get().openCart()
        } catch (error) {
          console.error("Failed to add item to cart:", error)
          set({ error: "Failed to add item to cart" })
          toast({
            title: "Error",
            description: "Failed to add item to cart. Please try again.",
            variant: "destructive",
          })
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Update item quantity
      updateQuantity: async (lineItemId: string, quantity: number) => {
        if (quantity < 1) {
          return get().removeItem(lineItemId)
        }
        
        set({ isLoading: true, error: null })
        try {
          const { cart } = get()
          if (!cart) throw new Error("No cart found")
          
          const { cart: updatedCart } = await medusaClient.carts.lineItems.update(
            cart.id,
            lineItemId,
            { quantity }
          )
          
          const items = updatedCart.items?.map(item => 
            mapMedusaItemToCartItem(item, updatedCart.region?.currency_code)
          ) || []
          
          set({ cart: updatedCart, items })
        } catch (error) {
          console.error("Failed to update item quantity:", error)
          set({ error: "Failed to update quantity" })
          toast({
            title: "Error",
            description: "Failed to update item quantity. Please try again.",
            variant: "destructive",
          })
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Remove item from cart
      removeItem: async (lineItemId: string) => {
        set({ isLoading: true, error: null })
        try {
          const { cart } = get()
          if (!cart) throw new Error("No cart found")
          
          const { cart: updatedCart } = await medusaClient.carts.lineItems.delete(
            cart.id,
            lineItemId
          )
          
          const items = updatedCart.items?.map(item => 
            mapMedusaItemToCartItem(item, updatedCart.region?.currency_code)
          ) || []
          
          set({ cart: updatedCart, items })
          
          toast({
            title: "Removed from cart",
            description: "Item has been removed from your cart.",
          })
        } catch (error) {
          console.error("Failed to remove item from cart:", error)
          set({ error: "Failed to remove item" })
          toast({
            title: "Error",
            description: "Failed to remove item from cart. Please try again.",
            variant: "destructive",
          })
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Clear entire cart
      clearCart: async () => {
        set({ isLoading: true, error: null })
        try {
          // Create new cart (Medusa doesn't have a clear endpoint)
          const { cart: newCart } = await medusaClient.carts.create({
            region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID,
          })
          
          localStorage.setItem("medusa_cart_id", newCart.id)
          set({ cart: newCart, items: [] })
          
          toast({
            title: "Cart cleared",
            description: "All items have been removed from your cart.",
          })
        } catch (error) {
          console.error("Failed to clear cart:", error)
          set({ error: "Failed to clear cart" })
          toast({
            title: "Error",
            description: "Failed to clear cart. Please try again.",
            variant: "destructive",
          })
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Apply discount code
      applyDiscount: async (code: string) => {
        set({ isLoading: true, error: null })
        try {
          const { cart } = get()
          if (!cart) throw new Error("No cart found")
          
          const { cart: updatedCart } = await medusaClient.carts.update(cart.id, {
            discounts: [{ code }],
          })
          
          const items = updatedCart.items?.map(item => 
            mapMedusaItemToCartItem(item, updatedCart.region?.currency_code)
          ) || []
          
          set({ cart: updatedCart, items })
          
          toast({
            title: "Discount applied",
            description: `Discount code "${code}" has been applied.`,
          })
        } catch (error) {
          console.error("Failed to apply discount:", error)
          set({ error: "Failed to apply discount" })
          toast({
            title: "Error",
            description: "Invalid discount code. Please try again.",
            variant: "destructive",
          })
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Remove discount
      removeDiscount: async (code: string) => {
        set({ isLoading: true, error: null })
        try {
          const { cart } = get()
          if (!cart) throw new Error("No cart found")
          
          const { cart: updatedCart } = await medusaClient.carts.deleteDiscount(cart.id, code)
          
          const items = updatedCart.items?.map(item => 
            mapMedusaItemToCartItem(item, updatedCart.region?.currency_code)
          ) || []
          
          set({ cart: updatedCart, items })
        } catch (error) {
          console.error("Failed to remove discount:", error)
          set({ error: "Failed to remove discount" })
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Update cart details
      updateCart: async (updates: Partial<MedusaCart>) => {
        set({ isLoading: true, error: null })
        try {
          const { cart } = get()
          if (!cart) throw new Error("No cart found")
          
          const { cart: updatedCart } = await medusaClient.carts.update(cart.id, updates)
          
          const items = updatedCart.items?.map(item => 
            mapMedusaItemToCartItem(item, updatedCart.region?.currency_code)
          ) || []
          
          set({ cart: updatedCart, items })
        } catch (error) {
          console.error("Failed to update cart:", error)
          set({ error: "Failed to update cart" })
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Refresh cart from server
      refreshCart: async () => {
        const { cart } = get()
        if (!cart) return
        
        set({ isLoading: true, error: null })
        try {
          const { cart: refreshedCart } = await medusaClient.carts.retrieve(cart.id)
          
          const items = refreshedCart.items?.map(item => 
            mapMedusaItemToCartItem(item, refreshedCart.region?.currency_code)
          ) || []
          
          set({ cart: refreshedCart, items })
        } catch (error) {
          console.error("Failed to refresh cart:", error)
          set({ error: "Failed to refresh cart" })
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Checkout process methods
      setEmail: async (email: string) => {
        return get().updateCart({ email })
      },
      
      setAddresses: async (shipping: any, billing?: any) => {
        return get().updateCart({
          shipping_address: shipping,
          billing_address: billing || shipping,
        })
      },
      
      selectShippingMethod: async (optionId: string) => {
        set({ isLoading: true, error: null })
        try {
          const { cart } = get()
          if (!cart) throw new Error("No cart found")
          
          const { cart: updatedCart } = await medusaClient.carts.addShippingMethod(cart.id, {
            option_id: optionId,
          })
          
          const items = updatedCart.items?.map(item => 
            mapMedusaItemToCartItem(item, updatedCart.region?.currency_code)
          ) || []
          
          set({ cart: updatedCart, items })
        } catch (error) {
          console.error("Failed to select shipping method:", error)
          set({ error: "Failed to select shipping method" })
        } finally {
          set({ isLoading: false })
        }
      },
      
      createPaymentSession: async () => {
        set({ isLoading: true, error: null })
        try {
          const { cart } = get()
          if (!cart) throw new Error("No cart found")
          
          const { cart: updatedCart } = await medusaClient.carts.createPaymentSessions(cart.id)
          
          const items = updatedCart.items?.map(item => 
            mapMedusaItemToCartItem(item, updatedCart.region?.currency_code)
          ) || []
          
          set({ cart: updatedCart, items })
        } catch (error) {
          console.error("Failed to create payment session:", error)
          set({ error: "Failed to create payment session" })
        } finally {
          set({ isLoading: false })
        }
      },
      
      completeCart: async (paymentDetails?: any) => {
        set({ isLoading: true, error: null })
        try {
          const { cart } = get()
          if (!cart) throw new Error("No cart found")
          
          const { type, data } = await medusaClient.carts.complete(cart.id, paymentDetails)
          
          if (type === "order") {
            // Clear cart after successful order
            localStorage.removeItem("medusa_cart_id")
            set({ cart: null, items: [] })
            
            toast({
              title: "Order placed!",
              description: `Your order #${data.id} has been confirmed.`,
            })
            
            return { order: data }
          }
          
          return null
        } catch (error) {
          console.error("Failed to complete cart:", error)
          set({ error: "Failed to complete order" })
          toast({
            title: "Error",
            description: "Failed to complete your order. Please try again.",
            variant: "destructive",
          })
          return null
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: "strike-cart",
      partialize: (state) => ({
        // Only persist cart ID, fetch full cart on init
        cart: state.cart ? { id: state.cart.id } : null,
      }),
    }
  )
)

// Auto-initialize cart on first load
if (typeof window !== "undefined") {
  setTimeout(() => {
    useCartStore.getState().initializeCart()
  }, 0)
}