'use client';

import type React from 'react';
import { ProductShowcase } from '@/components/product/product-showcase';

type Product = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  images?: string[];
  isNew?: boolean;
  soldOut?: boolean;
  slug: string;
  colors?: number;
  description?: string;
  sizes?: string[];
  sku?: string;
  variants?: Array<{
    id: string;
    title: string;
    sku?: string;
    prices?: any[];
  }>;
};

interface ProductScrollProps {
  title: string;
  products: Product[];
  viewAllLink?: string;
}

// Legacy wrapper component for backward compatibility
// This wraps the new modular ProductShowcase component
export default function ProductScroll({
  title,
  products,
  viewAllLink,
}: ProductScrollProps) {
  return (
    <ProductShowcase
      title={title}
      products={products}
      viewAllLink={viewAllLink}
      layout="scroll"
      sectionSpacing="default"
    />
  );
}
