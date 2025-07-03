// Server Component - CVE-2025-29927 Compliant Performance Optimization
import React from 'react';
import Link from 'next/link';
import type { SimpleProduct } from '../types';
import type { ProductAccessibility } from '@/lib/product/utils';

interface ProductLinkProps {
  children: React.ReactNode;
  className?: string;
  product?: SimpleProduct;
  accessibility?: ProductAccessibility;
}

/**
 * Product.Link - Server Component for navigation (PERFORMANCE improvement)
 */
export const ProductLink = React.memo(({ 
  children, 
  className, 
  product, 
  accessibility 
}: ProductLinkProps) => {
  // Fallback for backward compatibility
  if (!product) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <Link 
      href={`/product/${product.slug}`} 
      className={`block focus:outline-2 focus:outline-offset-2 focus:outline-primary rounded-none ${className || ''}`}
      aria-describedby={accessibility?.ariaIds?.description}
    >
      {children}
    </Link>
  );
});

ProductLink.displayName = 'Product.Link';