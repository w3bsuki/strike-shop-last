import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/stores';
import { queryKeys } from '@/lib/query-client';
import { useToast } from '@/hooks/use-toast';
import type { WishlistItem } from '@/types/store';

/**
 * Wishlist synchronization hooks with optimistic updates
 * 
 * These hooks provide:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on server errors
 * - Local storage persistence
 * - Conflict resolution
 */

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  const wishlistActions = useStore((state) => state.actions.wishlist);
  const wishlist = useStore((state) => state.wishlist);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: WishlistItem) => {
      // Check if already in wishlist
      if (wishlist.items.some(w => w.id === item.id)) {
        throw new Error('Item already in wishlist');
      }
      
      // In a real app, this would sync with the server
      // For now, we just update local state
      wishlistActions.addToWishlist(item);
      
      // Simulate server sync
      await new Promise(resolve => setTimeout(resolve, 300));
    },
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.wishlist });

      // Snapshot the previous value
      const previousWishlist = wishlist.items;

      // Optimistically update
      useStore.setState((state) => ({
        wishlist: {
          ...state.wishlist,
          items: [...state.wishlist.items, newItem],
        },
      }));

      // Return a context with the previous and new data
      return { previousWishlist };
    },
    onError: (err, newItem, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousWishlist) {
        useStore.setState((state) => ({
          wishlist: {
            ...state.wishlist,
            items: context.previousWishlist,
          },
        }));
      }
      
      if (err.message === 'Item already in wishlist') {
        toast({
          title: 'Already in wishlist',
          description: 'Item is already in your wishlist',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add to wishlist',
          variant: 'destructive',
        });
      }
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Added to wishlist',
        description: `${variables.name} added to wishlist`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  const wishlistActions = useStore((state) => state.actions.wishlist);
  const wishlist = useStore((state) => state.wishlist);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (productId: string) => {
      // In a real app, this would sync with the server
      wishlistActions.removeFromWishlist(productId);
      
      // Simulate server sync
      await new Promise(resolve => setTimeout(resolve, 300));
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wishlist });

      const previousWishlist = wishlist.items;
      const removedItem = wishlist.items.find(item => item.id === productId);

      // Optimistically remove
      useStore.setState((state) => ({
        wishlist: {
          ...state.wishlist,
          items: state.wishlist.items.filter(item => item.id !== productId),
        },
      }));

      return { previousWishlist, removedItem };
    },
    onError: (err, productId, context) => {
      if (context?.previousWishlist) {
        useStore.setState((state) => ({
          wishlist: {
            ...state.wishlist,
            items: context.previousWishlist,
          },
        }));
      }
      
      toast({
        title: 'Error',
        description: 'Failed to remove from wishlist',
        variant: 'destructive',
      });
    },
    onSuccess: (data, productId, context) => {
      if (context?.removedItem) {
        toast({
          title: 'Removed from wishlist',
          description: `${context.removedItem.name} removed from wishlist`,
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
    },
  });
}

export function useClearWishlist() {
  const queryClient = useQueryClient();
  const wishlistActions = useStore((state) => state.actions.wishlist);
  const wishlist = useStore((state) => state.wishlist);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      // In a real app, this would sync with the server
      wishlistActions.clearWishlist();
      
      // Simulate server sync
      await new Promise(resolve => setTimeout(resolve, 300));
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wishlist });

      const previousWishlist = wishlist.items;

      // Optimistically clear
      useStore.setState((state) => ({
        wishlist: {
          ...state.wishlist,
          items: [],
        },
      }));

      return { previousWishlist };
    },
    onError: (err, variables, context) => {
      if (context?.previousWishlist) {
        useStore.setState((state) => ({
          wishlist: {
            ...state.wishlist,
            items: context.previousWishlist,
          },
        }));
      }
      
      toast({
        title: 'Error',
        description: 'Failed to clear wishlist',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Wishlist cleared',
        description: 'All items removed from wishlist',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
    },
  });
}

export function useToggleWishlist() {
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const wishlistActions = useStore((state) => state.actions.wishlist);

  return useMutation({
    mutationFn: async (item: WishlistItem) => {
      const isInWishlist = wishlistActions.isInWishlist(item.id);
      
      if (isInWishlist) {
        await removeFromWishlist.mutateAsync(item.id);
      } else {
        await addToWishlist.mutateAsync(item);
      }
    },
  });
}