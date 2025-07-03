'use client';

import { createContext, useContext } from 'react';
import type { SimpleProduct } from '../types';

interface ProductAccessibility {
  productDescription: string;
  ariaIds: {
    title: string;
    description: string;
  };
}

interface ProductContextValue {
  product: SimpleProduct;
  priority: boolean;
  accessibility: ProductAccessibility;
}

const ProductContext = createContext<ProductContextValue | null>(null);

export function useProductContext(): ProductContextValue {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within a Product.Root component');
  }
  return context;
}

export { ProductContext };