import type { MedusaProduct, MedusaProductCategory } from '@/types/medusa';

/**
 * Medusa Product Service - Refactored to be stateless
 * 
 * This service provides static methods for fetching product data from Medusa.
 * All caching and request deduplication is handled by React Query instead of
 * internal mutable state.
 */
export class MedusaProductService {
  /**
   * Get all product categories
   */
  static async getCategories(): Promise<MedusaProductCategory[]> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/product-categories`,
        {
          headers: {
            'x-publishable-api-key':
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.product_categories || [];
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error; // Let React Query handle the error
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
  }): Promise<{ products: MedusaProduct[]; count: number }> {
    try {
      // Build URL with proper query parameters including region_id
      const url = new URL(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products`);
      url.searchParams.set('limit', String(params?.limit || 100));
      url.searchParams.set('offset', String(params?.offset || 0));
      url.searchParams.set('region_id', process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || '');
      
      if (params?.category_id?.length) {
        params.category_id.forEach(id => url.searchParams.append('category_id', id));
      }
      if (params?.collection_id?.length) {
        params.collection_id.forEach(id => url.searchParams.append('collection_id', id));
      }
      if (params?.tags?.length) {
        params.tags.forEach(tag => url.searchParams.append('tags', tag));
      }

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
      return { products: data.products || [], count: data.count || 0 };
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  /**
   * Get a single product by handle or id
   */
  static async getProduct(handleOrId: string): Promise<MedusaProduct | null> {
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
        return data.products[0];
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
          return idData.product;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      throw error;
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(categoryId: string, limit = 50): Promise<MedusaProduct[]> {
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
      return data.products || [];
    } catch (error) {
      console.error('Failed to fetch products by category:', error);
      throw error;
    }
  }

  /**
   * Search products
   */
  static async searchProducts(query: string, limit = 20): Promise<MedusaProduct[]> {
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
      return data.products || [];
    } catch (error) {
      console.error('Failed to search products:', error);
      throw error;
    }
  }

  /**
   * Get featured products (you can customize this logic)
   */
  static async getFeaturedProducts(limit = 8): Promise<MedusaProduct[]> {
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
      return data.products || [];
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      throw error;
    }
  }

  /**
   * Get product recommendations (related products)
   */
  static async getRecommendations(productId: string, limit = 4): Promise<MedusaProduct[]> {
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
          return (data.products || []).filter((p: MedusaProduct) => p.id !== productId).slice(0, limit);
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
      return (data.products || []).filter((p: any) => p.id !== productId).slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      throw error;
    }
  }

  /**
   * Get all collections
   */
  static async getCollections(): Promise<unknown[]> {
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
      return data.collections || [];
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      throw error;
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