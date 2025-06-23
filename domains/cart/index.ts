/**
 * Cart Domain - Public API
 * Exports all public interfaces and implementations for the Cart domain
 */

// Entities
export * from './entities/cart';

// Repositories
export * from './repositories/cart-repository';

// Services
export * from './services/cart-service';

// Re-export commonly used types for convenience
export type {
  Cart,
  CartItem,
  CartDiscount,
  CartStatus,
  ShippingInformation,
} from './entities/cart';

export type {
  ICartRepository,
  ICartService,
  CartStatistics,
  CartAnalytics,
  CartValidationResult,
  CartValidationError,
  CartValidationWarning,
} from './repositories/cart-repository';

export type {
  CartService,
  CartManagementService,
  CartSynchronizationService,
} from './services/cart-service';