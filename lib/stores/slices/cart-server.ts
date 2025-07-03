import type { StateCreator } from 'zustand';
import type { StoreState, CartSlice, CartActions } from '../types';
import { cartEventEmitter } from '../../events';
import { toast } from '@/hooks/use-toast';
import { createLineItemId, createVariantId, createSlug, createImageURL, createPrice, createProductId, createQuantity } from '@/types/branded';
import { cartApi } from '@/lib/cart-api';
import type { ShopifyCart } from '@/lib/shopify/client';

const formatPrice = (amount: number, currencyCode: string = 'EUR') => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount / 100);
};

// Convert Shopify cart to our format
const convertShopifyCart = (shopifyCart: ShopifyCart) => {
  return shopifyCart.lines.edges.map(({ node }) => ({
    id: createProductId(node.merchandise.product.id),
    lineItemId: createLineItemId(node.id),
    variantId: createVariantId(node.merchandise.id),
    name: node.merchandise.product.title,
    slug: createSlug(node.merchandise.product.handle),
    size: node.merchandise.title || 'One Size',
    quantity: createQuantity(node.quantity),
    image: createImageURL(node.merchandise.image?.url || ''),
    pricing: {
      unitPrice: createPrice(Math.round(parseFloat(node.cost.totalAmount.amount) / node.quantity)),
      totalPrice: createPrice(Math.round(parseFloat(node.cost.totalAmount.amount))),
      displayUnitPrice: formatPrice(parseFloat(node.cost.totalAmount.amount) / node.quantity, node.cost.totalAmount.currencyCode),
      displayTotalPrice: formatPrice(parseFloat(node.cost.totalAmount.amount), node.cost.totalAmount.currencyCode),
    },
  }));
};

/**
 * Server-side cart slice that uses the new API routes
 * This is a drop-in replacement for the existing cart slice
 */
export const createServerCartSlice: StateCreator<
  StoreState,
  [],
  [],
  CartSlice & { actions: { cart: CartActions } }
> = (set, get) => ({
  // Initial state
  cartId: null,
  items: [],
  isOpen: false,
  isLoading: false,
  error: null,
  checkoutUrl: undefined,
  
  // Enhanced cart state (default values)
  bulkOperations: [],
  savedCarts: [],
  recommendations: [],
  inventoryStatus: [],
  taxEstimate: null,
  shareToken: null,
  shareExpiry: null,
  savedForLater: [],
  abandonmentTracking: {
    startTime: null,
    events: [],
  },

  actions: {
    cart: {
      // Initialize cart with server-side API
      initializeCart: async () => {
        set((state) => ({ 
          ...state, 
          cart: { ...state.cart, isLoading: true, error: null } 
        }));
        try {
          // Check for existing cart ID in localStorage
          const savedCartId = typeof window !== 'undefined' ? localStorage.getItem('strike-cart-id') : null;
          let cartData: ShopifyCart | null = null;
          
          if (savedCartId) {
            // Try to retrieve existing cart
            const response = await cartApi.getCart(savedCartId);
            if (response.success && response.data) {
              cartData = response.data;
            }
          }
          
          if (!cartData) {
            // Create new cart
            const response = await cartApi.createCart();
            if (response.success && response.data) {
              cartData = response.data;
              if (typeof window !== 'undefined') {
                localStorage.setItem('strike-cart-id', cartData.id);
              }
            }
          }
          
          if (cartData) {
            // Convert Shopify cart to our format
            const items = convertShopifyCart(cartData);
            
            set((state) => ({ 
              ...state, 
              cart: { 
                ...state.cart, 
                cartId: cartData!.id, 
                items, 
                isLoading: false,
                checkoutUrl: cartData!.checkoutUrl 
              } 
            }));
          } else {
            throw new Error('Failed to initialize cart');
          }
        } catch (error) {
          console.error('Failed to initialize cart:', error);
          set((state) => ({ 
            ...state, 
            cart: { ...state.cart, isLoading: false, error: 'Cart initialization failed' } 
          }));
        }
      },

      // Add item to cart using server-side API
      addItem: async (_productId: string, variantId: string, quantity: number = 1) => {
        set((state) => ({ 
          ...state, 
          cart: { ...state.cart, isLoading: true, error: null } 
        }));
        try {
          const state = get();
          let cartId = state.cart.cartId;
          
          // Create cart if it doesn't exist
          if (!cartId) {
            const createResponse = await cartApi.createCart();
            if (!createResponse.success || !createResponse.data) {
              throw new Error(createResponse.error || 'Failed to create cart');
            }
            cartId = createResponse.data.id;
            if (typeof window !== 'undefined') {
              localStorage.setItem('strike-cart-id', cartId);
            }
          }
          
          // Add item to cart using server API
          const response = await cartApi.addToCart(cartId, variantId, quantity);
          
          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to add item to cart');
          }
          
          const cartData = response.data;
          
          // Convert Shopify cart to our format
          const items = convertShopifyCart(cartData);
          
          set((state) => ({ 
            ...state, 
            cart: { 
              ...state.cart, 
              cartId,
              items, 
              isLoading: false,
              checkoutUrl: cartData.checkoutUrl
            } 
          }));
          
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('strike-cart', JSON.stringify({ cartId, items }));
          }
          
          // Find the item that was just added/updated
          const addedItem = items.find(item => item.variantId === createVariantId(variantId));
          if (addedItem) {
            cartEventEmitter.emit('item-added', {
              item: addedItem,
              timestamp: new Date(),
              source: 'user'
            });
          }
          
          // Show toast
          toast({
            title: "Added to cart",
            description: `${quantity} item${quantity > 1 ? 's' : ''} added to your cart`,
          });
        } catch (error) {
          console.error('Failed to add item:', error);
          set((state) => ({ 
            ...state, 
            cart: { ...state.cart, error: 'Failed to add item to cart', isLoading: false } 
          }));
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to add item to cart",
            variant: "destructive",
          });
        }
      },

      // Update item quantity using server-side API
      updateItemQuantity: async (itemId: string, quantity: number) => {
        set((state) => ({ 
          ...state, 
          cart: { ...state.cart, isLoading: true, error: null } 
        }));
        try {
          const state = get();
          const items = state.cart.items || [];
          const cartId = state.cart.cartId;
          
          if (!cartId) {
            throw new Error('No cart ID available');
          }
          
          // Find the item to get its line item ID
          const item = items.find(item => item.id === itemId);
          if (!item) {
            throw new Error('Item not found in cart');
          }
          
          let response;
          
          if (quantity === 0) {
            // Remove item using server API
            response = await cartApi.removeSingleItem(cartId, String(item.lineItemId));
          } else {
            // Update quantity using server API
            response = await cartApi.updateCart(cartId, String(item.lineItemId), quantity);
          }
          
          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to update cart');
          }
          
          const cartData = response.data;
          
          // Convert Shopify cart to our format
          const newItems = convertShopifyCart(cartData);
          
          set((state) => ({ 
            ...state, 
            cart: { 
              ...state.cart, 
              items: newItems, 
              isLoading: false,
              checkoutUrl: cartData.checkoutUrl
            } 
          }));
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('strike-cart', JSON.stringify({ cartId, items: newItems }));
          }
          
          // Emit appropriate event based on action
          if (quantity === 0) {
            cartEventEmitter.emit('item-removed', {
              itemId,
              timestamp: new Date(),
              source: 'user'
            });
            toast({
              title: "Item removed",
              description: "Item has been removed from your cart",
            });
          } else {
            const updatedItem = newItems.find(newItem => newItem.id === itemId);
            if (updatedItem && item) {
              cartEventEmitter.emit('item-updated', {
                itemId,
                oldItem: item,
                newItem: updatedItem,
                changes: { quantity: quantity as any },
                timestamp: new Date(),
                source: 'user'
              });
            }
          }
        } catch (error) {
          console.error('Failed to update item:', error);
          set((state) => ({ 
            ...state, 
            cart: { ...state.cart, error: 'Failed to update item', isLoading: false } 
          }));
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to update item quantity",
            variant: "destructive",
          });
        }
      },

      // Remove item from cart
      removeItem: async (itemId: string) => {
        await get().actions.cart.updateItemQuantity(itemId, 0);
      },

      // Set cart open state
      setCartOpen: (isOpen: boolean) => {
        set((state) => ({ 
          ...state, 
          cart: { ...state.cart, isOpen } 
        }));
      },

      // Clear cart using server-side API
      clearCart: async () => {
        set((state) => ({ 
          ...state, 
          cart: { ...state.cart, isLoading: true, error: null } 
        }));
        try {
          const state = get();
          const cartId = state.cart.cartId;
          const items = state.cart.items || [];
          
          if (cartId && items.length > 0) {
            // Remove all items from cart using server API
            const lineIds = items.map(item => String(item.lineItemId));
            const response = await cartApi.removeFromCart(cartId, lineIds);
            
            if (!response.success) {
              throw new Error(response.error || 'Failed to clear cart');
            }
          }
          
          // Clear local state
          set((state) => {
            const { checkoutUrl, ...cartWithoutCheckout } = state.cart;
            return {
              ...state,
              cart: { ...cartWithoutCheckout, items: [], cartId: null, isLoading: false }
            };
          });
          
          if (typeof window !== 'undefined') {
            localStorage.removeItem('strike-cart');
            localStorage.removeItem('strike-cart-id');
          }
          
          cartEventEmitter.emit('cart-cleared', {
            clearedItems: state.cart.items || [],
            timestamp: new Date(),
            source: 'user'
          });
          
          toast({
            title: "Cart cleared",
            description: "All items have been removed from your cart",
          });
        } catch (error) {
          console.error('Failed to clear cart:', error);
          // Clear local state anyway
          set((state) => {
            const { checkoutUrl, ...cartWithoutCheckout } = state.cart;
            return {
              ...state,
              cart: { ...cartWithoutCheckout, items: [], cartId: null, isLoading: false }
            };
          });
          if (typeof window !== 'undefined') {
            localStorage.removeItem('strike-cart');
            localStorage.removeItem('strike-cart-id');
          }
          const state = get();
          cartEventEmitter.emit('cart-cleared', {
            clearedItems: state.cart.items || [],
            timestamp: new Date(),
            source: 'system'
          });
        }
      },

      // Calculate totals (unchanged)
      getTotals: () => {
        const state = get();
        const items = state.cart.items || [];
        const subtotal = items.reduce((acc, item) => {
          const price = item.pricing?.totalPrice;
          if (typeof price === 'number') {
            return acc + price;
          }
          // If it's a Price branded type, convert to number
          return acc + ((price as unknown as number) || 0);
        }, 0);
        const tax = Math.round(subtotal * 0.2); // 20% VAT
        const shipping = 0; // Free shipping
        const total = subtotal + tax + shipping;

        return {
          subtotal,
          tax,
          shipping,
          total,
          formattedSubtotal: formatPrice(subtotal),
          formattedTax: formatPrice(tax),
          formattedShipping: formatPrice(shipping),
          formattedTotal: formatPrice(total),
        };
      },

      // Get item count (unchanged)
      getItemCount: () => {
        const state = get();
        const items = state.cart.items || [];
        return items.reduce((acc, item) => acc + (item.quantity || 0), 0);
      },
    },
  },
});