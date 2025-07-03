'use client';

import React from 'react';
import { useIsWishlisted } from '@/lib/stores';
import { useCart } from '@/hooks/use-cart';
import { useProductActions } from '../hooks/use-product-actions';
import { WishlistButton } from './wishlist-button';
import { AddToCartButton } from './add-to-cart-button';
import type { SimpleProduct } from '../types';
import type { IntegratedProduct } from '@/types/integrated';

interface ProductActionsProps {
  product?: SimpleProduct;
  rawProduct?: SimpleProduct | IntegratedProduct;
}

/**
 * Product.Actions - Client Component for user interactions (KEPT CLIENT)
 * PERFORMANCE: Optimized prop passing instead of context
 */
export const ProductActions = React.memo(({ product, rawProduct }: ProductActionsProps) => {
  // Fallback for backward compatibility
  if (!product || !rawProduct) {
    return null;
  }
  const isWishlisted = useIsWishlisted(product.id);
  const { cart } = useCart();
  const isAddingItem = cart.isLoading;
  const actions = useProductActions(product, rawProduct);

  return (
    <>
      {/* Wishlist Button - Positioned absolutely over image */}
      <WishlistButton
        onClick={(e) => actions.handleWishlistToggle(e, isWishlisted)}
        isWishlisted={isWishlisted}
        productName={product.name}
      />
      
      {/* Add to Cart Button - Full width in action area */}
      <AddToCartButton 
        onClick={actions.handleAddToCart} 
        isLoading={isAddingItem}
        disabled={product.soldOut || false}
        productName={product.name}
        variant="full"
      />
    </>
  );
});

ProductActions.displayName = 'Product.Actions';