/**
 * Product Domain - Public API
 * Exports all public interfaces and implementations for the Product domain
 */

// Entities
export * from './entities/product';
export * from './entities/product-category';

// Repositories
export * from './repositories/product-repository';

// Services
export * from './services/product-service';

// Re-export commonly used types for convenience
export type {
  Product,
  ProductVariant,
  ProductImage,
  ProductDimensions,
  ProductSEO,
  ProductStatus,
  ProductAvailability,
} from './entities/product';

export type {
  ProductCategory,
  CategoryStatus,
  CategoryType,
  CategorySEO,
  CategoryTree,
  CategoryNode,
} from './entities/product-category';

export type {
  IProductRepository,
  IProductCategoryRepository,
  IProductService,
  ProductImportData,
  ProductExportData,
  ProductAnalytics,
} from './repositories/product-repository';

export type {
  ProductService,
  ProductSearchService,
} from './services/product-service';