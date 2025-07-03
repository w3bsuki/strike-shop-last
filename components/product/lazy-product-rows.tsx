'use client';

import React from 'react';
import { ProductCard } from './product-card';
import { LazyLoad } from '@/components/lazy-load';
import { ProductRowSkeleton } from './lazy-product-grid';
import type { IntegratedProduct } from '@/types/integrated';
import type { SimpleProduct } from './types';

// Transform IntegratedProduct to SimpleProduct for ProductCard
const transformToSimpleProduct = (product: IntegratedProduct): SimpleProduct => {
  const mainImageUrl = product.content?.images?.[0]?.url || '/placeholder.svg?height=400&width=400';
  const basePrice = product.pricing?.basePrice || 0;
  const salePrice = product.pricing?.salePrice;
  
  return {
    id: product.id,
    name: product.content?.name || 'Unnamed Product',
    price: `€${basePrice}`,
    originalPrice: salePrice ? `€${basePrice}` : undefined,
    discount: salePrice ? `-${Math.round(((basePrice - salePrice) / basePrice) * 100)}%` : undefined,
    image: mainImageUrl,
    slug: product.slug,
    isNew: product.badges?.isNew || false,
    soldOut: product.badges?.isSoldOut || false,
    colors: product.commerce?.variants?.length || 1,
  };
};

interface LazyProductRowsProps {
  products: IntegratedProduct[];
  itemsPerRow: number;
  startingRowIndex: number;
}

/**
 * Client Component - Progressive lazy loading for remaining product rows
 * PERFORMANCE: Only loaded when user scrolls, reducing initial bundle
 */
export function LazyProductRows({
  products,
  itemsPerRow,
  startingRowIndex,
}: LazyProductRowsProps) {
  // Split remaining products into rows for progressive loading
  const rows: IntegratedProduct[][] = [];
  for (let i = 0; i < products.length; i += itemsPerRow) {
    rows.push(products.slice(i, i + itemsPerRow));
  }

  return (
    <>
      {rows.map((row, rowIndex) => (
        <LazyLoad
          key={startingRowIndex + rowIndex}
          fallback={<ProductRowSkeleton itemsPerRow={itemsPerRow} />}
          threshold={0.1}
          rootMargin="200px"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {row.map((product) => (
              <ProductCard
                key={product.id}
                product={transformToSimpleProduct(product)}
                priority={false} // Lazy loaded products are not priority
                className="touch-manipulation"
              />
            ))}
          </div>
        </LazyLoad>
      ))}
    </>
  );
}