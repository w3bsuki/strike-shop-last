/**
 * Domain Errors
 * Implements proper error handling with domain-specific error types
 */

/**
 * Base domain error class
 */
export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Validation Error
 */
export class ValidationError extends DomainError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', context);
    this.field = field;
    this.value = value;
  }

  static invalidField(field: string, value: unknown, reason: string): ValidationError {
    return new ValidationError(
      `Invalid ${field}: ${reason}`,
      field,
      value,
      { reason }
    );
  }

  static required(field: string): ValidationError {
    return new ValidationError(
      `${field} is required`,
      field,
      undefined,
      { type: 'required' }
    );
  }

  static invalidFormat(field: string, value: unknown, expectedFormat: string): ValidationError {
    return new ValidationError(
      `${field} has invalid format. Expected: ${expectedFormat}`,
      field,
      value,
      { expectedFormat }
    );
  }
}

/**
 * Business Rule Violation Error
 */
export class BusinessRuleViolationError extends DomainError {
  public readonly rule: string;

  constructor(
    message: string,
    rule: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'BUSINESS_RULE_VIOLATION', context);
    this.rule = rule;
  }

  static create(rule: string, message: string, context?: Record<string, unknown>): BusinessRuleViolationError {
    return new BusinessRuleViolationError(message, rule, context);
  }
}

/**
 * Entity Not Found Error
 */
export class EntityNotFoundError extends DomainError {
  public readonly entityType: string;
  public readonly entityId: string;

  constructor(entityType: string, entityId: string) {
    super(
      `${entityType} with ID '${entityId}' was not found`,
      'ENTITY_NOT_FOUND',
      { entityType, entityId }
    );
    this.entityType = entityType;
    this.entityId = entityId;
  }
}

/**
 * Duplicate Entity Error
 */
export class DuplicateEntityError extends DomainError {
  public readonly entityType: string;
  public readonly conflictingField: string;
  public readonly conflictingValue: unknown;

  constructor(
    entityType: string,
    conflictingField: string,
    conflictingValue: unknown
  ) {
    super(
      `${entityType} with ${conflictingField} '${conflictingValue}' already exists`,
      'DUPLICATE_ENTITY',
      { entityType, conflictingField, conflictingValue }
    );
    this.entityType = entityType;
    this.conflictingField = conflictingField;
    this.conflictingValue = conflictingValue;
  }
}

/**
 * Concurrency Error
 */
export class ConcurrencyError extends DomainError {
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly expectedVersion: number;
  public readonly actualVersion: number;

  constructor(
    entityType: string,
    entityId: string,
    expectedVersion: number,
    actualVersion: number
  ) {
    super(
      `Concurrency conflict for ${entityType} '${entityId}'. Expected version ${expectedVersion}, but was ${actualVersion}`,
      'CONCURRENCY_ERROR',
      { entityType, entityId, expectedVersion, actualVersion }
    );
    this.entityType = entityType;
    this.entityId = entityId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

/**
 * Domain-specific errors
 */

// Product Domain Errors
export class ProductErrors {
  static notFound(productId: string): EntityNotFoundError {
    return new EntityNotFoundError('Product', productId);
  }

  static duplicateHandle(handle: string): DuplicateEntityError {
    return new DuplicateEntityError('Product', 'handle', handle);
  }

  static invalidPrice(price: number): ValidationError {
    return ValidationError.invalidField('price', price, 'Price must be positive');
  }

  static outOfStock(productId: string, variantId: string): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'insufficient_inventory',
      'Product variant is out of stock',
      { productId, variantId }
    );
  }

  static categoryNotFound(categoryId: string): EntityNotFoundError {
    return new EntityNotFoundError('ProductCategory', categoryId);
  }

  static variantNotFound(variantId: string): EntityNotFoundError {
    return new EntityNotFoundError('ProductVariant', variantId);
  }

  static invalidInventoryQuantity(quantity: number): ValidationError {
    return ValidationError.invalidField(
      'inventoryQuantity',
      quantity,
      'Inventory quantity cannot be negative'
    );
  }
}

// Cart Domain Errors
export class CartErrors {
  static notFound(cartId: string): EntityNotFoundError {
    return new EntityNotFoundError('Cart', cartId);
  }

  static itemNotFound(cartId: string, productId: string): EntityNotFoundError {
    return new EntityNotFoundError('CartItem', `${cartId}:${productId}`);
  }

  static invalidQuantity(quantity: number): ValidationError {
    return ValidationError.invalidField('quantity', quantity, 'Quantity must be positive');
  }

  static maxQuantityExceeded(maxQuantity: number): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'max_quantity_exceeded',
      `Cannot add more than ${maxQuantity} items to cart`,
      { maxQuantity }
    );
  }

  static cartExpired(cartId: string): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'cart_expired',
      'Cart has expired and cannot be modified',
      { cartId }
    );
  }

  static currencyMismatch(cartCurrency: string, itemCurrency: string): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'currency_mismatch',
      `Cannot add item with currency ${itemCurrency} to cart with currency ${cartCurrency}`,
      { cartCurrency, itemCurrency }
    );
  }
}

// User Domain Errors
export class UserErrors {
  static notFound(userId: string): EntityNotFoundError {
    return new EntityNotFoundError('User', userId);
  }

  static duplicateEmail(email: string): DuplicateEntityError {
    return new DuplicateEntityError('User', 'email', email);
  }

  static invalidEmail(email: string): ValidationError {
    return ValidationError.invalidFormat('email', email, 'valid email address');
  }

  static weakPassword(): ValidationError {
    return ValidationError.invalidField(
      'password',
      '[REDACTED]',
      'Password must be at least 8 characters with uppercase, lowercase, number and special character'
    );
  }

  static accountLocked(userId: string): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'account_locked',
      'User account is locked',
      { userId }
    );
  }

  static emailNotVerified(userId: string): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'email_not_verified',
      'Email address must be verified before proceeding',
      { userId }
    );
  }
}

// Payment Domain Errors
export class PaymentErrors {
  static notFound(paymentId: string): EntityNotFoundError {
    return new EntityNotFoundError('Payment', paymentId);
  }

  static invalidAmount(amount: number): ValidationError {
    return ValidationError.invalidField('amount', amount, 'Amount must be positive');
  }

  static unsupportedCurrency(currency: string): ValidationError {
    return ValidationError.invalidField('currency', currency, 'Currency is not supported');
  }

  static paymentFailed(reason: string): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'payment_failed',
      `Payment failed: ${reason}`,
      { reason }
    );
  }

  static insufficientFunds(): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'insufficient_funds',
      'Insufficient funds for this payment'
    );
  }

  static cardDeclined(): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'card_declined',
      'Payment card was declined'
    );
  }

  static paymentExpired(paymentId: string): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'payment_expired',
      'Payment has expired',
      { paymentId }
    );
  }
}

// Order Domain Errors
export class OrderErrors {
  static notFound(orderId: string): EntityNotFoundError {
    return new EntityNotFoundError('Order', orderId);
  }

  static cannotModifyOrder(orderId: string, status: string): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'cannot_modify_order',
      `Cannot modify order in status: ${status}`,
      { orderId, status }
    );
  }

  static cannotCancelOrder(orderId: string, status: string): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'cannot_cancel_order',
      `Cannot cancel order in status: ${status}`,
      { orderId, status }
    );
  }

  static invalidShippingAddress(): ValidationError {
    return ValidationError.invalidField(
      'shippingAddress',
      undefined,
      'Valid shipping address is required'
    );
  }

  static emptyCart(): BusinessRuleViolationError {
    return BusinessRuleViolationError.create(
      'empty_cart',
      'Cannot place order with empty cart'
    );
  }
}

/**
 * Error aggregation for multiple validation errors
 */
export class ValidationErrorCollection extends DomainError {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const message = `Validation failed with ${errors.length} error(s)`;
    super(message, 'VALIDATION_ERROR_COLLECTION');
    this.errors = errors;
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field: string): ValidationError[] {
    return this.errors.filter(error => error.field === field);
  }

  /**
   * Check if field has errors
   */
  hasFieldError(field: string): boolean {
    return this.getFieldErrors(field).length > 0;
  }

  /**
   * Get all field names with errors
   */
  getErrorFields(): string[] {
    return [...new Set(this.errors.map(error => error.field).filter(Boolean))];
  }

  /**
   * Convert to field-based error map
   */
  toFieldErrorMap(): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    
    for (const error of this.errors) {
      if (error.field) {
        if (!map[error.field]) {
          map[error.field] = [];
        }
        map[error.field].push(error.message);
      }
    }
    
    return map;
  }
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E extends Error = DomainError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Utility functions for result handling
 */
export const ResultUtils = {
  /**
   * Create successful result
   */
  success<T>(data: T): Result<T> {
    return { success: true, data };
  },

  /**
   * Create error result
   */
  error<T, E extends Error = DomainError>(error: E): Result<T, E> {
    return { success: false, error };
  },

  /**
   * Check if result is successful
   */
  isSuccess<T, E extends Error>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success;
  },

  /**
   * Check if result is error
   */
  isError<T, E extends Error>(result: Result<T, E>): result is { success: false; error: E } {
    return !result.success;
  },

  /**
   * Transform successful result
   */
  map<T, U, E extends Error>(
    result: Result<T, E>,
    mapper: (data: T) => U
  ): Result<U, E> {
    if (result.success) {
      return ResultUtils.success(mapper(result.data));
    }
    return result;
  },

  /**
   * Chain results
   */
  flatMap<T, U, E extends Error>(
    result: Result<T, E>,
    mapper: (data: T) => Result<U, E>
  ): Result<U, E> {
    if (result.success) {
      return mapper(result.data);
    }
    return result;
  },

  /**
   * Handle result with success and error callbacks
   */
  match<T, U, E extends Error>(
    result: Result<T, E>,
    onSuccess: (data: T) => U,
    onError: (error: E) => U
  ): U {
    if (result.success) {
      return onSuccess(result.data);
    }
    return onError(result.error);
  }
};

/**
 * Error handler for converting unknown errors to domain errors
 */
export class ErrorHandler {
  static toDomainError(error: unknown): DomainError {
    if (error instanceof DomainError) {
      return error;
    }

    if (error instanceof Error) {
      return new DomainError(error.message, 'UNKNOWN_ERROR', {
        originalError: error.constructor.name,
        stack: error.stack,
      });
    }

    return new DomainError(
      String(error),
      'UNKNOWN_ERROR',
      { originalError: error }
    );
  }

  static async safeExecute<T>(
    operation: () => Promise<T>
  ): Promise<Result<T, DomainError>> {
    try {
      const result = await operation();
      return ResultUtils.success(result);
    } catch (error) {
      return ResultUtils.error(this.toDomainError(error));
    }
  }
}

/**
 * Custom error class that extends the built-in Error but with our domain error structure
 */
abstract class DomainError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}