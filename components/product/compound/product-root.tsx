'use client';

import React from 'react';
import { ProductContext } from './product-context';
import { useProductNormalization } from '../hooks/use-product-normalization';
import { useProductAccessibility } from '../hooks/use-product-accessibility';
import type { ProductCardProps } from '../types';

interface ProductRootProps extends Omit<ProductCardProps, 'className'> {
  className?: string;
  children: React.ReactNode;
}

/**
 * Product.Root - Root container component that provides context for all child components
 */
export const ProductRoot = React.memo(({ 
  product: rawProduct, 
  className = '', 
  priority = false,
  children 
}: ProductRootProps) => {
  const product = useProductNormalization(rawProduct);
  const accessibility = useProductAccessibility(product);

  const contextValue = {
    product,
    priority,
    accessibility
  };

  return (
    <ProductContext.Provider value={contextValue}>
      <article 
        className={`product-card group ${className} focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 touch-manipulation`}
        role="group"
        aria-labelledby={accessibility.ariaIds.title}
        aria-describedby={accessibility.ariaIds.description}
      >
        <div id={accessibility.ariaIds.description} className="sr-only">
          {accessibility.productDescription}
        </div>
        {children}
      </article>
    </ProductContext.Provider>
  );
});

ProductRoot.displayName = 'Product.Root';