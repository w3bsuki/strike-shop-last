import React from 'react';
import { ProductCard } from './product-card';
import type { IntegratedProduct } from '@/types/integrated';

interface ProductGridProps {
  products: IntegratedProduct[];
  className?: string;
  priority?: boolean; // For above-the-fold products
}

/**
 * Server Component - Product Grid
 * Renders a grid of product cards
 */
export function ProductGrid({
  products,
  className = '',
  priority = false,
}: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 ${className}`}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={priority && index < 4} // Prioritize first 4 images if priority is true
          className="touch-manipulation"
        />
      ))}
    </div>
  );
}
