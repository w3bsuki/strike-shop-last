'use client';

import React from 'react';
import Link from 'next/link';
import { useProductContext } from './product-context';

interface ProductLinkProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Product.Link - Navigation wrapper for product content
 */
export const ProductLink = React.memo(({ children, className }: ProductLinkProps) => {
  const { product, accessibility } = useProductContext();
  
  return (
    <Link 
      href={`/product/${product.slug}`} 
      className={`block focus:outline-2 focus:outline-offset-2 focus:outline-primary rounded-none ${className || ''}`}
      aria-describedby={accessibility.ariaIds.description}
    >
      {children}
    </Link>
  );
});

ProductLink.displayName = 'Product.Link';