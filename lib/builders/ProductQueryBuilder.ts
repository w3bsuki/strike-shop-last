/**
 * Builder Pattern Implementation for Product Queries
 * Provides a fluent API for building complex product search queries
 */

import type { ProductFilters, ProductSortOption } from '@/types/integrated';

/**
 * Product query interface
 */
export interface ProductQuery {
  // Filtering
  categories?: string[];
  tags?: string[];
  priceRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  sizes?: string[];
  colors?: string[];
  brands?: string[];
  availability?: 'in_stock' | 'out_of_stock' | 'all';
  onSale?: boolean;
  isNew?: boolean;
  featured?: boolean;

  // Search
  searchTerm?: string;
  searchFields?: ('title' | 'description' | 'tags' | 'sku')[];

  // Sorting
  sortBy?: ProductSortOption;
  sortDirection?: 'asc' | 'desc';

  // Pagination
  limit?: number;
  offset?: number;
  page?: number;

  // Includes
  includeVariants?: boolean;
  includeImages?: boolean;
  includeCategories?: boolean;
  includePricing?: boolean;
  includeInventory?: boolean;

  // Advanced
  region?: string;
  currency?: string;
  customerId?: string;
  locale?: string;

  // Raw query for complex scenarios
  rawQuery?: Record<string, any>;
}

/**
 * Query validation result
 */
export interface QueryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Product Query Builder - Builder Pattern Implementation
 */
export class ProductQueryBuilder {
  private query: ProductQuery = {};

  /**
   * Create a new query builder
   */
  static create(): ProductQueryBuilder {
    return new ProductQueryBuilder();
  }

  /**
   * Create builder from existing query
   */
  static fromQuery(query: ProductQuery): ProductQueryBuilder {
    const builder = new ProductQueryBuilder();
    builder.query = { ...query };
    return builder;
  }

  /**
   * Category filtering
   */
  category(category: string): this {
    if (!this.query.categories) {
      this.query.categories = [];
    }
    if (!this.query.categories.includes(category)) {
      this.query.categories.push(category);
    }
    return this;
  }

  categories(categories: string[]): this {
    this.query.categories = [...(this.query.categories || []), ...categories];
    return this;
  }

  /**
   * Tag filtering
   */
  tag(tag: string): this {
    if (!this.query.tags) {
      this.query.tags = [];
    }
    if (!this.query.tags.includes(tag)) {
      this.query.tags.push(tag);
    }
    return this;
  }

  tags(tags: string[]): this {
    this.query.tags = [...(this.query.tags || []), ...tags];
    return this;
  }

  /**
   * Price range filtering
   */
  priceRange(min?: number, max?: number, currency = 'GBP'): this {
    this.query.priceRange = { min, max, currency };
    return this;
  }

  minPrice(price: number, currency = 'GBP'): this {
    if (!this.query.priceRange) {
      this.query.priceRange = { currency };
    }
    this.query.priceRange.min = price;
    return this;
  }

  maxPrice(price: number, currency = 'GBP'): this {
    if (!this.query.priceRange) {
      this.query.priceRange = { currency };
    }
    this.query.priceRange.max = price;
    return this;
  }

  /**
   * Size filtering
   */
  size(size: string): this {
    if (!this.query.sizes) {
      this.query.sizes = [];
    }
    if (!this.query.sizes.includes(size)) {
      this.query.sizes.push(size);
    }
    return this;
  }

  sizes(sizes: string[]): this {
    this.query.sizes = [...(this.query.sizes || []), ...sizes];
    return this;
  }

  /**
   * Color filtering
   */
  color(color: string): this {
    if (!this.query.colors) {
      this.query.colors = [];
    }
    if (!this.query.colors.includes(color)) {
      this.query.colors.push(color);
    }
    return this;
  }

  colors(colors: string[]): this {
    this.query.colors = [...(this.query.colors || []), ...colors];
    return this;
  }

  /**
   * Brand filtering
   */
  brand(brand: string): this {
    if (!this.query.brands) {
      this.query.brands = [];
    }
    if (!this.query.brands.includes(brand)) {
      this.query.brands.push(brand);
    }
    return this;
  }

  brands(brands: string[]): this {
    this.query.brands = [...(this.query.brands || []), ...brands];
    return this;
  }

  /**
   * Availability filtering
   */
  availability(status: 'in_stock' | 'out_of_stock' | 'all'): this {
    this.query.availability = status;
    return this;
  }

  inStock(): this {
    this.query.availability = 'in_stock';
    return this;
  }

  outOfStock(): this {
    this.query.availability = 'out_of_stock';
    return this;
  }

  /**
   * Sale and special status filtering
   */
  onSale(onSale = true): this {
    this.query.onSale = onSale;
    return this;
  }

  isNew(isNew = true): this {
    this.query.isNew = isNew;
    return this;
  }

  featured(featured = true): this {
    this.query.featured = featured;
    return this;
  }

  /**
   * Search functionality
   */
  search(
    term: string,
    fields?: ('title' | 'description' | 'tags' | 'sku')[]
  ): this {
    this.query.searchTerm = term;
    if (fields) {
      this.query.searchFields = fields;
    }
    return this;
  }

  searchInTitle(term: string): this {
    this.query.searchTerm = term;
    this.query.searchFields = ['title'];
    return this;
  }

  searchInDescription(term: string): this {
    this.query.searchTerm = term;
    this.query.searchFields = ['description'];
    return this;
  }

  /**
   * Sorting
   */
  sortBy(sort: ProductSortOption, direction: 'asc' | 'desc' = 'asc'): this {
    this.query.sortBy = sort;
    this.query.sortDirection = direction;
    return this;
  }

  sortByPrice(direction: 'asc' | 'desc' = 'asc'): this {
    this.query.sortBy = direction === 'asc' ? 'price-asc' : 'price-desc';
    return this;
  }

  sortByName(direction: 'asc' | 'desc' = 'asc'): this {
    this.query.sortBy = direction === 'asc' ? 'name-asc' : 'name-desc';
    return this;
  }

  sortByNewest(): this {
    this.query.sortBy = 'newest';
    return this;
  }

  sortByBestSelling(): this {
    this.query.sortBy = 'best-selling';
    return this;
  }

  sortByRelevance(): this {
    this.query.sortBy = 'relevance';
    return this;
  }

  /**
   * Pagination
   */
  limit(limit: number): this {
    this.query.limit = Math.max(1, Math.min(100, limit)); // Ensure reasonable limits
    return this;
  }

  offset(offset: number): this {
    this.query.offset = Math.max(0, offset);
    return this;
  }

  page(page: number, pageSize = 20): this {
    this.query.page = Math.max(1, page);
    this.query.limit = pageSize;
    this.query.offset = (page - 1) * pageSize;
    return this;
  }

  /**
   * Data includes
   */
  includeVariants(include = true): this {
    this.query.includeVariants = include;
    return this;
  }

  includeImages(include = true): this {
    this.query.includeImages = include;
    return this;
  }

  includeCategories(include = true): this {
    this.query.includeCategories = include;
    return this;
  }

  includePricing(include = true): this {
    this.query.includePricing = include;
    return this;
  }

  includeInventory(include = true): this {
    this.query.includeInventory = include;
    return this;
  }

  includeAll(): this {
    return this.includeVariants()
      .includeImages()
      .includeCategories()
      .includePricing()
      .includeInventory();
  }

  /**
   * Regional and localization settings
   */
  region(region: string): this {
    this.query.region = region;
    return this;
  }

  currency(currency: string): this {
    this.query.currency = currency;
    return this;
  }

  customer(customerId: string): this {
    this.query.customerId = customerId;
    return this;
  }

  locale(locale: string): this {
    this.query.locale = locale;
    return this;
  }

  /**
   * Raw query for advanced use cases
   */
  raw(rawQuery: Record<string, any>): this {
    this.query.rawQuery = { ...this.query.rawQuery, ...rawQuery };
    return this;
  }

  /**
   * Filter presets
   */
  mensClothing(): this {
    return this.categories(['mens', 'clothing']);
  }

  womensClothing(): this {
    return this.categories(['womens', 'clothing']);
  }

  accessories(): this {
    return this.category('accessories');
  }

  shoes(): this {
    return this.category('shoes');
  }

  newArrivals(): this {
    return this.isNew().sortByNewest();
  }

  saleItems(): this {
    return this.onSale().sortByPrice('asc');
  }

  bestSellers(): this {
    return this.sortByBestSelling();
  }

  affordable(maxPrice = 5000): this {
    // £50.00 in pence
    return this.maxPrice(maxPrice);
  }

  premium(minPrice = 10000): this {
    // £100.00 in pence
    return this.minPrice(minPrice);
  }

  /**
   * Query validation
   */
  validate(): QueryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate price range
    if (this.query.priceRange) {
      const { min, max } = this.query.priceRange;
      if (min !== undefined && max !== undefined && min > max) {
        errors.push('Minimum price cannot be greater than maximum price');
      }
      if (min !== undefined && min < 0) {
        errors.push('Minimum price cannot be negative');
      }
      if (max !== undefined && max < 0) {
        errors.push('Maximum price cannot be negative');
      }
    }

    // Validate pagination
    if (this.query.limit !== undefined && this.query.limit <= 0) {
      errors.push('Limit must be greater than 0');
    }
    if (this.query.offset !== undefined && this.query.offset < 0) {
      errors.push('Offset cannot be negative');
    }
    if (this.query.page !== undefined && this.query.page <= 0) {
      errors.push('Page must be greater than 0');
    }

    // Validate search
    if (this.query.searchTerm && this.query.searchTerm.trim().length === 0) {
      warnings.push('Search term is empty');
    }

    // Performance warnings
    if (this.query.limit && this.query.limit > 50) {
      warnings.push('Large limit may impact performance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Reset builder to empty state
   */
  reset(): this {
    this.query = {};
    return this;
  }

  /**
   * Clone the current builder
   */
  clone(): ProductQueryBuilder {
    return ProductQueryBuilder.fromQuery(this.query);
  }

  /**
   * Build the final query
   */
  build(): ProductQuery {
    const validation = this.validate();

    if (!validation.valid) {
      throw new Error(`Invalid query: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {

    }

    return { ...this.query };
  }

  /**
   * Build for specific data sources
   */
  buildForMedusa(): any {
    const query = this.build();

    const medusaQuery: any = {};

    // Basic pagination
    if (query.limit) medusaQuery.limit = query.limit;
    if (query.offset) medusaQuery.offset = query.offset;

    // Categories
    if (query.categories && query.categories.length > 0) {
      medusaQuery.category_id = query.categories;
    }

    // Tags
    if (query.tags && query.tags.length > 0) {
      medusaQuery.tags = query.tags;
    }

    // Search
    if (query.searchTerm) {
      medusaQuery.q = query.searchTerm;
    }

    // Region
    if (query.region) {
      medusaQuery.region_id = query.region;
    }

    // Currency for pricing
    if (query.currency) {
      medusaQuery.currency_code = query.currency;
    }

    return medusaQuery;
  }

  buildForSanity(): string {
    const query = this.build();

    let sanityQuery = '*[_type == "product"';
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    // Categories
    if (query.categories && query.categories.length > 0) {
      conditions.push('category->slug.current in $categories');
      params.categories = query.categories;
    }

    // Tags
    if (query.tags && query.tags.length > 0) {
      conditions.push('$tags match tags[]');
      params.tags = query.tags.join('|');
    }

    // Price range
    if (query.priceRange) {
      if (query.priceRange.min !== undefined) {
        conditions.push('price >= $minPrice');
        params.minPrice = query.priceRange.min / 100; // Convert from pence
      }
      if (query.priceRange.max !== undefined) {
        conditions.push('price <= $maxPrice');
        params.maxPrice = query.priceRange.max / 100; // Convert from pence
      }
    }

    // Availability
    if (query.availability === 'in_stock') {
      conditions.push('inStock == true');
    } else if (query.availability === 'out_of_stock') {
      conditions.push('inStock == false');
    }

    // Sale items
    if (query.onSale) {
      conditions.push('defined(compareAtPrice)');
    }

    // Search
    if (query.searchTerm) {
      const searchFields = query.searchFields || ['title', 'description'];
      const searchConditions = searchFields
        .map((field) => `${field} match $searchTerm`)
        .join(' || ');
      conditions.push(`(${searchConditions})`);
      params.searchTerm = `*${query.searchTerm}*`;
    }

    // Add conditions to query
    if (conditions.length > 0) {
      sanityQuery += ` && ${conditions.join(' && ')}`;
    }

    sanityQuery += ']';

    // Sorting
    if (query.sortBy) {
      switch (query.sortBy) {
        case 'price-asc':
          sanityQuery += ' | order(price asc)';
          break;
        case 'price-desc':
          sanityQuery += ' | order(price desc)';
          break;
        case 'name-asc':
          sanityQuery += ' | order(title asc)';
          break;
        case 'name-desc':
          sanityQuery += ' | order(title desc)';
          break;
        case 'newest':
          sanityQuery += ' | order(_createdAt desc)';
          break;
        default:
          // Default to created date desc
          sanityQuery += ' | order(_createdAt desc)';
      }
    }

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    sanityQuery += `[${offset}...${offset + limit}]`;

    return sanityQuery;
  }

  /**
   * Convert to legacy ProductFilters interface
   */
  toProductFilters(): ProductFilters {
    const query = this.build();

    return {
      categories: query.categories,
      priceRange: query.priceRange
        ? {
            min: query.priceRange.min,
            max: query.priceRange.max,
          }
        : undefined,
      sizes: query.sizes,
      colors: query.colors,
      brands: query.brands,
      tags: query.tags,
      inStock: query.availability === 'in_stock',
      onSale: query.onSale,
      isNew: query.isNew,
    };
  }

  /**
   * Debug information
   */
  debug(): {
    query: ProductQuery;
    medusaQuery: any;
    sanityQuery: string;
    validation: QueryValidationResult;
  } {
    const query = this.query;
    const validation = this.validate();

    return {
      query,
      medusaQuery: validation.valid ? this.buildForMedusa() : null,
      sanityQuery: validation.valid ? this.buildForSanity() : '',
      validation,
    };
  }
}

/**
 * Query builder factory
 */
export class QueryBuilderFactory {
  /**
   * Create a standard product query builder
   */
  static createProductQuery(): ProductQueryBuilder {
    return ProductQueryBuilder.create();
  }

  /**
   * Create a search-focused query builder
   */
  static createSearchQuery(term: string): ProductQueryBuilder {
    return ProductQueryBuilder.create()
      .search(term)
      .sortByRelevance()
      .includeAll();
  }

  /**
   * Create a category browsing query builder
   */
  static createCategoryQuery(category: string): ProductQueryBuilder {
    return ProductQueryBuilder.create()
      .category(category)
      .inStock()
      .includeAll()
      .sortByBestSelling();
  }

  /**
   * Create a sale items query builder
   */
  static createSaleQuery(): ProductQueryBuilder {
    return ProductQueryBuilder.create().saleItems().inStock().includeAll();
  }

  /**
   * Create a new arrivals query builder
   */
  static createNewArrivalsQuery(): ProductQueryBuilder {
    return ProductQueryBuilder.create()
      .newArrivals()
      .inStock()
      .includeAll()
      .limit(20);
  }

  /**
   * Create from legacy filters
   */
  static fromProductFilters(filters: ProductFilters): ProductQueryBuilder {
    const builder = ProductQueryBuilder.create();

    if (filters.categories) builder.categories(filters.categories);
    if (filters.tags) builder.tags(filters.tags);
    if (filters.sizes) builder.sizes(filters.sizes);
    if (filters.colors) builder.colors(filters.colors);
    if (filters.brands) builder.brands(filters.brands);
    if (filters.priceRange) {
      builder.priceRange(filters.priceRange.min, filters.priceRange.max);
    }
    if (filters.inStock) builder.inStock();
    if (filters.onSale) builder.onSale();
    if (filters.isNew) builder.isNew();

    return builder;
  }
}

// Export convenience functions
export const createProductQuery = () => ProductQueryBuilder.create();
export const createSearchQuery = (term: string) =>
  QueryBuilderFactory.createSearchQuery(term);
export const createCategoryQuery = (category: string) =>
  QueryBuilderFactory.createCategoryQuery(category);
export const createSaleQuery = () => QueryBuilderFactory.createSaleQuery();
export const createNewArrivalsQuery = () =>
  QueryBuilderFactory.createNewArrivalsQuery();
