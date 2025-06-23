/**
 * Cart Domain Entity Tests
 * Comprehensive test suite for Cart aggregate root and related entities
 * Target: 100% code coverage for cart domain logic
 */

import {
  Cart,
  CartItem,
  CartDiscount,
  ShippingInformation,
  CartStatus,
  CartItemQuantityChangedEvent,
  CartDiscountAppliedEvent,
  CartDiscountRemovedEvent,
  CartAbandonedEvent,
} from '@/domains/cart/entities/cart';

import {
  Money,
  Currency,
  CartId,
  CartItemId,
  ProductId,
  ProductVariantId,
  UserId,
  ValidationError,
  BusinessRuleViolationError,
  CartCreatedEvent,
  CartItemAddedEvent,
  CartItemRemovedEvent,
  CartClearedEvent,
} from '@/shared/domain';

describe('CartItem Entity', () => {
  const createTestCartItem = (overrides: Partial<any> = {}) => {
    return new CartItem(
      CartItemId.fromString('item_123'),
      CartId.fromString('cart_123'),
      ProductId.fromString('prod_123'),
      ProductVariantId.fromString('variant_123'),
      'Test Product',
      'Default Variant',
      'SKU-123',
      2,
      Money.fromDecimal(19.99, Currency.USD),
      Money.fromDecimal(24.99, Currency.USD),
      'http://example.com/image.jpg',
      'test-product',
      { size: 'M', color: 'blue' },
      new Date('2024-01-01'),
      new Date('2024-01-01'),
      ...overrides
    );
  };

  describe('Constructor and Validation', () => {
    it('should create cart item with valid data', () => {
      const item = createTestCartItem();
      
      expect(item.id.value).toBe('item_123');
      expect(item.productTitle).toBe('Test Product');
      expect(item.quantity).toBe(2);
      expect(item.unitPrice.decimalAmount).toBe(19.99);
      expect(item.compareAtPrice?.decimalAmount).toBe(24.99);
    });

    it('should throw validation error for zero quantity', () => {
      expect(() => createTestCartItem({ quantity: 0 })).toThrow(ValidationError);
    });

    it('should throw validation error for negative quantity', () => {
      expect(() => createTestCartItem({ quantity: -1 })).toThrow(ValidationError);
    });

    it('should throw validation error for zero unit price', () => {
      const zeroPrice = Money.zero(Currency.USD);
      expect(() => createTestCartItem({ unitPrice: zeroPrice })).toThrow(ValidationError);
    });

    it('should throw validation error for empty product title', () => {
      expect(() => createTestCartItem({ productTitle: '' })).toThrow(ValidationError);
      expect(() => createTestCartItem({ productTitle: '   ' })).toThrow(ValidationError);
    });

    it('should throw validation error for empty variant title', () => {
      expect(() => createTestCartItem({ variantTitle: '' })).toThrow(ValidationError);
    });

    it('should throw validation error for empty SKU', () => {
      expect(() => createTestCartItem({ sku: '' })).toThrow(ValidationError);
    });
  });

  describe('Factory Method', () => {
    it('should create cart item using factory method', () => {
      const item = CartItem.create(
        CartId.fromString('cart_123'),
        ProductId.fromString('prod_123'),
        ProductVariantId.fromString('variant_123'),
        'Test Product',
        'Default Variant',
        'SKU-123',
        1,
        Money.fromDecimal(29.99, Currency.USD),
        Money.fromDecimal(39.99, Currency.USD),
        'http://example.com/image.jpg',
        'test-product',
        { size: 'L' }
      );

      expect(item.productTitle).toBe('Test Product');
      expect(item.quantity).toBe(1);
      expect(item.unitPrice.decimalAmount).toBe(29.99);
      expect(item.options).toEqual({ size: 'L' });
    });
  });

  describe('Business Methods', () => {
    describe('updateQuantity', () => {
      it('should update quantity successfully', () => {
        const item = createTestCartItem();
        item.updateQuantity(5);
        
        expect(item.quantity).toBe(5);
        expect(item.updatedAt).toBeInstanceOf(Date);
      });

      it('should emit quantity changed event', () => {
        const item = createTestCartItem();
        item.updateQuantity(3);
        
        const events = item.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(CartItemQuantityChangedEvent);
      });

      it('should throw error for zero quantity', () => {
        const item = createTestCartItem();
        expect(() => item.updateQuantity(0)).toThrow(ValidationError);
      });

      it('should throw error for quantity over 999', () => {
        const item = createTestCartItem();
        expect(() => item.updateQuantity(1000)).toThrow(ValidationError);
      });
    });

    describe('updatePrice', () => {
      it('should update unit price successfully', () => {
        const item = createTestCartItem();
        const newPrice = Money.fromDecimal(25.99, Currency.USD);
        item.updatePrice(newPrice);
        
        expect(item.unitPrice.decimalAmount).toBe(25.99);
        expect(item.compareAtPrice).toBeNull();
      });

      it('should update both unit price and compare at price', () => {
        const item = createTestCartItem();
        const newPrice = Money.fromDecimal(22.99, Currency.USD);
        const newComparePrice = Money.fromDecimal(29.99, Currency.USD);
        
        item.updatePrice(newPrice, newComparePrice);
        
        expect(item.unitPrice.decimalAmount).toBe(22.99);
        expect(item.compareAtPrice?.decimalAmount).toBe(29.99);
      });

      it('should throw error for zero unit price', () => {
        const item = createTestCartItem();
        const zeroPrice = Money.zero(Currency.USD);
        expect(() => item.updatePrice(zeroPrice)).toThrow(ValidationError);
      });

      it('should throw error when compare at price is not greater than unit price', () => {
        const item = createTestCartItem();
        const unitPrice = Money.fromDecimal(25.99, Currency.USD);
        const comparePrice = Money.fromDecimal(20.99, Currency.USD);
        
        expect(() => item.updatePrice(unitPrice, comparePrice)).toThrow(ValidationError);
      });
    });
  });

  describe('Calculations', () => {
    describe('totalPrice', () => {
      it('should calculate total price correctly', () => {
        const item = createTestCartItem();
        const totalPrice = item.totalPrice;
        
        expect(totalPrice.decimalAmount).toBe(39.98); // 19.99 * 2
      });
    });

    describe('discountAmount', () => {
      it('should calculate discount amount when compare at price exists', () => {
        const item = createTestCartItem();
        const discountAmount = item.discountAmount;
        
        expect(discountAmount.decimalAmount).toBe(10.00); // (24.99 - 19.99) * 2
      });

      it('should return zero when no compare at price', () => {
        const item = createTestCartItem({ compareAtPrice: null });
        const discountAmount = item.discountAmount;
        
        expect(discountAmount.amount).toBe(0);
      });
    });

    describe('isOnSale', () => {
      it('should return true when compare at price is greater than unit price', () => {
        const item = createTestCartItem();
        expect(item.isOnSale).toBe(true);
      });

      it('should return false when no compare at price', () => {
        const item = createTestCartItem({ compareAtPrice: null });
        expect(item.isOnSale).toBe(false);
      });
    });

    describe('discountPercentage', () => {
      it('should calculate discount percentage correctly', () => {
        const item = createTestCartItem();
        const percentage = item.discountPercentage;
        
        expect(percentage).toBeCloseTo(20.01, 1); // (24.99 - 19.99) / 24.99 * 100
      });

      it('should return 0 when no compare at price', () => {
        const item = createTestCartItem({ compareAtPrice: null });
        expect(item.discountPercentage).toBe(0);
      });
    });
  });

  describe('Comparison Methods', () => {
    it('should identify same product', () => {
      const item = createTestCartItem();
      const productId = ProductId.fromString('prod_123');
      const variantId = ProductVariantId.fromString('variant_123');
      
      expect(item.isSameProduct(productId, variantId)).toBe(true);
    });

    it('should identify different product', () => {
      const item = createTestCartItem();
      const productId = ProductId.fromString('prod_456');
      const variantId = ProductVariantId.fromString('variant_456');
      
      expect(item.isSameProduct(productId, variantId)).toBe(false);
    });
  });

  describe('Event Management', () => {
    it('should track uncommitted events', () => {
      const item = createTestCartItem();
      item.updateQuantity(3);
      
      const events = item.getUncommittedEvents();
      expect(events).toHaveLength(1);
    });

    it('should clear events when marked as committed', () => {
      const item = createTestCartItem();
      item.updateQuantity(3);
      
      expect(item.getUncommittedEvents()).toHaveLength(1);
      
      item.markEventsAsCommitted();
      expect(item.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const item = createTestCartItem();
      const json = item.toJSON();
      
      expect(json).toMatchObject({
        id: 'item_123',
        cartId: 'cart_123',
        productId: 'prod_123',
        productTitle: 'Test Product',
        quantity: 2,
        isOnSale: true,
        options: { size: 'M', color: 'blue' },
      });
      
      expect(json.unitPrice).toBeDefined();
      expect(json.totalPrice).toBeDefined();
      expect(json.discountAmount).toBeDefined();
    });
  });
});

describe('CartDiscount Entity', () => {
  describe('Constructor and Validation', () => {
    it('should create discount with valid data', () => {
      const discount = new CartDiscount(
        'discount_123',
        'SAVE10',
        'percentage',
        10,
        '10% off your order',
        Money.fromDecimal(50, Currency.USD),
        Money.fromDecimal(20, Currency.USD)
      );
      
      expect(discount.id).toBe('discount_123');
      expect(discount.code).toBe('SAVE10');
      expect(discount.type).toBe('percentage');
      expect(discount.value).toBe(10);
    });

    it('should throw error for empty code', () => {
      expect(() => new CartDiscount('id', '', 'percentage', 10, 'Description')).toThrow(ValidationError);
    });

    it('should throw error for zero value', () => {
      expect(() => new CartDiscount('id', 'CODE', 'percentage', 0, 'Description')).toThrow(ValidationError);
    });

    it('should throw error for percentage over 100', () => {
      expect(() => new CartDiscount('id', 'CODE', 'percentage', 150, 'Description')).toThrow(ValidationError);
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate percentage discount correctly', () => {
      const discount = new CartDiscount('id', 'SAVE20', 'percentage', 20, '20% off');
      const amount = Money.fromDecimal(100, Currency.USD);
      
      const discountAmount = discount.calculateDiscount(amount);
      expect(discountAmount.decimalAmount).toBe(20);
    });

    it('should calculate fixed discount correctly', () => {
      const discount = new CartDiscount('id', 'SAVE10', 'fixed', 10, '$10 off');
      const amount = Money.fromDecimal(100, Currency.USD);
      
      const discountAmount = discount.calculateDiscount(amount);
      expect(discountAmount.decimalAmount).toBe(10);
    });

    it('should return zero when minimum amount not met', () => {
      const discount = new CartDiscount(
        'id',
        'SAVE20',
        'percentage',
        20,
        '20% off orders over $50',
        Money.fromDecimal(50, Currency.USD)
      );
      const amount = Money.fromDecimal(30, Currency.USD);
      
      const discountAmount = discount.calculateDiscount(amount);
      expect(discountAmount.amount).toBe(0);
    });

    it('should cap discount at maximum amount', () => {
      const discount = new CartDiscount(
        'id',
        'SAVE50',
        'percentage',
        50,
        '50% off (max $25)',
        undefined,
        Money.fromDecimal(25, Currency.USD)
      );
      const amount = Money.fromDecimal(100, Currency.USD);
      
      const discountAmount = discount.calculateDiscount(amount);
      expect(discountAmount.decimalAmount).toBe(25);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const discount = new CartDiscount('id', 'CODE', 'percentage', 15, 'Description');
      const json = discount.toJSON();
      
      expect(json).toMatchObject({
        id: 'id',
        code: 'CODE',
        type: 'percentage',
        value: 15,
        description: 'Description',
        appliesTo: 'order',
      });
    });
  });
});

describe('ShippingInformation Entity', () => {
  describe('Constructor and Validation', () => {
    it('should create shipping information with valid data', () => {
      const shipping = new ShippingInformation(
        'Standard Shipping',
        Money.fromDecimal(5.99, Currency.USD),
        new Date('2024-01-05'),
        'Delivered in 3-5 business days'
      );
      
      expect(shipping.method).toBe('Standard Shipping');
      expect(shipping.cost.decimalAmount).toBe(5.99);
      expect(shipping.isFree).toBe(false);
    });

    it('should throw error for empty method', () => {
      expect(() => new ShippingInformation('', Money.zero(Currency.USD))).toThrow(ValidationError);
    });

    it('should throw error for negative cost', () => {
      const negativeCost = Money.fromDecimal(-5, Currency.USD);
      expect(() => new ShippingInformation('Method', negativeCost)).toThrow(ValidationError);
    });
  });

  describe('isFree property', () => {
    it('should return true for free shipping', () => {
      const shipping = new ShippingInformation('Free Shipping', Money.zero(Currency.USD));
      expect(shipping.isFree).toBe(true);
    });

    it('should return false for paid shipping', () => {
      const shipping = new ShippingInformation('Paid Shipping', Money.fromDecimal(5.99, Currency.USD));
      expect(shipping.isFree).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const shipping = new ShippingInformation(
        'Express',
        Money.fromDecimal(15.99, Currency.USD),
        new Date('2024-01-03'),
        'Next day delivery'
      );
      
      const json = shipping.toJSON();
      expect(json.method).toBe('Express');
      expect(json.isFree).toBe(false);
      expect(json.description).toBe('Next day delivery');
    });
  });
});

describe('Cart Entity (Aggregate Root)', () => {
  const createTestCart = (overrides: Partial<any> = {}) => {
    return new Cart(
      CartId.fromString('cart_123'),
      Currency.USD,
      CartStatus.ACTIVE,
      UserId.fromString('user_123'),
      'session_123',
      undefined,
      undefined,
      [],
      [],
      new Date('2024-01-01'),
      new Date('2024-01-01'),
      new Date('2024-01-01'),
      new Date('2024-01-31'),
      ...overrides
    );
  };

  describe('Factory Methods', () => {
    describe('create', () => {
      it('should create cart for authenticated user', () => {
        const userId = UserId.fromString('user_123');
        const cart = Cart.create(Currency.USD, userId);
        
        expect(cart.currency.code).toBe('USD');
        expect(cart.userId?.value).toBe('user_123');
        expect(cart.status).toBe(CartStatus.ACTIVE);
        expect(cart.expiresAt).toBeDefined();
      });

      it('should create cart for guest user', () => {
        const cart = Cart.create(Currency.USD, undefined, 'session_123');
        
        expect(cart.sessionId).toBe('session_123');
        expect(cart.userId).toBeUndefined();
      });

      it('should emit cart created event', () => {
        const cart = Cart.create(Currency.USD);
        const events = cart.getUncommittedEvents();
        
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(CartCreatedEvent);
      });
    });

    describe('createGuest', () => {
      it('should create guest cart', () => {
        const cart = Cart.createGuest(Currency.USD, 'session_456');
        
        expect(cart.sessionId).toBe('session_456');
        expect(cart.userId).toBeUndefined();
      });
    });

    describe('createForUser', () => {
      it('should create user cart', () => {
        const userId = UserId.fromString('user_456');
        const cart = Cart.createForUser(Currency.USD, userId);
        
        expect(cart.userId?.value).toBe('user_456');
        expect(cart.sessionId).toBeUndefined();
      });
    });
  });

  describe('Item Management', () => {
    describe('addItem', () => {
      it('should add new item to cart', () => {
        const cart = createTestCart();
        
        cart.addItem(
          ProductId.fromString('prod_123'),
          ProductVariantId.fromString('variant_123'),
          'Test Product',
          'Default Variant',
          'SKU-123',
          2,
          Money.fromDecimal(19.99, Currency.USD)
        );
        
        expect(cart.items).toHaveLength(1);
        expect(cart.getTotalItems()).toBe(2);
      });

      it('should update quantity if item already exists', () => {
        const cart = createTestCart();
        const productId = ProductId.fromString('prod_123');
        const variantId = ProductVariantId.fromString('variant_123');
        
        // Add item first time
        cart.addItem(productId, variantId, 'Test Product', 'Variant', 'SKU', 2, Money.fromDecimal(19.99, Currency.USD));
        
        // Add same item again
        cart.addItem(productId, variantId, 'Test Product', 'Variant', 'SKU', 3, Money.fromDecimal(19.99, Currency.USD));
        
        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].quantity).toBe(5);
      });

      it('should throw error for inactive cart', () => {
        const cart = createTestCart({ status: CartStatus.COMPLETED });
        
        expect(() => {
          cart.addItem(
            ProductId.fromString('prod_123'),
            ProductVariantId.fromString('variant_123'),
            'Product',
            'Variant',
            'SKU',
            1,
            Money.fromDecimal(10, Currency.USD)
          );
        }).toThrow(BusinessRuleViolationError);
      });

      it('should throw error for currency mismatch', () => {
        const cart = createTestCart();
        
        expect(() => {
          cart.addItem(
            ProductId.fromString('prod_123'),
            ProductVariantId.fromString('variant_123'),
            'Product',
            'Variant',
            'SKU',
            1,
            Money.fromDecimal(10, Currency.EUR)
          );
        }).toThrow(BusinessRuleViolationError);
      });

      it('should throw error when adding would exceed max quantity', () => {
        const cart = createTestCart();
        const productId = ProductId.fromString('prod_123');
        const variantId = ProductVariantId.fromString('variant_123');
        
        // Add item with quantity 998
        cart.addItem(productId, variantId, 'Product', 'Variant', 'SKU', 998, Money.fromDecimal(10, Currency.USD));
        
        // Try to add 2 more (would exceed 999)
        expect(() => {
          cart.addItem(productId, variantId, 'Product', 'Variant', 'SKU', 2, Money.fromDecimal(10, Currency.USD));
        }).toThrow(BusinessRuleViolationError);
      });

      it('should emit item added event for new items', () => {
        const cart = createTestCart();
        
        cart.addItem(
          ProductId.fromString('prod_123'),
          ProductVariantId.fromString('variant_123'),
          'Product',
          'Variant',
          'SKU',
          1,
          Money.fromDecimal(10, Currency.USD)
        );
        
        const events = cart.getUncommittedEvents();
        const itemAddedEvents = events.filter(e => e instanceof CartItemAddedEvent);
        expect(itemAddedEvents).toHaveLength(1);
      });
    });

    describe('removeItem', () => {
      it('should remove item from cart', () => {
        const cart = createTestCart();
        
        // Add item first
        cart.addItem(
          ProductId.fromString('prod_123'),
          ProductVariantId.fromString('variant_123'),
          'Product',
          'Variant',
          'SKU',
          1,
          Money.fromDecimal(10, Currency.USD)
        );
        
        const itemId = cart.items[0].id;
        cart.removeItem(itemId);
        
        expect(cart.items).toHaveLength(0);
      });

      it('should emit item removed event', () => {
        const cart = createTestCart();
        
        cart.addItem(
          ProductId.fromString('prod_123'),
          ProductVariantId.fromString('variant_123'),
          'Product',
          'Variant',
          'SKU',
          1,
          Money.fromDecimal(10, Currency.USD)
        );
        
        const itemId = cart.items[0].id;
        cart.markEventsAsCommitted(); // Clear add events
        
        cart.removeItem(itemId);
        
        const events = cart.getUncommittedEvents();
        const removeEvents = events.filter(e => e instanceof CartItemRemovedEvent);
        expect(removeEvents).toHaveLength(1);
      });

      it('should throw error for non-existent item', () => {
        const cart = createTestCart();
        const itemId = CartItemId.fromString('non_existent');
        
        expect(() => cart.removeItem(itemId)).toThrow(ValidationError);
      });
    });

    describe('updateItemQuantity', () => {
      it('should update item quantity', () => {
        const cart = createTestCart();
        
        cart.addItem(
          ProductId.fromString('prod_123'),
          ProductVariantId.fromString('variant_123'),
          'Product',
          'Variant',
          'SKU',
          1,
          Money.fromDecimal(10, Currency.USD)
        );
        
        const itemId = cart.items[0].id;
        cart.updateItemQuantity(itemId, 5);
        
        expect(cart.items[0].quantity).toBe(5);
      });

      it('should remove item when quantity is zero', () => {
        const cart = createTestCart();
        
        cart.addItem(
          ProductId.fromString('prod_123'),
          ProductVariantId.fromString('variant_123'),
          'Product',
          'Variant',
          'SKU',
          1,
          Money.fromDecimal(10, Currency.USD)
        );
        
        const itemId = cart.items[0].id;
        cart.updateItemQuantity(itemId, 0);
        
        expect(cart.items).toHaveLength(0);
      });
    });

    describe('clearItems', () => {
      it('should remove all items from cart', () => {
        const cart = createTestCart();
        
        // Add multiple items
        cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(10, Currency.USD));
        cart.addItem(ProductId.fromString('prod_2'), ProductVariantId.fromString('var_2'), 'P2', 'V2', 'S2', 1, Money.fromDecimal(20, Currency.USD));
        
        cart.clearItems();
        
        expect(cart.items).toHaveLength(0);
        expect(cart.isEmpty()).toBe(true);
      });

      it('should emit cart cleared event', () => {
        const cart = createTestCart();
        
        cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(10, Currency.USD));
        cart.markEventsAsCommitted();
        
        cart.clearItems();
        
        const events = cart.getUncommittedEvents();
        const clearEvents = events.filter(e => e instanceof CartClearedEvent);
        expect(clearEvents).toHaveLength(1);
      });
    });
  });

  describe('Discount Management', () => {
    describe('applyDiscount', () => {
      it('should apply valid discount', () => {
        const cart = createTestCart();
        
        // Add item to meet minimum
        cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(100, Currency.USD));
        
        const discount = new CartDiscount('disc_1', 'SAVE10', 'percentage', 10, '10% off');
        cart.applyDiscount(discount);
        
        expect(cart.discounts).toHaveLength(1);
      });

      it('should throw error when minimum amount not met', () => {
        const cart = createTestCart();
        
        cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(30, Currency.USD));
        
        const discount = new CartDiscount(
          'disc_1',
          'SAVE10',
          'percentage',
          10,
          '10% off orders over $50',
          Money.fromDecimal(50, Currency.USD)
        );
        
        expect(() => cart.applyDiscount(discount)).toThrow(BusinessRuleViolationError);
      });

      it('should throw error when discount already applied', () => {
        const cart = createTestCart();
        
        cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(100, Currency.USD));
        
        const discount = new CartDiscount('disc_1', 'SAVE10', 'percentage', 10, '10% off');
        cart.applyDiscount(discount);
        
        expect(() => cart.applyDiscount(discount)).toThrow(BusinessRuleViolationError);
      });

      it('should emit discount applied event', () => {
        const cart = createTestCart();
        
        cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(100, Currency.USD));
        cart.markEventsAsCommitted();
        
        const discount = new CartDiscount('disc_1', 'SAVE10', 'percentage', 10, '10% off');
        cart.applyDiscount(discount);
        
        const events = cart.getUncommittedEvents();
        const discountEvents = events.filter(e => e instanceof CartDiscountAppliedEvent);
        expect(discountEvents).toHaveLength(1);
      });
    });

    describe('removeDiscount', () => {
      it('should remove discount', () => {
        const cart = createTestCart();
        
        cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(100, Currency.USD));
        
        const discount = new CartDiscount('disc_1', 'SAVE10', 'percentage', 10, '10% off');
        cart.applyDiscount(discount);
        
        cart.removeDiscount('disc_1');
        
        expect(cart.discounts).toHaveLength(0);
      });

      it('should emit discount removed event', () => {
        const cart = createTestCart();
        
        cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(100, Currency.USD));
        
        const discount = new CartDiscount('disc_1', 'SAVE10', 'percentage', 10, '10% off');
        cart.applyDiscount(discount);
        cart.markEventsAsCommitted();
        
        cart.removeDiscount('disc_1');
        
        const events = cart.getUncommittedEvents();
        const removeEvents = events.filter(e => e instanceof CartDiscountRemovedEvent);
        expect(removeEvents).toHaveLength(1);
      });
    });
  });

  describe('Status Management', () => {
    describe('abandon', () => {
      it('should abandon active cart', () => {
        const cart = createTestCart();
        cart.abandon();
        
        expect(cart.status).toBe(CartStatus.ABANDONED);
      });

      it('should emit abandoned event', () => {
        const cart = createTestCart();
        cart.markEventsAsCommitted();
        
        cart.abandon();
        
        const events = cart.getUncommittedEvents();
        const abandonEvents = events.filter(e => e instanceof CartAbandonedEvent);
        expect(abandonEvents).toHaveLength(1);
      });

      it('should throw error for non-active cart', () => {
        const cart = createTestCart({ status: CartStatus.COMPLETED });
        
        expect(() => cart.abandon()).toThrow(BusinessRuleViolationError);
      });
    });

    describe('complete', () => {
      it('should complete cart with items', () => {
        const cart = createTestCart();
        
        cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(10, Currency.USD));
        cart.complete();
        
        expect(cart.status).toBe(CartStatus.COMPLETED);
      });

      it('should throw error for empty cart', () => {
        const cart = createTestCart();
        
        expect(() => cart.complete()).toThrow(BusinessRuleViolationError);
      });
    });

    describe('expire', () => {
      it('should expire active cart', () => {
        const cart = createTestCart();
        cart.expire();
        
        expect(cart.status).toBe(CartStatus.EXPIRED);
      });

      it('should throw error for completed cart', () => {
        const cart = createTestCart({ status: CartStatus.COMPLETED });
        
        expect(() => cart.expire()).toThrow(BusinessRuleViolationError);
      });
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate subtotal correctly', () => {
      const cart = createTestCart();
      
      cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 2, Money.fromDecimal(10, Currency.USD));
      cart.addItem(ProductId.fromString('prod_2'), ProductVariantId.fromString('var_2'), 'P2', 'V2', 'S2', 1, Money.fromDecimal(15, Currency.USD));
      
      const subtotal = cart.getSubtotal();
      expect(subtotal.decimalAmount).toBe(35); // (10 * 2) + (15 * 1)
    });

    it('should calculate total discounts correctly', () => {
      const cart = createTestCart();
      
      cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(100, Currency.USD));
      
      const discount = new CartDiscount('disc_1', 'SAVE10', 'percentage', 10, '10% off');
      cart.applyDiscount(discount);
      
      const totalDiscounts = cart.getTotalDiscounts();
      expect(totalDiscounts.decimalAmount).toBe(10);
    });

    it('should calculate shipping cost correctly', () => {
      const cart = createTestCart();
      
      const shipping = new ShippingInformation('Standard', Money.fromDecimal(5.99, Currency.USD));
      cart.updateShipping(shipping);
      
      const shippingCost = cart.getShippingCost();
      expect(shippingCost.decimalAmount).toBe(5.99);
    });

    it('should calculate total correctly', () => {
      const cart = createTestCart();
      
      cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(100, Currency.USD));
      
      const discount = new CartDiscount('disc_1', 'SAVE10', 'percentage', 10, '10% off');
      cart.applyDiscount(discount);
      
      const shipping = new ShippingInformation('Standard', Money.fromDecimal(5.99, Currency.USD));
      cart.updateShipping(shipping);
      
      const total = cart.getTotal();
      expect(total.decimalAmount).toBe(95.99); // 100 - 10 + 5.99
    });
  });

  describe('Cart State Queries', () => {
    it('should check if cart is empty', () => {
      const cart = createTestCart();
      expect(cart.isEmpty()).toBe(true);
      
      cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(10, Currency.USD));
      expect(cart.isEmpty()).toBe(false);
    });

    it('should check if cart is expired', () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      
      const activeCart = createTestCart({ expiresAt: futureDate });
      const expiredCart = createTestCart({ expiresAt: pastDate });
      
      expect(activeCart.isExpired()).toBe(false);
      expect(expiredCart.isExpired()).toBe(true);
    });

    it('should check if cart can checkout', () => {
      const cart = createTestCart();
      expect(cart.canCheckout()).toBe(false); // Empty cart
      
      cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(10, Currency.USD));
      expect(cart.canCheckout()).toBe(true);
      
      cart.complete();
      expect(cart.canCheckout()).toBe(false); // Completed cart
    });
  });

  describe('User Assignment', () => {
    it('should assign cart to user', () => {
      const cart = Cart.createGuest(Currency.USD, 'session_123');
      const userId = UserId.fromString('user_456');
      
      cart.assignToUser(userId);
      
      expect(cart.userId?.value).toBe('user_456');
      expect(cart.sessionId).toBeUndefined();
    });

    it('should throw error when cart already assigned', () => {
      const cart = createTestCart();
      const userId = UserId.fromString('user_456');
      
      expect(() => cart.assignToUser(userId)).toThrow(BusinessRuleViolationError);
    });
  });

  describe('Event Management', () => {
    it('should collect events from cart and items', () => {
      const cart = createTestCart();
      
      cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(10, Currency.USD));
      cart.updateItemQuantity(cart.items[0].id, 2);
      
      const events = cart.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(1); // Cart creation + item added + quantity changed
    });

    it('should mark all events as committed', () => {
      const cart = createTestCart();
      
      cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 1, Money.fromDecimal(10, Currency.USD));
      
      expect(cart.getUncommittedEvents().length).toBeGreaterThan(0);
      
      cart.markEventsAsCommitted();
      expect(cart.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('Serialization', () => {
    it('should serialize cart to JSON correctly', () => {
      const cart = createTestCart();
      
      cart.addItem(ProductId.fromString('prod_1'), ProductVariantId.fromString('var_1'), 'P1', 'V1', 'S1', 2, Money.fromDecimal(10, Currency.USD));
      
      const json = cart.toJSON();
      
      expect(json).toMatchObject({
        id: 'cart_123',
        currency: 'USD',
        status: 'active',
        userId: 'user_123',
        sessionId: 'session_123',
        totalItems: 2,
        totalUniqueItems: 1,
        isEmpty: false,
        canCheckout: true,
      });
      
      expect(json.items).toHaveLength(1);
      expect(json.subtotal).toBeDefined();
      expect(json.total).toBeDefined();
    });
  });
});