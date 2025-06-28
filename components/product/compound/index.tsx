'use client';

import React from 'react';
import { ProductRoot } from './product-root';
import { ProductImage } from './product-image';
import { ProductBadge } from './product-badge';
import { ProductActions } from './product-actions';
import { ProductContent } from './product-content';
import { ProductLink } from './product-link';
import type { ProductCardProps } from '../types';

// Export individual compound components
export { ProductRoot } from './product-root';
export { ProductImage } from './product-image';
export { ProductBadge } from './product-badge';
export { ProductActions } from './product-actions';
export { ProductContent } from './product-content';
export { ProductLink } from './product-link';

// Export compound component pattern
export const Product = {
  Root: ProductRoot,
  Image: ProductImage,
  Badge: ProductBadge,
  Actions: ProductActions,
  Content: ProductContent,
  Link: ProductLink
};

/**
 * Backward Compatible ProductCard - Maintains exact same API while using compound components internally
 */
export const ProductCard = React.memo(({ 
  product: rawProduct, 
  className = '', 
  priority = false 
}: ProductCardProps) => {
  return (
    <Product.Root product={rawProduct} className={className} priority={priority}>
      <Product.Image />
      <Product.Badge />
      <Product.Actions rawProduct={rawProduct} />
      <Product.Link>
        <Product.Content />
      </Product.Link>
    </Product.Root>
  );
});

ProductCard.displayName = 'ProductCard';