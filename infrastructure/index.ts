/**
 * Infrastructure Layer - Public API
 * Exports all infrastructure implementations and utilities
 */

// Repository implementations
export * from './repositories/medusa-product-repository';
export * from './repositories/local-cart-repository';

// Dependency injection
export * from './dependency-injection/container';

// Re-export for convenience
export {
  MedusaProductRepository,
  MedusaProductCategoryRepository,
} from './repositories/medusa-product-repository';

export {
  LocalCartRepository,
  CartRepositoryFactory,
} from './repositories/local-cart-repository';

export {
  ServiceContainer,
  ServiceLocator,
  getService,
  registerService,
  registerFactory,
  initializeServices,
  ServiceConfigurator,
  ServiceHealthCheck,
} from './dependency-injection/container';