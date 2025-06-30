'use client';

import { useMemo } from 'react';
import { useWishlistActions } from '@/lib/stores';
import type { WishlistItem } from '@/lib/wishlist-store';
import { useQuickView } from '@/contexts/QuickViewContext';
import { useAria } from '@/components/accessibility/aria-helpers';
import { useCartActions } from '@/hooks/use-cart';
import { toast } from '@/hooks/use-toast';
import type { SimpleProduct } from '../types';
import type { IntegratedProduct } from '@/types/integrated';
import { isIntegratedProduct } from './use-product-normalization';

interface ProductActions {
  handleWishlistToggle: (e: React.MouseEvent, isWishlisted: boolean) => void;
  handleQuickView: (e: React.MouseEvent) => void;
  handleAddToCart: (e: React.MouseEvent) => Promise<void>;
}

/**
 * Hook to manage product action handlers (wishlist, quick view, cart)
 */
export function useProductActions(
  product: SimpleProduct,
  rawProduct: SimpleProduct | IntegratedProduct
): ProductActions {
  const { addToWishlist, removeFromWishlist } = useWishlistActions();
  const { openQuickView } = useQuickView();
  const { announceToScreenReader } = useAria();
  const { addItem } = useCartActions();

  // Wishlist item for add operation
  const wishlistItem: WishlistItem = useMemo(() => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    slug: product.slug,
  }), [product]);

  return useMemo(() => ({
    handleWishlistToggle: (e: React.MouseEvent, isWishlisted: boolean) => {
      e.preventDefault();
      e.stopPropagation();

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(isWishlisted ? 50 : [100, 50, 100]);
      }

      if (isWishlisted) {
        removeFromWishlist(product.id);
        announceToScreenReader(`${product.name} removed from wishlist`, 'polite');
      } else {
        addToWishlist(wishlistItem);
        announceToScreenReader(`${product.name} added to wishlist`, 'polite');
      }
    },

    handleQuickView: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openQuickView(product.id);
      announceToScreenReader(`Quick view opened for ${product.name}`, 'polite');
    },

    handleAddToCart: async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // For integrated products, check if we have variant information
      if (isIntegratedProduct(rawProduct) && rawProduct.commerce?.variants?.length > 0) {
        // Use the first variant as default
        const defaultVariant = rawProduct.commerce.variants[0];
        
        if (defaultVariant) {
          try {
            await addItem(rawProduct.id, defaultVariant.id, 1);
          announceToScreenReader(`${product.name} added to cart`, 'polite');
          toast({
            title: 'Added to cart',
            description: `${product.name} has been added to your cart.`,
          });
          } catch (error) {
            console.error('Error adding item to cart:', error);
            announceToScreenReader(`Failed to add ${product.name} to cart`, 'assertive');
            toast({
              title: 'Error',
              description: 'Failed to add item to cart. Please try again.',
              variant: 'destructive',
            });
          }
        }
      } else {
        // For simple products or products without variants, redirect to product page
        announceToScreenReader(`Please select options for ${product.name} on the product page`, 'polite');
        toast({
          title: 'Select Options',
          description: 'Please visit the product page to select size and add to cart.',
        });
        // Navigate to product page after a short delay
        setTimeout(() => {
          window.location.href = `/product/${product.slug}`;
        }, 1000);
      }
    },
  }), [product, rawProduct, wishlistItem, addToWishlist, removeFromWishlist, openQuickView, announceToScreenReader, addItem]);
}