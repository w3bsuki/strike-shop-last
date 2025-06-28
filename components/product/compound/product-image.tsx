'use client';

import React from 'react';
import Image from 'next/image';
import { useProductContext } from './product-context';

interface ProductImageProps {
  className?: string;
}

/**
 * Product.Image - Optimized image component with proper sizing and accessibility
 */
export const ProductImage = React.memo(({ className }: ProductImageProps) => {
  const { product, priority } = useProductContext();
  
  return (
    <div className={`product-card-image-wrapper relative bg-gray-100 aspect-[3/4] overflow-hidden rounded-lg ${className || ''}`}>
      <Image
        src={product.image || '/placeholder.svg'}
        alt={`${product.name}${product.soldOut ? ' - sold out' : ''}`}
        fill
        className="object-cover"
        priority={priority}
        sizes="(max-width: 640px) 176px, (max-width: 768px) 192px, (max-width: 1024px) 208px, 240px"
        quality={90}
      />
    </div>
  );
});

ProductImage.displayName = 'Product.Image';