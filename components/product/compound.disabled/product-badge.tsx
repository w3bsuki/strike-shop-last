// Server Component - CVE-2025-29927 Compliant Performance Optimization
import React from 'react';
import type { SimpleProduct } from '../types';

interface ProductBadgeProps {
  product?: SimpleProduct;
}

/**
 * Product.Badge - Server Component for badge display (PERFORMANCE improvement)
 */
export const ProductBadge = React.memo(({ product }: ProductBadgeProps) => {
  // Fallback for backward compatibility
  if (!product) {
    return null;
  }
  
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
          className="absolute top-2 right-2 bg-destructive text-white text-xs font-bold px-1.5 py-0.5"
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