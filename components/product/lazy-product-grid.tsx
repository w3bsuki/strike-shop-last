// Server Component - CVE-2025-29927 Compliant Performance Optimization
// Phase 3: Hybrid Component Optimization - Server first row + Client lazy loading
import React from 'react';
import { ProductCard } from './product-card';
import { LazyProductRows } from './lazy-product-rows';
import { Skeleton } from '@/components/ui/skeleton';
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

interface LazyProductGridProps {
  products: IntegratedProduct[];
  className?: string;
  itemsPerRow?: number;
}

/**
 * Hybrid Component - Server first row + Client lazy loading
 * PERFORMANCE: First row server-rendered for LCP, remaining rows lazy loaded
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

  // Split products: first row server-rendered, remaining rows lazy loaded
  const firstRowProducts = products.slice(0, itemsPerRow);
  const remainingProducts = products.slice(itemsPerRow);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* PERFORMANCE: First row server-rendered for LCP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {firstRowProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={transformToSimpleProduct(product)}
            priority={index < 4} // All first row items are priority
            className="touch-manipulation"
          />
        ))}
      </div>
      
      {/* Client component handles lazy loading for remaining products */}
      {remainingProducts.length > 0 && (
        <LazyProductRows 
          products={remainingProducts} 
          itemsPerRow={itemsPerRow}
          startingRowIndex={1}
        />
      )}
    </div>
  );
}

// Server Component - Product row skeleton (static)
export function ProductRowSkeleton({ itemsPerRow }: { itemsPerRow: number }) {
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
