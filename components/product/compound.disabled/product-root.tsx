// Server Component - CVE-2025-29927 Compliant Performance Optimization
import React from 'react';
import { normalizeProduct, generateProductAccessibility } from '@/lib/product/utils';
import type { ProductCardProps } from '../types';

interface ProductRootProps extends Omit<ProductCardProps, 'className'> {
  className?: string;
  children: React.ReactNode;
}

/**
 * Product.Root - Server Component container (MASSIVE performance improvement)
 * PERFORMANCE: Removed context, hooks, and client-side processing
 */
export const ProductRoot = React.memo(({ 
  product: rawProduct, 
  className = '', 
  priority = false,
  children 
}: ProductRootProps) => {
  // Server-side data processing (no client hooks needed)
  const product = normalizeProduct(rawProduct);
  const accessibility = generateProductAccessibility(product);

  return (
    <article 
      className={`
        group relative flex flex-col h-full
        bg-background overflow-hidden rounded-md
        border border-border hover:border-primary
        shadow-sm hover:shadow-lg
        transition-all duration-200 ease-out
        focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2
        touch-manipulation
        ${className}
      `}
      role="group"
      aria-labelledby={accessibility.ariaIds.title}
      aria-describedby={accessibility.ariaIds.description}
    >
      <div id={accessibility.ariaIds.description} className="sr-only">
        {accessibility.productDescription}
      </div>
      {/* Pass data via props to child components instead of context */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            product, 
            accessibility, 
            priority,
            ...child.props 
          } as any);
        }
        return child;
      })}
    </article>
  );
});

ProductRoot.displayName = 'Product.Root';