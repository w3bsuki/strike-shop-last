import { medusaClient } from "./medusa"
import { client, urlFor } from "./sanity"
import type { Product, ProductVariant } from "@medusajs/medusa"
import type { SanityProduct, SanityCategory } from "./sanity"

/**
 * Data Integration Service
 * 
 * This service coordinates data between:
 * - Sanity CMS: Product content, images, descriptions, categories
 * - Medusa: Inventory, pricing, variants, cart, checkout
 */

// Product data structure combining both sources
export interface IntegratedProduct {
  // Core identifiers
  id: string // Medusa product ID
  sanityId?: string // Sanity document ID
  handle: string // URL slug
  
  // Content from Sanity
  title: string
  description: string
  shortDescription?: string
  images: string[]
  category: {
    id: string
    name: string
    slug: string
  }
  details?: Array<{
    title: string
    content: string
  }>
  
  // Commerce data from Medusa
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
    allow_backorder: boolean
  }>
  
  // Computed fields
  price: number
  originalPrice?: number
  currency: string
  inStock: boolean
  availableSizes: string[]
  availableColors: string[]
  
  // Flags
  isNewArrival: boolean
  isFeatured: boolean
  isOnSale: boolean
}

export class DataService {
  // Sync product data between Sanity and Medusa
  static async syncProduct(sanityProduct: SanityProduct): Promise<void> {
    try {
      // Check if product exists in Medusa
      const { products } = await medusaClient.products.list({
        handle: sanityProduct.slug.current,
      })
      
      if (products.length === 0) {
        // Create new product in Medusa
        await medusaClient.admin.products.create({
          title: sanityProduct.name,
          handle: sanityProduct.slug.current,
          description: sanityProduct.description,
          is_giftcard: false,
          discountable: true,
          // Map Sanity data to Medusa format
          metadata: {
            sanity_id: sanityProduct._id,
            short_description: sanityProduct.shortDescription,
            is_new_arrival: sanityProduct.isNewArrival,
            is_featured: sanityProduct.isFeatured,
            is_on_sale: sanityProduct.isOnSale,
          },
        })
      } else {
        // Update existing product
        const medusaProduct = products[0]
        await medusaClient.admin.products.update(medusaProduct.id, {
          title: sanityProduct.name,
          description: sanityProduct.description,
          metadata: {
            ...medusaProduct.metadata,
            sanity_id: sanityProduct._id,
            short_description: sanityProduct.shortDescription,
            is_new_arrival: sanityProduct.isNewArrival,
            is_featured: sanityProduct.isFeatured,
            is_on_sale: sanityProduct.isOnSale,
          },
        })
      }
    } catch (error) {
      console.error("Error syncing product:", error)
      throw error
    }
  }
  
  // Get integrated product data
  static async getProduct(handle: string): Promise<IntegratedProduct | null> {
    try {
      // Fetch from both sources in parallel
      const [medusaData, sanityData] = await Promise.all([
        medusaClient.products.list({ handle }),
        client.fetch<SanityProduct>(
          `*[_type == "product" && slug.current == $handle][0]{
            _id,
            name,
            description,
            shortDescription,
            images,
            "category": category->{
              _id,
              name,
              "slug": slug.current
            },
            details,
            sizes,
            colors,
            isNewArrival,
            isFeatured,
            isOnSale
          }`,
          { handle }
        ),
      ])
      
      if (!medusaData.products.length || !sanityData) {
        return null
      }
      
      const medusaProduct = medusaData.products[0]
      
      // Merge data from both sources
      return this.mergeProductData(medusaProduct, sanityData)
    } catch (error) {
      console.error("Error fetching integrated product:", error)
      return null
    }
  }
  
  // Get products by category
  static async getProductsByCategory(
    categorySlug: string,
    options?: {
      limit?: number
      offset?: number
      sortBy?: "price" | "name" | "created_at"
      order?: "asc" | "desc"
    }
  ): Promise<IntegratedProduct[]> {
    try {
      // First get category from Sanity
      const category = await client.fetch<SanityCategory>(
        `*[_type == "category" && slug.current == $slug][0]`,
        { slug: categorySlug }
      )
      
      if (!category) return []
      
      // Get products in this category from Sanity
      const sanityProducts = await client.fetch<SanityProduct[]>(
        `*[_type == "product" && references($categoryId)]{
          _id,
          name,
          "slug": slug.current,
          description,
          shortDescription,
          images,
          sizes,
          colors,
          isNewArrival,
          isFeatured,
          isOnSale
        }`,
        { categoryId: category._id }
      )
      
      // Get corresponding products from Medusa
      const handles = sanityProducts.map(p => p.slug.current)
      const { products: medusaProducts } = await medusaClient.products.list({
        handle: handles,
        limit: options?.limit || 100,
        offset: options?.offset || 0,
        order: options?.order || "desc",
      })
      
      // Merge and return integrated products
      return this.mergeProductLists(medusaProducts, sanityProducts, category)
    } catch (error) {
      console.error("Error fetching products by category:", error)
      return []
    }
  }
  
  // Search products
  static async searchProducts(query: string): Promise<IntegratedProduct[]> {
    try {
      // Search in Sanity
      const sanityResults = await client.fetch<SanityProduct[]>(
        `*[_type == "product" && (
          name match $query ||
          description match $query ||
          shortDescription match $query
        )]{
          _id,
          name,
          "slug": slug.current,
          description,
          shortDescription,
          images,
          "category": category->{
            _id,
            name,
            "slug": slug.current
          },
          sizes,
          colors,
          isNewArrival,
          isFeatured,
          isOnSale
        }`,
        { query: `*${query}*` }
      )
      
      if (sanityResults.length === 0) return []
      
      // Get corresponding Medusa products
      const handles = sanityResults.map(p => p.slug.current)
      const { products: medusaProducts } = await medusaClient.products.list({
        handle: handles,
      })
      
      return this.mergeProductLists(medusaProducts, sanityResults)
    } catch (error) {
      console.error("Error searching products:", error)
      return []
    }
  }
  
  // Get featured products for homepage sections
  static async getFeaturedProducts(type: "sale" | "new" | "featured"): Promise<IntegratedProduct[]> {
    try {
      let sanityQuery = ""
      
      switch (type) {
        case "sale":
          sanityQuery = `*[_type == "product" && isOnSale == true]`
          break
        case "new":
          sanityQuery = `*[_type == "product" && isNewArrival == true]`
          break
        case "featured":
          sanityQuery = `*[_type == "product" && isFeatured == true]`
          break
      }
      
      sanityQuery += `{
        _id,
        name,
        "slug": slug.current,
        description,
        shortDescription,
        images,
        "category": category->{
          _id,
          name,
          "slug": slug.current
        },
        sizes,
        colors,
        isNewArrival,
        isFeatured,
        isOnSale,
        price,
        originalPrice
      }`
      
      const sanityProducts = await client.fetch<SanityProduct[]>(sanityQuery)
      
      if (sanityProducts.length === 0) return []
      
      // Get Medusa products
      const handles = sanityProducts.map(p => p.slug.current)
      const { products: medusaProducts } = await medusaClient.products.list({
        handle: handles,
      })
      
      return this.mergeProductLists(medusaProducts, sanityProducts)
    } catch (error) {
      console.error("Error fetching featured products:", error)
      return []
    }
  }
  
  // Helper: Merge single product data
  private static mergeProductData(
    medusaProduct: Product,
    sanityProduct: SanityProduct
  ): IntegratedProduct {
    // Get price from first variant
    const defaultVariant = medusaProduct.variants[0]
    const price = defaultVariant?.prices?.[0]?.amount || 0
    const currency = defaultVariant?.prices?.[0]?.currency_code || "GBP"
    
    // Calculate if in stock
    const inStock = medusaProduct.variants.some(
      v => !v.manage_inventory || (v.inventory_quantity ?? 0) > 0 || v.allow_backorder
    )
    
    // Get available options
    const availableSizes = sanityProduct.sizes || 
      medusaProduct.options?.find(o => o.title.toLowerCase() === "size")?.values.map(v => v.value) || []
    
    const availableColors = sanityProduct.colors ||
      medusaProduct.options?.find(o => o.title.toLowerCase() === "color")?.values.map(v => v.value) || []
    
    return {
      id: medusaProduct.id,
      sanityId: sanityProduct._id,
      handle: medusaProduct.handle || sanityProduct.slug.current,
      title: sanityProduct.name,
      description: sanityProduct.description || medusaProduct.description || "",
      shortDescription: sanityProduct.shortDescription,
      images: sanityProduct.images?.map(img => urlFor(img).url()) || [],
      category: sanityProduct.category || { id: "", name: "", slug: "" },
      details: sanityProduct.details,
      variants: medusaProduct.variants.map(v => ({
        id: v.id,
        title: v.title || "",
        sku: v.sku || undefined,
        prices: v.prices || [],
        inventory_quantity: v.inventory_quantity,
        manage_inventory: v.manage_inventory,
        allow_backorder: v.allow_backorder,
      })),
      price: price / 100, // Convert from cents
      originalPrice: sanityProduct.originalPrice,
      currency,
      inStock,
      availableSizes,
      availableColors,
      isNewArrival: sanityProduct.isNewArrival || false,
      isFeatured: sanityProduct.isFeatured || false,
      isOnSale: sanityProduct.isOnSale || false,
    }
  }
  
  // Helper: Merge product lists
  private static mergeProductLists(
    medusaProducts: Product[],
    sanityProducts: SanityProduct[],
    category?: SanityCategory
  ): IntegratedProduct[] {
    const productMap = new Map<string, IntegratedProduct>()
    
    // Create a map of Sanity products by handle
    const sanityMap = new Map(
      sanityProducts.map(p => [p.slug.current, p])
    )
    
    // Merge each Medusa product with its Sanity data
    medusaProducts.forEach(medusaProduct => {
      const handle = medusaProduct.handle
      if (!handle) return
      
      const sanityProduct = sanityMap.get(handle)
      if (!sanityProduct) return
      
      const integrated = this.mergeProductData(medusaProduct, {
        ...sanityProduct,
        category: sanityProduct.category || category,
      })
      
      productMap.set(handle, integrated)
    })
    
    return Array.from(productMap.values())
  }
  
  // Initialize data sync (run on app start or via cron)
  static async initializeSync(): Promise<void> {
    try {
      console.log("Starting data sync between Sanity and Medusa...")
      
      // Get all products from Sanity
      const sanityProducts = await client.fetch<SanityProduct[]>(
        `*[_type == "product"]{
          _id,
          name,
          "slug": slug.current,
          description,
          price,
          originalPrice
        }`
      )
      
      // Sync each product
      for (const product of sanityProducts) {
        await this.syncProduct(product)
      }
      
      console.log(`Synced ${sanityProducts.length} products`)
    } catch (error) {
      console.error("Error initializing data sync:", error)
    }
  }
}

// Export convenience functions
export const getProduct = DataService.getProduct.bind(DataService)
export const getProductsByCategory = DataService.getProductsByCategory.bind(DataService)
export const searchProducts = DataService.searchProducts.bind(DataService)
export const getFeaturedProducts = DataService.getFeaturedProducts.bind(DataService)
export const initializeDataSync = DataService.initializeSync.bind(DataService)