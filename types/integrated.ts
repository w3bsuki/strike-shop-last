/**
 * Integrated Type Definitions
 * Combines Sanity content with Medusa commerce data
 */

import type { SanityImage, SanityBlock, SanityCategory } from './sanity'
import type { MedusaProduct, MedusaProductVariant, MedusaPrice } from './medusa'

/**
 * Integrated Product combining Sanity content and Medusa commerce data
 */
export interface IntegratedProduct {
  // Core identifiers
  id: string // Medusa ID
  sanityId?: string
  slug: string
  sku?: string

  // Content from Sanity
  content: {
    name: string
    description?: string
    details?: SanityBlock[]
    images: SanityImage[]
    categories?: SanityCategory[]
    tags?: string[]
    brand?: string
    material?: string
    care?: string[]
    features?: string[]
    story?: SanityBlock[]
    sizeGuide?: {
      measurements?: Array<{
        size: string
        chest?: number
        waist?: number
        hips?: number
        length?: number
      }>
      notes?: string
    }
    sustainability?: {
      materials?: string[]
      certifications?: string[]
      description?: string
    }
  }

  // Commerce data from Medusa
  commerce: {
    medusaProduct?: MedusaProduct
    variants: IntegratedVariant[]
    prices: IntegratedPrice[]
    inventory: {
      available: boolean
      quantity?: number
    }
    tax?: {
      rate: number
      included: boolean
    }
  }

  // Computed/merged fields
  pricing: {
    currency: string
    basePrice: number
    salePrice?: number
    displayPrice: string
    displaySalePrice?: string
    discount?: {
      amount: number
      percentage: number
    }
  }

  // UI/Display helpers
  badges: {
    isNew?: boolean
    isSale?: boolean
    isLimited?: boolean
    isSoldOut?: boolean
  }

  // Metadata
  metadata?: {
    title?: string
    description?: string
    keywords?: string[]
  }
}

/**
 * Integrated Product Variant
 */
export interface IntegratedVariant {
  id: string
  title: string
  sku?: string

  // Options
  options: {
    size?: string
    color?: {
      name: string
      hex?: string
    }
    [key: string]: unknown
  }

  // Pricing
  prices: IntegratedPrice[]
  pricing: {
    currency: string
    price: number
    salePrice?: number
    displayPrice: string
    displaySalePrice?: string
  }

  // Inventory
  inventory: {
    available: boolean
    quantity?: number
    allowBackorder?: boolean
  }

  // Images (variant-specific)
  images?: SanityImage[]

  // Original Medusa variant
  medusaVariant?: MedusaProductVariant
}

/**
 * Integrated Price
 */
export interface IntegratedPrice {
  id: string
  currencyCode: string
  amount: number
  saleAmount?: number
  regionId?: string
  minQuantity?: number
  maxQuantity?: number
  includesTax?: boolean
}

/**
 * Cart Item with integrated data
 */
export interface IntegratedCartItem {
  id: string
  lineItemId?: string
  productId: string
  variantId: string
  
  // Display info
  name: string
  image: string
  slug: string
  size: string
  color?: string
  sku?: string

  // Pricing
  pricing: {
    currency: string
    unitPrice: number
    unitSalePrice?: number
    displayUnitPrice: string
    displayUnitSalePrice?: string
    totalPrice: number
    displayTotalPrice: string
  }

  // Quantity
  quantity: number
  maxQuantity?: number
}

/**
 * Category with products
 */
export interface IntegratedCategory extends SanityCategory {
  products?: IntegratedProduct[]
  productCount?: number
  subcategories?: IntegratedCategory[]
}

/**
 * Collection with products
 */
export interface IntegratedCollection {
  id: string
  name: string
  slug: string
  description?: string
  image?: SanityImage
  products: IntegratedProduct[]
  metadata?: {
    title?: string
    description?: string
    keywords?: string[]
  }
}

/**
 * Search result
 */
export interface IntegratedSearchResult {
  products: IntegratedProduct[]
  categories: IntegratedCategory[]
  collections: IntegratedCollection[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Filters for product listing
 */
export interface ProductFilters {
  categories?: string[]
  priceRange?: {
    min?: number
    max?: number
  }
  sizes?: string[]
  colors?: string[]
  brands?: string[]
  tags?: string[]
  inStock?: boolean
  onSale?: boolean
  isNew?: boolean
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
  | 'best-selling'

/**
 * Product listing response
 */
export interface ProductListingResponse {
  products: IntegratedProduct[]
  filters: {
    categories: Array<{ value: string; label: string; count: number }>
    sizes: Array<{ value: string; label: string; count: number }>
    colors: Array<{ value: string; label: string; hex?: string; count: number }>
    brands: Array<{ value: string; label: string; count: number }>
    priceRange: { min: number; max: number }
  }
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  applied: ProductFilters
  sort: ProductSortOption
}