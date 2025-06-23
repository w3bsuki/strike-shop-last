/**
 * Product Domain Entity Tests
 * Comprehensive test suite for Product aggregate root and related value objects
 * Target: 100% code coverage for product domain logic
 */

import {
  Product,
  ProductVariant,
  ProductImage,
  ProductDimensions,
  ProductSEO,
  ProductStatus,
  ProductAvailability,
} from '@/domains/product/entities/product';

import {
  Money,
  Currency,
  ProductId,
  ProductCategoryId,
  ProductVariantId,
  ValidationError,
  BusinessRuleViolationError,
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductInventoryChangedEvent,
} from '@/shared/domain';

describe('ProductImage Value Object', () => {
  describe('Constructor and Validation', () => {
    it('should create product image with valid data', () => {
      const image = new ProductImage(
        'https://example.com/image.jpg',
        'Product image',
        800,
        600,
        0
      );
      
      expect(image.url).toBe('https://example.com/image.jpg');
      expect(image.alt).toBe('Product image');
      expect(image.width).toBe(800);
      expect(image.height).toBe(600);
      expect(image.position).toBe(0);
    });

    it('should create image without dimensions', () => {
      const image = new ProductImage(
        'https://example.com/image.jpg',
        'Product image'
      );
      
      expect(image.width).toBeUndefined();
      expect(image.height).toBeUndefined();
      expect(image.position).toBe(0);
    });

    it('should throw error for empty URL', () => {
      expect(() => new ProductImage('', 'Alt text')).toThrow(ValidationError);
      expect(() => new ProductImage('   ', 'Alt text')).toThrow(ValidationError);
    });

    it('should throw error for empty alt text', () => {
      expect(() => new ProductImage('https://example.com/image.jpg', '')).toThrow(ValidationError);
      expect(() => new ProductImage('https://example.com/image.jpg', '   ')).toThrow(ValidationError);
    });

    it('should throw error for invalid width', () => {
      expect(() => new ProductImage('https://example.com/image.jpg', 'Alt', 0, 600)).toThrow(ValidationError);
      expect(() => new ProductImage('https://example.com/image.jpg', 'Alt', -100, 600)).toThrow(ValidationError);
    });

    it('should throw error for invalid height', () => {
      expect(() => new ProductImage('https://example.com/image.jpg', 'Alt', 800, 0)).toThrow(ValidationError);
      expect(() => new ProductImage('https://example.com/image.jpg', 'Alt', 800, -100)).toThrow(ValidationError);
    });

    it('should throw error for negative position', () => {
      expect(() => new ProductImage('https://example.com/image.jpg', 'Alt', 800, 600, -1)).toThrow(ValidationError);
    });
  });

  describe('equals', () => {
    it('should return true for same URL and position', () => {
      const image1 = new ProductImage('https://example.com/image.jpg', 'Alt', 800, 600, 0);
      const image2 = new ProductImage('https://example.com/image.jpg', 'Different Alt', 1000, 800, 0);
      
      expect(image1.equals(image2)).toBe(true);
    });

    it('should return false for different URL', () => {
      const image1 = new ProductImage('https://example.com/image1.jpg', 'Alt', 800, 600, 0);
      const image2 = new ProductImage('https://example.com/image2.jpg', 'Alt', 800, 600, 0);
      
      expect(image1.equals(image2)).toBe(false);
    });

    it('should return false for different position', () => {
      const image1 = new ProductImage('https://example.com/image.jpg', 'Alt', 800, 600, 0);
      const image2 = new ProductImage('https://example.com/image.jpg', 'Alt', 800, 600, 1);
      
      expect(image1.equals(image2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize correctly', () => {
      const image = new ProductImage('https://example.com/image.jpg', 'Alt text', 800, 600, 2);
      const json = image.toJSON();
      
      expect(json).toEqual({
        url: 'https://example.com/image.jpg',
        alt: 'Alt text',
        width: 800,
        height: 600,
        position: 2,
      });
    });
  });
});

describe('ProductDimensions Value Object', () => {
  describe('Constructor and Validation', () => {
    it('should create dimensions with valid data', () => {
      const dimensions = new ProductDimensions(10, 20, 30, 5, 'cm', 'kg');
      
      expect(dimensions.length).toBe(10);
      expect(dimensions.width).toBe(20);
      expect(dimensions.height).toBe(30);
      expect(dimensions.weight).toBe(5);
      expect(dimensions.unit).toBe('cm');
      expect(dimensions.weightUnit).toBe('kg');
    });

    it('should use default units', () => {
      const dimensions = new ProductDimensions(10, 20, 30, 5);
      
      expect(dimensions.unit).toBe('cm');
      expect(dimensions.weightUnit).toBe('kg');
    });

    it('should throw error for zero or negative dimensions', () => {
      expect(() => new ProductDimensions(0, 20, 30, 5)).toThrow(ValidationError);
      expect(() => new ProductDimensions(10, -20, 30, 5)).toThrow(ValidationError);
      expect(() => new ProductDimensions(10, 20, 0, 5)).toThrow(ValidationError);
      expect(() => new ProductDimensions(10, 20, 30, -5)).toThrow(ValidationError);
    });
  });

  describe('getVolume', () => {
    it('should calculate volume correctly', () => {
      const dimensions = new ProductDimensions(10, 20, 30, 5);
      expect(dimensions.getVolume()).toBe(6000);
    });
  });

  describe('toJSON', () => {
    it('should serialize correctly', () => {
      const dimensions = new ProductDimensions(10, 20, 30, 5, 'in', 'lb');
      const json = dimensions.toJSON();
      
      expect(json).toEqual({
        length: 10,
        width: 20,
        height: 30,
        weight: 5,
        unit: 'in',
        weightUnit: 'lb',
      });
    });
  });
});

describe('ProductSEO Value Object', () => {
  describe('Constructor and Validation', () => {
    it('should create SEO with valid data', () => {
      const seo = new ProductSEO(
        'SEO Title',
        'SEO description',
        ['keyword1', 'keyword2'],
        'https://example.com/product'
      );
      
      expect(seo.title).toBe('SEO Title');
      expect(seo.description).toBe('SEO description');
      expect(seo.keywords).toEqual(['keyword1', 'keyword2']);
      expect(seo.canonicalUrl).toBe('https://example.com/product');
    });

    it('should create SEO with minimal data', () => {
      const seo = new ProductSEO();
      
      expect(seo.title).toBeUndefined();
      expect(seo.description).toBeUndefined();
      expect(seo.keywords).toEqual([]);
      expect(seo.canonicalUrl).toBeUndefined();
    });

    it('should throw error for title too long', () => {
      const longTitle = 'a'.repeat(61);
      expect(() => new ProductSEO(longTitle)).toThrow(ValidationError);
    });

    it('should throw error for description too long', () => {
      const longDescription = 'a'.repeat(161);
      expect(() => new ProductSEO(undefined, longDescription)).toThrow(ValidationError);
    });
  });

  describe('toJSON', () => {
    it('should serialize correctly', () => {
      const seo = new ProductSEO('Title', 'Description', ['tag1'], 'https://example.com');
      const json = seo.toJSON();
      
      expect(json).toEqual({
        title: 'Title',
        description: 'Description',
        keywords: ['tag1'],
        canonicalUrl: 'https://example.com',
      });
    });
  });
});

describe('ProductVariant Entity', () => {
  const createTestVariant = (overrides: Partial<any> = {}) => {
    return new ProductVariant(
      ProductVariantId.fromString('variant_123'),
      ProductId.fromString('product_123'),
      'Default Variant',
      'SKU-123',
      Money.fromDecimal(29.99, Currency.USD),
      Money.fromDecimal(39.99, Currency.USD),
      50,
      true,
      false,
      { size: 'M', color: 'blue' },
      'barcode-123',
      1.5,
      new ProductDimensions(10, 20, 30, 1.5),
      new Date('2024-01-01'),
      new Date('2024-01-01'),
      ...overrides
    );
  };

  describe('Constructor and Validation', () => {
    it('should create variant with valid data', () => {
      const variant = createTestVariant();
      
      expect(variant.title).toBe('Default Variant');
      expect(variant.sku).toBe('SKU-123');
      expect(variant.price.decimalAmount).toBe(29.99);
      expect(variant.compareAtPrice?.decimalAmount).toBe(39.99);
      expect(variant.inventoryQuantity).toBe(50);
    });

    it('should throw error for empty title', () => {
      expect(() => createTestVariant({ title: '' })).toThrow(ValidationError);
    });

    it('should throw error for empty SKU', () => {
      expect(() => createTestVariant({ sku: '' })).toThrow(ValidationError);
    });

    it('should throw error for negative inventory', () => {
      expect(() => createTestVariant({ inventoryQuantity: -1 })).toThrow(ValidationError);
    });

    it('should throw error when compare at price is not greater than price', () => {
      const price = Money.fromDecimal(30, Currency.USD);
      const comparePrice = Money.fromDecimal(25, Currency.USD);
      
      expect(() => createTestVariant({ price, compareAtPrice: comparePrice })).toThrow(ValidationError);
    });
  });

  describe('updatePrice', () => {
    it('should update price successfully', () => {
      const variant = createTestVariant();
      const newPrice = Money.fromDecimal(35.99, Currency.USD);
      
      variant.updatePrice(newPrice);
      
      expect(variant.price.decimalAmount).toBe(35.99);
      expect(variant.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for zero or negative price', () => {
      const variant = createTestVariant();
      const zeroPrice = Money.zero(Currency.USD);
      
      expect(() => variant.updatePrice(zeroPrice)).toThrow(ValidationError);
    });
  });

  describe('updateInventory', () => {
    it('should update inventory and emit event', () => {
      const variant = createTestVariant();
      
      variant.updateInventory(75);
      
      expect(variant.inventoryQuantity).toBe(75);
      
      const events = variant.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ProductInventoryChangedEvent);
    });

    it('should throw error for negative inventory', () => {
      const variant = createTestVariant();
      
      expect(() => variant.updateInventory(-1)).toThrow(ValidationError);
    });
  });

  describe('reduceInventory', () => {
    it('should reduce inventory successfully', () => {
      const variant = createTestVariant({ inventoryQuantity: 100 });
      
      variant.reduceInventory(25);
      
      expect(variant.inventoryQuantity).toBe(75);
    });

    it('should throw error when insufficient inventory', () => {
      const variant = createTestVariant({ inventoryQuantity: 10, allowBackorder: false });
      
      expect(() => variant.reduceInventory(15)).toThrow(BusinessRuleViolationError);
    });

    it('should allow backorder when enabled', () => {
      const variant = createTestVariant({ inventoryQuantity: 10, allowBackorder: true });
      
      variant.reduceInventory(15);
      
      expect(variant.inventoryQuantity).toBe(0); // Should not go negative
    });

    it('should allow reduction when inventory management disabled', () => {
      const variant = createTestVariant({ inventoryQuantity: 5, inventoryManagement: false });
      
      variant.reduceInventory(10);
      
      expect(variant.inventoryQuantity).toBe(0);
    });

    it('should throw error for zero or negative quantity', () => {
      const variant = createTestVariant();
      
      expect(() => variant.reduceInventory(0)).toThrow(ValidationError);
      expect(() => variant.reduceInventory(-5)).toThrow(ValidationError);
    });
  });

  describe('isAvailable', () => {
    it('should return true when inventory management disabled', () => {
      const variant = createTestVariant({ inventoryQuantity: 0, inventoryManagement: false });
      
      expect(variant.isAvailable(10)).toBe(true);
    });

    it('should return true when backorder allowed', () => {
      const variant = createTestVariant({ inventoryQuantity: 0, allowBackorder: true });
      
      expect(variant.isAvailable(10)).toBe(true);
    });

    it('should return true when sufficient inventory', () => {
      const variant = createTestVariant({ inventoryQuantity: 50 });
      
      expect(variant.isAvailable(25)).toBe(true);
    });

    it('should return false when insufficient inventory', () => {
      const variant = createTestVariant({ inventoryQuantity: 10 });
      
      expect(variant.isAvailable(15)).toBe(false);
    });
  });

  describe('getAvailabilityStatus', () => {
    it('should return IN_STOCK when inventory management disabled', () => {
      const variant = createTestVariant({ inventoryManagement: false });
      
      expect(variant.getAvailabilityStatus()).toBe(ProductAvailability.IN_STOCK);
    });

    it('should return IN_STOCK when inventory available', () => {
      const variant = createTestVariant({ inventoryQuantity: 10 });
      
      expect(variant.getAvailabilityStatus()).toBe(ProductAvailability.IN_STOCK);
    });

    it('should return PRE_ORDER when out of stock but backorder allowed', () => {
      const variant = createTestVariant({ inventoryQuantity: 0, allowBackorder: true });
      
      expect(variant.getAvailabilityStatus()).toBe(ProductAvailability.PRE_ORDER);
    });

    it('should return OUT_OF_STOCK when no inventory and no backorder', () => {
      const variant = createTestVariant({ inventoryQuantity: 0, allowBackorder: false });
      
      expect(variant.getAvailabilityStatus()).toBe(ProductAvailability.OUT_OF_STOCK);
    });
  });

  describe('toJSON', () => {
    it('should serialize correctly', () => {
      const variant = createTestVariant();
      const json = variant.toJSON();
      
      expect(json).toMatchObject({
        id: 'variant_123',
        productId: 'product_123',
        title: 'Default Variant',
        sku: 'SKU-123',
        inventoryQuantity: 50,
        inventoryManagement: true,
        allowBackorder: false,
        availabilityStatus: ProductAvailability.IN_STOCK,
      });
      
      expect(json.price).toBeDefined();
      expect(json.compareAtPrice).toBeDefined();
      expect(json.dimensions).toBeDefined();
    });
  });
});

describe('Product Entity (Aggregate Root)', () => {
  const createTestProduct = (overrides: Partial<any> = {}) => {
    return new Product(
      ProductId.fromString('product_123'),
      'Test Product',
      'test-product',
      'Product description',
      ProductStatus.DRAFT,
      [ProductCategoryId.fromString('category_123')],
      ['tag1', 'tag2'],
      'Test Vendor',
      'Electronics',
      [new ProductImage('https://example.com/image.jpg', 'Product image', 800, 600, 0)],
      new ProductSEO('SEO Title', 'SEO description'),
      { metafield1: 'value1' },
      [],
      undefined,
      new Date('2024-01-01'),
      new Date('2024-01-01'),
      ...overrides
    );
  };

  const createTestVariant = (productId: ProductId, overrides: Partial<any> = {}) => {
    return new ProductVariant(
      ProductVariantId.generate(),
      productId,
      'Default Variant',
      'SKU-123',
      Money.fromDecimal(29.99, Currency.USD),
      Money.fromDecimal(39.99, Currency.USD),
      50,
      true,
      false,
      { size: 'M' },
      ...overrides
    );
  };

  describe('Constructor and Validation', () => {
    it('should create product with valid data', () => {
      const product = createTestProduct();
      
      expect(product.title).toBe('Test Product');
      expect(product.handle).toBe('test-product');
      expect(product.description).toBe('Product description');
      expect(product.status).toBe(ProductStatus.DRAFT);
      expect(product.tags).toEqual(['tag1', 'tag2']);
    });

    it('should create product with minimal data', () => {
      const product = new Product(
        ProductId.generate(),
        'Simple Product',
        'simple-product'
      );
      
      expect(product.title).toBe('Simple Product');
      expect(product.handle).toBe('simple-product');
      expect(product.description).toBe('');
      expect(product.status).toBe(ProductStatus.DRAFT);
    });

    it('should throw error for empty title', () => {
      expect(() => createTestProduct({ title: '' })).toThrow(ValidationError);
    });

    it('should throw error for empty handle', () => {
      expect(() => createTestProduct({ handle: '' })).toThrow(ValidationError);
    });

    it('should throw error for invalid handle format', () => {
      expect(() => createTestProduct({ handle: 'Invalid Handle!' })).toThrow(ValidationError);
      expect(() => createTestProduct({ handle: 'invalid_handle' })).toThrow(ValidationError);
      expect(() => createTestProduct({ handle: 'InvalidHandle' })).toThrow(ValidationError);
    });

    it('should throw error for title too long', () => {
      const longTitle = 'a'.repeat(256);
      expect(() => createTestProduct({ title: longTitle })).toThrow(ValidationError);
    });

    it('should throw error for description too long', () => {
      const longDescription = 'a'.repeat(5001);
      expect(() => createTestProduct({ description: longDescription })).toThrow(ValidationError);
    });

    it('should throw error for variant with wrong product ID', () => {
      const wrongProductId = ProductId.generate();
      const variant = createTestVariant(wrongProductId);
      
      expect(() => createTestProduct({ variants: [variant] })).toThrow(ValidationError);
    });
  });

  describe('Factory Method', () => {
    it('should create product using factory method', () => {
      const product = Product.create(
        'New Product',
        'new-product',
        'Product description',
        [ProductCategoryId.fromString('category_456')]
      );
      
      expect(product.title).toBe('New Product');
      expect(product.handle).toBe('new-product');
      expect(product.status).toBe(ProductStatus.DRAFT);
      
      const events = product.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ProductCreatedEvent);
    });
  });

  describe('updateBasicInfo', () => {
    it('should update title and description', () => {
      const product = createTestProduct();
      
      product.updateBasicInfo('Updated Title', 'Updated description');
      
      expect(product.title).toBe('Updated Title');
      expect(product.description).toBe('Updated description');
      
      const events = product.getUncommittedEvents();
      const updateEvents = events.filter(e => e instanceof ProductUpdatedEvent);
      expect(updateEvents).toHaveLength(1);
    });

    it('should not emit event when no changes', () => {
      const product = createTestProduct();
      product.markEventsAsCommitted();
      
      product.updateBasicInfo('Test Product', 'Product description'); // Same values
      
      const events = product.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should validate updated data', () => {
      const product = createTestProduct();
      
      expect(() => product.updateBasicInfo('', 'Valid description')).toThrow(ValidationError);
    });
  });

  describe('updateHandle', () => {
    it('should update handle successfully', () => {
      const product = createTestProduct();
      
      product.updateHandle('new-handle');
      
      expect(product.handle).toBe('new-handle');
      
      const events = product.getUncommittedEvents();
      const updateEvents = events.filter(e => e instanceof ProductUpdatedEvent);
      expect(updateEvents.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid handle', () => {
      const product = createTestProduct();
      
      expect(() => product.updateHandle('Invalid Handle!')).toThrow(ValidationError);
    });
  });

  describe('Status Management', () => {
    describe('publish', () => {
      it('should publish product with variants', () => {
        const product = createTestProduct();
        const variant = createTestVariant(product.id);
        product.addVariant(variant);
        
        product.publish();
        
        expect(product.status).toBe(ProductStatus.ACTIVE);
        expect(product.publishedAt).toBeInstanceOf(Date);
      });

      it('should throw error when already published', () => {
        const product = createTestProduct({ status: ProductStatus.ACTIVE });
        
        expect(() => product.publish()).toThrow(BusinessRuleViolationError);
      });

      it('should throw error when no variants', () => {
        const product = createTestProduct();
        
        expect(() => product.publish()).toThrow(BusinessRuleViolationError);
      });
    });

    describe('unpublish', () => {
      it('should unpublish active product', () => {
        const product = createTestProduct({ status: ProductStatus.ACTIVE });
        
        product.unpublish();
        
        expect(product.status).toBe(ProductStatus.INACTIVE);
      });

      it('should throw error when not published', () => {
        const product = createTestProduct({ status: ProductStatus.DRAFT });
        
        expect(() => product.unpublish()).toThrow(BusinessRuleViolationError);
      });
    });

    describe('archive', () => {
      it('should archive product', () => {
        const product = createTestProduct();
        
        product.archive();
        
        expect(product.status).toBe(ProductStatus.ARCHIVED);
      });

      it('should throw error when already archived', () => {
        const product = createTestProduct({ status: ProductStatus.ARCHIVED });
        
        expect(() => product.archive()).toThrow(BusinessRuleViolationError);
      });
    });
  });

  describe('Variant Management', () => {
    describe('addVariant', () => {
      it('should add variant successfully', () => {
        const product = createTestProduct();
        const variant = createTestVariant(product.id);
        
        product.addVariant(variant);
        
        expect(product.variants).toHaveLength(1);
        expect(product.variants[0].id.value).toBe(variant.id.value);
      });

      it('should throw error for variant with wrong product ID', () => {
        const product = createTestProduct();
        const variant = createTestVariant(ProductId.generate());
        
        expect(() => product.addVariant(variant)).toThrow(ValidationError);
      });

      it('should throw error for duplicate variant', () => {
        const product = createTestProduct();
        const variant = createTestVariant(product.id);
        
        product.addVariant(variant);
        
        expect(() => product.addVariant(variant)).toThrow(BusinessRuleViolationError);
      });

      it('should throw error for duplicate SKU', () => {
        const product = createTestProduct();
        const variant1 = createTestVariant(product.id, { sku: 'DUPLICATE-SKU' });
        const variant2 = createTestVariant(product.id, { sku: 'DUPLICATE-SKU' });
        
        product.addVariant(variant1);
        
        expect(() => product.addVariant(variant2)).toThrow(BusinessRuleViolationError);
      });
    });

    describe('removeVariant', () => {
      it('should remove variant successfully', () => {
        const product = createTestProduct();
        const variant1 = createTestVariant(product.id, { sku: 'SKU-1' });
        const variant2 = createTestVariant(product.id, { sku: 'SKU-2' });
        
        product.addVariant(variant1);
        product.addVariant(variant2);
        
        product.removeVariant(variant1.id);
        
        expect(product.variants).toHaveLength(1);
        expect(product.variants[0].id.value).toBe(variant2.id.value);
      });

      it('should throw error when variant not found', () => {
        const product = createTestProduct();
        const nonExistentId = ProductVariantId.generate();
        
        expect(() => product.removeVariant(nonExistentId)).toThrow(ValidationError);
      });

      it('should throw error when removing last variant', () => {
        const product = createTestProduct();
        const variant = createTestVariant(product.id);
        
        product.addVariant(variant);
        
        expect(() => product.removeVariant(variant.id)).toThrow(BusinessRuleViolationError);
      });
    });

    describe('updateVariant', () => {
      it('should update variant successfully', () => {
        const product = createTestProduct();
        const variant = createTestVariant(product.id);
        
        product.addVariant(variant);
        
        product.updateVariant(variant.id, { title: 'Updated Variant' });
        
        expect(product.variants[0].title).toBe('Updated Variant');
      });

      it('should throw error when variant not found', () => {
        const product = createTestProduct();
        const nonExistentId = ProductVariantId.generate();
        
        expect(() => product.updateVariant(nonExistentId, { title: 'Updated' })).toThrow(ValidationError);
      });
    });
  });

  describe('Image Management', () => {
    describe('addImage', () => {
      it('should add image at specified position', () => {
        const product = createTestProduct({ images: [] });
        const image = new ProductImage('https://example.com/new.jpg', 'New image', 800, 600, 0);
        
        product.addImage(image);
        
        expect(product.images).toHaveLength(1);
        expect(product.images[0].url).toBe('https://example.com/new.jpg');
      });

      it('should shift existing images when inserting', () => {
        const product = createTestProduct({ images: [] });
        const image1 = new ProductImage('https://example.com/1.jpg', 'Image 1', 800, 600, 0);
        const image2 = new ProductImage('https://example.com/2.jpg', 'Image 2', 800, 600, 1);
        const image3 = new ProductImage('https://example.com/3.jpg', 'Image 3', 800, 600, 0); // Insert at beginning
        
        product.addImage(image1);
        product.addImage(image2);
        product.addImage(image3);
        
        expect(product.images).toHaveLength(3);
        expect(product.images[0].url).toBe('https://example.com/3.jpg');
        expect(product.images[1].url).toBe('https://example.com/1.jpg');
        expect(product.images[2].url).toBe('https://example.com/2.jpg');
      });
    });

    describe('removeImage', () => {
      it('should remove image and reorder positions', () => {
        const product = createTestProduct({ images: [] });
        const image1 = new ProductImage('https://example.com/1.jpg', 'Image 1', 800, 600, 0);
        const image2 = new ProductImage('https://example.com/2.jpg', 'Image 2', 800, 600, 1);
        const image3 = new ProductImage('https://example.com/3.jpg', 'Image 3', 800, 600, 2);
        
        product.addImage(image1);
        product.addImage(image2);
        product.addImage(image3);
        
        product.removeImage('https://example.com/2.jpg');
        
        expect(product.images).toHaveLength(2);
        expect(product.images[0].position).toBe(0);
        expect(product.images[1].position).toBe(1);
      });

      it('should throw error when image not found', () => {
        const product = createTestProduct();
        
        expect(() => product.removeImage('https://example.com/nonexistent.jpg')).toThrow(ValidationError);
      });
    });
  });

  describe('Tag Management', () => {
    describe('addTag', () => {
      it('should add new tag', () => {
        const product = createTestProduct({ tags: [] });
        
        product.addTag('new-tag');
        
        expect(product.tags).toContain('new-tag');
      });

      it('should normalize tag to lowercase', () => {
        const product = createTestProduct({ tags: [] });
        
        product.addTag('NEW-TAG');
        
        expect(product.tags).toContain('new-tag');
      });

      it('should not add duplicate tags', () => {
        const product = createTestProduct({ tags: ['existing-tag'] });
        
        product.addTag('existing-tag');
        
        expect(product.tags.filter(tag => tag === 'existing-tag')).toHaveLength(1);
      });

      it('should throw error for empty tag', () => {
        const product = createTestProduct();
        
        expect(() => product.addTag('')).toThrow(ValidationError);
        expect(() => product.addTag('   ')).toThrow(ValidationError);
      });
    });

    describe('removeTag', () => {
      it('should remove existing tag', () => {
        const product = createTestProduct({ tags: ['tag1', 'tag2'] });
        
        product.removeTag('tag1');
        
        expect(product.tags).not.toContain('tag1');
        expect(product.tags).toContain('tag2');
      });

      it('should handle non-existent tag gracefully', () => {
        const product = createTestProduct({ tags: ['tag1'] });
        
        product.removeTag('nonexistent');
        
        expect(product.tags).toContain('tag1');
      });
    });
  });

  describe('Category Management', () => {
    describe('assignToCategory', () => {
      it('should assign product to category', () => {
        const product = createTestProduct({ categoryIds: [] });
        const categoryId = ProductCategoryId.fromString('new-category');
        
        product.assignToCategory(categoryId);
        
        expect(product.categoryIds.some(id => id.equals(categoryId))).toBe(true);
      });

      it('should not add duplicate categories', () => {
        const categoryId = ProductCategoryId.fromString('category_123');
        const product = createTestProduct({ categoryIds: [categoryId] });
        
        product.assignToCategory(categoryId);
        
        expect(product.categoryIds.filter(id => id.equals(categoryId))).toHaveLength(1);
      });
    });

    describe('removeFromCategory', () => {
      it('should remove product from category', () => {
        const categoryId = ProductCategoryId.fromString('category_123');
        const product = createTestProduct({ categoryIds: [categoryId] });
        
        product.removeFromCategory(categoryId);
        
        expect(product.categoryIds.some(id => id.equals(categoryId))).toBe(false);
      });
    });
  });

  describe('Query Methods', () => {
    describe('getVariant', () => {
      it('should return variant by ID', () => {
        const product = createTestProduct();
        const variant = createTestVariant(product.id);
        product.addVariant(variant);
        
        const found = product.getVariant(variant.id);
        
        expect(found?.id.value).toBe(variant.id.value);
      });

      it('should return null for non-existent variant', () => {
        const product = createTestProduct();
        const nonExistentId = ProductVariantId.generate();
        
        const found = product.getVariant(nonExistentId);
        
        expect(found).toBeNull();
      });
    });

    describe('getVariantBySku', () => {
      it('should return variant by SKU', () => {
        const product = createTestProduct();
        const variant = createTestVariant(product.id, { sku: 'UNIQUE-SKU' });
        product.addVariant(variant);
        
        const found = product.getVariantBySku('UNIQUE-SKU');
        
        expect(found?.sku).toBe('UNIQUE-SKU');
      });

      it('should return null for non-existent SKU', () => {
        const product = createTestProduct();
        
        const found = product.getVariantBySku('NONEXISTENT');
        
        expect(found).toBeNull();
      });
    });

    describe('getPriceRange', () => {
      it('should return price range for multiple variants', () => {
        const product = createTestProduct();
        const variant1 = createTestVariant(product.id, { 
          price: Money.fromDecimal(10, Currency.USD),
          sku: 'SKU-1' 
        });
        const variant2 = createTestVariant(product.id, { 
          price: Money.fromDecimal(30, Currency.USD),
          sku: 'SKU-2' 
        });
        
        product.addVariant(variant1);
        product.addVariant(variant2);
        
        const priceRange = product.getPriceRange();
        
        expect(priceRange?.min.decimalAmount).toBe(10);
        expect(priceRange?.max.decimalAmount).toBe(30);
      });

      it('should return null when no variants', () => {
        const product = createTestProduct();
        
        const priceRange = product.getPriceRange();
        
        expect(priceRange).toBeNull();
      });
    });

    describe('getTotalInventory', () => {
      it('should sum inventory across all variants', () => {
        const product = createTestProduct();
        const variant1 = createTestVariant(product.id, { inventoryQuantity: 25, sku: 'SKU-1' });
        const variant2 = createTestVariant(product.id, { inventoryQuantity: 35, sku: 'SKU-2' });
        
        product.addVariant(variant1);
        product.addVariant(variant2);
        
        expect(product.getTotalInventory()).toBe(60);
      });
    });

    describe('isAvailable', () => {
      it('should return true when product is active and has available variants', () => {
        const product = createTestProduct({ status: ProductStatus.ACTIVE });
        const variant = createTestVariant(product.id, { inventoryQuantity: 10 });
        product.addVariant(variant);
        
        expect(product.isAvailable()).toBe(true);
      });

      it('should return false when product is not active', () => {
        const product = createTestProduct({ status: ProductStatus.DRAFT });
        const variant = createTestVariant(product.id, { inventoryQuantity: 10 });
        product.addVariant(variant);
        
        expect(product.isAvailable()).toBe(false);
      });

      it('should return false when no variants are available', () => {
        const product = createTestProduct({ status: ProductStatus.ACTIVE });
        const variant = createTestVariant(product.id, { inventoryQuantity: 0, allowBackorder: false });
        product.addVariant(variant);
        
        expect(product.isAvailable()).toBe(false);
      });
    });

    describe('getAvailabilityStatus', () => {
      it('should return DISCONTINUED for non-active products', () => {
        const product = createTestProduct({ status: ProductStatus.ARCHIVED });
        
        expect(product.getAvailabilityStatus()).toBe(ProductAvailability.DISCONTINUED);
      });

      it('should return OUT_OF_STOCK when no variants available', () => {
        const product = createTestProduct({ status: ProductStatus.ACTIVE });
        const variant = createTestVariant(product.id, { inventoryQuantity: 0, allowBackorder: false });
        product.addVariant(variant);
        
        expect(product.getAvailabilityStatus()).toBe(ProductAvailability.OUT_OF_STOCK);
      });

      it('should return IN_STOCK when all variants available', () => {
        const product = createTestProduct({ status: ProductStatus.ACTIVE });
        const variant = createTestVariant(product.id, { inventoryQuantity: 10 });
        product.addVariant(variant);
        
        expect(product.getAvailabilityStatus()).toBe(ProductAvailability.IN_STOCK);
      });
    });

    describe('getFeaturedImage', () => {
      it('should return image at position 0', () => {
        const product = createTestProduct({ images: [] });
        const image1 = new ProductImage('https://example.com/1.jpg', 'Image 1', 800, 600, 0);
        const image2 = new ProductImage('https://example.com/2.jpg', 'Image 2', 800, 600, 1);
        
        product.addImage(image1);
        product.addImage(image2);
        
        const featured = product.getFeaturedImage();
        
        expect(featured?.url).toBe('https://example.com/1.jpg');
      });

      it('should return first image if no position 0', () => {
        const product = createTestProduct({ images: [] });
        const image = new ProductImage('https://example.com/1.jpg', 'Image 1', 800, 600, 5);
        
        product.addImage(image);
        
        const featured = product.getFeaturedImage();
        
        expect(featured?.url).toBe('https://example.com/1.jpg');
      });

      it('should return null when no images', () => {
        const product = createTestProduct({ images: [] });
        
        const featured = product.getFeaturedImage();
        
        expect(featured).toBeNull();
      });
    });
  });

  describe('Event Management', () => {
    it('should collect events from product and variants', () => {
      const product = createTestProduct();
      const variant = createTestVariant(product.id);
      
      product.addVariant(variant);
      variant.updateInventory(75);
      
      const events = product.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(1);
      
      const inventoryEvents = events.filter(e => e instanceof ProductInventoryChangedEvent);
      expect(inventoryEvents).toHaveLength(1);
    });

    it('should mark all events as committed', () => {
      const product = createTestProduct();
      const variant = createTestVariant(product.id);
      
      product.addVariant(variant);
      variant.updateInventory(75);
      
      expect(product.getUncommittedEvents().length).toBeGreaterThan(0);
      
      product.markEventsAsCommitted();
      expect(product.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('Serialization', () => {
    it('should serialize product to JSON correctly', () => {
      const product = createTestProduct();
      const variant = createTestVariant(product.id);
      product.addVariant(variant);
      
      const json = product.toJSON();
      
      expect(json).toMatchObject({
        id: 'product_123',
        title: 'Test Product',
        handle: 'test-product',
        status: ProductStatus.DRAFT,
        vendor: 'Test Vendor',
        productType: 'Electronics',
        totalInventory: 50,
      });
      
      expect(json.variants).toHaveLength(1);
      expect(json.images).toHaveLength(1);
      expect(json.categoryIds).toEqual(['category_123']);
      expect(json.tags).toEqual(['tag1', 'tag2']);
      expect(json.priceRange).toBeDefined();
      expect(json.featuredImage).toBeDefined();
    });
  });
});