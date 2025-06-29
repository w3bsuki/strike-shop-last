/**
 * Integrated Type Definitions
 * Combines Sanity content with Medusa commerce data
 */

import type { SanityImage, SanityBlock, SanityCategory } from './sanity';
import type {
  MedusaProduct,
  MedusaProductVariant,
} from './medusa';
import type { 
  ProductId, VariantId, LineItemId, ImageURL, 
  Slug, SKU, Price, Quantity, CurrencyCode 
} from './branded';

/**
 * Integrated Product combining Sanity content and Medusa commerce data
 */
export interface IntegratedProduct {
  // Core identifiers
  id: ProductId; // Medusa ID
  sanityId?: string;
  slug: Slug;
  sku?: SKU;

  // Content from Sanity
  content: {
    name: string;
    description?: string;
    details?: SanityBlock[];
    images: Array<{
      url: ImageURL;
      alt: string;
      width: number;
      height: number;
    } | SanityImage>;
    categories?: SanityCategory[];
    tags?: string[];
    brand?: string;
    material?: string;
    care?: string[];
    features?: string[];
    story?: SanityBlock[];
    sizeGuide?: {
      measurements?: Array<{
        size: string;
        chest?: number;
        waist?: number;
        hips?: number;
        length?: number;
      }>;
      notes?: string;
    };
    sustainability?: {
      materials?: string[];
      certifications?: string[];
      description?: string;
    };
  };

  // Commerce data from Medusa
  commerce: {
    medusaProduct?: MedusaProduct;
    variants: IntegratedVariant[];
    prices: IntegratedPrice[];
    inventory: {
      available: boolean;
      quantity?: number;
    };
    tax?: {
      rate: number;
      included: boolean;
    };
  };

  // Computed/merged fields
  pricing: {
    currency: CurrencyCode;
    basePrice: Price;
    salePrice?: Price;
    displayPrice: string;
    displaySalePrice?: string;
    discount?: {
      amount: Price;
      percentage: number;
    };
  };

  // UI/Display helpers
  badges: {
    isNew?: boolean;
    isSale?: boolean;
    isLimited?: boolean;
    isSoldOut?: boolean;
  };

  // Metadata
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

/**
 * Integrated Product Variant
 */
export interface IntegratedVariant {
  id: VariantId;
  title: string;
  sku?: SKU;

  // Options
  options: {
    size?: string;
    color?: {
      name: string;
      hex?: string;
    };
    [key: string]: unknown;
  };

  // Pricing
  prices: IntegratedPrice[];
  pricing: {
    currency: CurrencyCode;
    price: Price;
    salePrice?: Price;
    displayPrice: string;
    displaySalePrice?: string;
  };

  // Inventory
  inventory: {
    available: boolean;
    quantity?: Quantity;
    allowBackorder?: boolean;
  };

  // Images (variant-specific)
  images?: SanityImage[];

  // Original Medusa variant
  medusaVariant?: MedusaProductVariant;
}

/**
 * Integrated Price
 */
export interface IntegratedPrice {
  id: string;
  currencyCode: CurrencyCode;
  amount: Price;
  saleAmount?: Price;
  regionId?: string;
  minQuantity?: Quantity;
  maxQuantity?: Quantity;
  includesTax?: boolean;
}

/**
 * Cart Item with integrated data
 */
export interface IntegratedCartItem {
  id: ProductId;
  lineItemId?: LineItemId;
  productId: ProductId;
  variantId: VariantId;

  // Display info
  name: string;
  image: ImageURL;
  slug: Slug;
  size: string;
  color?: string;
  sku?: SKU;

  // Pricing
  pricing: {
    currency: CurrencyCode;
    unitPrice: Price;
    unitSalePrice?: Price;
    displayUnitPrice: string;
    displayUnitSalePrice?: string;
    totalPrice: Price;
    displayTotalPrice: string;
  };

  // Quantity
  quantity: Quantity;
  maxQuantity?: Quantity;
}

/**
 * Category with products
 */
export interface IntegratedCategory extends SanityCategory {
  products?: IntegratedProduct[];
  productCount?: number;
  subcategories?: IntegratedCategory[];
}

/**
 * Collection with products
 */
export interface IntegratedCollection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: SanityImage;
  products: IntegratedProduct[];
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

/**
 * Search result
 */
export interface IntegratedSearchResult {
  products: IntegratedProduct[];
  categories: IntegratedCategory[];
  collections: IntegratedCollection[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Filters for product listing
 */
export interface ProductFilters {
  categories?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  sizes?: string[];
  colors?: string[];
  brands?: string[];
  tags?: string[];
  inStock?: boolean;
  onSale?: boolean;
  isNew?: boolean;
}

/**
 * Sort options
 */
export type ProductSortOption =
  | 'relevance'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'
  | 'newest'
  | 'best-selling';

/**
 * Product listing response
 */
export interface ProductListingResponse {
  products: IntegratedProduct[];
  filters: {
    categories: Array<{ value: string; label: string; count: number }>;
    sizes: Array<{ value: string; label: string; count: number }>;
    colors: Array<{
      value: string;
      label: string;
      hex?: string;
      count: number;
    }>;
    brands: Array<{ value: string; label: string; count: number }>;
    priceRange: { min: number; max: number };
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  applied: ProductFilters;
  sort: ProductSortOption;
}
