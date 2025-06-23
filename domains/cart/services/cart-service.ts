/**
 * Cart Domain - Cart Service Implementation
 * Implements business logic for cart operations
 */

import {
  CartId,
  UserId,
  ProductId,
  ProductVariantId,
  Currency,
  Money,
  Result,
  ResultUtils,
  ValidationError,
  BusinessRuleViolationError,
  eventDispatcher,
} from '../../../shared/domain';
import { Cart, CartStatus, CartItem, CartDiscount } from '../entities/cart';
import {
  ICartRepository,
  ICartService,
  CartAnalytics,
  CartValidationResult,
  CartValidationError,
  CartValidationWarning,
  ICartNotificationService,
  ICartMetricsCollector,
} from '../repositories/cart-repository';

/**
 * Cart Service Implementation
 * Encapsulates complex business logic for cart operations
 */
export class CartService implements ICartService {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly notificationService?: ICartNotificationService,
    private readonly metricsCollector?: ICartMetricsCollector
  ) {}

  async getOrCreateForUser(userId: UserId, currency: string): Promise<Result<Cart>> {
    try {
      // Try to find existing active cart
      const existingCart = await this.cartRepository.findActiveByUserId(userId);
      if (existingCart) {
        // Ensure currency matches
        if (existingCart.currency.code !== currency.toUpperCase()) {
          return ResultUtils.error(
            BusinessRuleViolationError.create(
              'currency_mismatch',
              `Existing cart has different currency (${existingCart.currency.code}). Please complete or clear the existing cart first.`
            )
          );
        }
        return ResultUtils.success(existingCart);
      }

      // Create new cart
      const currencyObj = Currency.fromString(currency);
      const cart = Cart.createForUser(currencyObj, userId);

      // Save cart
      const savedCart = await this.cartRepository.save(cart);

      // Publish domain events
      await this.publishEvents(savedCart);

      // Record metrics
      if (this.metricsCollector) {
        await this.metricsCollector.recordCartCreated(savedCart);
      }

      return ResultUtils.success(savedCart);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async getOrCreateForSession(sessionId: string, currency: string): Promise<Result<Cart>> {
    try {
      if (!sessionId?.trim()) {
        return ResultUtils.error(ValidationError.required('sessionId'));
      }

      // Try to find existing active cart
      const existingCart = await this.cartRepository.findActiveBySessionId(sessionId);
      if (existingCart) {
        // Ensure currency matches
        if (existingCart.currency.code !== currency.toUpperCase()) {
          return ResultUtils.error(
            BusinessRuleViolationError.create(
              'currency_mismatch',
              `Existing cart has different currency (${existingCart.currency.code}). Please complete or clear the existing cart first.`
            )
          );
        }
        return ResultUtils.success(existingCart);
      }

      // Create new cart
      const currencyObj = Currency.fromString(currency);
      const cart = Cart.createGuest(currencyObj, sessionId);

      // Save cart
      const savedCart = await this.cartRepository.save(cart);

      // Publish domain events
      await this.publishEvents(savedCart);

      // Record metrics
      if (this.metricsCollector) {
        await this.metricsCollector.recordCartCreated(savedCart);
      }

      return ResultUtils.success(savedCart);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async mergeGuestCartWithUser(
    guestSessionId: string,
    userId: UserId
  ): Promise<Result<Cart>> {
    try {
      // Find guest cart
      const guestCart = await this.cartRepository.findActiveBySessionId(guestSessionId);
      if (!guestCart) {
        // No guest cart to merge, create new user cart
        return this.getOrCreateForUser(userId, 'USD'); // Default currency
      }

      // Find or create user cart
      const userCartResult = await this.getOrCreateForUser(userId, guestCart.currency.code);
      if (!userCartResult.success) {
        return userCartResult;
      }

      const userCart = userCartResult.data;

      // Merge items from guest cart to user cart
      const mergeResult = await this.mergeCartItems(guestCart, userCart);
      if (!mergeResult.success) {
        return mergeResult;
      }

      // Mark guest cart as completed to prevent further use
      guestCart.complete();
      await this.cartRepository.save(guestCart);

      // Save merged user cart
      const savedCart = await this.cartRepository.save(userCart);

      // Publish domain events
      await this.publishEvents(savedCart);

      return ResultUtils.success(savedCart);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async transferCartToUser(cartId: CartId, userId: UserId): Promise<Result<Cart>> {
    try {
      // Find cart
      const cart = await this.cartRepository.findById(cartId);
      if (!cart) {
        return ResultUtils.error(ValidationError.invalidField('cartId', cartId, 'Cart not found'));
      }

      // Check if cart can be transferred
      if (cart.userId) {
        return ResultUtils.error(
          BusinessRuleViolationError.create(
            'cart_already_owned',
            'Cart is already assigned to a user'
          )
        );
      }

      if (!cart.isActive()) {
        return ResultUtils.error(
          BusinessRuleViolationError.create(
            'cart_not_active',
            'Only active carts can be transferred'
          )
        );
      }

      // Check if user already has an active cart
      const existingUserCart = await this.cartRepository.findActiveByUserId(userId);
      if (existingUserCart) {
        // Merge carts
        const mergeResult = await this.mergeCartItems(cart, existingUserCart);
        if (!mergeResult.success) {
          return mergeResult;
        }

        // Mark transferred cart as completed
        cart.complete();
        await this.cartRepository.save(cart);

        // Save merged cart
        const savedCart = await this.cartRepository.save(existingUserCart);
        await this.publishEvents(savedCart);

        return ResultUtils.success(savedCart);
      } else {
        // Transfer cart to user
        cart.assignToUser(userId);
        const savedCart = await this.cartRepository.save(cart);
        await this.publishEvents(savedCart);

        return ResultUtils.success(savedCart);
      }
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async cleanupExpiredCarts(): Promise<Result<{ deletedCount: number }>> {
    try {
      const deletedCount = await this.cartRepository.cleanupExpired();
      return ResultUtils.success({ deletedCount });
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async sendAbandonedCartReminders(): Promise<Result<{ remindersSent: number }>> {
    try {
      if (!this.notificationService) {
        return ResultUtils.error(
          new Error('Notification service not configured')
        );
      }

      // Find abandoned carts from the last 24 hours
      const abandonedDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const abandonedCarts = await this.cartRepository.findAbandoned(abandonedDate);

      let remindersSent = 0;

      for (const cart of abandonedCarts) {
        // Only send reminders for carts with items and user association
        if (!cart.isEmpty() && cart.userId) {
          try {
            const result = await this.notificationService.sendAbandonedCartEmail(cart.id);
            if (result.success) {
              remindersSent++;
            }
          } catch (error) {
            console.error(`Failed to send abandoned cart reminder for cart ${cart.id.value}:`, error);
          }
        }
      }

      return ResultUtils.success({ remindersSent });
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async getCartAnalytics(startDate: Date, endDate: Date): Promise<Result<CartAnalytics>> {
    try {
      // In a real implementation, this would query analytics data
      // For now, return placeholder data structure
      const analytics: CartAnalytics = {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        metrics: {
          totalCarts: 0,
          activeCarts: 0,
          abandonedCarts: 0,
          completedCarts: 0,
          conversionRate: 0,
          averageCartValue: 0,
          averageItemsPerCart: 0,
          totalRevenue: 0,
        },
        trends: {
          cartCreation: [],
          completion: [],
          abandonment: [],
        },
        topProducts: [],
      };

      return ResultUtils.success(analytics);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async validateForCheckout(cartId: CartId): Promise<Result<CartValidationResult>> {
    try {
      // Find cart
      const cart = await this.cartRepository.findById(cartId);
      if (!cart) {
        return ResultUtils.error(ValidationError.invalidField('cartId', cartId, 'Cart not found'));
      }

      const errors: CartValidationError[] = [];
      const warnings: CartValidationWarning[] = [];

      // Basic cart validation
      if (!cart.isActive()) {
        errors.push({
          type: 'product_unavailable',
          message: 'Cart is not active',
        });
      }

      if (cart.isEmpty()) {
        errors.push({
          type: 'minimum_not_met',
          message: 'Cart is empty',
        });
      }

      // Validate each item
      for (const item of cart.items) {
        // In a real implementation, this would:
        // 1. Check if product/variant still exists
        // 2. Verify current price
        // 3. Check inventory availability
        // 4. Validate any business rules

        // Example validations (placeholder)
        if (item.quantity > 10) { // Example: Max 10 per item
          warnings.push({
            type: 'low_stock',
            message: `High quantity requested for ${item.productTitle}`,
            itemId: item.id.value,
            productId: item.productId.value,
            variantId: item.variantId.value,
          });
        }
      }

      // Validate minimum order amount
      const minimumOrderAmount = Money.fromDecimal(25, cart.currency); // Example: $25 minimum
      if (cart.getTotal().lessThan(minimumOrderAmount)) {
        errors.push({
          type: 'minimum_not_met',
          message: `Minimum order amount is ${minimumOrderAmount.format()}`,
          details: {
            minimumAmount: minimumOrderAmount.amount,
            currentAmount: cart.getTotal().amount,
          },
        });
      }

      const validationResult: CartValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
      };

      return ResultUtils.success(validationResult);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  // Helper methods
  private async mergeCartItems(sourceCart: Cart, targetCart: Cart): Promise<Result<Cart>> {
    try {
      // Ensure same currency
      if (!sourceCart.currency.equals(targetCart.currency)) {
        return ResultUtils.error(
          BusinessRuleViolationError.create(
            'currency_mismatch',
            'Cannot merge carts with different currencies'
          )
        );
      }

      // Merge items
      for (const sourceItem of sourceCart.items) {
        const existingItem = targetCart.findItemByProduct(
          sourceItem.productId,
          sourceItem.variantId
        );

        if (existingItem) {
          // Combine quantities
          const newQuantity = existingItem.quantity + sourceItem.quantity;
          if (newQuantity > 999) {
            // Skip items that would exceed maximum quantity
            continue;
          }
          existingItem.updateQuantity(newQuantity);
        } else {
          // Add new item
          targetCart.addItem(
            sourceItem.productId,
            sourceItem.variantId,
            sourceItem.productTitle,
            sourceItem.variantTitle,
            sourceItem.sku,
            sourceItem.quantity,
            sourceItem.unitPrice,
            sourceItem.compareAtPrice,
            sourceItem.productImage,
            sourceItem.productHandle,
            sourceItem.options
          );
        }
      }

      // Merge discounts (avoid duplicates)
      for (const discount of sourceCart.discounts) {
        const hasDiscount = targetCart.discounts.some(d => d.id === discount.id);
        if (!hasDiscount) {
          targetCart.applyDiscount(discount);
        }
      }

      // Merge notes
      if (sourceCart.notes && !targetCart.notes) {
        targetCart.updateNotes(sourceCart.notes);
      } else if (sourceCart.notes && targetCart.notes) {
        targetCart.updateNotes(`${targetCart.notes}\n\nMerged: ${sourceCart.notes}`);
      }

      // Copy shipping information if target doesn't have it
      if (sourceCart.shippingInformation && !targetCart.shippingInformation) {
        targetCart.updateShipping(sourceCart.shippingInformation);
      }

      return ResultUtils.success(targetCart);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  private async publishEvents(cart: Cart): Promise<void> {
    const events = cart.getUncommittedEvents();
    for (const event of events) {
      await eventDispatcher.publish(event);
    }
    cart.markEventsAsCommitted();
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(`Unknown error: ${error}`);
  }
}

/**
 * Cart Management Service
 * Specialized service for cart lifecycle management
 */
export class CartManagementService {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly cartService: ICartService
  ) {}

  /**
   * Automatically abandon carts that haven't been updated recently
   */
  async processAbandonedCarts(): Promise<Result<{ processedCount: number }>> {
    try {
      const abandonmentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
      const inactiveCarts = await this.cartRepository.findInactive(abandonmentThreshold);

      let processedCount = 0;

      for (const cart of inactiveCarts) {
        if (cart.status === CartStatus.ACTIVE && !cart.isEmpty()) {
          cart.abandon();
          await this.cartRepository.save(cart);
          processedCount++;
        }
      }

      return ResultUtils.success({ processedCount });
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  /**
   * Clean up old completed carts
   */
  async cleanupOldCarts(olderThanDays: number = 90): Promise<Result<{ deletedCount: number }>> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      // Find old completed carts
      const oldCarts = await this.cartRepository.find({
        isSatisfiedBy: (cart: Cart) => 
          cart.status === CartStatus.COMPLETED && cart.updatedAt < cutoffDate,
        toQuery: () => ({
          where: {
            status: CartStatus.COMPLETED,
            updatedAt: { lt: cutoffDate }
          }
        })
      });

      // Delete old carts
      const cartIds = oldCarts.map(cart => cart.id);
      await this.cartRepository.deleteMany(cartIds);

      return ResultUtils.success({ deletedCount: oldCarts.length });
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  /**
   * Migrate carts to new currency
   */
  async migrateCurrency(
    fromCurrency: string,
    toCurrency: string,
    exchangeRate: number
  ): Promise<Result<{ migratedCount: number }>> {
    try {
      // Find carts with the old currency
      const cartsToMigrate = await this.cartRepository.find({
        isSatisfiedBy: (cart: Cart) => cart.currency.code === fromCurrency,
        toQuery: () => ({ where: { currency: fromCurrency } })
      });

      let migratedCount = 0;
      const newCurrency = Currency.fromString(toCurrency);

      for (const cart of cartsToMigrate) {
        // Create new cart with new currency
        const newCart = new Cart(
          cart.id,
          newCurrency,
          cart.status,
          cart.userId,
          cart.sessionId,
          cart.shippingInformation ? 
            new (cart.shippingInformation.constructor as any)(
              cart.shippingInformation.method,
              cart.shippingInformation.cost.multiply(exchangeRate),
              cart.shippingInformation.estimatedDelivery,
              cart.shippingInformation.description
            ) : undefined,
          cart.notes,
          cart.items.map(item => new CartItem(
            item.id,
            item.cartId,
            item.productId,
            item.variantId,
            item.productTitle,
            item.variantTitle,
            item.sku,
            item.quantity,
            Money.fromDecimal(item.unitPrice.decimalAmount * exchangeRate, newCurrency),
            item.compareAtPrice ? 
              Money.fromDecimal(item.compareAtPrice.decimalAmount * exchangeRate, newCurrency) : 
              null,
            item.productImage,
            item.productHandle,
            item.options,
            item.addedAt,
            item.updatedAt
          )),
          [], // Reset discounts - they may not be valid for new currency
          cart.createdAt,
          cart.updatedAt,
          cart.lastActivityAt,
          cart.expiresAt
        );

        await this.cartRepository.save(newCart);
        migratedCount++;
      }

      return ResultUtils.success({ migratedCount });
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(`Unknown error: ${error}`);
  }
}

/**
 * Cart Synchronization Service
 * Handles real-time cart updates and synchronization
 */
export class CartSynchronizationService {
  constructor(private readonly cartRepository: ICartRepository) {}

  /**
   * Synchronize cart state across multiple sessions
   */
  async synchronizeCart(cartId: CartId): Promise<Result<Cart>> {
    try {
      const cart = await this.cartRepository.findById(cartId);
      if (!cart) {
        return ResultUtils.error(ValidationError.invalidField('cartId', cartId, 'Cart not found'));
      }

      // In a real implementation, this would:
      // 1. Validate all items against current product data
      // 2. Update prices if changed
      // 3. Check inventory availability
      // 4. Remove unavailable items
      // 5. Recalculate totals

      return ResultUtils.success(cart);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  /**
   * Refresh cart with latest product information
   */
  async refreshCartData(cartId: CartId): Promise<Result<Cart>> {
    try {
      const cart = await this.cartRepository.findById(cartId);
      if (!cart) {
        return ResultUtils.error(ValidationError.invalidField('cartId', cartId, 'Cart not found'));
      }

      // Refresh logic would go here
      // For now, just return the cart
      return ResultUtils.success(cart);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(`Unknown error: ${error}`);
  }
}