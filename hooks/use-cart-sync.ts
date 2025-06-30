import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/stores';
import { queryKeys } from '@/lib/query-client';
import { toast } from '@/hooks/use-toast';
import type { CartItem } from '@/types/store';
import { createProductId, createVariantId, createLineItemId, createSlug, createQuantity, createPrice, createImageURL } from '@/types/branded';

/**
 * Cart synchronization hooks with optimistic updates
 * 
 * These hooks provide:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on server errors
 * - Server state synchronization
 * - Conflict resolution
 */

interface AddToCartParams {
  productId: string;
  variantId: string;
  quantity: number;
  productData?: {
    name: string;
    image?: string;
    price: number;
    slug: string;
    size?: string;
  };
}

interface UpdateQuantityParams {
  itemId: string;
  size: string;
  quantity: number;
}

interface RemoveItemParams {
  itemId: string;
  size: string;
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const cartActions = useStore((state) => state.actions.cart);
  const cart = useStore((state) => state.cart);

  return useMutation({
    mutationFn: async ({ productId, variantId, quantity, productData: _productData }: AddToCartParams) => {
      // Perform the actual server mutation
      await cartActions.addItem(productId, variantId, quantity);
    },
    onMutate: async ({ productId, variantId, quantity, productData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart });

      // Snapshot the previous value
      const previousCart = cart.items;

      // Optimistically update the UI
      if (productData) {
        const optimisticItem: CartItem = {
          id: createProductId(productId),
          lineItemId: createLineItemId(`temp-${Date.now()}`), // Temporary ID
          variantId: createVariantId(variantId),
          name: productData.name,
          slug: createSlug(productData.slug),
          size: productData.size || 'One Size',
          quantity: createQuantity(quantity),
          image: productData.image ? createImageURL(productData.image) : null,
          pricing: {
            unitPrice: createPrice(productData.price),
            totalPrice: createPrice(productData.price * quantity),
            displayUnitPrice: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(productData.price / 100),
            displayTotalPrice: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format((productData.price * quantity) / 100),
          },
        };

        // Optimistically update the store
        useStore.setState((state) => ({
          cart: {
            ...state.cart,
            items: [...state.cart.items, optimisticItem],
            isOpen: true,
          },
        }));
      }

      // Return a context object with the snapshot
      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCart) {
        useStore.setState((state) => ({
          cart: {
            ...state.cart,
            items: context.previousCart,
          },
        }));
      }
      
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      // Invalidate and refetch cart data
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();
  const cartActions = useStore((state) => state.actions.cart);
  const cart = useStore((state) => state.cart);

  return useMutation({
    mutationFn: async ({ itemId, quantity }: UpdateQuantityParams) => {
      await cartActions.updateItemQuantity(itemId, quantity);
    },
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart });

      const previousCart = cart.items;

      // Optimistically update quantity
      useStore.setState((state) => ({
        cart: {
          ...state.cart,
          items: state.cart.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity: createQuantity(quantity),
                  pricing: {
                    ...item.pricing,
                    totalPrice: createPrice((item.pricing.unitPrice as number) * quantity),
                    displayTotalPrice: new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(((item.pricing.unitPrice as number) * quantity) / 100),
                  },
                }
              : item
          ),
        },
      }));

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart) {
        useStore.setState((state) => ({
          cart: {
            ...state.cart,
            items: context.previousCart,
          },
        }));
      }
      
      toast({
        title: 'Error',
        description: 'Failed to update quantity. Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const cartActions = useStore((state) => state.actions.cart);
  const cart = useStore((state) => state.cart);

  return useMutation({
    mutationFn: async ({ itemId }: RemoveItemParams) => {
      await cartActions.removeItem(itemId);
    },
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart });

      const previousCart = cart.items;

      // Optimistically remove the item
      useStore.setState((state) => ({
        cart: {
          ...state.cart,
          items: state.cart.items.filter(
            (item) => item.id !== itemId
          ),
        },
      }));

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart) {
        useStore.setState((state) => ({
          cart: {
            ...state.cart,
            items: context.previousCart,
          },
        }));
      }
      
      toast({
        title: 'Error',
        description: 'Failed to remove item. Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useSyncCart() {
  const queryClient = useQueryClient();
  const cartActions = useStore((state) => state.actions.cart);

  return useMutation({
    mutationFn: async () => {
      // Initialize cart and sync with server
      await cartActions.initializeCart();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}