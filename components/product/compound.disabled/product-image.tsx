// HYBRID Component - Server Component with Client Component overlay
// Step 6: Core Web Vitals - Enhanced product image with Shopify CDN optimization
import React from 'react';
import Image from 'next/image';
import type { SimpleProduct } from '../types';
import type { IntegratedProduct } from '@/types/integrated';
import { ProductImageOverlay } from './product-image-overlay';
import { getOptimizedImageProps } from '@/lib/utils/shopify-image-optimization-simple';

interface ProductImageProps {
  className?: string;
  product?: SimpleProduct;
  priority?: boolean;
  rawProduct?: SimpleProduct | IntegratedProduct;
  index?: number; // For smart priority loading
}

/**
 * Product.Image - HYBRID: Server Component for image + Client Component for interactions
 * PERFORMANCE: Server-side image rendering, client-side interactions only
 * Step 6: Shopify CDN optimization + smart priority loading for Core Web Vitals
 */
export const ProductImage = React.memo(({ 
  className, 
  product, 
  priority = false,
  rawProduct,
  index = 0
}: ProductImageProps) => {
  // Fallback for when used without product prop (backward compatibility)
  if (!product || !rawProduct) {
    return <div className="aspect-[3/4] bg-gray-100" />;
  }
  
  // Smart priority loading: First 4 product images get priority for above-the-fold optimization
  const isAboveFold = index < 4;
  const shouldPrioritize = priority || isAboveFold;
  
  // Simple optimization for Shopify images
  const imageUrl = product.image || '/placeholder.svg';
  const imageProps = imageUrl.includes('cdn.shopify.com') 
    ? getOptimizedImageProps(imageUrl, 'card')
    : { src: imageUrl, sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 400px', quality: 85 };
  
  return (
    <div className={`relative bg-gray-100 aspect-[3/4] overflow-hidden group cursor-pointer ${className || ''}`}>
      {/* Server Component: Optimized Image + Static Badges */}
      <Image
        src={imageProps.src}
        alt={`${product.name}${product.soldOut ? ' - sold out' : ''}`}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        priority={shouldPrioritize}
        sizes={imageProps.sizes}
        quality={imageProps.quality}
      />
      
      {/* Product badges - Server Component */}
      {product.soldOut && (
        <div className="absolute top-3 left-3 z-20">
          <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-gray-800">
            Sold Out
          </span>
        </div>
      )}
      
      {product.originalPrice && (
        <div className="absolute top-3 left-3 z-20">
          <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-red-500">
            Sale
          </span>
        </div>
      )}
      
      {/* Client Component: Interactive overlay */}
      <ProductImageOverlay product={product} rawProduct={rawProduct} />
    </div>
  );
});

ProductImage.displayName = 'Product.Image';