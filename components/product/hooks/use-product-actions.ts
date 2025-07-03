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
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      try {
        let variantId: string | null = null;
        
        // For integrated products, check if we have variant information
        if (isIntegratedProduct(rawProduct) && rawProduct.commerce?.variants?.length > 0) {
          // Use the first variant as default
          const defaultVariant = rawProduct.commerce.variants[0];
          if (defaultVariant) {
            variantId = defaultVariant.id;
          }
        } 
        // Check if rawProduct has variants array (common in Shopify data)
        else if ('variants' in rawProduct && Array.isArray((rawProduct as any).variants) && (rawProduct as any).variants.length > 0) {
          variantId = (rawProduct as any).variants[0].id;
        }
        // Check if rawProduct has a single variant property
        else if ('variant' in rawProduct && (rawProduct as any).variant?.id) {
          variantId = (rawProduct as any).variant.id;
        }
        // Last resort: construct a variant ID from product ID (may fail)
        else {
          // Create a Shopify-style variant ID from product ID
          const productIdPart = product.id.replace('gid://shopify/Product/', '');
          variantId = `gid://shopify/ProductVariant/${productIdPart}01`; // Common pattern for single-variant products
        }
        
        if (variantId) {
          console.log('Adding to cart:', { productId: product.id, variantId, quantity: 1 });
          await addItem(product.id, variantId, 1);
          console.log('Successfully added to cart');
        } else {
          console.error('No variant ID found for product:', product);
          throw new Error('Product variant not found. Please visit the product page to select options.');
        }
        
        // Success feedback
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
    },
  }), [product, rawProduct, wishlistItem, addToWishlist, removeFromWishlist, openQuickView, announceToScreenReader, addItem]);
}