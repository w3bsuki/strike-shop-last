/**
 * Domain ID Value Objects
 * Implements type-safe ID handling with validation
 */

import { z } from 'zod';

// Base ID validation schema
const idSchema = z.string().min(1, 'ID cannot be empty').max(100, 'ID too long');

/**
 * Abstract base class for typed IDs
 * Ensures type safety and prevents ID mixing between domains
 */
abstract class BaseId<T extends string> {
  protected readonly _brand!: T;
  protected readonly _value: string;

  constructor(value: string, brand: T) {
    const result = idSchema.safeParse(value);
    if (!result.success) {
      throw new Error(`Invalid ${brand} ID: ${result.error.issues[0]?.message}`);
    }
    this._value = value;
  }

  /**
   * Get the underlying string value
   */
  get value(): string {
    return this._value;
  }

  /**
   * Compare two IDs for equality
   */
  equals(other: BaseId<T>): boolean {
    return this._value === other._value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this._value;
  }

  /**
   * JSON serialization
   */
  toJSON(): string {
    return this._value;
  }
}

/**
 * Product Domain IDs
 */
export class ProductId extends BaseId<'ProductId'> {
  constructor(value: string) {
    super(value, 'ProductId');
  }

  static create(value: string): ProductId {
    return new ProductId(value);
  }

  static fromString(value: string): ProductId {
    return new ProductId(value);
  }
}

export class ProductCategoryId extends BaseId<'ProductCategoryId'> {
  constructor(value: string) {
    super(value, 'ProductCategoryId');
  }

  static create(value: string): ProductCategoryId {
    return new ProductCategoryId(value);
  }
}

export class ProductVariantId extends BaseId<'ProductVariantId'> {
  constructor(value: string) {
    super(value, 'ProductVariantId');
  }

  static create(value: string): ProductVariantId {
    return new ProductVariantId(value);
  }
}

/**
 * Cart Domain IDs
 */
export class CartId extends BaseId<'CartId'> {
  constructor(value: string) {
    super(value, 'CartId');
  }

  static create(value: string): CartId {
    return new CartId(value);
  }

  static generate(): CartId {
    return new CartId(crypto.randomUUID());
  }
}

export class CartItemId extends BaseId<'CartItemId'> {
  constructor(value: string) {
    super(value, 'CartItemId');
  }

  static create(value: string): CartItemId {
    return new CartItemId(value);
  }

  static generate(): CartItemId {
    return new CartItemId(crypto.randomUUID());
  }
}

/**
 * User Domain IDs
 */
export class UserId extends BaseId<'UserId'> {
  constructor(value: string) {
    super(value, 'UserId');
  }

  static create(value: string): UserId {
    return new UserId(value);
  }
}

/**
 * Payment Domain IDs
 */
export class PaymentId extends BaseId<'PaymentId'> {
  constructor(value: string) {
    super(value, 'PaymentId');
  }

  static create(value: string): PaymentId {
    return new PaymentId(value);
  }
}

export class PaymentIntentId extends BaseId<'PaymentIntentId'> {
  constructor(value: string) {
    super(value, 'PaymentIntentId');
  }

  static create(value: string): PaymentIntentId {
    return new PaymentIntentId(value);
  }
}

/**
 * Order Domain IDs
 */
export class OrderId extends BaseId<'OrderId'> {
  constructor(value: string) {
    super(value, 'OrderId');
  }

  static create(value: string): OrderId {
    return new OrderId(value);
  }
}

/**
 * Type guards for runtime checking
 */
export function isProductId(value: unknown): value is ProductId {
  return value instanceof ProductId;
}

export function isCartId(value: unknown): value is CartId {
  return value instanceof CartId;
}

export function isUserId(value: unknown): value is UserId {
  return value instanceof UserId;
}

/**
 * Utility functions for ID handling
 */
export const IdUtils = {
  /**
   * Generate a new UUID-based ID
   */
  generateUuid(): string {
    return crypto.randomUUID();
  },

  /**
   * Validate ID format
   */
  isValidId(value: string): boolean {
    return idSchema.safeParse(value).success;
  },

  /**
   * Create ID from string with validation
   */
  createSafe<T extends BaseId<any>>(
    value: string,
    IdClass: new (value: string) => T
  ): T | null {
    try {
      return new IdClass(value);
    } catch {
      return null;
    }
  }
};