'use client';

import { useMemo } from 'react';
import type { SimpleProduct } from '../types';

interface ProductAccessibility {
  productDescription: string;
  ariaIds: {
    title: string;
    description: string;
  };
}

/**
 * Hook to generate accessibility features for product components
 */
export function useProductAccessibility(product: SimpleProduct): ProductAccessibility {
  return useMemo(() => ({
    productDescription: [
      product.name,
      product.discount && `on sale with ${product.discount} discount`,
      product.isNew && 'new arrival',
      product.soldOut && 'currently sold out',
      product.originalPrice 
        ? `was ${product.originalPrice}, now ${product.price}`
        : `priced at ${product.price}`,
      product.colors && `available in ${product.colors} colors`,
    ].filter(Boolean).join(', '),
    ariaIds: {
      title: `product-title-${product.id}`,
      description: `product-description-${product.id}`,
    },
  }), [product]);
}