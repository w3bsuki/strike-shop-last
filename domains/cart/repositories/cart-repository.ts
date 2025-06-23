/**
 * Cart Domain - Cart Repository Interface and Implementation
 * Implements Repository pattern for Cart aggregate
 */

import {
  Repository,
  AdvancedRepository,
  Specification,
  PaginatedResult,
  CartId,
  UserId,
  Result,
  ResultUtils,
  ValidationError,
} from '../../../shared/domain';
import { Cart, CartStatus } from '../entities/cart';

// Cart repository interface
export interface ICartRepository extends AdvancedRepository<Cart, CartId> {
  /**
   * Find cart by user ID
   */
  findByUserId(userId: UserId): Promise<Cart | null>;

  /**
   * Find cart by session ID
   */
  findBySessionId(sessionId: string): Promise<Cart | null>;

  /**
   * Find active cart by user ID
   */
  findActiveByUserId(userId: UserId): Promise<Cart | null>;

  /**
   * Find active cart by session ID
   */
  findActiveBySessionId(sessionId: string): Promise<Cart | null>;

  /**
   * Find carts by status
   */
  findByStatus(status: CartStatus): Promise<Cart[]>;

  /**
   * Find abandoned carts
   */
  findAbandoned(olderThan?: Date): Promise<Cart[]>;

  /**
   * Find expired carts
   */
  findExpired(): Promise<Cart[]>;

  /**
   * Find carts that haven't been updated recently
   */
  findInactive(inactiveSince: Date): Promise<Cart[]>;

  /**
   * Clean up expired carts
   */
  cleanupExpired(): Promise<number>;

  /**
   * Get cart statistics
   */
  getStatistics(): Promise<CartStatistics>;

  /**
   * Find carts for user with pagination
   */
  findByUserIdPaginated(
    userId: UserId,
    page: number,
    limit: number
  ): Promise<PaginatedResult<Cart>>;
}

// Cart statistics interface
export interface CartStatistics {
  totalCarts: number;
  activeCarts: number;
  abandonedCarts: number;
  expiredCarts: number;
  completedCarts: number;
  averageItemsPerCart: number;
  averageCartValue: number;
  conversionRate: number;
}

// Cart specifications for complex queries
export class CartSpecifications {
  static isActive(): Specification<Cart> {
    return {
      isSatisfiedBy: (cart: Cart) => cart.isActive(),
      toQuery: () => ({ 
        where: { 
          status: CartStatus.ACTIVE,
          expiresAt: { gt: new Date() }
        } 
      }),
    };
  }

  static byStatus(status: CartStatus): Specification<Cart> {
    return {
      isSatisfiedBy: (cart: Cart) => cart.status === status,
      toQuery: () => ({ where: { status } }),
    };
  }

  static byUser(userId: UserId): Specification<Cart> {
    return {
      isSatisfiedBy: (cart: Cart) => cart.userId?.equals(userId) ?? false,
      toQuery: () => ({ where: { userId: userId.value } }),
    };
  }

  static bySession(sessionId: string): Specification<Cart> {
    return {
      isSatisfiedBy: (cart: Cart) => cart.sessionId === sessionId,
      toQuery: () => ({ where: { sessionId } }),
    };
  }

  static isEmpty(): Specification<Cart> {
    return {
      isSatisfiedBy: (cart: Cart) => cart.isEmpty(),
      toQuery: () => ({ where: { itemCount: 0 } }),
    };
  }

  static isNotEmpty(): Specification<Cart> {
    return {
      isSatisfiedBy: (cart: Cart) => !cart.isEmpty(),
      toQuery: () => ({ where: { itemCount: { gt: 0 } } }),
    };
  }

  static isExpired(): Specification<Cart> {
    return {
      isSatisfiedBy: (cart: Cart) => cart.isExpired(),
      toQuery: () => ({ where: { expiresAt: { lte: new Date() } } }),
    };
  }

  static isAbandoned(sinceDate?: Date): Specification<Cart> {
    const cutoff = sinceDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    return {
      isSatisfiedBy: (cart: Cart) => 
        cart.status === CartStatus.ACTIVE && 
        cart.lastActivityAt < cutoff &&
        !cart.isEmpty(),
      toQuery: () => ({ 
        where: { 
          status: CartStatus.ACTIVE,
          lastActivityAt: { lt: cutoff },
          itemCount: { gt: 0 }
        } 
      }),
    };
  }

  static createdAfter(date: Date): Specification<Cart> {
    return {
      isSatisfiedBy: (cart: Cart) => cart.createdAt > date,
      toQuery: () => ({ where: { createdAt: { gt: date } } }),
    };
  }

  static updatedAfter(date: Date): Specification<Cart> {
    return {
      isSatisfiedBy: (cart: Cart) => cart.updatedAt > date,
      toQuery: () => ({ where: { updatedAt: { gt: date } } }),
    };
  }

  static hasMinimumValue(amount: number, currency: string): Specification<Cart> {
    return {
      isSatisfiedBy: (cart: Cart) => 
        cart.currency.code === currency && 
        cart.getTotal().amount >= amount,
      toQuery: () => ({ 
        where: { 
          currency: currency,
          totalValue: { gte: amount }
        } 
      }),
    };
  }

  static withItemCount(min: number, max?: number): Specification<Cart> {
    return {
      isSatisfiedBy: (cart: Cart) => {
        const count = cart.getTotalItems();
        return count >= min && (max === undefined || count <= max);
      },
      toQuery: () => {
        const where: any = { itemCount: { gte: min } };
        if (max !== undefined) {
          where.itemCount.lte = max;
        }
        return { where };
      },
    };
  }

  // Compound specifications
  static activeForUser(userId: UserId): Specification<Cart> {
    return this.combineAnd(this.isActive(), this.byUser(userId));
  }

  static activeForSession(sessionId: string): Specification<Cart> {
    return this.combineAnd(this.isActive(), this.bySession(sessionId));
  }

  static abandonedWithValue(minimumValue: number, currency: string): Specification<Cart> {
    return this.combineAnd(
      this.isAbandoned(),
      this.hasMinimumValue(minimumValue, currency),
      this.isNotEmpty()
    );
  }

  // Specification combinators
  static combineAnd<T>(...specs: Specification<T>[]): Specification<T> {
    return {
      isSatisfiedBy: (entity: T) => specs.every(spec => spec.isSatisfiedBy(entity)),
      toQuery: () => {
        const queries = specs.map(spec => spec.toQuery());
        return { where: { $and: queries.map(q => q.where) } };
      },
    };
  }

  static combineOr<T>(...specs: Specification<T>[]): Specification<T> {
    return {
      isSatisfiedBy: (entity: T) => specs.some(spec => spec.isSatisfiedBy(entity)),
      toQuery: () => {
        const queries = specs.map(spec => spec.toQuery());
        return { where: { $or: queries.map(q => q.where) } };
      },
    };
  }
}

// Service interface for complex cart operations
export interface ICartService {
  /**
   * Get or create cart for user
   */
  getOrCreateForUser(userId: UserId, currency: string): Promise<Result<Cart>>;

  /**
   * Get or create cart for session
   */
  getOrCreateForSession(sessionId: string, currency: string): Promise<Result<Cart>>;

  /**
   * Merge guest cart with user cart
   */
  mergeGuestCartWithUser(
    guestSessionId: string,
    userId: UserId
  ): Promise<Result<Cart>>;

  /**
   * Transfer cart ownership
   */
  transferCartToUser(
    cartId: CartId,
    userId: UserId
  ): Promise<Result<Cart>>;

  /**
   * Cleanup expired carts
   */
  cleanupExpiredCarts(): Promise<Result<{ deletedCount: number }>>;

  /**
   * Send abandoned cart reminders
   */
  sendAbandonedCartReminders(): Promise<Result<{ remindersSent: number }>>;

  /**
   * Get cart analytics
   */
  getCartAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<Result<CartAnalytics>>;

  /**
   * Validate cart before checkout
   */
  validateForCheckout(cartId: CartId): Promise<Result<CartValidationResult>>;
}

// Cart analytics interface
export interface CartAnalytics {
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalCarts: number;
    activeCarts: number;
    abandonedCarts: number;
    completedCarts: number;
    conversionRate: number;
    averageCartValue: number;
    averageItemsPerCart: number;
    totalRevenue: number;
  };
  trends: {
    cartCreation: Array<{ date: string; count: number }>;
    completion: Array<{ date: string; count: number }>;
    abandonment: Array<{ date: string; count: number }>;
  };
  topProducts: Array<{
    productId: string;
    productTitle: string;
    addedToCartCount: number;
    completedPurchases: number;
    conversionRate: number;
  }>;
}

// Cart validation result
export interface CartValidationResult {
  isValid: boolean;
  errors: CartValidationError[];
  warnings: CartValidationWarning[];
}

export interface CartValidationError {
  type: 'out_of_stock' | 'price_changed' | 'product_unavailable' | 'minimum_not_met';
  message: string;
  itemId?: string;
  productId?: string;
  variantId?: string;
  details?: Record<string, unknown>;
}

export interface CartValidationWarning {
  type: 'low_stock' | 'price_increase' | 'shipping_delay';
  message: string;
  itemId?: string;
  productId?: string;
  variantId?: string;
  details?: Record<string, unknown>;
}

// Query builder for complex cart queries
export class CartQueryBuilder {
  private specifications: Specification<Cart>[] = [];
  private sortBy: Array<{ field: keyof Cart; direction: 'asc' | 'desc' }> = [];
  private limitValue?: number;
  private offsetValue?: number;

  static create(): CartQueryBuilder {
    return new CartQueryBuilder();
  }

  where(spec: Specification<Cart>): this {
    this.specifications.push(spec);
    return this;
  }

  isActive(): this {
    return this.where(CartSpecifications.isActive());
  }

  byStatus(status: CartStatus): this {
    return this.where(CartSpecifications.byStatus(status));
  }

  byUser(userId: UserId): this {
    return this.where(CartSpecifications.byUser(userId));
  }

  bySession(sessionId: string): this {
    return this.where(CartSpecifications.bySession(sessionId));
  }

  isEmpty(): this {
    return this.where(CartSpecifications.isEmpty());
  }

  isNotEmpty(): this {
    return this.where(CartSpecifications.isNotEmpty());
  }

  isExpired(): this {
    return this.where(CartSpecifications.isExpired());
  }

  isAbandoned(sinceDate?: Date): this {
    return this.where(CartSpecifications.isAbandoned(sinceDate));
  }

  createdAfter(date: Date): this {
    return this.where(CartSpecifications.createdAfter(date));
  }

  updatedAfter(date: Date): this {
    return this.where(CartSpecifications.updatedAfter(date));
  }

  hasMinimumValue(amount: number, currency: string): this {
    return this.where(CartSpecifications.hasMinimumValue(amount, currency));
  }

  withItemCount(min: number, max?: number): this {
    return this.where(CartSpecifications.withItemCount(min, max));
  }

  sortByCreatedAt(direction: 'asc' | 'desc' = 'desc'): this {
    this.sortBy.push({ field: 'createdAt', direction });
    return this;
  }

  sortByUpdatedAt(direction: 'asc' | 'desc' = 'desc'): this {
    this.sortBy.push({ field: 'updatedAt', direction });
    return this;
  }

  sortByLastActivity(direction: 'asc' | 'desc' = 'desc'): this {
    this.sortBy.push({ field: 'lastActivityAt', direction });
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

  build(): Specification<Cart> {
    if (this.specifications.length === 0) {
      throw new Error('At least one specification must be provided');
    }

    if (this.specifications.length === 1) {
      return this.specifications[0];
    }

    return CartSpecifications.combineAnd(...this.specifications);
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

// Cart event handlers
export interface ICartEventHandler {
  handleCartCreated(event: any): Promise<void>;
  handleItemAdded(event: any): Promise<void>;
  handleItemRemoved(event: any): Promise<void>;
  handleCartAbandoned(event: any): Promise<void>;
  handleDiscountApplied(event: any): Promise<void>;
}

// Cart notification service interface
export interface ICartNotificationService {
  sendAbandonedCartEmail(cartId: CartId): Promise<Result<void>>;
  sendCartSavedEmail(cartId: CartId): Promise<Result<void>>;
  sendLowStockNotification(cartId: CartId, itemId: string): Promise<Result<void>>;
  sendPriceChangeNotification(cartId: CartId, itemId: string): Promise<Result<void>>;
}

// Cart metrics collector interface
export interface ICartMetricsCollector {
  recordCartCreated(cart: Cart): Promise<void>;
  recordItemAdded(cart: Cart, itemId: string): Promise<void>;
  recordItemRemoved(cart: Cart, itemId: string): Promise<void>;
  recordCartAbandoned(cart: Cart): Promise<void>;
  recordCartCompleted(cart: Cart): Promise<void>;
  recordDiscountApplied(cart: Cart, discountCode: string): Promise<void>;
}