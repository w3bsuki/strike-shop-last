/**
 * Product Domain - Product Repository Interface and Implementation
 * Implements Repository pattern for Product aggregate
 */

import {
  Repository,
  AdvancedRepository,
  Specification,
  PaginatedResult,
  ProductId,
  ProductCategoryId,
  Result,
  ProductErrors,
  ResultUtils,
} from '../../../shared/domain';
import { Product, ProductStatus, ProductAvailability } from '../entities/product';
import { ProductCategory } from '../entities/product-category';

// Product repository interface
export interface IProductRepository extends AdvancedRepository<Product, ProductId> {
  /**
   * Find product by handle (URL slug)
   */
  findByHandle(handle: string): Promise<Product | null>;

  /**
   * Find products by category
   */
  findByCategoryId(categoryId: ProductCategoryId, limit?: number): Promise<Product[]>;

  /**
   * Find products by multiple categories
   */
  findByCategoryIds(categoryIds: ProductCategoryId[]): Promise<Product[]>;

  /**
   * Find products by status
   */
  findByStatus(status: ProductStatus): Promise<Product[]>;

  /**
   * Search products by title or description
   */
  search(query: string, limit?: number): Promise<Product[]>;

  /**
   * Find featured products
   */
  findFeatured(limit?: number): Promise<Product[]>;

  /**
   * Find new products
   */
  findNew(limit?: number): Promise<Product[]>;

  /**
   * Find products on sale
   */
  findOnSale(limit?: number): Promise<Product[]>;

  /**
   * Find related products
   */
  findRelated(productId: ProductId, limit?: number): Promise<Product[]>;

  /**
   * Find products by vendor
   */
  findByVendor(vendor: string): Promise<Product[]>;

  /**
   * Find products by tags
   */
  findByTags(tags: string[]): Promise<Product[]>;

  /**
   * Check if handle is available
   */
  isHandleAvailable(handle: string, excludeProductId?: ProductId): Promise<boolean>;

  /**
   * Get products with low inventory
   */
  findLowInventory(threshold?: number): Promise<Product[]>;

  /**
   * Get product recommendations
   */
  getRecommendations(productId: ProductId, limit?: number): Promise<Product[]>;
}

// Product category repository interface
export interface IProductCategoryRepository extends AdvancedRepository<ProductCategory, ProductCategoryId> {
  /**
   * Find category by handle
   */
  findByHandle(handle: string): Promise<ProductCategory | null>;

  /**
   * Find root categories
   */
  findRoots(): Promise<ProductCategory[]>;

  /**
   * Find children of a category
   */
  findChildren(parentId: ProductCategoryId): Promise<ProductCategory[]>;

  /**
   * Find all descendants of a category
   */
  findDescendants(parentId: ProductCategoryId): Promise<ProductCategory[]>;

  /**
   * Find category path
   */
  findPath(categoryId: ProductCategoryId): Promise<ProductCategory[]>;

  /**
   * Check if handle is available
   */
  isHandleAvailable(handle: string, excludeCategoryId?: ProductCategoryId): Promise<boolean>;

  /**
   * Find active categories
   */
  findActive(): Promise<ProductCategory[]>;

  /**
   * Reorder categories within parent
   */
  reorder(parentId: ProductCategoryId | null, categoryIds: ProductCategoryId[]): Promise<void>;
}

// Product specifications for complex queries
export class ProductSpecifications {
  static isActive(): Specification<Product> {
    return {
      isSatisfiedBy: (product: Product) => product.status === ProductStatus.ACTIVE,
      toQuery: () => ({ where: { status: ProductStatus.ACTIVE } }),
    };
  }

  static isAvailable(): Specification<Product> {
    return {
      isSatisfiedBy: (product: Product) => product.isAvailable(),
      toQuery: () => ({ where: { status: ProductStatus.ACTIVE } }), // Additional filtering needed in implementation
    };
  }

  static inCategory(categoryId: ProductCategoryId): Specification<Product> {
    return {
      isSatisfiedBy: (product: Product) => 
        product.categoryIds.some(id => id.equals(categoryId)),
      toQuery: () => ({ where: { categoryIds: categoryId.value } }),
    };
  }

  static withTag(tag: string): Specification<Product> {
    return {
      isSatisfiedBy: (product: Product) => 
        product.tags.includes(tag.toLowerCase()),
      toQuery: () => ({ where: { tags: tag.toLowerCase() } }),
    };
  }

  static withTags(tags: string[]): Specification<Product> {
    const normalizedTags = tags.map(tag => tag.toLowerCase());
    return {
      isSatisfiedBy: (product: Product) => 
        normalizedTags.some(tag => product.tags.includes(tag)),
      toQuery: () => ({ where: { tags: normalizedTags } }),
    };
  }

  static byVendor(vendor: string): Specification<Product> {
    return {
      isSatisfiedBy: (product: Product) => product.vendor === vendor,
      toQuery: () => ({ where: { vendor } }),
    };
  }

  static published(): Specification<Product> {
    return {
      isSatisfiedBy: (product: Product) => 
        product.status === ProductStatus.ACTIVE && product.publishedAt !== undefined,
      toQuery: () => ({ 
        where: { 
          status: ProductStatus.ACTIVE,
          publishedAt: { ne: null }
        } 
      }),
    };
  }

  static priceRange(minPrice: number, maxPrice: number, currency: string): Specification<Product> {
    return {
      isSatisfiedBy: (product: Product) => {
        const priceRange = product.getPriceRange();
        if (!priceRange) return false;
        
        return priceRange.min.currency.code === currency &&
               priceRange.min.amount >= minPrice &&
               priceRange.max.amount <= maxPrice;
      },
      toQuery: () => ({ 
        where: { 
          minPrice: { gte: minPrice },
          maxPrice: { lte: maxPrice },
          currency
        } 
      }),
    };
  }

  static lowInventory(threshold: number = 10): Specification<Product> {
    return {
      isSatisfiedBy: (product: Product) => 
        product.getTotalInventory() <= threshold,
      toQuery: () => ({ where: { totalInventory: { lte: threshold } } }),
    };
  }

  static outOfStock(): Specification<Product> {
    return {
      isSatisfiedBy: (product: Product) => 
        product.getAvailabilityStatus() === ProductAvailability.OUT_OF_STOCK,
      toQuery: () => ({ where: { availabilityStatus: ProductAvailability.OUT_OF_STOCK } }),
    };
  }

  static createdAfter(date: Date): Specification<Product> {
    return {
      isSatisfiedBy: (product: Product) => product.createdAt > date,
      toQuery: () => ({ where: { createdAt: { gt: date } } }),
    };
  }

  static updatedAfter(date: Date): Specification<Product> {
    return {
      isSatisfiedBy: (product: Product) => product.updatedAt > date,
      toQuery: () => ({ where: { updatedAt: { gt: date } } }),
    };
  }

  static searchByText(query: string): Specification<Product> {
    const normalizedQuery = query.toLowerCase();
    return {
      isSatisfiedBy: (product: Product) => 
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery) ||
        product.tags.some(tag => tag.includes(normalizedQuery)),
      toQuery: () => ({ 
        where: { 
          $or: [
            { title: { contains: query } },
            { description: { contains: query } },
            { tags: { contains: query } }
          ]
        } 
      }),
    };
  }

  // Compound specifications
  static activeAndAvailable(): Specification<Product> {
    return this.combineAnd(this.isActive(), this.isAvailable());
  }

  static activeInCategory(categoryId: ProductCategoryId): Specification<Product> {
    return this.combineAnd(this.isActive(), this.inCategory(categoryId));
  }

  static searchActiveProducts(query: string): Specification<Product> {
    return this.combineAnd(this.isActive(), this.searchByText(query));
  }

  // Specification combinators
  static combineAnd<T>(...specs: Specification<T>[]): Specification<T> {
    return {
      isSatisfiedBy: (entity: T) => specs.every(spec => spec.isSatisfiedBy(entity)),
      toQuery: () => {
        // Combine queries with AND logic
        const queries = specs.map(spec => spec.toQuery());
        return { where: { $and: queries.map(q => q.where) } };
      },
    };
  }

  static combineOr<T>(...specs: Specification<T>[]): Specification<T> {
    return {
      isSatisfiedBy: (entity: T) => specs.some(spec => spec.isSatisfiedBy(entity)),
      toQuery: () => {
        // Combine queries with OR logic
        const queries = specs.map(spec => spec.toQuery());
        return { where: { $or: queries.map(q => q.where) } };
      },
    };
  }
}

// Service interface for complex product operations
export interface IProductService {
  /**
   * Create a new product
   */
  createProduct(
    title: string,
    handle: string,
    description: string,
    categoryIds: ProductCategoryId[]
  ): Promise<Result<Product>>;

  /**
   * Update product basic information
   */
  updateProduct(
    productId: ProductId,
    updates: {
      title?: string;
      description?: string;
      vendor?: string;
      productType?: string;
    }
  ): Promise<Result<Product>>;

  /**
   * Publish product
   */
  publishProduct(productId: ProductId): Promise<Result<Product>>;

  /**
   * Unpublish product
   */
  unpublishProduct(productId: ProductId): Promise<Result<Product>>;

  /**
   * Delete product
   */
  deleteProduct(productId: ProductId): Promise<Result<void>>;

  /**
   * Duplicate product
   */
  duplicateProduct(
    productId: ProductId,
    newTitle: string,
    newHandle: string
  ): Promise<Result<Product>>;

  /**
   * Import products from external source
   */
  importProducts(products: ProductImportData[]): Promise<Result<Product[]>>;

  /**
   * Export products
   */
  exportProducts(productIds?: ProductId[]): Promise<Result<ProductExportData[]>>;

  /**
   * Bulk update products
   */
  bulkUpdateProducts(
    productIds: ProductId[],
    updates: Partial<Product>
  ): Promise<Result<Product[]>>;

  /**
   * Get product analytics
   */
  getProductAnalytics(productId: ProductId): Promise<Result<ProductAnalytics>>;
}

// Data transfer objects
export interface ProductImportData {
  title: string;
  handle: string;
  description?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  categoryHandles?: string[];
  variants: ProductVariantImportData[];
  images?: ProductImageImportData[];
}

export interface ProductVariantImportData {
  title: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  inventoryQuantity?: number;
  options?: Record<string, string>;
  barcode?: string;
  weight?: number;
}

export interface ProductImageImportData {
  url: string;
  alt: string;
  position?: number;
}

export interface ProductExportData {
  id: string;
  title: string;
  handle: string;
  description: string;
  status: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  categories: string[];
  variants: ProductVariantExportData[];
  images: ProductImageExportData[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariantExportData {
  id: string;
  title: string;
  sku: string;
  price: number;
  currency: string;
  compareAtPrice?: number;
  inventoryQuantity: number;
  options: Record<string, string>;
  barcode?: string;
  weight?: number;
}

export interface ProductImageExportData {
  url: string;
  alt: string;
  position: number;
}

export interface ProductAnalytics {
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  averageOrderValue: number;
  inventoryTurnover: number;
  popularVariants: Array<{
    variantId: string;
    sales: number;
    revenue: number;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
    conversions: number;
  }>;
}

// Query builder for complex product queries
export class ProductQueryBuilder {
  private specifications: Specification<Product>[] = [];
  private sortBy: Array<{ field: keyof Product; direction: 'asc' | 'desc' }> = [];
  private limitValue?: number;
  private offsetValue?: number;

  static create(): ProductQueryBuilder {
    return new ProductQueryBuilder();
  }

  where(spec: Specification<Product>): this {
    this.specifications.push(spec);
    return this;
  }

  isActive(): this {
    return this.where(ProductSpecifications.isActive());
  }

  isAvailable(): this {
    return this.where(ProductSpecifications.isAvailable());
  }

  inCategory(categoryId: ProductCategoryId): this {
    return this.where(ProductSpecifications.inCategory(categoryId));
  }

  withTag(tag: string): this {
    return this.where(ProductSpecifications.withTag(tag));
  }

  byVendor(vendor: string): this {
    return this.where(ProductSpecifications.byVendor(vendor));
  }

  searchText(query: string): this {
    return this.where(ProductSpecifications.searchByText(query));
  }

  priceRange(min: number, max: number, currency: string): this {
    return this.where(ProductSpecifications.priceRange(min, max, currency));
  }

  lowInventory(threshold?: number): this {
    return this.where(ProductSpecifications.lowInventory(threshold));
  }

  createdAfter(date: Date): this {
    return this.where(ProductSpecifications.createdAfter(date));
  }

  sortByTitle(direction: 'asc' | 'desc' = 'asc'): this {
    this.sortBy.push({ field: 'title', direction });
    return this;
  }

  sortByCreatedAt(direction: 'asc' | 'desc' = 'desc'): this {
    this.sortBy.push({ field: 'createdAt', direction });
    return this;
  }

  sortByUpdatedAt(direction: 'asc' | 'desc' = 'desc'): this {
    this.sortBy.push({ field: 'updatedAt', direction });
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  build(): Specification<Product> {
    if (this.specifications.length === 0) {
      throw new Error('At least one specification must be provided');
    }

    if (this.specifications.length === 1) {
      return this.specifications[0];
    }

    return ProductSpecifications.combineAnd(...this.specifications);
  }

  getQuery() {
    const spec = this.build();
    const query = spec.toQuery();

    if (this.sortBy.length > 0) {
      query.orderBy = this.sortBy;
    }

    if (this.limitValue !== undefined) {
      query.limit = this.limitValue;
    }

    if (this.offsetValue !== undefined) {
      query.offset = this.offsetValue;
    }

    return query;
  }
}