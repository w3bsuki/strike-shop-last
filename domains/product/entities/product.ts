/**
 * Product Domain - Product Entity
 * Core product aggregate root implementing business rules
 */

import { z } from 'zod';
import {
  ProductId,
  ProductCategoryId,
  ProductVariantId,
  Money,
  Currency,
  ValidationError,
  BusinessRuleViolationError,
  DomainEvent,
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductInventoryChangedEvent,
} from '../../../shared/domain';

// Product status enumeration
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

// Product availability enumeration
export enum ProductAvailability {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  PRE_ORDER = 'pre_order',
  DISCONTINUED = 'discontinued',
}

// Product image value object
export class ProductImage {
  constructor(
    public readonly url: string,
    public readonly alt: string,
    public readonly width?: number,
    public readonly height?: number,
    public readonly position: number = 0
  ) {
    if (!url || url.trim() === '') {
      throw ValidationError.required('url');
    }
    if (!alt || alt.trim() === '') {
      throw ValidationError.required('alt');
    }
    if (width && width <= 0) {
      throw ValidationError.invalidField('width', width, 'Width must be positive');
    }
    if (height && height <= 0) {
      throw ValidationError.invalidField('height', height, 'Height must be positive');
    }
    if (position < 0) {
      throw ValidationError.invalidField('position', position, 'Position cannot be negative');
    }
  }

  equals(other: ProductImage): boolean {
    return this.url === other.url && this.position === other.position;
  }

  toJSON() {
    return {
      url: this.url,
      alt: this.alt,
      width: this.width,
      height: this.height,
      position: this.position,
    };
  }
}

// Product dimensions value object
export class ProductDimensions {
  constructor(
    public readonly length: number,
    public readonly width: number,
    public readonly height: number,
    public readonly weight: number,
    public readonly unit: 'cm' | 'in' = 'cm',
    public readonly weightUnit: 'kg' | 'lb' | 'g' | 'oz' = 'kg'
  ) {
    if (length <= 0 || width <= 0 || height <= 0 || weight <= 0) {
      throw ValidationError.invalidField(
        'dimensions',
        { length, width, height, weight },
        'All dimensions must be positive'
      );
    }
  }

  getVolume(): number {
    return this.length * this.width * this.height;
  }

  toJSON() {
    return {
      length: this.length,
      width: this.width,
      height: this.height,
      weight: this.weight,
      unit: this.unit,
      weightUnit: this.weightUnit,
    };
  }
}

// Product SEO value object
export class ProductSEO {
  constructor(
    public readonly title?: string,
    public readonly description?: string,
    public readonly keywords: string[] = [],
    public readonly canonicalUrl?: string
  ) {
    if (title && title.length > 60) {
      throw ValidationError.invalidField('seoTitle', title, 'SEO title must be 60 characters or less');
    }
    if (description && description.length > 160) {
      throw ValidationError.invalidField('seoDescription', description, 'SEO description must be 160 characters or less');
    }
  }

  toJSON() {
    return {
      title: this.title,
      description: this.description,
      keywords: this.keywords,
      canonicalUrl: this.canonicalUrl,
    };
  }
}

// Product variant entity
export class ProductVariant {
  private _events: DomainEvent[] = [];

  constructor(
    public readonly id: ProductVariantId,
    public readonly productId: ProductId,
    public title: string,
    public sku: string,
    public price: Money,
    public compareAtPrice: Money | null = null,
    public inventoryQuantity: number = 0,
    public inventoryManagement: boolean = true,
    public allowBackorder: boolean = false,
    public options: Record<string, string> = {},
    public barcode?: string,
    public weight?: number,
    public dimensions?: ProductDimensions,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    this.validateVariant();
  }

  private validateVariant(): void {
    if (!this.title || this.title.trim() === '') {
      throw ValidationError.required('title');
    }
    if (!this.sku || this.sku.trim() === '') {
      throw ValidationError.required('sku');
    }
    if (this.inventoryQuantity < 0) {
      throw ValidationError.invalidField('inventoryQuantity', this.inventoryQuantity, 'Cannot be negative');
    }
    if (this.compareAtPrice && this.compareAtPrice.lessThanOrEqual(this.price)) {
      throw ValidationError.invalidField('compareAtPrice', this.compareAtPrice, 'Must be greater than price');
    }
  }

  // Business methods
  updatePrice(newPrice: Money): void {
    if (newPrice.lessThanOrEqual(Money.zero(newPrice.currency))) {
      throw ValidationError.invalidField('price', newPrice, 'Price must be positive');
    }
    
    this.price = newPrice;
    this.updatedAt = new Date();
  }

  updateInventory(quantity: number): void {
    if (quantity < 0) {
      throw ValidationError.invalidField('inventoryQuantity', quantity, 'Cannot be negative');
    }

    const oldQuantity = this.inventoryQuantity;
    this.inventoryQuantity = quantity;
    this.updatedAt = new Date();

    // Emit inventory change event
    this._events.push(
      new ProductInventoryChangedEvent(this.productId.value, {
        variantId: this.id.value,
        oldQuantity,
        newQuantity: quantity,
      })
    );
  }

  reduceInventory(quantity: number): void {
    if (quantity <= 0) {
      throw ValidationError.invalidField('quantity', quantity, 'Quantity must be positive');
    }

    if (this.inventoryManagement && this.inventoryQuantity < quantity && !this.allowBackorder) {
      throw BusinessRuleViolationError.create(
        'insufficient_inventory',
        `Insufficient inventory. Available: ${this.inventoryQuantity}, Required: ${quantity}`,
        { variantId: this.id.value, available: this.inventoryQuantity, required: quantity }
      );
    }

    this.updateInventory(Math.max(0, this.inventoryQuantity - quantity));
  }

  isAvailable(quantity: number = 1): boolean {
    if (!this.inventoryManagement) return true;
    if (this.allowBackorder) return true;
    return this.inventoryQuantity >= quantity;
  }

  getAvailabilityStatus(): ProductAvailability {
    if (!this.inventoryManagement) return ProductAvailability.IN_STOCK;
    if (this.inventoryQuantity > 0) return ProductAvailability.IN_STOCK;
    if (this.allowBackorder) return ProductAvailability.PRE_ORDER;
    return ProductAvailability.OUT_OF_STOCK;
  }

  // Domain events
  getUncommittedEvents(): DomainEvent[] {
    return [...this._events];
  }

  markEventsAsCommitted(): void {
    this._events = [];
  }

  toJSON() {
    return {
      id: this.id.value,
      productId: this.productId.value,
      title: this.title,
      sku: this.sku,
      price: this.price.toJSON(),
      compareAtPrice: this.compareAtPrice?.toJSON(),
      inventoryQuantity: this.inventoryQuantity,
      inventoryManagement: this.inventoryManagement,
      allowBackorder: this.allowBackorder,
      options: this.options,
      barcode: this.barcode,
      weight: this.weight,
      dimensions: this.dimensions?.toJSON(),
      availabilityStatus: this.getAvailabilityStatus(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

// Product entity (aggregate root)
export class Product {
  private _events: DomainEvent[] = [];
  private _variants: Map<string, ProductVariant> = new Map();

  constructor(
    public readonly id: ProductId,
    public title: string,
    public handle: string,
    public description: string = '',
    public status: ProductStatus = ProductStatus.DRAFT,
    public categoryIds: ProductCategoryId[] = [],
    public tags: string[] = [],
    public vendor?: string,
    public productType?: string,
    public images: ProductImage[] = [],
    public seo?: ProductSEO,
    public metafields: Record<string, unknown> = {},
    variants: ProductVariant[] = [],
    public publishedAt?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    this.validateProduct();
    this.setVariants(variants);
  }

  private validateProduct(): void {
    if (!this.title || this.title.trim() === '') {
      throw ValidationError.required('title');
    }
    if (!this.handle || this.handle.trim() === '') {
      throw ValidationError.required('handle');
    }
    if (!/^[a-z0-9-]+$/.test(this.handle)) {
      throw ValidationError.invalidFormat('handle', this.handle, 'lowercase letters, numbers, and hyphens only');
    }
    if (this.title.length > 255) {
      throw ValidationError.invalidField('title', this.title, 'Title must be 255 characters or less');
    }
    if (this.description.length > 5000) {
      throw ValidationError.invalidField('description', this.description, 'Description must be 5000 characters or less');
    }
  }

  private setVariants(variants: ProductVariant[]): void {
    for (const variant of variants) {
      if (!variant.productId.equals(this.id)) {
        throw ValidationError.invalidField('variant.productId', variant.productId, 'Variant must belong to this product');
      }
      this._variants.set(variant.id.value, variant);
    }
  }

  // Factory method
  static create(
    title: string,
    handle: string,
    description: string = '',
    categoryIds: ProductCategoryId[] = []
  ): Product {
    const id = ProductId.create(crypto.randomUUID());
    const product = new Product(id, title, handle, description, ProductStatus.DRAFT, categoryIds);
    
    // Emit creation event
    product._events.push(
      new ProductCreatedEvent(id.value, {
        title,
        handle,
        categoryIds: categoryIds.map(c => c.value),
      })
    );

    return product;
  }

  // Business methods
  updateBasicInfo(title: string, description: string): void {
    const oldTitle = this.title;
    const oldDescription = this.description;

    this.title = title;
    this.description = description;
    this.updatedAt = new Date();

    this.validateProduct();

    // Emit update event
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (oldTitle !== title) changes.title = { old: oldTitle, new: title };
    if (oldDescription !== description) changes.description = { old: oldDescription, new: description };

    if (Object.keys(changes).length > 0) {
      this._events.push(
        new ProductUpdatedEvent(this.id.value, { changes })
      );
    }
  }

  updateHandle(handle: string): void {
    if (!handle || handle.trim() === '') {
      throw ValidationError.required('handle');
    }
    if (!/^[a-z0-9-]+$/.test(handle)) {
      throw ValidationError.invalidFormat('handle', handle, 'lowercase letters, numbers, and hyphens only');
    }

    const oldHandle = this.handle;
    this.handle = handle;
    this.updatedAt = new Date();

    this._events.push(
      new ProductUpdatedEvent(this.id.value, {
        changes: { handle: { old: oldHandle, new: handle } }
      })
    );
  }

  publish(): void {
    if (this.status === ProductStatus.ACTIVE) {
      throw BusinessRuleViolationError.create(
        'already_published',
        'Product is already published'
      );
    }

    if (this._variants.size === 0) {
      throw BusinessRuleViolationError.create(
        'no_variants',
        'Cannot publish product without variants'
      );
    }

    this.status = ProductStatus.ACTIVE;
    this.publishedAt = new Date();
    this.updatedAt = new Date();

    this._events.push(
      new ProductUpdatedEvent(this.id.value, {
        changes: { status: { old: ProductStatus.DRAFT, new: ProductStatus.ACTIVE } }
      })
    );
  }

  unpublish(): void {
    if (this.status !== ProductStatus.ACTIVE) {
      throw BusinessRuleViolationError.create(
        'not_published',
        'Product is not currently published'
      );
    }

    this.status = ProductStatus.INACTIVE;
    this.updatedAt = new Date();

    this._events.push(
      new ProductUpdatedEvent(this.id.value, {
        changes: { status: { old: ProductStatus.ACTIVE, new: ProductStatus.INACTIVE } }
      })
    );
  }

  archive(): void {
    if (this.status === ProductStatus.ARCHIVED) {
      throw BusinessRuleViolationError.create(
        'already_archived',
        'Product is already archived'
      );
    }

    this.status = ProductStatus.ARCHIVED;
    this.updatedAt = new Date();

    this._events.push(
      new ProductUpdatedEvent(this.id.value, {
        changes: { status: { old: this.status, new: ProductStatus.ARCHIVED } }
      })
    );
  }

  addVariant(variant: ProductVariant): void {
    if (!variant.productId.equals(this.id)) {
      throw ValidationError.invalidField('variant.productId', variant.productId, 'Variant must belong to this product');
    }

    if (this._variants.has(variant.id.value)) {
      throw BusinessRuleViolationError.create(
        'duplicate_variant',
        'Variant already exists',
        { variantId: variant.id.value }
      );
    }

    // Check for duplicate SKU
    for (const existingVariant of this._variants.values()) {
      if (existingVariant.sku === variant.sku) {
        throw BusinessRuleViolationError.create(
          'duplicate_sku',
          'SKU already exists',
          { sku: variant.sku }
        );
      }
    }

    this._variants.set(variant.id.value, variant);
    this.updatedAt = new Date();
  }

  removeVariant(variantId: ProductVariantId): void {
    if (!this._variants.has(variantId.value)) {
      throw ValidationError.invalidField('variantId', variantId, 'Variant not found');
    }

    if (this._variants.size === 1) {
      throw BusinessRuleViolationError.create(
        'cannot_remove_last_variant',
        'Cannot remove the last variant from a product'
      );
    }

    this._variants.delete(variantId.value);
    this.updatedAt = new Date();
  }

  updateVariant(variantId: ProductVariantId, updates: Partial<ProductVariant>): void {
    const variant = this._variants.get(variantId.value);
    if (!variant) {
      throw ValidationError.invalidField('variantId', variantId, 'Variant not found');
    }

    // Apply updates
    Object.assign(variant, updates, { updatedAt: new Date() });
    this.updatedAt = new Date();
  }

  addImage(image: ProductImage): void {
    // Check for duplicate position
    const existingImage = this.images.find(img => img.position === image.position);
    if (existingImage) {
      // Shift existing images
      this.images = this.images.map(img => 
        img.position >= image.position 
          ? new ProductImage(img.url, img.alt, img.width, img.height, img.position + 1)
          : img
      );
    }

    this.images.push(image);
    this.images.sort((a, b) => a.position - b.position);
    this.updatedAt = new Date();
  }

  removeImage(url: string): void {
    const index = this.images.findIndex(img => img.url === url);
    if (index === -1) {
      throw ValidationError.invalidField('imageUrl', url, 'Image not found');
    }

    this.images.splice(index, 1);
    // Reorder remaining images
    this.images = this.images.map((img, idx) => 
      new ProductImage(img.url, img.alt, img.width, img.height, idx)
    );
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag) {
      throw ValidationError.invalidField('tag', tag, 'Tag cannot be empty');
    }

    if (!this.tags.includes(normalizedTag)) {
      this.tags.push(normalizedTag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    const index = this.tags.indexOf(normalizedTag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  assignToCategory(categoryId: ProductCategoryId): void {
    if (!this.categoryIds.find(id => id.equals(categoryId))) {
      this.categoryIds.push(categoryId);
      this.updatedAt = new Date();
    }
  }

  removeFromCategory(categoryId: ProductCategoryId): void {
    const index = this.categoryIds.findIndex(id => id.equals(categoryId));
    if (index > -1) {
      this.categoryIds.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // Queries
  get variants(): ProductVariant[] {
    return Array.from(this._variants.values());
  }

  getVariant(variantId: ProductVariantId): ProductVariant | null {
    return this._variants.get(variantId.value) || null;
  }

  getVariantBySku(sku: string): ProductVariant | null {
    for (const variant of this._variants.values()) {
      if (variant.sku === sku) return variant;
    }
    return null;
  }

  getPriceRange(): { min: Money; max: Money } | null {
    if (this._variants.size === 0) return null;

    const prices = Array.from(this._variants.values()).map(v => v.price);
    const min = prices.reduce((min, price) => price.lessThan(min) ? price : min);
    const max = prices.reduce((max, price) => price.greaterThan(max) ? price : max);

    return { min, max };
  }

  getTotalInventory(): number {
    return Array.from(this._variants.values())
      .reduce((total, variant) => total + variant.inventoryQuantity, 0);
  }

  isAvailable(): boolean {
    if (this.status !== ProductStatus.ACTIVE) return false;
    return this.variants.some(variant => variant.isAvailable());
  }

  getAvailabilityStatus(): ProductAvailability {
    if (this.status !== ProductStatus.ACTIVE) return ProductAvailability.DISCONTINUED;
    
    const availableVariants = this.variants.filter(v => v.isAvailable());
    if (availableVariants.length === 0) return ProductAvailability.OUT_OF_STOCK;
    
    const allVariantsAvailable = this.variants.every(v => v.isAvailable());
    return allVariantsAvailable ? ProductAvailability.IN_STOCK : ProductAvailability.OUT_OF_STOCK;
  }

  getFeaturedImage(): ProductImage | null {
    return this.images.find(img => img.position === 0) || this.images[0] || null;
  }

  // Domain events
  getUncommittedEvents(): DomainEvent[] {
    const productEvents = [...this._events];
    const variantEvents = Array.from(this._variants.values())
      .flatMap(variant => variant.getUncommittedEvents());
    
    return [...productEvents, ...variantEvents];
  }

  markEventsAsCommitted(): void {
    this._events = [];
    for (const variant of this._variants.values()) {
      variant.markEventsAsCommitted();
    }
  }

  // Serialization
  toJSON() {
    return {
      id: this.id.value,
      title: this.title,
      handle: this.handle,
      description: this.description,
      status: this.status,
      categoryIds: this.categoryIds.map(id => id.value),
      tags: this.tags,
      vendor: this.vendor,
      productType: this.productType,
      images: this.images.map(img => img.toJSON()),
      variants: this.variants.map(variant => variant.toJSON()),
      seo: this.seo?.toJSON(),
      metafields: this.metafields,
      priceRange: this.getPriceRange(),
      totalInventory: this.getTotalInventory(),
      availabilityStatus: this.getAvailabilityStatus(),
      featuredImage: this.getFeaturedImage()?.toJSON(),
      publishedAt: this.publishedAt?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}