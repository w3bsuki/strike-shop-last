// Essential product type definitions
import type { IntegratedProduct } from '../../types/integrated';
import type { MoneyV2 } from '../../lib/shopify/types';

export interface BaseProduct {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  images?: string[];
  isNew?: boolean;
  soldOut?: boolean;
  lowStock?: boolean;
  slug: string;
  colors?: string[];
  description?: string;
  sizes?: string[];
  sku?: string;
  variants?: ProductVariant[];
  variantId?: string;
  title?: string; // Alternative to name for compatibility
  rating?: number;
  reviewCount?: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  prices?: MoneyV2[];
}

// Simple product type for compatibility
export type SimpleProduct = BaseProduct;

export interface ProductCardProps {
  /** Product data - supports both simple and integrated formats */
  product: IntegratedProduct | BaseProduct;
  /** Optional CSS class names */
  className?: string;
  /** Whether to prioritize image loading */
  priority?: boolean;
}