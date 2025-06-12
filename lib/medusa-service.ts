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
      // Add region_id to ensure prices are included
      const searchParams = {
        ...params,
        region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || 'reg_01JXFMWZWX24XQD1BYNTS3N15Q'
      }
      
      const { products } = await medusaClient.products.list(searchParams)
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
  static getLowestPrice(product: any): { amount: number; currency: string } | null {
    if (!product.variants || product.variants.length === 0) return null
    
    // Handle Medusa v2 calculated_price structure
    let lowestPrice = null
    
    for (const variant of product.variants) {
      // Check for calculated_price (v2 format)
      if (variant.calculated_price && variant.calculated_price.calculated_amount) {
        const price = {
          amount: variant.calculated_price.calculated_amount,
          currency_code: variant.calculated_price.currency_code
        }
        
        if (!lowestPrice || price.amount < lowestPrice.amount) {
          lowestPrice = price
        }
      }
      // Fallback to prices array (v1 format)
      else if (variant.prices && variant.prices.length > 0) {
        if (!lowestPrice || variant.prices[0].amount < lowestPrice.amount) {
          lowestPrice = variant.prices[0]
        }
      }
    }
    
    if (!lowestPrice) {
      // Return default price if no prices found
      return {
        amount: 0,
        currency: 'eur'
      }
    }
    
    return {
      amount: lowestPrice.amount,
      currency: lowestPrice.currency_code
    }
  }
}