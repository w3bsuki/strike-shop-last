'use client';

import React from 'react';
import { useIsWishlisted } from '@/lib/stores';
import { useCart } from '@/hooks/use-cart';
import { useProductContext } from './product-context';
import { useProductActions } from '../hooks/use-product-actions';
import { QuickViewButton } from './quick-view-button';
import { AddToCartButton } from './add-to-cart-button';
import { WishlistButton } from './wishlist-button';

interface ProductActionsProps {
  rawProduct: import('../types').SimpleProduct | import('@/types/integrated').IntegratedProduct;
}

/**
 * Product.Actions - Interactive action buttons (quick view, cart, wishlist)
 */
export const ProductActions = React.memo(({ rawProduct }: ProductActionsProps) => {
  const { product } = useProductContext();
  const isWishlisted = useIsWishlisted(product.id);
  const { isAddingItem } = useCart();
  const actions = useProductActions(product, rawProduct);

  return (
    <>
      {/* Action Buttons - Bottom Center */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-20">
        <QuickViewButton onClick={actions.handleQuickView} productName={product.name} />
        <AddToCartButton 
          onClick={actions.handleAddToCart} 
          isLoading={isAddingItem}
          disabled={product.soldOut || false}
          productName={product.name}
        />
      </div>

      {/* Wishlist Button - Top Right */}
      <WishlistButton
        onClick={(e) => actions.handleWishlistToggle(e, isWishlisted)}
        isWishlisted={isWishlisted}
        productName={product.name}
      />
    </>
  );
});

ProductActions.displayName = 'Product.Actions';