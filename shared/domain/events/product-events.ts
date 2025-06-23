/**
 * Product Domain Events
 * Event definitions for product operations
 */

import { BaseDomainEvent } from './domain-event';

export class ProductCreatedEvent extends BaseDomainEvent {
  constructor(
    productId: string,
    payload: {
      title: string;
      handle: string;
      categoryIds: string[];
    }
  ) {
    super(productId, 'product.created', payload);
  }
}

export class ProductUpdatedEvent extends BaseDomainEvent {
  constructor(
    productId: string,
    payload: {
      changes: Record<string, { old: unknown; new: unknown }>;
    }
  ) {
    super(productId, 'product.updated', payload);
  }
}

export class ProductInventoryChangedEvent extends BaseDomainEvent {
  constructor(
    productId: string,
    payload: {
      variantId: string;
      oldQuantity: number;
      newQuantity: number;
    }
  ) {
    super(productId, 'product.inventory.changed', payload);
  }
}