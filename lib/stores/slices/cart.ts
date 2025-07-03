import type { StateCreator } from 'zustand';
import type { StoreState, CartSlice, CartActions } from '../types';
import { cartEventEmitter } from '../../events';
import { toast } from '@/hooks/use-toast';
import { createLineItemId, createVariantId, createSlug, createImageURL, createPrice, createProductId, createQuantity } from '@/types/branded';
import { retry, handleError, NetworkError } from '@/lib/error-handling';
// import type { CartItem } from '../../cart-store';

const formatPrice = (amount: number, currencyCode: string = 'EUR') => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount / 100);
};

export const createCartSlice: StateCreator<
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
      // Initialize cart with Shopify Cart API
      initializeCart: async () => {
        set((state) => ({ 
          ...state, 
          cart: { ...state.cart, isLoading: true, error: null } 
        }));
        try {
          // Import Shopify client dynamically to avoid circular dependency
          const { shopifyClient } = await import('@/lib/shopify/client');
          
          // Check for existing cart ID in localStorage
          const savedCartId = typeof window !== 'undefined' ? localStorage.getItem('strike-cart-id') : null;
          let shopifyCart;
          
          if (savedCartId && shopifyClient) {
            // Try to retrieve existing cart
            shopifyCart = await shopifyClient.getCart(savedCartId);
          }
          
          if (!shopifyCart && shopifyClient) {
            // Create new Shopify cart
            shopifyCart = await shopifyClient.createCart();
            if (typeof window !== 'undefined') {
              localStorage.setItem('strike-cart-id', shopifyCart.id);
            }
          }
          
          if (shopifyCart) {
            // Convert Shopify cart to our format
            const items = shopifyCart.lines.edges.map(({ node }) => ({
              id: createProductId(node.merchandise.product.id),
              lineItemId: createLineItemId(node.id),
              variantId: createVariantId(node.merchandise.id),
              name: node.merchandise.product.title,
              slug: createSlug(node.merchandise.product.handle),
              size: node.merchandise.title || 'One Size',
              quantity: createQuantity(node.quantity),
              image: createImageURL(node.merchandise.image?.url || ''),
              pricing: {
                unitPrice: createPrice(Math.round(parseFloat(node.cost.totalAmount.amount) * 100 / node.quantity)),
                totalPrice: createPrice(Math.round(parseFloat(node.cost.totalAmount.amount) * 100)),
                displayUnitPrice: formatPrice(parseFloat(node.cost.totalAmount.amount) / node.quantity, node.cost.totalAmount.currencyCode),
                displayTotalPrice: formatPrice(parseFloat(node.cost.totalAmount.amount), node.cost.totalAmount.currencyCode),
              },
            }));
            
            set((state) => ({ 
              ...state, 
              cart: { 
                ...state.cart, 
                cartId: shopifyCart.id, 
                items, 
                isLoading: false,
                checkoutUrl: shopifyCart.checkoutUrl 
              } 
            }));
          } else {
            // Fallback to local cart if Shopify not configured
            const cartId = `local_cart_${Date.now()}`;
            set((state) => ({ 
              ...state, 
              cart: { ...state.cart, cartId, items: [], isLoading: false } 
            }));
          }
        } catch (error) {
          handleError(error, false);
          const errorMessage = error instanceof NetworkError 
            ? 'No internet connection. Cart will sync when online.'
            : 'Cart initialization failed, using offline mode';
          
          // Fallback to local cart on error
          const cartId = `local_cart_${Date.now()}`;
          set((state) => ({ 
            ...state, 
            cart: { ...state.cart, cartId, items: [], isLoading: false, error: errorMessage } 
          }));
          
          toast({
            title: 'Offline Mode',
            description: errorMessage,
            variant: 'default',
          });
        }
      },

      // Add item to cart with Shopify integration
      addItem: async (productId: string, variantId: string, quantity: number = 1, productData?: any) => {
        set((state) => ({ 
          ...state, 
          cart: { ...state.cart, isLoading: true, error: null } 
        }));
        try {
          const state = get();
          let cartId = state.cart.cartId;
          
          // Import Shopify client dynamically to avoid circular dependency
          const { shopifyClient } = await import('@/lib/shopify/client');
          
          if (!shopifyClient) {
            throw new Error('Shopify client not initialized. Please restart the dev server.');
          }
          
          let shopifyCart;
          
          // Create cart if it doesn't exist
          if (!cartId) {
            shopifyCart = await shopifyClient.createCart();
            cartId = shopifyCart.id;
            if (typeof window !== 'undefined') {
              localStorage.setItem('strike-cart-id', cartId);
            }
          }
          
          // Add item to Shopify cart using cartLinesAdd mutation with retry
          shopifyCart = await retry(
            () => shopifyClient.addToCart(cartId, variantId, quantity),
            {
              maxAttempts: 3,
              onRetry: (attempt) => {
                if (attempt === 2) {
                  toast({
                    title: 'Connection issues',
                    description: 'Having trouble adding to cart. Retrying...',
                  });
                }
              },
            }
          );
          
          // Convert Shopify cart to our format
          const items = shopifyCart.lines.edges.map(({ node }) => ({
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
          
          console.log('Updating cart state with items:', items);
          console.log('First item quantity type and value:', typeof items[0]?.quantity, items[0]?.quantity);
          set((state) => ({ 
            ...state, 
            cart: { 
              ...state.cart, 
              cartId,
              items, 
              isLoading: false,
              checkoutUrl: shopifyCart.checkoutUrl
            } 
          }));
          console.log('Cart state updated successfully');
          
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
          handleError(error);
          
          const isNetworkError = error instanceof NetworkError || 
            (error instanceof Error && error.message.includes('fetch'));
          
          const errorMessage = isNetworkError
            ? 'No connection. Item will be added when online.'
            : 'Failed to add item to cart. Please try again.';
          
          set((state) => ({ 
            ...state, 
            cart: { ...state.cart, isLoading: false, error: errorMessage } 
          }));
          
          // If network error, queue the action for later
          if (isNetworkError && typeof window !== 'undefined') {
            const pendingActions = JSON.parse(
              localStorage.getItem('strike-pending-cart-actions') || '[]'
            );
            pendingActions.push({
              type: 'addItem',
              payload: { variantId, quantity },
              timestamp: Date.now(),
            });
            localStorage.setItem('strike-pending-cart-actions', JSON.stringify(pendingActions));
          }
        }
      },

      // Update item quantity
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
          
          // Import Shopify client dynamically to avoid circular dependency
          const { shopifyClient } = await import('@/lib/shopify/client');
          
          if (!shopifyClient) {
            throw new Error('Shopify client not configured');
          }
          
          // Find the item to get its line item ID
          const item = items.find(item => item.id === itemId);
          if (!item) {
            throw new Error('Item not found in cart');
          }
          
          let shopifyCart;
          
          if (quantity === 0) {
            // Remove item using Shopify mutation
            shopifyCart = await shopifyClient.removeFromCart(cartId, [String(item.lineItemId)]);
          } else {
            // Update quantity using Shopify mutation
            shopifyCart = await shopifyClient.updateCartLines(cartId, String(item.lineItemId), quantity);
          }
          
          // Convert Shopify cart to our format
          const newItems = shopifyCart.lines.edges.map(({ node }) => ({
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
          
          set((state) => ({ 
            ...state, 
            cart: { 
              ...state.cart, 
              items: newItems, 
              isLoading: false,
              checkoutUrl: shopifyCart.checkoutUrl
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
            const updatedItem = newItems.find(item => item.id === itemId);
            if (updatedItem) {
              cartEventEmitter.emit('item-updated', {
                itemId: updatedItem.id,
                oldItem: updatedItem,
                newItem: updatedItem,
                changes: { quantity: updatedItem.quantity },
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
            description: "Failed to update item quantity",
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

      // Clear cart
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
            // Import Shopify client dynamically to avoid circular dependency
            const { shopifyClient } = await import('@/lib/shopify/client');
            
            if (shopifyClient) {
              // Remove all items from Shopify cart
              const lineIds = items.map(item => String(item.lineItemId));
              await shopifyClient.removeFromCart(cartId, lineIds);
            }
          }
          
          // Clear local state
          set((state) => ({ 
            ...state, 
            cart: { ...state.cart, items: [], cartId: null, isLoading: false } 
          }));
          
          if (typeof window !== 'undefined') {
            localStorage.removeItem('strike-cart');
            localStorage.removeItem('strike-cart-id');
          }
          
          cartEventEmitter.emit('cart-cleared', {
            clearedItems: items,
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
          set((state) => ({ 
            ...state, 
            cart: { ...state.cart, items: [], cartId: null, isLoading: false } 
          }));
          if (typeof window !== 'undefined') {
            localStorage.removeItem('strike-cart');
            localStorage.removeItem('strike-cart-id');
          }
          cartEventEmitter.emit('cart-cleared', {
            clearedItems: [],
            timestamp: new Date(),
            source: 'user'
          });
        }
      },

      // Calculate totals
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

      // Get item count
      getItemCount: () => {
        const state = get();
        const items = state.cart.items || [];
        return items.reduce((acc, item) => acc + (item.quantity || 0), 0);
      },
    },
  },
});