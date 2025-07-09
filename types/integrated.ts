/**
 * Integrated Type Definitions
 * For future Shopify integration
 */

import type { SanityImage, SanityBlock, SanityCategory } from './sanity';
import type { 
  ProductId, VariantId, LineItemId, ImageURL, 
  Slug, SKU, Price, Quantity, CurrencyCode 
} from './branded';

/**
 * Integrated Product - will be used with Shopify
 */
export interface IntegratedProduct {
  // Core identifiers
  id: ProductId;
  slug: Slug;
  sku?: SKU;

  // Content
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

  // Commerce data - will come from Shopify
  commerce: {
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