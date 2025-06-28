'use client';

import React from 'react';
import { useProductContext } from './product-context';

/**
 * Product.Content - Product information display (title, pricing, colors)
 */
export const ProductContent = React.memo(() => {
  const { product, accessibility } = useProductContext();
  
  return (
    <div className="product-card-content min-h-[4.5rem]">
      <h3 id={accessibility.ariaIds.title} className="product-card-title font-typewriter">
        {product.name}
      </h3>
      <div className="flex items-baseline" role="group" aria-label="Product pricing">
        <span className="product-card-price font-typewriter font-bold" aria-label={`Current price ${product.price}`}>
          {product.price}
        </span>
        {product.originalPrice && (
          <span 
            className="product-card-original-price font-typewriter"
            aria-label={`Original price ${product.originalPrice}`}
          >
            {product.originalPrice}
          </span>
        )}
      </div>
      {product.colors && (
        <div className="text-[10px] text-[var(--subtle-text-color)] mt-0.5 font-typewriter">
          <span aria-label={`Available in ${product.colors} different colors`}>
            {product.colors} Colors
          </span>
        </div>
      )}
    </div>
  );
});

ProductContent.displayName = 'Product.Content';