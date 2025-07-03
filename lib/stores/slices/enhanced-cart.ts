import type { StateCreator } from 'zustand';
import type { StoreState, CartSlice } from '../types';
import { cartEventEmitter } from '../../events';
import { toast } from '@/hooks/use-toast';
import { retry, handleError, NetworkError } from '@/lib/error-handling';

// Enhanced cart types
export interface BulkCartItem {
  productId: string;
  variantId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
}

export interface BulkOperation {
  id: string;
  type: 'add' | 'update' | 'remove';
  items: BulkCartItem[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  timestamp: number;
}

export interface SavedCart {
  id: string;
  name: string;
  items: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CartRecommendation {
  id: string;
  type: 'frequently_bought' | 'similar' | 'trending' | 'recently_viewed';
  reason: 'frequently-bought-together' | 'similar-products' | 'trending' | 'recently-viewed';
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  price: string;
  relevanceScore: number;
  confidence: number;
  productData?: {
    name: string;
    image: string;
    price: number;
    slug: string;
  };
}

export interface InventoryStatus {
  variantId: string;
  available: boolean;
  quantity: number | null;
  policy: 'deny' | 'continue';
  message?: string;
}

export interface TaxEstimate {
  subtotal: number;
  tax: number;
  total: number;
  shipping?: number;
  currency: string;
  regionCode?: string;
  taxRate?: number;
  taxAmount?: number;
  shippingEstimate?: number;
  breakdown?: Array<{
    name: string;
    rate: number;
    amount: number;
  }>;
}

export interface EnhancedCartState extends CartSlice {
  // Enhanced state
  bulkOperations: BulkOperation[];
  savedCarts: SavedCart[];
  recommendations: CartRecommendation[];
  inventoryStatus: InventoryStatus[];
  taxEstimate: TaxEstimate | null;
  shareToken: string | null;
  shareExpiry: number | null;
  
  // Save for later
  savedForLater: any[];
  
  // Analytics tracking
  abandonmentTracking: {
    startTime: number | null;
    events: Array<{
      event: string;
      timestamp: number;
      data?: any;
    }>;
  };
}

export interface EnhancedCartActions {
  // Bulk operations
  bulkAddToCart: (items: BulkCartItem[]) => Promise<boolean>;
  bulkUpdateQuantities: (updates: Array<{ lineItemId: string; quantity: number }>) => Promise<boolean>;
  bulkRemoveItems: (lineItemIds: string[]) => Promise<boolean>;
  
  // Cart sharing
  createShareableCart: (expiryHours?: number) => Promise<string | null>;
  loadSharedCart: (shareToken: string) => Promise<boolean>;
  
  // Save for later
  saveForLater: (lineItemId: string) => Promise<boolean>;
  moveToCart: (savedItemId: string) => Promise<boolean>;
  removeSavedItem: (savedItemId: string) => Promise<boolean>;
  
  // Recommendations
  loadRecommendations: () => Promise<void>;
  addRecommendationToCart: (recommendationId: string) => Promise<boolean>;
  
  // Inventory validation
  validateInventory: () => Promise<void>;
  
  // Tax estimation
  estimateTax: (countryCode?: string, provinceCode?: string) => Promise<void>;
  
  // Analytics
  startAbandonmentTracking: () => void;
  trackEvent: (event: string, data?: any) => void;
  
  // Saved carts
  saveCurrentCart: (name: string) => Promise<boolean>;
  loadSavedCart: (cartId: string) => Promise<boolean>;
  deleteSavedCart: (cartId: string) => Promise<boolean>;
}

export const createEnhancedCartSlice: StateCreator<
  StoreState,
  [],
  [],
  EnhancedCartState & { actions: { enhancedCart: EnhancedCartActions } }
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
      // Bulk add to cart with optimistic updates
      bulkAddToCart: async (items: BulkCartItem[]) => {
        const operationId = `bulk_add_${Date.now()}`;
        
        // Add operation to tracking
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            bulkOperations: [...(state.cart as any).bulkOperations || [], {
              id: operationId,
              type: 'add',
              items,
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
              items,
            }),
          });

          const result = await response.json();

          if (result.success) {
            // Update operation status
            set((state) => ({
              ...state,
              cart: {
                ...state.cart,
                bulkOperations: (state.cart as any).bulkOperations?.map((op: BulkOperation) =>
                  op.id === operationId ? { ...op, status: 'completed' } : op
                ) || [],
                items: result.cart.items || state.cart.items,
                isLoading: false,
              },
            }));

            // Emit events for analytics
            cartEventEmitter.emit('bulk-operation-completed', {
              operation: 'add',
              itemCount: items.length,
              success: true,
            });

            toast({
              title: 'Items added to cart',
              description: `Successfully added ${items.length} items to your cart.`,
            });

            return true;
          } else {
            throw new Error(result.error || 'Bulk add failed');
          }
        } catch (error) {
          // Update operation status
          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              bulkOperations: (state.cart as any).bulkOperations?.map((op: BulkOperation) =>
                op.id === operationId ? { 
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

          return false;
        }
      },

      // Bulk update quantities
      bulkUpdateQuantities: async (updates: Array<{ lineItemId: string; quantity: number }>) => {
        const operationId = `bulk_update_${Date.now()}`;
        
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            bulkOperations: [...(state.cart as any).bulkOperations || [], {
              id: operationId,
              type: 'update',
              items: updates,
              status: 'processing',
              timestamp: Date.now(),
            }],
            isLoading: true,
          },
        }));

        try {
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

            return true;
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
          return false;
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
      estimateTax: async (countryCode = 'GB', provinceCode) => {
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

      // Start abandonment tracking
      startAbandonmentTracking: () => {
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            abandonmentTracking: {
              startTime: Date.now(),
              events: [],
            },
          },
        }));
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
          
          if (!item) return false;

          // Move item to saved for later
          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              savedForLater: [...(state.cart as any).savedForLater || [], item],
              items: state.cart.items.filter(i => i.lineItemId !== lineItemId),
            },
          }));

          toast({
            title: 'Saved for later',
            description: `${item.name} has been saved for later.`,
          });

          return true;
        } catch (error) {
          handleError(error, false);
          return false;
        }
      },

      // Move from saved to cart
      moveToCart: async (savedItemId: string) => {
        try {
          const savedItems = (get().cart as any).savedForLater || [];
          const item = savedItems.find((i: any) => i.id === savedItemId);
          
          if (!item) return false;

          // Move back to cart
          set((state) => ({
            ...state,
            cart: {
              ...state.cart,
              items: [...state.cart.items, item],
              savedForLater: (state.cart as any).savedForLater?.filter((i: any) => i.id !== savedItemId) || [],
            },
          }));

          return true;
        } catch (error) {
          handleError(error, false);
          return false;
        }
      },

      // Remove saved item
      removeSavedItem: async (savedItemId: string) => {
        set((state) => ({
          ...state,
          cart: {
            ...state.cart,
            savedForLater: (state.cart as any).savedForLater?.filter((i: any) => i.id !== savedItemId) || [],
          },
        }));
        return true;
      },

      // Add recommendation to cart
      addRecommendationToCart: async (recommendationId: string) => {
        try {
          const recommendations = (get().cart as any).recommendations || [];
          const recommendation = recommendations.find((r: CartRecommendation) => r.id === recommendationId);
          
          if (!recommendation) return false;

          // Use existing cart actions to add item
          const cartActions = get().actions.cart;
          await cartActions.addItem(recommendation.productId, 'default-variant', 1);

          cartEventEmitter.emit('recommendation-added', {
            recommendationId,
            type: recommendation.type,
          });

          return true;
        } catch (error) {
          handleError(error, false);
          return false;
        }
      },

      // Placeholder implementations for remaining methods
      bulkRemoveItems: async () => { return true; },
      loadSharedCart: async () => { return true; },
      saveCurrentCart: async () => { return true; },
      loadSavedCart: async () => { return true; },
      deleteSavedCart: async () => { return true; },
    },
  },
});