/**
 * Factory Pattern Type Definitions
 * Shared types for all factory implementations
 */

import type { IntegratedProduct, IntegratedCartItem } from '@/types/integrated';
import type { CartItem } from '@/lib/cart-store';
import type { WishlistItem } from '@/lib/wishlist-store';
import type { MedusaProduct } from '@/types/medusa';
import type { SanityProduct } from '@/types/sanity';

/**
 * Generic Factory Interface
 */
export interface Factory<TInput, TOutput, TContext = unknown> {
  create(input: TInput, context?: TContext): TOutput;
}

/**
 * Product Factory Specific Types
 */
export interface ProductFactoryInterface {
  createIntegratedProduct: (
    medusaProduct: MedusaProduct,
    sanityData?: SanityProduct,
    context?: ProductCreationContext
  ) => IntegratedProduct;

  createIntegratedProductFromSanity: (
    sanityData: SanityProduct,
    context?: ProductCreationContext
  ) => IntegratedProduct;

  createCartItem: (
    product: IntegratedProduct,
    variantId: string,
    quantity?: number
  ) => IntegratedCartItem;

  createWishlistItem: (product: IntegratedProduct) => WishlistItem;

  createLegacyCartItem: (
    integratedCartItem: IntegratedCartItem,
    lineItemId?: string
  ) => CartItem;
}

/**
 * Product Creation Context
 */
export interface ProductCreationContext {
  currency?: string;
  region?: string;
  includeVariants?: boolean;
  includePricing?: boolean;
  includeInventory?: boolean;
}

/**
 * Cart Factory Types (Future Implementation)
 */
export interface CartCreationContext {
  regionId?: string;
  currency?: string;
  customerId?: string;
}

export interface CartFactoryInterface {
  createCart: (context?: CartCreationContext) => unknown;
  createCartItem: (
    productId: string,
    variantId: string,
    quantity: number
  ) => unknown;
  updateCartItem: (itemId: string, updates: unknown) => unknown;
}

/**
 * Order Factory Types (Future Implementation)
 */
export interface OrderCreationContext {
  customerId?: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentMethodId?: string;
}

export interface OrderFactoryInterface {
  createOrder: (cartId: string, context: OrderCreationContext) => unknown;
  createOrderItem: (lineItem: unknown) => unknown;
}

/**
 * Factory Registry Pattern
 */
export interface FactoryRegistry {
  register<T>(name: string, factory: T): void;
  get<T>(name: string): T | null;
  list(): string[];
}

/**
 * Factory Creation Result
 */
export interface FactoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

/**
 * Async Factory Interface for factories that require async operations
 */
export interface AsyncFactory<TInput, TOutput, TContext = unknown> {
  create(input: TInput, context?: TContext): Promise<TOutput>;
}

/**
 * Batch Factory Interface for bulk operations
 */
export interface BatchFactory<TInput, TOutput, TContext = unknown> {
  createBatch(inputs: TInput[], context?: TContext): TOutput[];
  createBatchAsync(inputs: TInput[], context?: TContext): Promise<TOutput[]>;
}

/**
 * Validation Factory Interface
 */
export interface ValidatedFactory<TInput, TOutput, TContext = unknown>
  extends Factory<TInput, TOutput, TContext> {
  validate(input: TInput, context?: TContext): FactoryResult<boolean>;
  createSafe(input: TInput, context?: TContext): FactoryResult<TOutput>;
}

/**
 * Factory Configuration
 */
export interface FactoryConfig {
  enableCaching?: boolean;
  enableValidation?: boolean;
  enableMetrics?: boolean;
  defaultContext?: Record<string, unknown>;
}

/**
 * Factory Metrics
 */
export interface FactoryMetrics {
  creationCount: number;
  errorCount: number;
  averageCreationTime: number;
  lastCreated: Date | null;
  lastError: Date | null;
}

/**
 * Abstract Factory Pattern
 */
export interface AbstractFactory {
  createProduct: () => ProductFactoryInterface;
  createCart: () => CartFactoryInterface;
  createOrder: () => OrderFactoryInterface;
}

/**
 * Factory Builder Pattern
 */
export interface FactoryBuilder<T> {
  setConfig(config: FactoryConfig): this;
  setValidation(enabled: boolean): this;
  setCaching(enabled: boolean): this;
  setMetrics(enabled: boolean): this;
  build(): T;
}
