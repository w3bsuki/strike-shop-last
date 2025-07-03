// Server Component - CVE-2025-29927 Compliant Performance Optimization
import React from 'react';
import type { SimpleProduct } from '../types';
import type { ProductAccessibility } from '@/lib/product/utils';

interface ProductContentProps {
  product: SimpleProduct;
  accessibility: ProductAccessibility;
}

/**
 * Product.Content - Server Component for product information display
 * PERFORMANCE: Converted from Client to Server Component (massive improvement)
 */
export const ProductContent = React.memo(({ product, accessibility }: ProductContentProps) => {
  // Handle missing accessibility prop
  if (!product) {
    return null;
  }
  
  return (
    <div className="product-card-content p-3 space-y-2">
      {/* Product Title */}
      <h3 
        id={accessibility?.ariaIds?.title} 
        className="product-card-title font-typewriter text-xs font-normal line-clamp-2"
      >
        {product.name}
      </h3>
      
      {/* Pricing */}
      <div className="flex items-baseline gap-1" role="group" aria-label="Product pricing">
        <span 
          className="product-card-price font-typewriter text-xs font-bold" 
          aria-label={`Current price ${product.price}`}
        >
          {product.price}
        </span>
        {product.originalPrice && (
          <span 
            className="product-card-original-price font-typewriter text-[10px] text-gray-500 line-through ml-1"
            aria-label={`Original price ${product.originalPrice}`}
          >
            {product.originalPrice}
          </span>
        )}
      </div>
      
      {/* Colors */}
      {product.colors && (
        <div className="text-[10px] text-gray-500 font-professional">
          <span aria-label={`Available in ${product.colors} different colors`}>
            {product.colors} Colors
          </span>
        </div>
      )}
    </div>
  );
});

ProductContent.displayName = 'Product.Content';