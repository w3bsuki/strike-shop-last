'use client';

import { useMemo } from 'react';
import type { SimpleProduct } from '../types';
import type { IntegratedProduct } from '@/types/integrated';

/**
 * Type guard to check if product is in integrated format
 */
function isIntegratedProduct(product: SimpleProduct | IntegratedProduct): product is IntegratedProduct {
  return 'content' in product && 'pricing' in product && 'badges' in product;
}

/**
 * Normalize product data from different formats into a simple format
 */
function normalizeProduct(product: SimpleProduct | IntegratedProduct): SimpleProduct {
  if (!isIntegratedProduct(product)) {
    return product;
  }

  const { content, pricing, badges } = product;
  const mainImage = content.images?.[0];
  
  return {
    id: product.id,
    name: content.name,
    price: pricing.displayPrice,
    image: typeof mainImage === 'string'
      ? mainImage
      : mainImage && 'asset' in mainImage && mainImage.asset && 'url' in mainImage.asset
        ? (mainImage.asset as any).url as string
        : mainImage && 'url' in mainImage
          ? (mainImage as any).url as string
          : '/placeholder.svg',
    slug: product.slug,
    ...(pricing.displaySalePrice && { originalPrice: pricing.displaySalePrice }),
    ...(badges.isSale && pricing.discount && { discount: `-${pricing.discount.percentage}%` }),
    ...(badges.isNew && { isNew: badges.isNew }),
    ...(badges.isSoldOut && { soldOut: badges.isSoldOut }),
    ...(content.categories?.length && { colors: content.categories.length })
  };
}

/**
 * Hook to normalize product data with memoization for performance
 */
export function useProductNormalization(rawProduct: SimpleProduct | IntegratedProduct): SimpleProduct {
  return useMemo(() => normalizeProduct(rawProduct), [rawProduct]);
}

export { isIntegratedProduct, normalizeProduct };