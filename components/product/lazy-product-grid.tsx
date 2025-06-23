'use client';

import React from 'react';
import { ProductCard } from './product-card';
import { LazyLoad } from '@/components/lazy-load';
import { Skeleton } from '@/components/ui/skeleton';
import type { IntegratedProduct } from '@/types/integrated';

interface LazyProductGridProps {
  products: IntegratedProduct[];
  className?: string;
  itemsPerRow?: number;
}

/**
 * Client Component - Lazy-loaded Product Grid
 * Renders products in batches as user scrolls
 */
export function LazyProductGrid({
  products,
  className = '',
  itemsPerRow = 4,
}: LazyProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  // Split products into rows for better lazy loading
  const rows: IntegratedProduct[][] = [];
  for (let i = 0; i < products.length; i += itemsPerRow) {
    rows.push(products.slice(i, i + itemsPerRow));
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {rows.map((row, rowIndex) => (
        <LazyLoad
          key={rowIndex}
          fallback={<ProductRowSkeleton itemsPerRow={itemsPerRow} />}
          threshold={0.1}
          rootMargin="200px"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {row.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={rowIndex === 0 && index < 4} // Only prioritize first row
                className="touch-manipulation"
              />
            ))}
          </div>
        </LazyLoad>
      ))}
    </div>
  );
}

function ProductRowSkeleton({ itemsPerRow }: { itemsPerRow: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: itemsPerRow }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
