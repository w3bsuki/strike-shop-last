/**
 * Data Service - Core integration layer between Sanity CMS and Medusa e-commerce
 * Now uses Factory Pattern for consistent product creation
 */

import { sanityClient as client, urlForImage } from '@/lib/sanity';
import { medusaClient } from '@/lib/medusa-service-refactored';
import { MedusaProductService } from '@/lib/medusa-service-refactored';
import { ProductFactory } from '@/lib/factories/ProductFactory';
import { ProductQueryBuilder, type ProductQuery } from '@/lib/builders';
import type { SanityProduct, SanityCategory } from '@/types/sanity';
import type { IntegratedProduct } from '@/types/integrated';

// Keep legacy interface for backward compatibility
export interface LegacyIntegratedProduct {
  // Core identifiers
  id: string;
  medusaId?: string;
  sanityId?: string;

  // Product information
  title: string;
  handle: string;
  description: string;

  // Pricing
  price: {
    amount: number;
    currency: string;
    formatted: string;
  };
  compareAtPrice?: {
    amount: number;
    currency: string;
    formatted: string;
  };

  // Media
  images: Array<{
    url: string;
    alt?: string;
  }>;
  thumbnail?: string;

  // Inventory
  inStock: boolean;
  variants: Array<{
    id: string;
    title: string;
    sku?: string;
    price: number;
    inventory_quantity: number;
  }>;

  // Categorization
  categories: Array<{
    id: string;
    name: string;
    handle: string;
  }>;
  tags: string[];

  // SEO
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export class DataService {
  private static instance: DataService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private pendingRequests: Map<string, Promise<any>> = new Map(); // Prevent duplicate requests

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * Get a single product by handle, merging data from both sources
   * Now uses ProductFactory for consistent product creation
   */
  async getProduct(handle: string): Promise<IntegratedProduct | null> {
    const cacheKey = `product:${handle}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Create and store the promise
    const promise = this._fetchProduct(handle, cacheKey);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async _fetchProduct(handle: string, cacheKey: string): Promise<IntegratedProduct | null> {
    try {
      // Try to get from Medusa first
      const medusaProduct = await MedusaProductService.getProduct(handle);
      if (medusaProduct) {
        // Try to enhance with Sanity data
        const sanityQuery = `*[_type == "product" && slug.current == $handle][0]`;
        const sanityProduct: SanityProduct | null = await client.fetch(
          sanityQuery,
          { handle }
        );

        // Use ProductFactory to create integrated product
        const integrated = ProductFactory.createIntegratedProduct(
          medusaProduct,
          sanityProduct || undefined,
          {
            currency: 'GBP',
            region: 'uk',
            includeVariants: true,
            includePricing: true,
            includeInventory: true,
          }
        );

        this.setCache(cacheKey, integrated);
        return integrated;
      }

      // Fallback to Sanity only
      const sanityQuery = `*[_type == "product" && slug.current == $handle][0]`;
      const sanityProduct: SanityProduct | null = await client.fetch(
        sanityQuery,
        { handle }
      );

      if (sanityProduct) {
        // Use ProductFactory for Sanity-only products
        const integrated = ProductFactory.createIntegratedProductFromSanity(
          sanityProduct,
          {
            currency: 'GBP',
            includeVariants: true,
          }
        );
        this.setCache(cacheKey, integrated);
        return integrated;
      }

      return null;
    } catch (error) {

      return null;
    }
  }

  /**
   * Get products with filtering and pagination
   */
  async getProducts(
    params: {
      limit?: number;
      offset?: number;
      categoryId?: string;
      categoryHandle?: string;
      tags?: string[];
      sort?: string;
    } = {}
  ): Promise<{ products: IntegratedProduct[]; count: number }> {
    const cacheKey = `products:${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get products from Medusa
      const medusaParams: any = {
        limit: params.limit || 20,
        offset: params.offset || 0,
      };

      if (params.categoryId) {
        medusaParams.category_id = [params.categoryId];
      }

      if (params.tags) {
        medusaParams.tags = params.tags;
      }

      const { products: medusaProducts, count } =
        await MedusaProductService.getProducts(medusaParams);

      // Enhance with Sanity data if available
      const handles = medusaProducts.map((p: any) => p.handle).filter(Boolean);
      const sanityQuery = `*[_type == "product" && slug.current in $handles]`;
      const sanityProducts: SanityProduct[] =
        handles.length > 0 ? await client.fetch(sanityQuery, { handles }) : [];

      const sanityMap = new Map(
        sanityProducts.map((p: any) => [p.slug.current, p])
      );

      const integratedProducts = medusaProducts.map((mp: any) => {
        const sanityProduct = mp.handle
          ? sanityMap.get(mp.handle) || null
          : null;
        return ProductFactory.createIntegratedProduct(mp, sanityProduct, {
          currency: 'GBP',
          region: 'uk',
          includeVariants: true,
          includePricing: true,
          includeInventory: true,
        });
      });

      const result = { products: integratedProducts, count };
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {

      // Fallback to Sanity only
      try {
        let sanityQuery = `*[_type == "product"]`;
        const queryParams: any = {};

        if (params.categoryHandle) {
          sanityQuery += `[category->slug.current == $categoryHandle]`;
          queryParams.categoryHandle = params.categoryHandle;
        }

        const start = params.offset || 0;
        const end = start + (params.limit || 20);
        sanityQuery += `[${start}...${end}]`;

        const sanityProducts: SanityProduct[] = await client.fetch(
          sanityQuery,
          queryParams
        );
        const integratedProducts = sanityProducts.map((sp) =>
          ProductFactory.createIntegratedProductFromSanity(sp, {
            currency: 'GBP',
            includeVariants: true,
          })
        );

        return {
          products: integratedProducts,
          count: integratedProducts.length,
        };
      } catch (sanityError) {

        return { products: [], count: 0 };
      }
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<
    Array<{ id: string; name: string; handle: string; parent?: string }>
  > {
    const cacheKey = 'categories:all';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get from Medusa
      const medusaCategories = await MedusaProductService.getCategories();

      if (medusaCategories.length > 0) {
        const categories = medusaCategories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          handle: cat.handle,
          parent: cat.parent_category_id || undefined,
        }));
        this.setCache(cacheKey, categories);
        return categories;
      }

      // Fallback to Sanity
      const sanityQuery = `*[_type == "category"]{ _id, title, slug }`;
      const sanityCategories: SanityCategory[] =
        await client.fetch(sanityQuery);

      const categories = sanityCategories.map((cat) => ({
        id: cat._id,
        name: cat.name,
        handle: cat.slug.current,
      }));

      this.setCache(cacheKey, categories);
      return categories;
    } catch (error) {

      return [];
    }
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    limit = 20
  ): Promise<IntegratedProduct[]> {
    const cacheKey = `search:${query}:${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Search in Medusa
      const medusaProducts = await MedusaProductService.searchProducts(
        query,
        limit
      );

      if (medusaProducts.length > 0) {
        const handles = medusaProducts
          .map((p: any) => p.handle)
          .filter(Boolean);
        const sanityQuery = `*[_type == "product" && slug.current in $handles]`;
        const sanityProducts: SanityProduct[] =
          handles.length > 0
            ? await client.fetch(sanityQuery, { handles })
            : [];

        const sanityMap = new Map(
          sanityProducts.map((p: any) => [p.slug.current, p])
        );

        const integratedProducts = medusaProducts.map((mp: any) => {
          const sanityProduct = mp.handle
            ? sanityMap.get(mp.handle) || null
            : null;
          return ProductFactory.createIntegratedProduct(mp, sanityProduct, {
            currency: 'GBP',
            region: 'uk',
            includeVariants: true,
            includePricing: true,
            includeInventory: true,
          });
        });

        this.setCache(cacheKey, integratedProducts);
        return integratedProducts;
      }

      // Fallback to Sanity search
      const sanityQuery = `*[_type == "product" && (title match $searchQuery || description match $searchQuery)][0...${limit}]`;
      const sanityProducts: SanityProduct[] = await client.fetch(sanityQuery, {
        searchQuery: `*${query}*`,
      });

      const products = sanityProducts.map((sp) =>
        ProductFactory.createIntegratedProductFromSanity(sp, {
          currency: 'GBP',
          includeVariants: true,
        })
      );
      this.setCache(cacheKey, products);
      return products;
    } catch (error) {

      return [];
    }
  }

  /**
   * Get products using query builder pattern
   */
  async getProductsWithQuery(
    queryOrBuilder: ProductQuery | ProductQueryBuilder
  ): Promise<{ products: IntegratedProduct[]; count: number }> {
    // Extract query from builder if needed
    const query =
      queryOrBuilder instanceof ProductQueryBuilder
        ? queryOrBuilder.build()
        : queryOrBuilder;

    const cacheKey = `products-query:${JSON.stringify(query)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Build Medusa query
      const medusaParams =
        ProductQueryBuilder.fromQuery(query).buildForMedusa();

      // Get products from Medusa
      const { products: medusaProducts, count } =
        await MedusaProductService.getProducts(medusaParams);

      // Enhance with Sanity data if available
      const handles = medusaProducts.map((p: any) => p.handle).filter(Boolean);
      const sanityQuery = ProductQueryBuilder.fromQuery(query).buildForSanity();

      let sanityProducts: SanityProduct[] = [];
      if (handles.length > 0) {
        // Use handles to get matching Sanity products
        const sanityHandleQuery = `*[_type == "product" && slug.current in $handles]`;
        sanityProducts = await client.fetch(sanityHandleQuery, { handles });
      } else if (query.searchTerm || query.categories || query.tags) {
        // Use the built Sanity query for search/filter scenarios
        try {
          sanityProducts = await client.fetch(sanityQuery);
        } catch (error) {
          // Sanity query failed, continuing with Medusa data only
        }
      }

      const sanityMap = new Map(
        sanityProducts.map((p: any) => [p.slug.current, p])
      );

      const integratedProducts = medusaProducts.map((mp: any) => {
        const sanityProduct = mp.handle
          ? sanityMap.get(mp.handle) || null
          : null;
        return ProductFactory.createIntegratedProduct(mp, sanityProduct, {
          currency: query.currency || 'GBP',
          region: query.region || 'uk',
          includeVariants: query.includeVariants ?? true,
          includePricing: query.includePricing ?? true,
          includeInventory: query.includeInventory ?? true,
        });
      });

      const result = { products: integratedProducts, count };
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {

      // Fallback to Sanity only if it's a search/filter query
      if (query.searchTerm || query.categories || query.tags) {
        try {
          const sanityQuery =
            ProductQueryBuilder.fromQuery(query).buildForSanity();
          const sanityProducts: SanityProduct[] =
            await client.fetch(sanityQuery);
          const integratedProducts = sanityProducts.map((sp) =>
            ProductFactory.createIntegratedProductFromSanity(sp, {
              currency: query.currency || 'GBP',
              includeVariants: query.includeVariants ?? true,
            })
          );

          return {
            products: integratedProducts,
            count: integratedProducts.length,
          };
        } catch (sanityError) {

        }
      }

      return { products: [], count: 0 };
    }
  }

  // Old mergeProductData and convertSanityProduct methods removed
  // Now using ProductFactory for consistent product creation

  /**
   * Cache helpers with request deduplication
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const dataService = DataService.getInstance();

// Export convenience functions - now using ProductFactory internally
export const getProduct = (handle: string) => dataService.getProduct(handle);
export const getProducts = (params?: any) => dataService.getProducts(params);
export const getProductsWithQuery = (
  query: ProductQuery | ProductQueryBuilder
) => dataService.getProductsWithQuery(query);
export const getCategories = () => dataService.getCategories();
export const searchProducts = (query: string, limit?: number) =>
  dataService.searchProducts(query, limit);

// Re-export patterns for direct access
export { ProductFactory } from '@/lib/factories/ProductFactory';
export {
  ProductQueryBuilder,
  createProductQuery,
  createSearchQuery,
} from '@/lib/builders';
