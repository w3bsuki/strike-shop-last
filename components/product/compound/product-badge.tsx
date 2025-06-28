'use client';

import React from 'react';
import { useProductContext } from './product-context';

/**
 * Product.Badge - Display sale, new, and sold out badges
 */
export const ProductBadge = React.memo(() => {
  const { product } = useProductContext();
  
  return (
    <>
      {product.discount && (
        <div 
          className="product-card-discount" 
          role="status" 
          aria-label={`${product.discount} discount`}
        >
          {product.discount}
        </div>
      )}
      {product.isNew && !product.discount && (
        <div 
          className="product-card-new" 
          role="status" 
          aria-label="New product"
        >
          NEW
        </div>
      )}
      {product.soldOut && (
        <div 
          className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5"
          role="status"
          aria-label="Product is sold out"
        >
          SOLD OUT
        </div>
      )}
    </>
  );
});

ProductBadge.displayName = 'Product.Badge';