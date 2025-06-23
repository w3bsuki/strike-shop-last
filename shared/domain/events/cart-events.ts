/**
 * Cart Domain Events
 * Event definitions for cart operations
 */

import { BaseDomainEvent } from './domain-event';

export class CartCreatedEvent extends BaseDomainEvent {
  constructor(
    cartId: string,
    payload: {
      userId?: string;
      currency: string;
    }
  ) {
    super(cartId, 'cart.created', payload);
  }
}

export class CartItemAddedEvent extends BaseDomainEvent {
  constructor(
    cartId: string,
    payload: {
      productId: string;
      variantId: string;
      quantity: number;
      price: number;
    }
  ) {
    super(cartId, 'cart.item.added', payload);
  }
}

export class CartItemRemovedEvent extends BaseDomainEvent {
  constructor(
    cartId: string,
    payload: {
      productId: string;
      variantId: string;
      quantity: number;
    }
  ) {
    super(cartId, 'cart.item.removed', payload);
  }
}

export class CartClearedEvent extends BaseDomainEvent {
  constructor(cartId: string) {
    super(cartId, 'cart.cleared', {});
  }
}