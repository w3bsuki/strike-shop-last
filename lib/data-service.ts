import { medusaClient } from "./medusa"
import { client, urlFor } from "./sanity"
// Note: Using any types for Medusa objects until we have proper type definitions
import type { SanityProduct as LibSanityProduct, SanityCategory as LibSanityCategory } from "./sanity"
import type { IntegratedProduct as IntegratedProductType, IntegratedVariant } from "@/types/integrated"
import type { SanityProduct, SanityCategory } from "@/types/sanity"

/**
 * Data Integration Service
 * 
 * This service coordinates data between:
 * - Sanity CMS: Product content, images, descriptions, categories
 * - Medusa: Inventory, pricing, variants, cart, checkout
 */

// Use the IntegratedProduct type from types/integrated.ts
export type IntegratedProduct = IntegratedProductType

export class DataService {
  // Sync product data between Sanity and Medusa
  static async syncProduct(sanityProduct: LibSanityProduct): Promise<void> {
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
        client.fetch<LibSanityProduct>(
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
      const category = await client.fetch<LibSanityCategory>(
        `*[_type == "category" && slug.current == $slug][0]`,
        { slug: categorySlug }
      )
      
      if (!category) return []
      
      // Get products in this category from Sanity
      const sanityProducts = await client.fetch<LibSanityProduct[]>(
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
      const handles = sanityProducts.map((p: any) => p.slug.current)
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
      const sanityResults = await client.fetch<LibSanityProduct[]>(
        `*[_type == "product" && (
          name match $searchQuery ||
          description match $searchQuery ||
          shortDescription match $searchQuery
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
        { searchQuery: `*${query}*` }
      )
      
      if (sanityResults.length === 0) return []
      
      // Get corresponding Medusa products
      const handles = sanityResults.map((p: any) => p.slug.current)
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
      
      const sanityProducts = await client.fetch<LibSanityProduct[]>(sanityQuery)
      
      if (sanityProducts.length === 0) return []
      
      // Get Medusa products
      const handles = sanityProducts.map((p: any) => p.slug.current)
      const { products: medusaProducts } = await medusaClient.products.list({
        handle: handles,
      })
      
      return this.mergeProductLists(medusaProducts, sanityProducts)
    } catch (error) {
      console.error("Error fetching featured products:", error)
      return []
    }
  }
  
  // Get products with filtering, sorting and pagination
  static async getProducts(options: {
    category?: string
    filters?: any
    sort?: 'relevance' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest' | 'best-selling'
    limit?: number
    offset?: number
  } = {}): Promise<{
    products: IntegratedProduct[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
    filters: any
    applied: any
  }> {
    try {
      const { category, filters = {}, sort = 'newest', limit = 20, offset = 0 } = options
      
      // Build Sanity query
      let sanityQuery = '*[_type == "product"'
      const queryParams: any = {}
      
      if (category) {
        const categoryData = await client.fetch<LibSanityCategory>(
          `*[_type == "category" && slug.current == $slug][0]`,
          { slug: category }
        )
        if (categoryData) {
          sanityQuery += ' && references($categoryId)'
          queryParams.categoryId = categoryData._id
        }
      }
      
      // Apply filters
      if (filters.sizes?.length > 0) {
        sanityQuery += ' && count((sizes[])[@ in $sizes]) > 0'
        queryParams.sizes = filters.sizes
      }
      
      if (filters.colors?.length > 0) {
        sanityQuery += ' && count((colors[])[@ in $colors]) > 0'
        queryParams.colors = filters.colors
      }
      
      if (filters.priceRange) {
        if (filters.priceRange.min !== undefined) {
          sanityQuery += ' && price >= $minPrice'
          queryParams.minPrice = filters.priceRange.min
        }
        if (filters.priceRange.max !== undefined) {
          sanityQuery += ' && price <= $maxPrice'
          queryParams.maxPrice = filters.priceRange.max
        }
      }
      
      if (filters.inStock) {
        // This would need to be checked against Medusa data
      }
      
      sanityQuery += ']'
      
      // Add sorting
      const sortMap = {
        'relevance': '', // Default Sanity ordering when searching
        'newest': ' | order(_createdAt desc)',
        'price-asc': ' | order(price asc)',
        'price-desc': ' | order(price desc)',
        'name-asc': ' | order(name asc)',
        'name-desc': ' | order(name desc)',
        'best-selling': ' | order(_updatedAt desc)', // Using _updatedAt as proxy for popularity
      }
      
      const fullQuery = sanityQuery + (sortMap[sort] || sortMap['newest']) + `{
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
      }[${offset}...${offset + limit}]`
      
      // Get total count
      const countQuery = sanityQuery
      const [sanityProducts, totalCount] = await Promise.all([
        client.fetch<LibSanityProduct[]>(fullQuery, queryParams),
        client.fetch<number>(`count(${countQuery})`, queryParams)
      ])
      
      if (sanityProducts.length === 0) {
        return {
          products: [],
          pagination: { total: 0, limit, offset, hasMore: false },
          filters: {},
          applied: filters
        }
      }
      
      // Get Medusa products
      const handles = sanityProducts.map((p: any) => p.slug.current)
      const { products: medusaProducts } = await medusaClient.products.list({
        handle: handles,
      })
      
      // Merge products
      const integratedProducts = this.mergeProductLists(medusaProducts, sanityProducts)
      
      // Apply stock filter if needed
      let finalProducts = integratedProducts
      if (filters.inStock) {
        finalProducts = integratedProducts.filter(p => p.commerce.inventory.available)
      }
      
      // Get available filters from all products (for filter UI)
      const allProductsQuery = '*[_type == "product"]{ sizes, colors, price }'
      const allProducts = await client.fetch<any[]>(allProductsQuery)
      
      const availableSizes = [...new Set(allProducts.flatMap(p => p.sizes || []))]
      const availableColors = [...new Set(allProducts.flatMap(p => p.colors || []))]
      const prices = allProducts.map(p => p.price).filter(Boolean)
      const priceRange = prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices)
      } : { min: 0, max: 1000 }
      
      return {
        products: finalProducts,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        filters: {
          sizes: availableSizes,
          colors: availableColors,
          priceRange,
        },
        applied: filters
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      return {
        products: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
        filters: {},
        applied: {}
      }
    }
  }
  
  // Helper: Merge single product data
  private static mergeProductData(
    medusaProduct: any,
    sanityProduct: LibSanityProduct
  ): IntegratedProduct {
    // Get price info from first variant
    const defaultVariant = medusaProduct.variants[0]
    const defaultPrice = defaultVariant?.prices?.[0]
    const amount = defaultPrice?.amount || 0
    const currency = defaultPrice?.currency_code || "GBP"
    
    // Calculate discount if originalPrice exists
    const originalAmount = sanityProduct.originalPrice ? sanityProduct.originalPrice * 100 : amount
    const discountPercentage = originalAmount > amount ? Math.round(((originalAmount - amount) / originalAmount) * 100) : 0
    const discountAmount = originalAmount > amount ? originalAmount - amount : 0
    const discount = discountPercentage > 0 ? { amount: discountAmount / 100, percentage: discountPercentage } : undefined
    
    // Calculate if in stock
    const totalInventory = medusaProduct.variants.reduce((sum: number, v: any) => {
      if (!v.manage_inventory) return sum + 100 // If not managing inventory, assume available
      return sum + (v.inventory_quantity || 0)
    }, 0)
    
    // Get available options
    const availableSizes = sanityProduct.sizes || 
      medusaProduct.options?.find((o: any) => o.title.toLowerCase() === "size")?.values.map((v: any) => v.value) || []
    
    const availableColors = sanityProduct.colors ||
      medusaProduct.options?.find((o: any) => o.title.toLowerCase() === "color")?.values.map((v: any) => v.value) || []
    
    // Map variants to integrated format
    const variants: IntegratedVariant[] = medusaProduct.variants.map((v: any) => ({
      id: v.id,
      productId: medusaProduct.id,
      title: v.title || "",
      sku: v.sku,
      
      // Options
      options: {
        size: v.options?.find((o: any) => o.option?.title?.toLowerCase() === "size")?.value,
        color: availableColors.length > 0 ? {
          name: availableColors[0],
          hex: undefined
        } : undefined
      },
      
      // Pricing
      prices: v.prices?.map((p: any) => ({
        id: p.id,
        currencyCode: p.currency_code,
        amount: p.amount,
        regionId: p.region_id,
        includesTax: p.includes_tax
      })) || [],
      pricing: {
        currency: v.prices?.[0]?.currency_code || currency,
        price: v.prices?.[0]?.amount || amount,
        salePrice: sanityProduct.isOnSale ? v.prices?.[0]?.amount : undefined,
        displayPrice: DataService.formatPrice(v.prices?.[0]?.amount || amount, v.prices?.[0]?.currency_code || currency),
        displaySalePrice: sanityProduct.isOnSale ? DataService.formatPrice(v.prices?.[0]?.amount || amount, v.prices?.[0]?.currency_code || currency) : undefined,
      },
      
      // Inventory
      inventory: {
        available: !v.manage_inventory || (v.inventory_quantity ?? 0) > 0 || v.allow_backorder,
        quantity: v.inventory_quantity,
        allowBackorder: v.allow_backorder
      },
      
      medusaVariant: v
    }))
    
    return {
      // Core identifiers
      id: medusaProduct.id,
      sanityId: sanityProduct._id,
      slug: medusaProduct.handle || sanityProduct.slug.current,
      sku: defaultVariant?.sku,
      
      // Content from Sanity
      content: {
        name: sanityProduct.name,
        description: sanityProduct.description,
        details: undefined, // SanityBlock[] type expected, but we have SanityProductDetailItem[]
        images: sanityProduct.images || [],
        categories: sanityProduct.category ? [sanityProduct.category as any as SanityCategory] : [],
        tags: [],
        brand: undefined,
        material: undefined,
        care: [],
        features: [],
        story: undefined,
        sizeGuide: undefined,
        sustainability: undefined
      },
      
      // Commerce data from Medusa
      commerce: {
        medusaProduct,
        variants,
        prices: variants.flatMap(v => v.prices),
        inventory: {
          available: totalInventory > 0,
          quantity: totalInventory
        },
        tax: {
          rate: 0.2, // 20% VAT
          included: false
        }
      },
      
      // Pricing summary
      pricing: {
        currency,
        basePrice: amount / 100,
        salePrice: sanityProduct.isOnSale && sanityProduct.originalPrice ? amount / 100 : undefined,
        displayPrice: DataService.formatPrice(amount, currency),
        displaySalePrice: sanityProduct.isOnSale && sanityProduct.originalPrice ? DataService.formatPrice(amount, currency) : undefined,
        discount
      },
      
      // Badges
      badges: {
        isNew: sanityProduct.isNewArrival || false,
        isSale: sanityProduct.isOnSale || false,
        isSoldOut: totalInventory === 0,
        isLimited: false
      },
      
      // Metadata
      metadata: {
        title: sanityProduct.name,
        description: sanityProduct.shortDescription || sanityProduct.description,
        keywords: []
      }
    }
  }
  
  // Helper function to format price
  private static formatPrice(amount: number, currency: string): string {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }
  
  // Helper: Merge product lists
  private static mergeProductLists(
    medusaProducts: any[],
    sanityProducts: LibSanityProduct[],
    category?: LibSanityCategory
  ): IntegratedProduct[] {
    const productMap = new Map<string, IntegratedProduct>()
    
    // Create a map of Sanity products by handle
    const sanityMap = new Map(
      sanityProducts.map((p: any) => [p.slug.current, p])
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
      const sanityProducts = await client.fetch<LibSanityProduct[]>(
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
export const getProducts = DataService.getProducts.bind(DataService)
export const getProductsByCategory = DataService.getProductsByCategory.bind(DataService)
export const searchProducts = DataService.searchProducts.bind(DataService)
export const getFeaturedProducts = DataService.getFeaturedProducts.bind(DataService)
export const initializeDataSync = DataService.initializeSync.bind(DataService)