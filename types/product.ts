import type { ProductId, CategoryId, TagId, ImageURL } from './branded';

export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  available: boolean;
}

export interface ProductCategory {
  id: CategoryId;
  name: string;
  handle: string;
}

export interface ProductTag {
  id: TagId;
  value: string;
}

export interface ProductPageData {
  id: ProductId;
  title: string;
  description: string;
  price: string;
  images: ImageURL[];
  variants: ProductVariant[];
  categories: ProductCategory[];
  tags: ProductTag[];
  material?: string;
  metadata?: Record<string, any>;
}