import type { StateCreator } from 'zustand';
import type { StoreState, CartSlice, CartActions } from '../types';
import type { CartItem } from '../../cart-store';
import { medusaClient } from '../../medusa-service-refactored';
import { cartEventEmitter } from '../../events';
import { toast } from '@/hooks/use-toast';

// Type definitions for Medusa cart operations
interface MedusaCartItem {
  id: string;
  variant_id: string;
  variant?: {
    product_id?: string;
    product?: { handle?: string };
    title?: string;
    sku?: string;
    prices?: Array<{ amount: number }>;
  };
  product_id?: string;
  title: string;
  quantity: number;
  thumbnail?: string;
  unit_price: number;
  subtotal?: number;
}

interface MedusaCart {
  id: string;
  items?: MedusaCartItem[];
  region?: { currency_code: string };
}

interface MedusaClient {
  carts: {
    retrieve: (cartId: string) => Promise<{ cart: MedusaCart }>;
    create: (data: { region_id: string }) => Promise<{ cart: MedusaCart }>;
    lineItems: {
      create: (cartId: string, data: { variant_id: string; quantity: number }) => Promise<{ cart: MedusaCart }>;
      update: (cartId: string, lineItemId: string, data: { quantity: number }) => Promise<{ cart: MedusaCart }>;
      delete: (cartId: string, lineItemId: string) => Promise<{ cart: MedusaCart }>;
    };
  };
}

const formatPrice = (amount: number, currencyCode: string = 'GBP') => {
  return new Intl.NumberFormat('en-GB', {
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

  actions: {
    cart: {
      // UI Actions
      openCart: () =>
        set((state) => ({ cart: { ...state.cart, isOpen: true } })),
      closeCart: () =>
        set((state) => ({ cart: { ...state.cart, isOpen: false } })),
      clearError: () =>
        set((state) => ({ cart: { ...state.cart, error: null } })),

      // Initialize cart
      initializeCart: async () => {
        const { cart } = get();

        if (cart.cartId) {
          // Validate existing cart
          try {
            const { cart: medusaCart } = await (
              medusaClient as MedusaClient
            ).carts.retrieve(cart.cartId);
            if (medusaCart) {
              // Update items from server
              const items =
                medusaCart.items?.map((item) => ({
                  id: item.variant?.product_id || item.product_id,
                  lineItemId: item.id,
                  variantId: item.variant_id,
                  name: item.title,
                  slug: item.variant?.product?.handle || '',
                  size: item.variant?.title || 'One Size',
                  sku: item.variant?.sku,
                  quantity: item.quantity,
                  image: item.thumbnail,
                  pricing: {
                    unitPrice: item.unit_price,
                    unitSalePrice: item.variant?.prices?.[0]?.amount,
                    totalPrice:
                      item.subtotal || item.unit_price * item.quantity,
                    displayUnitPrice: formatPrice(
                      item.unit_price,
                      medusaCart.region?.currency_code
                    ),
                    displayUnitSalePrice: item.variant?.prices?.[0]?.amount
                      ? formatPrice(
                          item.variant.prices[0].amount,
                          medusaCart.region?.currency_code
                        )
                      : undefined,
                    displayTotalPrice: formatPrice(
                      item.subtotal || item.unit_price * item.quantity,
                      medusaCart.region?.currency_code
                    ),
                  },
                })) || [];

              set((state) => ({
                cart: { ...state.cart, items, cartId: medusaCart.id },
              }));

              // Emit cart initialized event
              cartEventEmitter.emit('cart-initialized', {
                cartId: medusaCart.id,
                items,
                timestamp: new Date(),
                source: 'system',
              });

              return;
            }
          } catch (error) {

          }
        }

        // Create new cart
        try {
          const { cart: medusaCart } = await (medusaClient as MedusaClient).carts.create(
            {
              region_id:
                process.env.NEXT_PUBLIC_MEDUSA_REGION_ID ||
                'reg_01J0PY5V5W92D5H5YZH52XNNPQ',
            }
          );
          set((state) => ({
            cart: { ...state.cart, cartId: medusaCart.id, items: [] },
          }));

          // Emit cart initialized event
          cartEventEmitter.emit('cart-initialized', {
            cartId: medusaCart.id,
            items: [],
            timestamp: new Date(),
            source: 'system',
          });
        } catch (error) {

          set((state) => ({
            cart: { ...state.cart, error: 'Failed to initialize cart' },
          }));

          // Emit error event
          cartEventEmitter.emit('cart-error', {
            error: error instanceof Error ? error : new Error(String(error)),
            context: { operation: 'initialize' },
            timestamp: new Date(),
            source: 'system',
          });
        }
      },

      // Add item to cart
      addItem: async (
        productId: string,
        variantId: string,
        quantity: number
      ) => {
        set((state) => ({
          cart: { ...state.cart, isLoading: true, error: null },
        }));

        // Emit loading start event
        cartEventEmitter.emit('cart-loading-start', {
          operation: 'add-item',
          timestamp: new Date(),
        });

        try {
          const { cart } = get();
          if (!cart.cartId) {
            await get().actions.cart.initializeCart();
          }

          const currentCartId = get().cart.cartId;
          if (!currentCartId) {
            throw new Error('Failed to initialize cart');
          }

          // Add line item
          const { cart: medusaCart } = await (
            medusaClient as MedusaClient
          ).carts.lineItems.create(currentCartId, {
            variant_id: variantId,
            quantity,
          });

          // Update local state
          const items =
            medusaCart.items?.map((item) => ({
              id: item.variant?.product_id || item.product_id,
              lineItemId: item.id,
              variantId: item.variant_id,
              name: item.title,
              slug: item.variant?.product?.handle || '',
              size: item.variant?.title || 'One Size',
              sku: item.variant?.sku,
              quantity: item.quantity,
              image: item.thumbnail,
              pricing: {
                unitPrice: item.unit_price,
                unitSalePrice: item.variant?.prices?.[0]?.amount,
                totalPrice: item.subtotal || item.unit_price * item.quantity,
                displayUnitPrice: formatPrice(
                  item.unit_price,
                  medusaCart.region?.currency_code
                ),
                displayUnitSalePrice: item.variant?.prices?.[0]?.amount
                  ? formatPrice(
                      item.variant.prices[0].amount,
                      medusaCart.region?.currency_code
                    )
                  : undefined,
                displayTotalPrice: formatPrice(
                  item.subtotal || item.unit_price * item.quantity,
                  medusaCart.region?.currency_code
                ),
              },
            })) || [];

          set((state) => ({ cart: { ...state.cart, items, isOpen: true } }));

          // Find the newly added item
          const newItem = items.find(
            (item) =>
              item.variantId === variantId &&
              (!get().cart.items.find(
                (existing) => existing.variantId === variantId
              ) ||
                item.quantity >
                  (get().cart.items.find(
                    (existing) => existing.variantId === variantId
                  )?.quantity || 0))
          );

          if (newItem) {
            // Emit item added event
            cartEventEmitter.emit('item-added', {
              item: newItem,
              timestamp: new Date(),
              source: 'user',
            });
          }

          toast({
            title: 'Added to cart',
            description: 'Item has been added to your cart',
          });
        } catch (error) {

          set((state) => ({
            cart: {
              ...state.cart,
              error: error instanceof Error ? error.message : 'Failed to add item to cart',
            },
          }));

          // Emit error event
          cartEventEmitter.emit('cart-error', {
            error: error instanceof Error ? error : new Error(String(error)),
            context: { operation: 'add-item', productId, variantId, quantity },
            timestamp: new Date(),
            source: 'user',
          });

          toast({
            title: 'Error',
            description: 'Failed to add item to cart',
            variant: 'destructive',
          });
        } finally {
          set((state) => ({ cart: { ...state.cart, isLoading: false } }));

          // Emit loading end event
          cartEventEmitter.emit('cart-loading-end', {
            operation: 'add-item',
            duration: 0, // Would need to track start time for accurate duration
            timestamp: new Date(),
          });
        }
      },

      // Update item quantity
      updateQuantity: async (
        itemId: string,
        size: string,
        quantity: number
      ) => {
        if (quantity < 1) {
          return get().actions.cart.removeItem(itemId, size);
        }

        set((state) => ({
          cart: { ...state.cart, isLoading: true, error: null },
        }));

        try {
          const { cart } = get();
          if (!cart.cartId) throw new Error('No cart found');

          const item = cart.items.find(
            (i) => i.id === itemId && i.size === size
          );
          if (!item) throw new Error('Item not found');

          // Update line item
          const { cart: medusaCart } = await (
            medusaClient as MedusaClient
          ).carts.lineItems.update(cart.cartId, item.lineItemId, {
            quantity,
          });

          // Update local state
          const updatedItems =
            medusaCart.items?.map((item) => ({
              id: item.variant?.product_id || item.product_id,
              lineItemId: item.id,
              variantId: item.variant_id,
              name: item.title,
              slug: item.variant?.product?.handle || '',
              size: item.variant?.title || 'One Size',
              sku: item.variant?.sku,
              quantity: item.quantity,
              image: item.thumbnail,
              pricing: {
                unitPrice: item.unit_price,
                unitSalePrice: item.variant?.prices?.[0]?.amount,
                totalPrice: item.subtotal || item.unit_price * item.quantity,
                displayUnitPrice: formatPrice(
                  item.unit_price,
                  medusaCart.region?.currency_code
                ),
                displayUnitSalePrice: item.variant?.prices?.[0]?.amount
                  ? formatPrice(
                      item.variant.prices[0].amount,
                      medusaCart.region?.currency_code
                    )
                  : undefined,
                displayTotalPrice: formatPrice(
                  item.subtotal || item.unit_price * item.quantity,
                  medusaCart.region?.currency_code
                ),
              },
            })) || [];

          set((state) => ({ cart: { ...state.cart, items: updatedItems } }));
        } catch (error) {

          set((state) => ({
            cart: {
              ...state.cart,
              error: error instanceof Error ? error.message : 'Failed to update quantity',
            },
          }));
          toast({
            title: 'Error',
            description: 'Failed to update quantity',
            variant: 'destructive',
          });
        } finally {
          set((state) => ({ cart: { ...state.cart, isLoading: false } }));
        }
      },

      // Remove item from cart
      removeItem: async (itemId: string, size: string) => {
        set((state) => ({
          cart: { ...state.cart, isLoading: true, error: null },
        }));

        try {
          const { cart } = get();
          if (!cart.cartId) throw new Error('No cart found');

          const item = cart.items.find(
            (i) => i.id === itemId && i.size === size
          );
          if (!item) throw new Error('Item not found');

          // Delete line item
          const { cart: medusaCart } = await (
            medusaClient as MedusaClient
          ).carts.lineItems.delete(cart.cartId, item.lineItemId);

          // Update local state
          const updatedItems =
            medusaCart.items?.map((item) => ({
              id: item.variant?.product_id || item.product_id,
              lineItemId: item.id,
              variantId: item.variant_id,
              name: item.title,
              slug: item.variant?.product?.handle || '',
              size: item.variant?.title || 'One Size',
              sku: item.variant?.sku,
              quantity: item.quantity,
              image: item.thumbnail,
              pricing: {
                unitPrice: item.unit_price,
                unitSalePrice: item.variant?.prices?.[0]?.amount,
                totalPrice: item.subtotal || item.unit_price * item.quantity,
                displayUnitPrice: formatPrice(
                  item.unit_price,
                  medusaCart.region?.currency_code
                ),
                displayUnitSalePrice: item.variant?.prices?.[0]?.amount
                  ? formatPrice(
                      item.variant.prices[0].amount,
                      medusaCart.region?.currency_code
                    )
                  : undefined,
                displayTotalPrice: formatPrice(
                  item.subtotal || item.unit_price * item.quantity,
                  medusaCart.region?.currency_code
                ),
              },
            })) || [];

          set((state) => ({ cart: { ...state.cart, items: updatedItems } }));

          // Emit item removed event
          cartEventEmitter.emit('item-removed', {
            itemId: item.id,
            item,
            timestamp: new Date(),
            source: 'user',
          });

          toast({
            title: 'Removed from cart',
            description: 'Item has been removed from your cart',
          });
        } catch (error) {

          set((state) => ({
            cart: {
              ...state.cart,
              error: error instanceof Error ? error.message : 'Failed to remove item',
            },
          }));
          toast({
            title: 'Error',
            description: 'Failed to remove item',
            variant: 'destructive',
          });
        } finally {
          set((state) => ({ cart: { ...state.cart, isLoading: false } }));
        }
      },

      // Clear cart
      clearCart: () => {
        const { cart } = get();
        const clearedItems = [...cart.items];

        set((state) => ({
          cart: { ...state.cart, items: [], cartId: null, isOpen: false },
        }));

        // Emit cart cleared event
        cartEventEmitter.emit('cart-cleared', {
          clearedItems,
          timestamp: new Date(),
          source: 'user',
        });
      },

      // Get total items count
      getTotalItems: () => {
        const { cart } = get();
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((total, item) => total + item.quantity, 0);
      },

      // Get total price
      getTotalPrice: () => {
        const { cart } = get();
        if (!cart || !cart.items) return 0;
        return cart.items.reduce(
          (total, item) => total + item.pricing.totalPrice / 100,
          0
        );
      },
    },
  },
});
