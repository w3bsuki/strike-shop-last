'use client';

import React from 'react';
import { ProductCard as UnifiedProductCard } from './ProductCard';
import type { IntegratedProduct } from '@/types/integrated';

interface ProductCardProps {
  product: IntegratedProduct;
  priority?: boolean;
}

/**
 * Adapter Component - Maps IntegratedProduct to unified ProductCard
 * This maintains compatibility with existing code while using the unified component
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { content, pricing, badges } = product;
  const mainImage = content.images?.[0];

  // Map IntegratedProduct to simplified product format
  const simplifiedProduct = {
    id: product.id,
    name: content.name,
    price: pricing.displayPrice,
    originalPrice: pricing.displaySalePrice,
    discount:
      badges.isSale && pricing.discount
        ? `-${pricing.discount.percentage}%`
        : undefined,
    image:
      typeof mainImage === 'string'
        ? mainImage
        : mainImage?.asset && 'url' in mainImage.asset
          ? mainImage.asset.url
          : '/placeholder.svg',
    slug: product.slug,
    isNew: badges.isNew,
    soldOut: badges.isSoldOut,
    colors: content.categories?.length || undefined,
  };

  return <UnifiedProductCard product={simplifiedProduct} priority={priority} />;
}
