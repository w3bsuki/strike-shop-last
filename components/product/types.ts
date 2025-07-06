// Essential product type definitions

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
  slug: string;
  colors?: number;
  description?: string;
  sizes?: string[];
  sku?: string;
  variants?: ProductVariant[];
  variantId?: string;
  title?: string; // Alternative to name for compatibility
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  prices?: any[];
}

// Simple product type for compatibility
export type SimpleProduct = BaseProduct;

export interface ProductCardProps {
  /** Product data - supports both simple and integrated formats */
  product: any;
  /** Optional CSS class names */
  className?: string;
  /** Whether to prioritize image loading */
  priority?: boolean;
}