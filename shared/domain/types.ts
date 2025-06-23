/**
 * Shared Domain Types
 * Common type definitions used across the domain layer
 */

import { Id } from './value-objects/id';

// ID Type Classes
export class CartId extends Id {
  static create(value: string): CartId {
    return new CartId(value);
  }
}

export class CartItemId extends Id {
  static create(value: string): CartItemId {
    return new CartItemId(value);
  }
}

export class ProductId extends Id {
  static create(value: string): ProductId {
    return new ProductId(value);
  }
}

export class ProductVariantId extends Id {
  static create(value: string): ProductVariantId {
    return new ProductVariantId(value);
  }
}

export class ProductCategoryId extends Id {
  static create(value: string): ProductCategoryId {
    return new ProductCategoryId(value);
  }
}

export class UserId extends Id {
  static create(value: string): UserId {
    return new UserId(value);
  }
}