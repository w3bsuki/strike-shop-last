/**
 * Infrastructure Layer - Medusa Product Repository Implementation
 * Concrete implementation of Product Repository using Medusa.js
 */

import {
  ProductId,
  ProductCategoryId,
  Money,
  Currency,
  BaseRepository,
  Specification,
  PaginatedResult,
  Result,
  ResultUtils,
  ProductErrors,
  InMemoryRepository,
} from '../../shared/domain';
import {
  Product,
  ProductVariant,
  ProductImage,
  ProductStatus,
  ProductCategory,
  IProductRepository,
  IProductCategoryRepository,
  ProductSpecifications,
} from '../../domains/product';
import type { MedusaProduct, MedusaProductCategory } from '../../types/medusa';

/**
 * Medusa Product Repository Implementation
 * Adapts Medusa.js API to our domain repository interface
 */
export class MedusaProductRepository implements IProductRepository {
  private cache = new Map<string, Product>();
  private readonly baseUrl: string;
  private readonly publishableKey: string;
  private readonly regionId: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || '';
    this.publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';
    this.regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || '';
  }

  async findById(id: ProductId): Promise<Product | null> {
    try {
      // Check cache first
      const cached = this.cache.get(id.value);
      if (cached) return cached;

      const response = await this.fetchFromMedusa(`/store/products/${id.value}?region_id=${this.regionId}`);
      if (!response.ok) return null;

      const data = await response.json();
      if (!data.product) return null;

      const product = this.transformMedusaProduct(data.product);
      this.cache.set(id.value, product);
      return product;
    } catch (error) {
      console.error('Error finding product by ID:', error);
      return null;
    }
  }

  async findByIds(ids: ProductId[]): Promise<Product[]> {
    const products: Product[] = [];
    
    for (const id of ids) {
      const product = await this.findById(id);
      if (product) {
        products.push(product);
      }
    }
    
    return products;
  }

  async findByHandle(handle: string): Promise<Product | null> {
    try {
      const response = await this.fetchFromMedusa(
        `/store/products?handle=${handle}&region_id=${this.regionId}&limit=1`
      );
      if (!response.ok) return null;

      const data = await response.json();
      if (!data.products || data.products.length === 0) return null;

      return this.transformMedusaProduct(data.products[0]);
    } catch (error) {
      console.error('Error finding product by handle:', error);
      return null;
    }
  }

  async findByCategoryId(categoryId: ProductCategoryId, limit = 50): Promise<Product[]> {
    try {
      const response = await this.fetchFromMedusa(
        `/store/products?category_id=${categoryId.value}&region_id=${this.regionId}&limit=${limit}`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return (data.products || []).map((p: MedusaProduct) => this.transformMedusaProduct(p));
    } catch (error) {
      console.error('Error finding products by category:', error);
      return [];
    }
  }

  async findByCategoryIds(categoryIds: ProductCategoryId[]): Promise<Product[]> {
    try {
      const categoryIdParams = categoryIds.map(id => `category_id=${id.value}`).join('&');
      const response = await this.fetchFromMedusa(
        `/store/products?${categoryIdParams}&region_id=${this.regionId}&limit=100`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return (data.products || []).map((p: MedusaProduct) => this.transformMedusaProduct(p));
    } catch (error) {
      console.error('Error finding products by category IDs:', error);
      return [];
    }
  }

  async findByStatus(status: ProductStatus): Promise<Product[]> {
    // Medusa doesn't have direct status filtering, so we filter after fetching
    const allProducts = await this.findAll();
    return allProducts.filter(product => product.status === status);
  }

  async search(query: string, limit = 20): Promise<Product[]> {
    try {
      const response = await this.fetchFromMedusa(
        `/store/products?q=${encodeURIComponent(query)}&region_id=${this.regionId}&limit=${limit}`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return (data.products || []).map((p: MedusaProduct) => this.transformMedusaProduct(p));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  async findFeatured(limit = 8): Promise<Product[]> {
    // In Medusa, featured products could be marked with metadata or tags
    // For now, return the first products
    try {
      const response = await this.fetchFromMedusa(
        `/store/products?region_id=${this.regionId}&limit=${limit}`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return (data.products || []).map((p: MedusaProduct) => this.transformMedusaProduct(p));
    } catch (error) {
      console.error('Error finding featured products:', error);
      return [];
    }
  }

  async findNew(limit = 8): Promise<Product[]> {
    // New products are sorted by creation date
    try {
      const response = await this.fetchFromMedusa(
        `/store/products?region_id=${this.regionId}&limit=${limit}&order=created_at`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return (data.products || []).map((p: MedusaProduct) => this.transformMedusaProduct(p));
    } catch (error) {
      console.error('Error finding new products:', error);
      return [];
    }
  }

  async findOnSale(limit = 8): Promise<Product[]> {
    // Products on sale would have compare_at_price set
    const allProducts = await this.findAll();
    const saleProducts = allProducts.filter(product => 
      product.variants.some(variant => variant.compareAtPrice !== null)
    );
    return saleProducts.slice(0, limit);
  }

  async findRelated(productId: ProductId, limit = 4): Promise<Product[]> {
    try {
      // First get the product to find its categories
      const product = await this.findById(productId);
      if (!product || product.categoryIds.length === 0) {
        // Fallback to just returning some products
        return this.findFeatured(limit);
      }

      // Find products in the same category
      const categoryId = product.categoryIds[0];
      const categoryProducts = await this.findByCategoryId(categoryId, limit + 1);
      
      // Filter out the current product and limit results
      return categoryProducts
        .filter(p => !p.id.equals(productId))
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding related products:', error);
      return [];
    }
  }

  async findByVendor(vendor: string): Promise<Product[]> {
    // Medusa doesn't have direct vendor filtering in the store API
    // We'd need to use metadata or implement custom logic
    const allProducts = await this.findAll();
    return allProducts.filter(product => product.vendor === vendor);
  }

  async findByTags(tags: string[]): Promise<Product[]> {
    try {
      const tagParams = tags.map(tag => `tags=${encodeURIComponent(tag)}`).join('&');
      const response = await this.fetchFromMedusa(
        `/store/products?${tagParams}&region_id=${this.regionId}&limit=100`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return (data.products || []).map((p: MedusaProduct) => this.transformMedusaProduct(p));
    } catch (error) {
      console.error('Error finding products by tags:', error);
      return [];
    }
  }

  async isHandleAvailable(handle: string, excludeProductId?: ProductId): Promise<boolean> {
    const existingProduct = await this.findByHandle(handle);
    if (!existingProduct) return true;
    if (excludeProductId && existingProduct.id.equals(excludeProductId)) return true;
    return false;
  }

  async findLowInventory(threshold = 10): Promise<Product[]> {
    const allProducts = await this.findAll();
    return allProducts.filter(product => product.getTotalInventory() <= threshold);
  }

  async getRecommendations(productId: ProductId, limit = 4): Promise<Product[]> {
    // Same as related products for now
    return this.findRelated(productId, limit);
  }

  // Base repository methods
  async save(product: Product): Promise<Product> {
    // In a real implementation, this would save to Medusa
    // For now, just cache it
    this.cache.set(product.id.value, product);
    return product;
  }

  async saveMany(products: Product[]): Promise<Product[]> {
    return Promise.all(products.map(product => this.save(product)));
  }

  async delete(id: ProductId): Promise<void> {
    // In a real implementation, this would delete from Medusa
    this.cache.delete(id.value);
  }

  async deleteMany(ids: ProductId[]): Promise<void> {
    await Promise.all(ids.map(id => this.delete(id)));
  }

  async exists(id: ProductId): Promise<boolean> {
    const product = await this.findById(id);
    return product !== null;
  }

  async count(): Promise<number> {
    try {
      const response = await this.fetchFromMedusa(
        `/store/products?region_id=${this.regionId}&limit=1`
      );
      if (!response.ok) return 0;

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error counting products:', error);
      return 0;
    }
  }

  // Advanced repository methods
  async find(spec: Specification<Product>): Promise<Product[]> {
    // For complex specifications, we'd need to implement query translation
    // For now, get all products and filter in memory
    const allProducts = await this.findAll();
    return allProducts.filter(product => spec.isSatisfiedBy(product));
  }

  async findOne(spec: Specification<Product>): Promise<Product | null> {
    const products = await this.find(spec);
    return products[0] || null;
  }

  async findPaginated(
    spec?: Specification<Product>,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Product>> {
    try {
      const offset = (page - 1) * limit;
      const response = await this.fetchFromMedusa(
        `/store/products?region_id=${this.regionId}&limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        };
      }

      const data = await response.json();
      let products = (data.products || []).map((p: MedusaProduct) => this.transformMedusaProduct(p));
      
      // Apply specification filter if provided
      if (spec) {
        products = products.filter(product => spec.isSatisfiedBy(product));
      }

      const total = data.count || products.length;
      const totalPages = Math.ceil(total / limit);

      return {
        items: products,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      console.error('Error finding paginated products:', error);
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      const response = await this.fetchFromMedusa(
        `/store/products?region_id=${this.regionId}&limit=1000`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return (data.products || []).map((p: MedusaProduct) => this.transformMedusaProduct(p));
    } catch (error) {
      console.error('Error finding all products:', error);
      return [];
    }
  }

  async countBy(spec: Specification<Product>): Promise<number> {
    const products = await this.find(spec);
    return products.length;
  }

  async existsBy(spec: Specification<Product>): Promise<boolean> {
    const product = await this.findOne(spec);
    return product !== null;
  }

  // Private helper methods
  private async fetchFromMedusa(path: string): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    return fetch(url, {
      headers: {
        'x-publishable-api-key': this.publishableKey,
        'Content-Type': 'application/json',
      },
    });
  }

  private transformMedusaProduct(medusaProduct: MedusaProduct): Product {
    // Transform Medusa product to our domain product
    const productId = ProductId.create(medusaProduct.id);
    
    // Transform categories
    const categoryIds = (medusaProduct.categories || []).map(cat => 
      ProductCategoryId.create(cat.id)
    );

    // Transform images
    const images = (medusaProduct.images || []).map((img, index) => 
      new ProductImage(img.url, medusaProduct.title, undefined, undefined, index)
    );

    // Create product
    const product = new Product(
      productId,
      medusaProduct.title,
      medusaProduct.handle,
      medusaProduct.description || '',
      ProductStatus.ACTIVE, // Assume active if in store API
      categoryIds,
      medusaProduct.tags?.map(tag => tag.value) || [],
      undefined, // vendor
      medusaProduct.type?.value,
      images,
      undefined, // seo
      medusaProduct.metadata || {},
      [], // variants - will be added below
      undefined, // publishedAt
      new Date(medusaProduct.created_at),
      new Date(medusaProduct.updated_at)
    );

    // Transform and add variants
    if (medusaProduct.variants) {
      for (const medusaVariant of medusaProduct.variants) {
        const variantId = ProductVariantId.create(medusaVariant.id);
        
        // Get price from calculated_price or prices
        let price: Money;
        if (medusaVariant.calculated_price) {
          price = new Money(
            medusaVariant.calculated_price.calculated_amount,
            Currency.fromString(medusaVariant.calculated_price.currency_code)
          );
        } else if (medusaVariant.prices && medusaVariant.prices.length > 0) {
          const priceData = medusaVariant.prices[0];
          price = new Money(
            priceData.amount,
            Currency.fromString(priceData.currency_code)
          );
        } else {
          // Fallback price
          price = Money.fromDecimal(0, Currency.USD);
        }

        const variant = new ProductVariant(
          variantId,
          productId,
          medusaVariant.title,
          medusaVariant.sku || '',
          price,
          null, // compareAtPrice
          medusaVariant.inventory_quantity || 0,
          true, // inventoryManagement
          medusaVariant.allow_backorder || false,
          medusaVariant.options?.reduce((acc, opt) => {
            acc[opt.option_id] = opt.value;
            return acc;
          }, {} as Record<string, string>) || {},
          medusaVariant.barcode,
          medusaVariant.weight,
          undefined, // dimensions
          new Date(medusaVariant.created_at),
          new Date(medusaVariant.updated_at)
        );

        product.addVariant(variant);
      }
    }

    return product;
  }
}

/**
 * Medusa Product Category Repository Implementation
 */
export class MedusaProductCategoryRepository implements IProductCategoryRepository {
  private cache = new Map<string, ProductCategory>();
  private readonly baseUrl: string;
  private readonly publishableKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || '';
    this.publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';
  }

  async findById(id: ProductCategoryId): Promise<ProductCategory | null> {
    try {
      // Check cache first
      const cached = this.cache.get(id.value);
      if (cached) return cached;

      const response = await this.fetchFromMedusa(`/store/product-categories/${id.value}`);
      if (!response.ok) return null;

      const data = await response.json();
      if (!data.product_category) return null;

      const category = this.transformMedusaCategory(data.product_category);
      this.cache.set(id.value, category);
      return category;
    } catch (error) {
      console.error('Error finding category by ID:', error);
      return null;
    }
  }

  async findByIds(ids: ProductCategoryId[]): Promise<ProductCategory[]> {
    const categories: ProductCategory[] = [];
    
    for (const id of ids) {
      const category = await this.findById(id);
      if (category) {
        categories.push(category);
      }
    }
    
    return categories;
  }

  async findByHandle(handle: string): Promise<ProductCategory | null> {
    try {
      const response = await this.fetchFromMedusa(
        `/store/product-categories?handle=${handle}&limit=1`
      );
      if (!response.ok) return null;

      const data = await response.json();
      if (!data.product_categories || data.product_categories.length === 0) return null;

      return this.transformMedusaCategory(data.product_categories[0]);
    } catch (error) {
      console.error('Error finding category by handle:', error);
      return null;
    }
  }

  async findRoots(): Promise<ProductCategory[]> {
    try {
      const response = await this.fetchFromMedusa(
        `/store/product-categories?parent_category_id=null&limit=100`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return (data.product_categories || []).map((c: MedusaProductCategory) => 
        this.transformMedusaCategory(c)
      );
    } catch (error) {
      console.error('Error finding root categories:', error);
      return [];
    }
  }

  async findChildren(parentId: ProductCategoryId): Promise<ProductCategory[]> {
    try {
      const response = await this.fetchFromMedusa(
        `/store/product-categories?parent_category_id=${parentId.value}&limit=100`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return (data.product_categories || []).map((c: MedusaProductCategory) => 
        this.transformMedusaCategory(c)
      );
    } catch (error) {
      console.error('Error finding child categories:', error);
      return [];
    }
  }

  async findDescendants(parentId: ProductCategoryId): Promise<ProductCategory[]> {
    const descendants: ProductCategory[] = [];
    const children = await this.findChildren(parentId);
    
    for (const child of children) {
      descendants.push(child);
      const childDescendants = await this.findDescendants(child.id);
      descendants.push(...childDescendants);
    }
    
    return descendants;
  }

  async findPath(categoryId: ProductCategoryId): Promise<ProductCategory[]> {
    const path: ProductCategory[] = [];
    let current = await this.findById(categoryId);
    
    while (current) {
      path.unshift(current);
      if (current.parentId) {
        current = await this.findById(current.parentId);
      } else {
        break;
      }
    }
    
    return path;
  }

  async isHandleAvailable(handle: string, excludeCategoryId?: ProductCategoryId): Promise<boolean> {
    const existingCategory = await this.findByHandle(handle);
    if (!existingCategory) return true;
    if (excludeCategoryId && existingCategory.id.equals(excludeCategoryId)) return true;
    return false;
  }

  async findActive(): Promise<ProductCategory[]> {
    try {
      const response = await this.fetchFromMedusa(
        `/store/product-categories?is_active=true&limit=1000`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return (data.product_categories || []).map((c: MedusaProductCategory) => 
        this.transformMedusaCategory(c)
      );
    } catch (error) {
      console.error('Error finding active categories:', error);
      return [];
    }
  }

  async reorder(parentId: ProductCategoryId | null, categoryIds: ProductCategoryId[]): Promise<void> {
    // In a real implementation, this would call Medusa API to reorder
    // For now, just update positions in memory
    for (let i = 0; i < categoryIds.length; i++) {
      const category = await this.findById(categoryIds[i]);
      if (category) {
        category.updatePosition(i);
        this.cache.set(category.id.value, category);
      }
    }
  }

  // Base repository methods implementation
  async save(category: ProductCategory): Promise<ProductCategory> {
    this.cache.set(category.id.value, category);
    return category;
  }

  async saveMany(categories: ProductCategory[]): Promise<ProductCategory[]> {
    return Promise.all(categories.map(category => this.save(category)));
  }

  async delete(id: ProductCategoryId): Promise<void> {
    this.cache.delete(id.value);
  }

  async deleteMany(ids: ProductCategoryId[]): Promise<void> {
    await Promise.all(ids.map(id => this.delete(id)));
  }

  async exists(id: ProductCategoryId): Promise<boolean> {
    const category = await this.findById(id);
    return category !== null;
  }

  async count(): Promise<number> {
    try {
      const response = await this.fetchFromMedusa(
        `/store/product-categories?limit=1`
      );
      if (!response.ok) return 0;

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error counting categories:', error);
      return 0;
    }
  }

  // Advanced repository methods
  async find(spec: Specification<ProductCategory>): Promise<ProductCategory[]> {
    const allCategories = await this.findAll();
    return allCategories.filter(category => spec.isSatisfiedBy(category));
  }

  async findOne(spec: Specification<ProductCategory>): Promise<ProductCategory | null> {
    const categories = await this.find(spec);
    return categories[0] || null;
  }

  async findPaginated(
    spec?: Specification<ProductCategory>,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<ProductCategory>> {
    try {
      const offset = (page - 1) * limit;
      const response = await this.fetchFromMedusa(
        `/store/product-categories?limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        };
      }

      const data = await response.json();
      let categories = (data.product_categories || []).map((c: MedusaProductCategory) => 
        this.transformMedusaCategory(c)
      );
      
      if (spec) {
        categories = categories.filter(category => spec.isSatisfiedBy(category));
      }

      const total = data.count || categories.length;
      const totalPages = Math.ceil(total / limit);

      return {
        items: categories,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      console.error('Error finding paginated categories:', error);
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };
    }
  }

  async findAll(): Promise<ProductCategory[]> {
    try {
      const response = await this.fetchFromMedusa(
        `/store/product-categories?limit=1000`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return (data.product_categories || []).map((c: MedusaProductCategory) => 
        this.transformMedusaCategory(c)
      );
    } catch (error) {
      console.error('Error finding all categories:', error);
      return [];
    }
  }

  async countBy(spec: Specification<ProductCategory>): Promise<number> {
    const categories = await this.find(spec);
    return categories.length;
  }

  async existsBy(spec: Specification<ProductCategory>): Promise<boolean> {
    const category = await this.findOne(spec);
    return category !== null;
  }

  // Private helper methods
  private async fetchFromMedusa(path: string): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    return fetch(url, {
      headers: {
        'x-publishable-api-key': this.publishableKey,
        'Content-Type': 'application/json',
      },
    });
  }

  private transformMedusaCategory(medusaCategory: MedusaProductCategory): ProductCategory {
    const categoryId = ProductCategoryId.create(medusaCategory.id);
    const parentId = medusaCategory.parent_category_id 
      ? ProductCategoryId.create(medusaCategory.parent_category_id)
      : undefined;

    return new ProductCategory(
      categoryId,
      medusaCategory.name,
      medusaCategory.handle,
      medusaCategory.description || '',
      medusaCategory.is_active ? 'active' as any : 'inactive' as any,
      'standard' as any, // Default type
      parentId,
      medusaCategory.rank || 0,
      undefined, // imageUrl
      undefined, // bannerUrl
      undefined, // seo
      medusaCategory.metadata || {},
      medusaCategory.is_internal ? false : true, // isVisible
      medusaCategory.rank || 0,
      new Date(medusaCategory.created_at),
      new Date(medusaCategory.updated_at)
    );
  }
}