import type { MedusaProduct, MedusaProductCategory } from '@/types/medusa';

// Simple cache implementation
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Request deduplication
const pendingRequests = new Map<string, Promise<unknown>>();

export class MedusaProductService {
  private static cache = new SimpleCache<unknown>(5); // 5 minute cache
  /**
   * Get all product categories
   */
  static async getCategories(): Promise<MedusaProductCategory[]> {
    const cacheKey = 'categories:all';
    const cached = this.cache.get(cacheKey) as MedusaProductCategory[] | null;
    if (cached) return cached;

    // Check for pending request
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey) as Promise<MedusaProductCategory[]>;
    }

    const promise = this._fetchCategories(cacheKey);
    pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  private static async _fetchCategories(cacheKey: string): Promise<MedusaProductCategory[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/product-categories`,
        {
          headers: {
            'x-publishable-api-key':
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
          signal: controller.signal,
          cache: 'no-store',
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const categories = data.product_categories || [];
      this.cache.set(cacheKey, categories);
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get products with optional filtering
   */
  static async getProducts(params?: {
    limit?: number;
    offset?: number;
    category_id?: string[];
    collection_id?: string[];
    tags?: string[];
    sales_channel_id?: string[];
    handle?: string;
  }): Promise<{ products: MedusaProduct[]; count: number }> {
    const cacheKey = `products:${JSON.stringify(params || {})}`;
    const cached = this.cache.get(cacheKey) as { products: MedusaProduct[]; count: number } | null;
    if (cached) return cached;

    try {
      // Build URL with proper query parameters including region_id
      const url = new URL(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products`);
      url.searchParams.set('limit', String(params?.limit || 100));
      url.searchParams.set('offset', String(params?.offset || 0));
      url.searchParams.set('region_id', process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || '');
      
      if (params?.handle) {
        url.searchParams.set('handle', params.handle);
      }
      if (params?.category_id?.length) {
        params.category_id.forEach(id => url.searchParams.append('category_id', id));
      }
      if (params?.collection_id?.length) {
        params.collection_id.forEach(id => url.searchParams.append('collection_id', id));
      }
      if (params?.tags?.length) {
        params.tags.forEach(tag => url.searchParams.append('tags', tag));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url.toString(), {
        headers: {
          'x-publishable-api-key':
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result = { products: data.products || [], count: data.count || 0 };
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching products:', error);
      return { products: [], count: 0 };
    }
  }

  /**
   * Get a single product by handle or id
   */
  static async getProduct(handleOrId: string): Promise<MedusaProduct | null> {
    const cacheKey = `product:${handleOrId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Try by handle first
      const url = new URL(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products`);
      url.searchParams.set('handle', handleOrId);
      url.searchParams.set('limit', '1');
      url.searchParams.set('region_id', process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || '');
      
      const response = await fetch(url.toString(), {
        headers: {
          'x-publishable-api-key':
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        const product = data.products[0];
        this.cache.set(cacheKey, product);
        return product;
      }

      // If not found by handle, try by ID
      const idUrl = new URL(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products/${handleOrId}`);
      idUrl.searchParams.set('region_id', process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || '');
      
      const idResponse = await fetch(idUrl.toString(), {
        headers: {
          'x-publishable-api-key':
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
      });

      if (idResponse.ok) {
        const idData = await idResponse.json();
        if (idData.product) {
          this.cache.set(cacheKey, idData.product);
          return idData.product;
        }
      }

      return null;
    } catch (error) {

      return null;
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(categoryId: string, limit = 50): Promise<MedusaProduct[]> {
    const cacheKey = `products-category:${categoryId}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products`);
      url.searchParams.set('category_id', categoryId);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('region_id', process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || '');
      
      const response = await fetch(url.toString(), {
        headers: {
          'x-publishable-api-key':
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const products = data.products || [];
      this.cache.set(cacheKey, products);
      return products;
    } catch (error) {

      return [];
    }
  }

  /**
   * Search products
   */
  static async searchProducts(query: string, limit = 20): Promise<MedusaProduct[]> {
    const cacheKey = `search:${query}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products`);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('region_id', process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || '');
      
      const response = await fetch(url.toString(), {
        headers: {
          'x-publishable-api-key':
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const products = data.products || [];
      this.cache.set(cacheKey, products);
      return products;
    } catch (error) {

      return [];
    }
  }

  /**
   * Get featured products (you can customize this logic)
   */
  static async getFeaturedProducts(limit = 8): Promise<MedusaProduct[]> {
    const cacheKey = `featured:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // In production, you might want to use tags or metadata to mark featured products
      const url = new URL(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('region_id', process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || '');
      
      const response = await fetch(url.toString(), {
        headers: {
          'x-publishable-api-key':
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const products = data.products || [];
      this.cache.set(cacheKey, products);
      return products;
    } catch (error) {

      return [];
    }
  }

  /**
   * Get product recommendations (related products)
   */
  static async getRecommendations(productId: string, limit = 4): Promise<MedusaProduct[]> {
    const cacheKey = `recommendations:${productId}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Get the current product to find its category
      const product = await this.getProduct(productId);
      if (!product || !product.categories?.length) {
        // If no categories, just get some random products
        const url = new URL(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products`);
        url.searchParams.set('limit', String(limit + 1));
        url.searchParams.set('region_id', process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || '');
        
        const response = await fetch(url.toString(), {
          headers: {
            'x-publishable-api-key':
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const products = (data.products || []).filter((p: MedusaProduct) => p.id !== productId).slice(0, limit);
          this.cache.set(cacheKey, products);
          return products;
        }
        return [];
      }

      // Get products from the same category
      const categoryId = product.categories[0].id;
      const url = new URL(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products`);
      url.searchParams.set('category_id', categoryId);
      url.searchParams.set('limit', String(limit + 1));
      url.searchParams.set('region_id', process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || '');
      
      const response = await fetch(url.toString(), {
        headers: {
          'x-publishable-api-key':
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Filter out the current product
      const products = (data.products || []).filter((p: MedusaProduct) => p.id !== productId).slice(0, limit);
      this.cache.set(cacheKey, products);
      return products;
    } catch (error) {

      return [];
    }
  }

  /**
   * Get all collections
   */
  static async getCollections(): Promise<unknown[]> {
    const cacheKey = 'collections:all';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/collections`);
      url.searchParams.set('limit', '100');
      // Note: collections endpoint doesn't require region_id
      
      const response = await fetch(url.toString(), {
        headers: {
          'x-publishable-api-key':
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const collections = data.collections || [];
      this.cache.set(cacheKey, collections);
      return collections;
    } catch (error) {

      return [];
    }
  }

  /**
   * Get lowest price from product variants (updated for Medusa v2)
   */
  static getLowestPrice(
    product: MedusaProduct
  ): { amount: number; currency: string } | null {
    if (!product.variants?.length) return null;

    let lowestPrice: { amount: number; currency: string } | null = null;
    
    for (const variant of product.variants) {
      // Handle new Medusa v2 calculated_price structure
      if (variant.calculated_price) {
        const price = {
          amount: variant.calculated_price.calculated_amount,
          currency: variant.calculated_price.currency_code,
        };
        
        if (!lowestPrice || price.amount < lowestPrice.amount) {
          lowestPrice = price;
        }
      }
      // Fallback to old prices structure if available
      else if (variant.prices?.length) {
        for (const price of variant.prices) {
          if (!lowestPrice || price.amount < lowestPrice.amount) {
            lowestPrice = {
              amount: price.amount,
              currency: price.currency_code,
            };
          }
        }
      }
    }

    return lowestPrice;
  }

  /**
   * Transform Medusa product to match expected format
   */
  static transformProduct(product: MedusaProduct): MedusaProduct & {
    price: { amount: number; currency_code: string; formatted: string } | null;
  } {
    const variant = product.variants?.[0];
    const lowestPrice = this.getLowestPrice(product);

    return {
      id: product.id,
      handle: product.handle,
      title: product.title,
      description: product.description,
      thumbnail: product.thumbnail || product.images?.[0]?.url,
      images:
        product.images?.map((img) => ({
          url: img.url,
          alt: product.title,
        })) || [],
      variants:
        product.variants?.map((v) => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          // Include both old and new price structures
          prices: v.prices?.map((p) => ({
            amount: p.amount,
            currency_code: p.currency_code,
          })) || [],
          calculated_price: v.calculated_price || null,
          inventory_quantity: v.inventory_quantity || 0,
        })) || [],
      categories:
        product.categories?.map((cat) => ({
          id: cat.id,
          name: cat.name,
          handle: cat.handle,
        })) || [],
      price: lowestPrice
        ? {
            amount: lowestPrice.amount,
            currency_code: lowestPrice.currency,
            formatted: this.formatPrice(lowestPrice.amount, lowestPrice.currency),
          }
        : null,
    };
  }

  /**
   * Format price helper
   */
  static formatPrice(amount: number, currencyCode: string): string {
    // Determine locale based on currency
    let locale = 'en-US';
    if (currencyCode.toLowerCase() === 'eur') {
      locale = 'de-DE'; // Use German locale for EUR formatting
    } else if (currencyCode.toLowerCase() === 'gbp') {
      locale = 'en-GB';
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount / 100);
  }
}

// Export convenience functions
export const getProducts = MedusaProductService.getProducts;
export const getProduct = MedusaProductService.getProduct;
export const getCategories = MedusaProductService.getCategories;
export const getProductsByCategory = MedusaProductService.getProductsByCategory;
export const searchProducts = MedusaProductService.searchProducts;
export const getFeaturedProducts = MedusaProductService.getFeaturedProducts;
export const getRecommendations = MedusaProductService.getRecommendations;
