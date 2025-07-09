import type { StateCreator } from 'zustand';
import type { 
  StoreState, 
  CartSlice, 
  BulkCartItem,
  BulkOperation,
  SavedCart,
  SavedCartItem,
  CartRecommendation,
  InventoryStatus,
  TaxEstimate,
  EnhancedCartActions
} from '../types';
import type { CartItem } from '@/types/store';
import { cartEventEmitter } from '../../events';
import { toast } from '@/hooks/use-toast';
import { retry, handleError, NetworkError } from '@/lib/error-handling';






export const createEnhancedCartSlice: StateCreator<
  StoreState,
  [],
  [],
  CartSlice & { actions: { enhancedCart: EnhancedCartActions } }
> = (set, get) => ({
  // Basic cart state (from CartSlice)
  cartId: null,
  items: [],
  isOpen: false,
  isLoading: false,
  error: null,
  checkoutUrl: undefined,
  
  // Enhanced state - extends base cart state
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
    enhancedCart: {
      // Bulk operations
      processBulkOperation: async (operation: BulkOperation) => {
        // Add operation to tracking
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            bulkOperations: [...(state.cart.bulkOperations || []), {
              ...operation,
              status: 'processing',
              timestamp: Date.now(),
            }],
            isLoading: true,
          },
        }));

        try {
          const response = await fetch('/api/cart/bulk-add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cartId: get().cart.cartId,
              items: operation.items,
            }),
          });

          const result = await response.json();

          if (result.success) {
            // Update operation status
            set((state) => ({
              ...state,
              cart: {
                ...state.cart,
                bulkOperations: state.cart.bulkOperations?.map((op: BulkOperation) =>
                  op.id === operation.id ? { ...op, status: 'completed' } : op
                ) || [],
                items: result.cart.items || state.cart.items,
                isLoading: false,
              },
            }));

            // Emit events for analytics
            cartEventEmitter.emit('bulk-operation-completed', {
              operation: operation.type,
              itemCount: operation.items.length,
              success: true,
            });

            toast({
              title: 'Items added to cart',
              description: `Successfully added ${operation.items.length} items to your cart.`,
            });
          } else {
            throw new Error(result.error || 'Bulk add failed');
          }
        } catch (error) {
          // Update operation status
          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              bulkOperations: state.cart.bulkOperations?.map((op: BulkOperation) =>
                op.id === operation.id ? { 
                  ...op, 
                  status: 'failed', 
                  error: error instanceof Error ? error.message : 'Unknown error' 
                } : op
              ) || [],
              isLoading: false,
            },
          }));

          handleError(error, false);
          toast({
            title: 'Failed to add items',
            description: 'Some items could not be added to your cart.',
            variant: 'destructive',
          });
        }
      },

      getBulkOperationStatus: (operationId: string) => {
        const operations = get().cart.bulkOperations || [];
        return operations.find(op => op.id === operationId) || null;
      },

      // Generate share token
      generateShareToken: async () => {
        const response = await fetch('/api/cart/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartId: get().cart.cartId,
            expiryHours: 24,
          }),
        });

        const result = await response.json();

        if (result.success) {
          const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
          
          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              shareToken: result.shareToken,
              shareExpiry: expiryTime,
            },
          }));

          return result.shareToken;
        } else {
          throw new Error(result.error || 'Failed to generate share token');
        }
      },

      // Keep the remaining needed methods for the interface
      refreshRecommendations: async () => {
        // Implementation placeholder
      },

      dismissRecommendation: (recommendationId: string) => {
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            recommendations: state.cart.recommendations?.filter(r => r.id !== recommendationId) || [],
          },
        }));
      },

      getSavedCarts: () => {
        return get().cart.savedCarts || [];
      },

      refreshInventoryStatus: async () => {
        // Implementation placeholder
      },

      subscribeToInventoryUpdates: (productIds: string[]) => {
        // Implementation placeholder
      },

      startAbandonmentTracking: () => {
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            abandonmentTracking: {
              ...state.cart.abandonmentTracking,
              startTime: Date.now(),
            },
          },
        }));
      },

      stopAbandonmentTracking: () => {
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            abandonmentTracking: {
              ...state.cart.abandonmentTracking,
              startTime: null,
            },
          },
        }));
      },

      trackAbandonmentEvent: (event: string, data?: Record<string, unknown>) => {
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            abandonmentTracking: {
              ...state.cart.abandonmentTracking,
              events: [
                ...state.cart.abandonmentTracking.events,
                {
                  event,
                  timestamp: Date.now(),
                  data,
                },
              ],
            },
          },
        }));
      },

      // Bulk update quantities
      bulkUpdateQuantities: async (updates: Array<{ itemId: string; quantity: number }>) => {
        try {
          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              isLoading: true,
            },
          }));

          const response = await fetch('/api/cart/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cartId: get().cart.cartId,
              updates,
            }),
          });

          const result = await response.json();

          if (result.success) {
            set((state) => ({
              ...state,
              cart: {
                ...state.cart,
                items: result.cart.items || state.cart.items,
                isLoading: false,
              },
            }));

            cartEventEmitter.emit('bulk-operation-completed', {
              operation: 'update',
              itemCount: updates.length,
              success: true,
            });
          } else {
            throw new Error(result.error || 'Bulk update failed');
          }
        } catch (error) {
          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              isLoading: false,
            },
          }));

          handleError(error, false);
        }
      },

      // Create shareable cart
      createShareableCart: async (expiryHours = 24) => {
        try {
          const response = await fetch('/api/cart/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cartId: get().cart.cartId,
              expiryHours,
            }),
          });

          const result = await response.json();

          if (result.success) {
            const expiryTime = Date.now() + (expiryHours * 60 * 60 * 1000);
            
            set((state) => ({
              ...state,
              cart: {
                ...state.cart,
                shareToken: result.shareToken,
                shareExpiry: expiryTime,
              },
            }));

            cartEventEmitter.emit('cart-shared', {
              shareToken: result.shareToken,
              expiryHours,
            });

            return result.shareToken;
          }

          return null;
        } catch (error) {
          handleError(error, false);
          return null;
        }
      },

      // Load recommendations
      loadRecommendations: async () => {
        try {
          const cartItems = get().cart.items;
          const response = await fetch('/api/cart/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cartItems: cartItems.map(item => ({
                productId: item.id,
                variantId: item.variantId,
              })),
            }),
          });

          const result = await response.json();

          if (result.success) {
            set((state) => ({
              ...state,
              cart: {
                ...state.cart,
                recommendations: result.recommendations || [],
              },
            }));
          }
        } catch (error) {
          console.error('Failed to load recommendations:', error);
        }
      },

      // Validate inventory
      validateInventory: async () => {
        try {
          const cartItems = get().cart.items;
          const response = await fetch('/api/cart/validate-inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: cartItems.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity,
              })),
            }),
          });

          const result = await response.json();

          if (result.success) {
            set((state) => ({
              ...state,
              cart: {
                ...state.cart,
                inventoryStatus: result.inventoryStatus || [],
              },
            }));

            // Check for unavailable items
            const unavailableItems = result.inventoryStatus?.filter(
              (status: InventoryStatus) => !status.available
            );

            if (unavailableItems?.length > 0) {
              cartEventEmitter.emit('inventory-validated', {
                unavailableCount: unavailableItems.length,
                items: unavailableItems,
              });

              toast({
                title: 'Inventory Update',
                description: `${unavailableItems.length} item(s) in your cart are no longer available.`,
                variant: 'destructive',
              });
            }
          }
        } catch (error) {
          console.error('Failed to validate inventory:', error);
        }
      },

      // Estimate tax
      estimateTax: async (shippingAddress?: any) => {
        const countryCode = shippingAddress?.countryCode || 'GB';
        const provinceCode = shippingAddress?.provinceCode;
        try {
          const response = await fetch('/api/cart/calculate-tax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cartId: get().cart.cartId,
              countryCode,
              provinceCode,
            }),
          });

          const result = await response.json();

          if (result.success) {
            set((state) => ({
              ...state,
              cart: {
                ...state.cart,
                taxEstimate: result.taxEstimate,
              },
            }));
          }
        } catch (error) {
          console.error('Failed to estimate tax:', error);
        }
      },


      // Track events for analytics
      trackEvent: (event: string, data?: any) => {
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            abandonmentTracking: {
              ...state.cart.abandonmentTracking,
              events: [
                ...(state.cart.abandonmentTracking?.events || []),
                {
                  event,
                  timestamp: Date.now(),
                  data,
                },
              ],
            },
          },
        }));
      },

      // Save for later
      saveForLater: async (lineItemId: string) => {
        try {
          const cartItems = get().cart.items;
          const item = cartItems.find(i => i.lineItemId === lineItemId);
          
          if (!item) return;

          // Convert CartItem to SavedCartItem
          const savedItem: SavedCartItem = {
            productId: item.id as string,
            variantId: item.variantId as string,
            quantity: item.quantity as number,
            savedAt: Date.now(),
            productData: {
              id: lineItemId,
              name: item.name,
              image: item.image as string || '',
              price: parseFloat(item.pricing.unitPrice.toString()),
            },
          };

          // Move item to saved for later
          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              savedForLater: [...(state.cart.savedForLater || []), savedItem],
              items: state.cart.items.filter(i => i.lineItemId !== lineItemId),
            },
          }));

          toast({
            title: 'Saved for later',
            description: `${item.name} has been saved for later.`,
          });
        } catch (error) {
          handleError(error, false);
        }
      },

      // Move from saved to cart
      moveToCart: async (savedItemId: string) => {
        try {
          const savedItems = get().cart.savedForLater || [];
          const item = savedItems.find((i: any) => i.productData?.id === savedItemId);
          
          if (!item) return;

          // Convert SavedCartItem back to CartItem
          const cartItem: CartItem = {
            id: item.productId as any,
            lineItemId: item.productData?.id as any,
            variantId: item.variantId as any,
            name: item.productData?.name,
            slug: 'default-slug' as any, // Would need to be looked up from product data
            size: 'One Size', // Would need to be retrieved from variant data
            quantity: item.quantity as any,
            image: item.productData?.image as any || null,
            pricing: {
              unitPrice: item.productData?.price.toString() as any,
              totalPrice: (item.productData?.price * item.quantity).toString() as any,
              displayUnitPrice: `$${item.productData?.price.toFixed(2)}`,
              displayTotalPrice: `$${(item.productData?.price * item.quantity).toFixed(2)}`,
            },
          };

          // Move back to cart
          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              items: [...state.cart.items, cartItem],
              savedForLater: state.cart.savedForLater?.filter((i: SavedCartItem) => i.productData?.id !== savedItemId) || [],
            },
          }));
        } catch (error) {
          handleError(error, false);
        }
      },

      // Remove saved item
      removeSavedItem: async (savedItemId: string) => {
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            savedForLater: state.cart.savedForLater?.filter((i: SavedCartItem) => i.productData?.id !== savedItemId) || [],
          },
        }));
      },

      // Add recommendation to cart
      addRecommendationToCart: async (recommendationId: string) => {
        try {
          const recommendations = get().cart.recommendations || [];
          const recommendation = recommendations.find((r: CartRecommendation) => r.id === recommendationId);
          
          if (!recommendation) return;

          // Use existing cart actions to add item
          const cartActions = get().actions.cart;
          await cartActions.addItem(recommendation.productId, 'default-variant', 1);

          cartEventEmitter.emit('recommendation-added', {
            recommendationId,
            type: recommendation.reason,
          });

        } catch (error) {
          handleError(error, false);
        }
      },

      // Bulk remove items
      bulkRemoveItems: async (itemIds: string[]) => {
        try {
          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              isLoading: true,
            },
          }));

          const response = await fetch('/api/cart/bulk-remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cartId: get().cart.cartId,
              itemIds,
            }),
          });

          const result = await response.json();

          if (result.success) {
            set((state) => ({
              ...state,
              cart: {
                ...state.cart,
                items: state.cart.items.filter(item => !itemIds.includes(item.lineItemId)),
                isLoading: false,
              },
            }));
          }
        } catch (error) {
          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              isLoading: false,
            },
          }));
          handleError(error, false);
        }
      },

      // Load shared cart
      loadSharedCart: async (token: string) => {
        try {
          const response = await fetch(`/api/cart/shared/${token}`);
          const result = await response.json();

          if (result.success) {
            set((state) => ({
              ...state,
              cart: {
                ...state.cart,
                items: result.cart.items || [],
                cartId: result.cart.id,
              },
            }));
          }
        } catch (error) {
          handleError(error, false);
        }
      },

      // Save current cart
      saveCurrentCart: async (name: string) => {
        try {
          const currentCart = get().cart;
          const savedCart: SavedCart = {
            id: Date.now().toString(),
            name,
            items: currentCart.items.map(item => ({
              productId: item.id as string,
              variantId: item.variantId as string,
              quantity: item.quantity,
              savedAt: Date.now(),
              productData: {
                id: item.lineItemId,
                name: item.name,
                image: item.image || '',
                price: parseFloat(item.pricing.unitPrice.toString()),
              },
            })),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              savedCarts: [...(state.cart.savedCarts || []), savedCart],
            },
          }));
        } catch (error) {
          handleError(error, false);
        }
      },

      // Load saved cart
      loadSavedCart: async (cartId: string) => {
        try {
          const savedCarts = get().cart.savedCarts || [];
          const savedCart = savedCarts.find(cart => cart.id === cartId);

          if (savedCart) {
            set((state) => ({
              ...state,
              cart: {
                ...state.cart,
                items: savedCart.items.map(item => ({
                  id: item.productId as any,
                  lineItemId: item.productData?.id as any,
                  variantId: item.variantId as any,
                  name: item.productData?.name,
                  slug: 'default-slug' as any,
                  size: 'One Size',
                  quantity: item.quantity as any,
                  image: item.productData?.image as any || null,
                  pricing: {
                    unitPrice: item.productData?.price.toString() as any,
                    totalPrice: (item.productData?.price * item.quantity).toString() as any,
                    displayUnitPrice: `$${item.productData?.price.toFixed(2)}`,
                    displayTotalPrice: `$${(item.productData?.price * item.quantity).toFixed(2)}`,
                  },
                })),
              },
            }));
          }
        } catch (error) {
          handleError(error, false);
        }
      },

      // Delete saved cart
      deleteSavedCart: async (cartId: string) => {
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            savedCarts: state.cart.savedCarts?.filter(cart => cart.id !== cartId) || [],
          },
        }));
      },
    },
  },
});