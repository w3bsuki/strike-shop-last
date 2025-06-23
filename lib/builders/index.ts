/**
 * Builder Pattern Exports
 * Central export point for all builder implementations
 */

export {
  type ProductQuery,
  type QueryValidationResult,
  ProductQueryBuilder,
  QueryBuilderFactory,
  createProductQuery,
  createSearchQuery,
  createCategoryQuery,
  createSaleQuery,
  createNewArrivalsQuery,
} from './ProductQueryBuilder';

// Future builder exports will go here
// export { CartQueryBuilder } from './CartQueryBuilder'
// export { OrderQueryBuilder } from './OrderQueryBuilder'
// export { UserQueryBuilder } from './UserQueryBuilder'
