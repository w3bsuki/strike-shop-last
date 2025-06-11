import { medusaClient } from "./medusa"

/**
 * Medusa Product Service
 * Handles all product-related operations with Medusa backend
 */

export interface MedusaProduct {
  id: string
  title: string
  handle: string
  description: string
  status: string
  thumbnail?: string
  images?: Array<{ url: string }>
  variants: Array<{
    id: string
    title: string
    sku?: string
    prices: Array<{
      amount: number
      currency_code: string
    }>
    inventory_quantity?: number
    manage_inventory: boolean
  }>
  categories?: Array<{
    id: string
    name: string
    handle: string
  }>
  collection?: {
    id: string
    title: string
    handle: string
  }
}

export class MedusaProductService {
  /**
   * Get all products from Medusa
   */
  static async getProducts(params?: {
    collection_id?: string[]
    category_id?: string[]
    limit?: number
    offset?: number
  }): Promise<MedusaProduct[]> {
    try {
      const { products } = await medusaClient.products.list(params)
      return products as MedusaProduct[]
    } catch (error) {
      console.error('Error fetching products from Medusa:', error)
      return []
    }
  }

  /**
   * Get single product by handle
   */
  static async getProductByHandle(handle: string): Promise<MedusaProduct | null> {
    try {
      const { products } = await medusaClient.products.list({ handle })
      return products[0] as MedusaProduct || null
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string): Promise<MedusaProduct | null> {
    try {
      const { product } = await medusaClient.products.retrieve(id)
      return product as MedusaProduct
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  }

  /**
   * Get all collections
   */
  static async getCollections() {
    try {
      const { collections } = await medusaClient.collections.list()
      return collections
    } catch (error) {
      console.error('Error fetching collections:', error)
      return []
    }
  }

  /**
   * Get all categories
   */
  static async getCategories() {
    try {
      const { product_categories } = await medusaClient.productCategories.list()
      return product_categories
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }

  /**
   * Search products
   */
  static async searchProducts(query: string): Promise<MedusaProduct[]> {
    try {
      const { products } = await medusaClient.products.list({ q: query })
      return products as MedusaProduct[]
    } catch (error) {
      console.error('Error searching products:', error)
      return []
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(categoryId: string): Promise<MedusaProduct[]> {
    try {
      const { products } = await medusaClient.products.list({
        category_id: [categoryId]
      })
      return products as MedusaProduct[]
    } catch (error) {
      console.error('Error fetching products by category:', error)
      return []
    }
  }

  /**
   * Get products by collection
   */
  static async getProductsByCollection(collectionId: string): Promise<MedusaProduct[]> {
    try {
      const { products } = await medusaClient.products.list({
        collection_id: [collectionId]
      })
      return products as MedusaProduct[]
    } catch (error) {
      console.error('Error fetching products by collection:', error)
      return []
    }
  }

  /**
   * Format price for display
   */
  static formatPrice(amount: number, currencyCode: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount / 100) // Medusa stores prices in cents
  }

  /**
   * Get the lowest price from variants
   */
  static getLowestPrice(product: MedusaProduct): { amount: number; currency: string } | null {
    if (!product.variants || product.variants.length === 0) return null
    
    // Find first variant with prices
    let lowestPrice = null
    
    for (const variant of product.variants) {
      if (variant.prices && variant.prices.length > 0) {
        if (!lowestPrice || variant.prices[0].amount < lowestPrice.amount) {
          lowestPrice = variant.prices[0]
        }
      }
    }
    
    if (!lowestPrice) {
      // Return default price if no prices found
      return {
        amount: 0,
        currency: 'usd'
      }
    }
    
    return {
      amount: lowestPrice.amount,
      currency: lowestPrice.currency_code
    }
  }
}