/**
 * Cart Domain - Cart Entity
 * Shopping cart aggregate root implementing business rules
 */

import {
  CartId,
  CartItemId,
  ProductId,
  ProductVariantId,
  UserId,
  Money,
  Currency,
  ValidationError,
  BusinessRuleViolationError,
  DomainEvent,
  CartCreatedEvent,
  CartItemAddedEvent,
  CartItemRemovedEvent,
  CartClearedEvent,
  BaseDomainEvent,
} from '../../../shared/domain';

// Cart status enumeration
export enum CartStatus {
  ACTIVE = 'active',
  ABANDONED = 'abandoned',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

// Cart item entity
export class CartItem {
  private _events: DomainEvent[] = [];

  constructor(
    public readonly id: CartItemId,
    public readonly cartId: CartId,
    public readonly productId: ProductId,
    public readonly variantId: ProductVariantId,
    public readonly productTitle: string,
    public readonly variantTitle: string,
    public readonly sku: string,
    public quantity: number,
    public unitPrice: Money,
    public compareAtPrice: Money | null = null,
    public readonly productImage?: string,
    public readonly productHandle?: string,
    public readonly options: Record<string, string> = {},
    public readonly addedAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    this.validateCartItem();
  }

  private validateCartItem(): void {
    if (this.quantity <= 0) {
      throw ValidationError.invalidField('quantity', this.quantity, 'Quantity must be positive');
    }
    if (this.unitPrice.amount <= 0) {
      throw ValidationError.invalidField('unitPrice', this.unitPrice, 'Unit price must be positive');
    }
    if (!this.productTitle?.trim()) {
      throw ValidationError.required('productTitle');
    }
    if (!this.variantTitle?.trim()) {
      throw ValidationError.required('variantTitle');
    }
    if (!this.sku?.trim()) {
      throw ValidationError.required('sku');
    }
  }

  // Factory method
  static create(
    cartId: CartId,
    productId: ProductId,
    variantId: ProductVariantId,
    productTitle: string,
    variantTitle: string,
    sku: string,
    quantity: number,
    unitPrice: Money,
    compareAtPrice?: Money,
    productImage?: string,
    productHandle?: string,
    options: Record<string, string> = {}
  ): CartItem {
    const id = CartItemId.generate();
    return new CartItem(
      id,
      cartId,
      productId,
      variantId,
      productTitle,
      variantTitle,
      sku,
      quantity,
      unitPrice,
      compareAtPrice,
      productImage,
      productHandle,
      options
    );
  }

  // Business methods
  updateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw ValidationError.invalidField('quantity', quantity, 'Quantity must be positive');
    }
    if (quantity > 999) {
      throw ValidationError.invalidField('quantity', quantity, 'Quantity cannot exceed 999');
    }

    const oldQuantity = this.quantity;
    this.quantity = quantity;
    this.updatedAt = new Date();

    // Emit quantity change event
    this._events.push(
      new CartItemQuantityChangedEvent(this.cartId.value, {
        itemId: this.id.value,
        productId: this.productId.value,
        variantId: this.variantId.value,
        oldQuantity,
        newQuantity: quantity,
      })
    );
  }

  updatePrice(unitPrice: Money, compareAtPrice?: Money): void {
    if (unitPrice.amount <= 0) {
      throw ValidationError.invalidField('unitPrice', unitPrice, 'Unit price must be positive');
    }
    if (compareAtPrice && compareAtPrice.lessThanOrEqual(unitPrice)) {
      throw ValidationError.invalidField('compareAtPrice', compareAtPrice, 'Compare at price must be greater than unit price');
    }

    this.unitPrice = unitPrice;
    this.compareAtPrice = compareAtPrice || null;
    this.updatedAt = new Date();
  }

  // Calculations
  get totalPrice(): Money {
    return this.unitPrice.multiply(this.quantity);
  }

  get discountAmount(): Money {
    if (!this.compareAtPrice) {
      return Money.zero(this.unitPrice.currency);
    }
    const discount = this.compareAtPrice.subtract(this.unitPrice);
    return discount.multiply(this.quantity);
  }

  get isOnSale(): boolean {
    return this.compareAtPrice !== null && this.compareAtPrice.greaterThan(this.unitPrice);
  }

  get discountPercentage(): number {
    if (!this.compareAtPrice || this.compareAtPrice.amount === 0) {
      return 0;
    }
    const discount = this.compareAtPrice.subtract(this.unitPrice);
    return (discount.amount / this.compareAtPrice.amount) * 100;
  }

  // Domain events
  getUncommittedEvents(): DomainEvent[] {
    return [...this._events];
  }

  markEventsAsCommitted(): void {
    this._events = [];
  }

  // Comparison
  isSameProduct(productId: ProductId, variantId: ProductVariantId): boolean {
    return this.productId.equals(productId) && this.variantId.equals(variantId);
  }

  // Serialization
  toJSON() {
    return {
      id: this.id.value,
      cartId: this.cartId.value,
      productId: this.productId.value,
      variantId: this.variantId.value,
      productTitle: this.productTitle,
      variantTitle: this.variantTitle,
      sku: this.sku,
      quantity: this.quantity,
      unitPrice: this.unitPrice.toJSON(),
      compareAtPrice: this.compareAtPrice?.toJSON(),
      totalPrice: this.totalPrice.toJSON(),
      discountAmount: this.discountAmount.toJSON(),
      isOnSale: this.isOnSale,
      discountPercentage: this.discountPercentage,
      productImage: this.productImage,
      productHandle: this.productHandle,
      options: this.options,
      addedAt: this.addedAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

// Cart discounts value object
export class CartDiscount {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly type: 'percentage' | 'fixed' | 'shipping',
    public readonly value: number,
    public readonly description: string,
    public readonly minimumAmount?: Money,
    public readonly maximumDiscount?: Money,
    public readonly appliesTo: 'order' | 'shipping' | 'items' = 'order'
  ) {
    this.validateDiscount();
  }

  private validateDiscount(): void {
    if (!this.code?.trim()) {
      throw ValidationError.required('code');
    }
    if (this.value <= 0) {
      throw ValidationError.invalidField('value', this.value, 'Discount value must be positive');
    }
    if (this.type === 'percentage' && this.value > 100) {
      throw ValidationError.invalidField('value', this.value, 'Percentage discount cannot exceed 100%');
    }
  }

  calculateDiscount(amount: Money): Money {
    if (this.minimumAmount && amount.lessThan(this.minimumAmount)) {
      return Money.zero(amount.currency);
    }

    let discount: Money;
    
    if (this.type === 'percentage') {
      discount = amount.multiply(this.value / 100);
    } else {
      discount = Money.fromDecimal(this.value, amount.currency);
    }

    if (this.maximumDiscount && discount.greaterThan(this.maximumDiscount)) {
      discount = this.maximumDiscount;
    }

    return discount;
  }

  toJSON() {
    return {
      id: this.id,
      code: this.code,
      type: this.type,
      value: this.value,
      description: this.description,
      minimumAmount: this.minimumAmount?.toJSON(),
      maximumDiscount: this.maximumDiscount?.toJSON(),
      appliesTo: this.appliesTo,
    };
  }
}

// Cart shipping information
export class ShippingInformation {
  constructor(
    public readonly method: string,
    public readonly cost: Money,
    public readonly estimatedDelivery?: Date,
    public readonly description?: string
  ) {
    if (!this.method?.trim()) {
      throw ValidationError.required('method');
    }
    if (this.cost.amount < 0) {
      throw ValidationError.invalidField('cost', this.cost, 'Shipping cost cannot be negative');
    }
  }

  get isFree(): boolean {
    return this.cost.amount === 0;
  }

  toJSON() {
    return {
      method: this.method,
      cost: this.cost.toJSON(),
      isFree: this.isFree,
      estimatedDelivery: this.estimatedDelivery?.toISOString(),
      description: this.description,
    };
  }
}

// Additional cart events
export class CartItemQuantityChangedEvent extends BaseDomainEvent {
  constructor(
    cartId: string,
    payload: {
      itemId: string;
      productId: string;
      variantId: string;
      oldQuantity: number;
      newQuantity: number;
    }
  ) {
    super(cartId, 'cart.item.quantity.changed', payload);
  }
}

export class CartDiscountAppliedEvent extends BaseDomainEvent {
  constructor(
    cartId: string,
    payload: {
      discountCode: string;
      discountAmount: number;
      currency: string;
    }
  ) {
    super(cartId, 'cart.discount.applied', payload);
  }
}

export class CartDiscountRemovedEvent extends BaseDomainEvent {
  constructor(
    cartId: string,
    payload: {
      discountCode: string;
    }
  ) {
    super(cartId, 'cart.discount.removed', payload);
  }
}

export class CartAbandonedEvent extends BaseDomainEvent {
  constructor(
    cartId: string,
    payload: {
      abandonedAt: string;
      totalValue: number;
      currency: string;
      itemCount: number;
    }
  ) {
    super(cartId, 'cart.abandoned', payload);
  }
}

// Cart entity (aggregate root)
export class Cart {
  private _events: DomainEvent[] = [];
  private _items: Map<string, CartItem> = new Map();
  private _discounts: Map<string, CartDiscount> = new Map();

  constructor(
    public readonly id: CartId,
    public readonly currency: Currency,
    public status: CartStatus = CartStatus.ACTIVE,
    public readonly userId?: UserId,
    public sessionId?: string,
    public shippingInformation?: ShippingInformation,
    public notes?: string,
    items: CartItem[] = [],
    discounts: CartDiscount[] = [],
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public lastActivityAt: Date = new Date(),
    public expiresAt?: Date
  ) {
    this.validateCart();
    this.setItems(items);
    this.setDiscounts(discounts);
  }

  private validateCart(): void {
    if (this.expiresAt && this.expiresAt <= new Date()) {
      this.status = CartStatus.EXPIRED;
    }
  }

  private setItems(items: CartItem[]): void {
    for (const item of items) {
      if (!item.cartId.equals(this.id)) {
        throw ValidationError.invalidField('item.cartId', item.cartId, 'Item must belong to this cart');
      }
      this._items.set(item.id.value, item);
    }
  }

  private setDiscounts(discounts: CartDiscount[]): void {
    for (const discount of discounts) {
      this._discounts.set(discount.id, discount);
    }
  }

  // Factory methods
  static create(currency: Currency, userId?: UserId, sessionId?: string): Cart {
    const id = CartId.generate();
    const cart = new Cart(id, currency, CartStatus.ACTIVE, userId, sessionId);

    // Set expiration (30 days for authenticated users, 7 days for guests)
    const expirationDays = userId ? 30 : 7;
    cart.expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    // Emit creation event
    cart._events.push(
      new CartCreatedEvent(id.value, {
        userId: userId?.value,
        currency: currency.code,
      })
    );

    return cart;
  }

  static createGuest(currency: Currency, sessionId: string): Cart {
    return Cart.create(currency, undefined, sessionId);
  }

  static createForUser(currency: Currency, userId: UserId): Cart {
    return Cart.create(currency, userId);
  }

  // Business methods
  addItem(
    productId: ProductId,
    variantId: ProductVariantId,
    productTitle: string,
    variantTitle: string,
    sku: string,
    quantity: number,
    unitPrice: Money,
    compareAtPrice?: Money,
    productImage?: string,
    productHandle?: string,
    options: Record<string, string> = {}
  ): void {
    this.ensureCartIsActive();
    this.ensureCurrencyMatches(unitPrice.currency);

    if (quantity <= 0) {
      throw ValidationError.invalidField('quantity', quantity, 'Quantity must be positive');
    }

    // Check if item already exists
    const existingItem = this.findItemByProduct(productId, variantId);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > 999) {
        throw BusinessRuleViolationError.create(
          'max_quantity_exceeded',
          'Cannot add more items. Maximum quantity per item is 999',
          { maxQuantity: 999, requestedQuantity: newQuantity }
        );
      }
      existingItem.updateQuantity(newQuantity);
    } else {
      // Create new item
      const item = CartItem.create(
        this.id,
        productId,
        variantId,
        productTitle,
        variantTitle,
        sku,
        quantity,
        unitPrice,
        compareAtPrice,
        productImage,
        productHandle,
        options
      );
      this._items.set(item.id.value, item);

      // Emit item added event
      this._events.push(
        new CartItemAddedEvent(this.id.value, {
          productId: productId.value,
          variantId: variantId.value,
          quantity,
          price: unitPrice.amount,
        })
      );
    }

    this.updateActivity();
  }

  removeItem(itemId: CartItemId): void {
    this.ensureCartIsActive();

    const item = this._items.get(itemId.value);
    if (!item) {
      throw ValidationError.invalidField('itemId', itemId, 'Item not found in cart');
    }

    this._items.delete(itemId.value);

    // Emit item removed event
    this._events.push(
      new CartItemRemovedEvent(this.id.value, {
        productId: item.productId.value,
        variantId: item.variantId.value,
        quantity: item.quantity,
      })
    );

    this.updateActivity();
  }

  updateItemQuantity(itemId: CartItemId, quantity: number): void {
    this.ensureCartIsActive();

    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    const item = this._items.get(itemId.value);
    if (!item) {
      throw ValidationError.invalidField('itemId', itemId, 'Item not found in cart');
    }

    item.updateQuantity(quantity);
    this.updateActivity();
  }

  clearItems(): void {
    this.ensureCartIsActive();

    this._items.clear();

    // Emit cart cleared event
    this._events.push(new CartClearedEvent(this.id.value));

    this.updateActivity();
  }

  applyDiscount(discount: CartDiscount): void {
    this.ensureCartIsActive();

    // Check minimum amount requirement
    if (discount.minimumAmount && this.getSubtotal().lessThan(discount.minimumAmount)) {
      throw BusinessRuleViolationError.create(
        'minimum_amount_not_met',
        `Minimum order amount of ${discount.minimumAmount.format()} required for this discount`,
        { 
          minimumAmount: discount.minimumAmount.amount,
          currentAmount: this.getSubtotal().amount 
        }
      );
    }

    // Check if discount already applied
    if (this._discounts.has(discount.id)) {
      throw BusinessRuleViolationError.create(
        'discount_already_applied',
        'This discount has already been applied to the cart'
      );
    }

    this._discounts.set(discount.id, discount);

    // Emit discount applied event
    const discountAmount = this.calculateDiscountAmount(discount);
    this._events.push(
      new CartDiscountAppliedEvent(this.id.value, {
        discountCode: discount.code,
        discountAmount: discountAmount.amount,
        currency: this.currency.code,
      })
    );

    this.updateActivity();
  }

  removeDiscount(discountId: string): void {
    this.ensureCartIsActive();

    const discount = this._discounts.get(discountId);
    if (!discount) {
      throw ValidationError.invalidField('discountId', discountId, 'Discount not found in cart');
    }

    this._discounts.delete(discountId);

    // Emit discount removed event
    this._events.push(
      new CartDiscountRemovedEvent(this.id.value, {
        discountCode: discount.code,
      })
    );

    this.updateActivity();
  }

  updateShipping(shippingInformation: ShippingInformation): void {
    this.ensureCartIsActive();
    this.ensureCurrencyMatches(shippingInformation.cost.currency);

    this.shippingInformation = shippingInformation;
    this.updateActivity();
  }

  updateNotes(notes: string): void {
    this.ensureCartIsActive();
    
    this.notes = notes || undefined;
    this.updateActivity();
  }

  assignToUser(userId: UserId): void {
    if (this.userId) {
      throw BusinessRuleViolationError.create(
        'cart_already_assigned',
        'Cart is already assigned to a user'
      );
    }

    (this as any).userId = userId; // TypeScript workaround for readonly property
    this.sessionId = undefined;
    
    // Extend expiration for authenticated user
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    this.updateActivity();
  }

  abandon(): void {
    if (this.status !== CartStatus.ACTIVE) {
      throw BusinessRuleViolationError.create(
        'cart_not_active',
        'Only active carts can be abandoned'
      );
    }

    this.status = CartStatus.ABANDONED;
    this.updatedAt = new Date();

    // Emit abandoned event
    this._events.push(
      new CartAbandonedEvent(this.id.value, {
        abandonedAt: new Date().toISOString(),
        totalValue: this.getTotal().amount,
        currency: this.currency.code,
        itemCount: this.getTotalItems(),
      })
    );
  }

  complete(): void {
    this.ensureCartIsActive();

    if (this.isEmpty()) {
      throw BusinessRuleViolationError.create(
        'empty_cart',
        'Cannot complete an empty cart'
      );
    }

    this.status = CartStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  expire(): void {
    if (this.status === CartStatus.COMPLETED) {
      throw BusinessRuleViolationError.create(
        'cart_completed',
        'Cannot expire a completed cart'
      );
    }

    this.status = CartStatus.EXPIRED;
    this.updatedAt = new Date();
  }

  // Queries
  get items(): CartItem[] {
    return Array.from(this._items.values());
  }

  get discounts(): CartDiscount[] {
    return Array.from(this._discounts.values());
  }

  getItem(itemId: CartItemId): CartItem | null {
    return this._items.get(itemId.value) || null;
  }

  findItemByProduct(productId: ProductId, variantId: ProductVariantId): CartItem | null {
    for (const item of this._items.values()) {
      if (item.isSameProduct(productId, variantId)) {
        return item;
      }
    }
    return null;
  }

  hasItem(productId: ProductId, variantId: ProductVariantId): boolean {
    return this.findItemByProduct(productId, variantId) !== null;
  }

  isEmpty(): boolean {
    return this._items.size === 0;
  }

  getTotalItems(): number {
    return Array.from(this._items.values())
      .reduce((total, item) => total + item.quantity, 0);
  }

  getTotalUniqueItems(): number {
    return this._items.size;
  }

  getSubtotal(): Money {
    const total = Array.from(this._items.values())
      .reduce((sum, item) => sum.add(item.totalPrice), Money.zero(this.currency));
    return total;
  }

  getTotalDiscounts(): Money {
    let totalDiscount = Money.zero(this.currency);
    const subtotal = this.getSubtotal();

    for (const discount of this._discounts.values()) {
      if (discount.appliesTo === 'order' || discount.appliesTo === 'items') {
        totalDiscount = totalDiscount.add(discount.calculateDiscount(subtotal));
      }
    }

    return totalDiscount;
  }

  getShippingCost(): Money {
    if (!this.shippingInformation) {
      return Money.zero(this.currency);
    }

    let shippingCost = this.shippingInformation.cost;

    // Apply shipping discounts
    for (const discount of this._discounts.values()) {
      if (discount.appliesTo === 'shipping') {
        const discountAmount = discount.calculateDiscount(shippingCost);
        shippingCost = shippingCost.subtract(discountAmount);
      }
    }

    return shippingCost.amount < 0 ? Money.zero(this.currency) : shippingCost;
  }

  getTotal(): Money {
    const subtotal = this.getSubtotal();
    const discounts = this.getTotalDiscounts();
    const shipping = this.getShippingCost();

    return subtotal.subtract(discounts).add(shipping);
  }

  getSavings(): Money {
    let savings = Money.zero(this.currency);

    // Item-level savings (compare at price)
    for (const item of this._items.values()) {
      savings = savings.add(item.discountAmount);
    }

    // Discount savings
    savings = savings.add(this.getTotalDiscounts());

    return savings;
  }

  isExpired(): boolean {
    return this.expiresAt ? this.expiresAt <= new Date() : false;
  }

  isActive(): boolean {
    return this.status === CartStatus.ACTIVE && !this.isExpired();
  }

  canCheckout(): boolean {
    return this.isActive() && !this.isEmpty();
  }

  getItemsRequiringShipping(): CartItem[] {
    // In a real implementation, this would check product shipping requirements
    return this.items;
  }

  requiresShipping(): boolean {
    return this.getItemsRequiringShipping().length > 0;
  }

  // Private helper methods
  private ensureCartIsActive(): void {
    if (!this.isActive()) {
      throw BusinessRuleViolationError.create(
        'cart_not_active',
        'Cart is not active and cannot be modified',
        { status: this.status, isExpired: this.isExpired() }
      );
    }
  }

  private ensureCurrencyMatches(currency: Currency): void {
    if (!this.currency.equals(currency)) {
      throw BusinessRuleViolationError.create(
        'currency_mismatch',
        `Cart currency (${this.currency.code}) does not match item currency (${currency.code})`,
        { cartCurrency: this.currency.code, itemCurrency: currency.code }
      );
    }
  }

  private updateActivity(): void {
    this.lastActivityAt = new Date();
    this.updatedAt = new Date();
  }

  private calculateDiscountAmount(discount: CartDiscount): Money {
    const subtotal = this.getSubtotal();
    return discount.calculateDiscount(subtotal);
  }

  // Domain events
  getUncommittedEvents(): DomainEvent[] {
    const cartEvents = [...this._events];
    const itemEvents = Array.from(this._items.values())
      .flatMap(item => item.getUncommittedEvents());
    
    return [...cartEvents, ...itemEvents];
  }

  markEventsAsCommitted(): void {
    this._events = [];
    for (const item of this._items.values()) {
      item.markEventsAsCommitted();
    }
  }

  // Serialization
  toJSON() {
    return {
      id: this.id.value,
      currency: this.currency.code,
      status: this.status,
      userId: this.userId?.value,
      sessionId: this.sessionId,
      items: this.items.map(item => item.toJSON()),
      discounts: this.discounts.map(discount => discount.toJSON()),
      shippingInformation: this.shippingInformation?.toJSON(),
      notes: this.notes,
      subtotal: this.getSubtotal().toJSON(),
      totalDiscounts: this.getTotalDiscounts().toJSON(),
      shippingCost: this.getShippingCost().toJSON(),
      total: this.getTotal().toJSON(),
      savings: this.getSavings().toJSON(),
      totalItems: this.getTotalItems(),
      totalUniqueItems: this.getTotalUniqueItems(),
      isEmpty: this.isEmpty(),
      canCheckout: this.canCheckout(),
      requiresShipping: this.requiresShipping(),
      isExpired: this.isExpired(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      lastActivityAt: this.lastActivityAt.toISOString(),
      expiresAt: this.expiresAt?.toISOString(),
    };
  }
}