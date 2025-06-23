/**
 * Product Domain - Product Category Entity
 * Represents product categorization with hierarchical structure
 */

import {
  ProductCategoryId,
  ValidationError,
  BusinessRuleViolationError,
  DomainEvent,
  BaseDomainEvent,
} from '../../../shared/domain';

// Category status enumeration
export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

// Category type enumeration
export enum CategoryType {
  STANDARD = 'standard',
  COLLECTION = 'collection',
  BRAND = 'brand',
  SEASONAL = 'seasonal',
}

// Category SEO value object
export class CategorySEO {
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

// Category domain events
export class CategoryCreatedEvent extends BaseDomainEvent {
  constructor(
    categoryId: string,
    payload: {
      name: string;
      handle: string;
      parentId?: string;
    }
  ) {
    super(categoryId, 'category.created', payload);
  }
}

export class CategoryUpdatedEvent extends BaseDomainEvent {
  constructor(
    categoryId: string,
    payload: {
      changes: Record<string, { old: unknown; new: unknown }>;
    }
  ) {
    super(categoryId, 'category.updated', payload);
  }
}

export class CategoryDeletedEvent extends BaseDomainEvent {
  constructor(categoryId: string) {
    super(categoryId, 'category.deleted');
  }
}

export class CategoryMoveEvent extends BaseDomainEvent {
  constructor(
    categoryId: string,
    payload: {
      oldParentId?: string;
      newParentId?: string;
      oldPosition: number;
      newPosition: number;
    }
  ) {
    super(categoryId, 'category.moved', payload);
  }
}

// Product Category entity
export class ProductCategory {
  private _events: DomainEvent[] = [];

  constructor(
    public readonly id: ProductCategoryId,
    public name: string,
    public handle: string,
    public description: string = '',
    public status: CategoryStatus = CategoryStatus.ACTIVE,
    public type: CategoryType = CategoryType.STANDARD,
    public parentId?: ProductCategoryId,
    public position: number = 0,
    public imageUrl?: string,
    public bannerUrl?: string,
    public seo?: CategorySEO,
    public metafields: Record<string, unknown> = {},
    public isVisible: boolean = true,
    public sortOrder: number = 0,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    this.validateCategory();
  }

  private validateCategory(): void {
    if (!this.name || this.name.trim() === '') {
      throw ValidationError.required('name');
    }
    if (!this.handle || this.handle.trim() === '') {
      throw ValidationError.required('handle');
    }
    if (!/^[a-z0-9-]+$/.test(this.handle)) {
      throw ValidationError.invalidFormat('handle', this.handle, 'lowercase letters, numbers, and hyphens only');
    }
    if (this.name.length > 255) {
      throw ValidationError.invalidField('name', this.name, 'Name must be 255 characters or less');
    }
    if (this.description.length > 1000) {
      throw ValidationError.invalidField('description', this.description, 'Description must be 1000 characters or less');
    }
    if (this.position < 0) {
      throw ValidationError.invalidField('position', this.position, 'Position cannot be negative');
    }
    if (this.sortOrder < 0) {
      throw ValidationError.invalidField('sortOrder', this.sortOrder, 'Sort order cannot be negative');
    }
  }

  // Factory method
  static create(
    name: string,
    handle: string,
    description: string = '',
    parentId?: ProductCategoryId
  ): ProductCategory {
    const id = ProductCategoryId.create(crypto.randomUUID());
    const category = new ProductCategory(
      id,
      name,
      handle,
      description,
      CategoryStatus.ACTIVE,
      CategoryType.STANDARD,
      parentId
    );

    // Emit creation event
    category._events.push(
      new CategoryCreatedEvent(id.value, {
        name,
        handle,
        parentId: parentId?.value,
      })
    );

    return category;
  }

  // Business methods
  updateBasicInfo(name: string, description: string): void {
    const oldName = this.name;
    const oldDescription = this.description;

    this.name = name;
    this.description = description;
    this.updatedAt = new Date();

    this.validateCategory();

    // Emit update event
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (oldName !== name) changes.name = { old: oldName, new: name };
    if (oldDescription !== description) changes.description = { old: oldDescription, new: description };

    if (Object.keys(changes).length > 0) {
      this._events.push(
        new CategoryUpdatedEvent(this.id.value, { changes })
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
      new CategoryUpdatedEvent(this.id.value, {
        changes: { handle: { old: oldHandle, new: handle } }
      })
    );
  }

  activate(): void {
    if (this.status === CategoryStatus.ACTIVE) {
      throw BusinessRuleViolationError.create(
        'already_active',
        'Category is already active'
      );
    }

    const oldStatus = this.status;
    this.status = CategoryStatus.ACTIVE;
    this.updatedAt = new Date();

    this._events.push(
      new CategoryUpdatedEvent(this.id.value, {
        changes: { status: { old: oldStatus, new: CategoryStatus.ACTIVE } }
      })
    );
  }

  deactivate(): void {
    if (this.status === CategoryStatus.INACTIVE) {
      throw BusinessRuleViolationError.create(
        'already_inactive',
        'Category is already inactive'
      );
    }

    const oldStatus = this.status;
    this.status = CategoryStatus.INACTIVE;
    this.updatedAt = new Date();

    this._events.push(
      new CategoryUpdatedEvent(this.id.value, {
        changes: { status: { old: oldStatus, new: CategoryStatus.INACTIVE } }
      })
    );
  }

  archive(): void {
    if (this.status === CategoryStatus.ARCHIVED) {
      throw BusinessRuleViolationError.create(
        'already_archived',
        'Category is already archived'
      );
    }

    const oldStatus = this.status;
    this.status = CategoryStatus.ARCHIVED;
    this.updatedAt = new Date();

    this._events.push(
      new CategoryUpdatedEvent(this.id.value, {
        changes: { status: { old: oldStatus, new: CategoryStatus.ARCHIVED } }
      })
    );
  }

  moveTo(newParentId: ProductCategoryId | null, newPosition: number): void {
    if (newPosition < 0) {
      throw ValidationError.invalidField('position', newPosition, 'Position cannot be negative');
    }

    // Prevent moving to self or descendant
    if (newParentId?.equals(this.id)) {
      throw BusinessRuleViolationError.create(
        'invalid_parent',
        'Cannot move category to itself'
      );
    }

    const oldParentId = this.parentId;
    const oldPosition = this.position;

    this.parentId = newParentId || undefined;
    this.position = newPosition;
    this.updatedAt = new Date();

    this._events.push(
      new CategoryMoveEvent(this.id.value, {
        oldParentId: oldParentId?.value,
        newParentId: newParentId?.value,
        oldPosition,
        newPosition,
      })
    );
  }

  updatePosition(position: number): void {
    if (position < 0) {
      throw ValidationError.invalidField('position', position, 'Position cannot be negative');
    }

    const oldPosition = this.position;
    this.position = position;
    this.updatedAt = new Date();

    this._events.push(
      new CategoryUpdatedEvent(this.id.value, {
        changes: { position: { old: oldPosition, new: position } }
      })
    );
  }

  updateVisibility(isVisible: boolean): void {
    const oldVisibility = this.isVisible;
    this.isVisible = isVisible;
    this.updatedAt = new Date();

    this._events.push(
      new CategoryUpdatedEvent(this.id.value, {
        changes: { isVisible: { old: oldVisibility, new: isVisible } }
      })
    );
  }

  updateImage(imageUrl: string | null): void {
    const oldImageUrl = this.imageUrl;
    this.imageUrl = imageUrl || undefined;
    this.updatedAt = new Date();

    this._events.push(
      new CategoryUpdatedEvent(this.id.value, {
        changes: { imageUrl: { old: oldImageUrl, new: imageUrl } }
      })
    );
  }

  updateBanner(bannerUrl: string | null): void {
    const oldBannerUrl = this.bannerUrl;
    this.bannerUrl = bannerUrl || undefined;
    this.updatedAt = new Date();

    this._events.push(
      new CategoryUpdatedEvent(this.id.value, {
        changes: { bannerUrl: { old: oldBannerUrl, new: bannerUrl } }
      })
    );
  }

  updateSEO(seo: CategorySEO): void {
    this.seo = seo;
    this.updatedAt = new Date();

    this._events.push(
      new CategoryUpdatedEvent(this.id.value, {
        changes: { seo: { old: this.seo, new: seo } }
      })
    );
  }

  updateMetafield(key: string, value: unknown): void {
    this.metafields[key] = value;
    this.updatedAt = new Date();
  }

  removeMetafield(key: string): void {
    delete this.metafields[key];
    this.updatedAt = new Date();
  }

  // Queries
  isRoot(): boolean {
    return this.parentId === undefined;
  }

  isChild(): boolean {
    return this.parentId !== undefined;
  }

  isActive(): boolean {
    return this.status === CategoryStatus.ACTIVE && this.isVisible;
  }

  getFullPath(categories: ProductCategory[]): string {
    const path: string[] = [];
    let current: ProductCategory | undefined = this;

    while (current) {
      path.unshift(current.handle);
      current = current.parentId
        ? categories.find(c => c.id.equals(current!.parentId!))
        : undefined;
    }

    return path.join('/');
  }

  getAncestors(categories: ProductCategory[]): ProductCategory[] {
    const ancestors: ProductCategory[] = [];
    let current = this.parentId
      ? categories.find(c => c.id.equals(this.parentId!))
      : undefined;

    while (current) {
      ancestors.unshift(current);
      current = current.parentId
        ? categories.find(c => c.id.equals(current!.parentId!))
        : undefined;
    }

    return ancestors;
  }

  getChildren(categories: ProductCategory[]): ProductCategory[] {
    return categories
      .filter(c => c.parentId?.equals(this.id))
      .sort((a, b) => a.position - b.position);
  }

  getDescendants(categories: ProductCategory[]): ProductCategory[] {
    const descendants: ProductCategory[] = [];
    const children = this.getChildren(categories);

    for (const child of children) {
      descendants.push(child);
      descendants.push(...child.getDescendants(categories));
    }

    return descendants;
  }

  getDepth(categories: ProductCategory[]): number {
    return this.getAncestors(categories).length;
  }

  canMoveTo(newParentId: ProductCategoryId | null, categories: ProductCategory[]): boolean {
    if (!newParentId) return true; // Can always move to root

    // Cannot move to self
    if (newParentId.equals(this.id)) return false;

    // Cannot move to descendant
    const descendants = this.getDescendants(categories);
    return !descendants.some(d => d.id.equals(newParentId));
  }

  // Domain events
  getUncommittedEvents(): DomainEvent[] {
    return [...this._events];
  }

  markEventsAsCommitted(): void {
    this._events = [];
  }

  // Serialization
  toJSON() {
    return {
      id: this.id.value,
      name: this.name,
      handle: this.handle,
      description: this.description,
      status: this.status,
      type: this.type,
      parentId: this.parentId?.value,
      position: this.position,
      imageUrl: this.imageUrl,
      bannerUrl: this.bannerUrl,
      seo: this.seo?.toJSON(),
      metafields: this.metafields,
      isVisible: this.isVisible,
      sortOrder: this.sortOrder,
      isRoot: this.isRoot(),
      isActive: this.isActive(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

// Category tree utility for hierarchical operations
export class CategoryTree {
  private categories: Map<string, ProductCategory> = new Map();

  constructor(categories: ProductCategory[] = []) {
    for (const category of categories) {
      this.categories.set(category.id.value, category);
    }
  }

  addCategory(category: ProductCategory): void {
    this.categories.set(category.id.value, category);
  }

  removeCategory(categoryId: ProductCategoryId): void {
    this.categories.delete(categoryId.value);
  }

  getCategory(categoryId: ProductCategoryId): ProductCategory | null {
    return this.categories.get(categoryId.value) || null;
  }

  getAllCategories(): ProductCategory[] {
    return Array.from(this.categories.values());
  }

  getRootCategories(): ProductCategory[] {
    return Array.from(this.categories.values())
      .filter(c => c.isRoot())
      .sort((a, b) => a.position - b.position);
  }

  getChildren(parentId: ProductCategoryId): ProductCategory[] {
    return Array.from(this.categories.values())
      .filter(c => c.parentId?.equals(parentId))
      .sort((a, b) => a.position - b.position);
  }

  getActiveCategories(): ProductCategory[] {
    return Array.from(this.categories.values())
      .filter(c => c.isActive())
      .sort((a, b) => a.position - b.position);
  }

  buildHierarchy(): CategoryNode[] {
    const nodes = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // Create nodes
    for (const category of this.categories.values()) {
      nodes.set(category.id.value, {
        category,
        children: [],
        parent: null,
      });
    }

    // Build hierarchy
    for (const node of nodes.values()) {
      if (node.category.parentId) {
        const parent = nodes.get(node.category.parentId.value);
        if (parent) {
          parent.children.push(node);
          node.parent = parent;
        } else {
          roots.push(node); // Orphaned category
        }
      } else {
        roots.push(node);
      }
    }

    // Sort children
    for (const node of nodes.values()) {
      node.children.sort((a, b) => a.category.position - b.category.position);
    }

    return roots.sort((a, b) => a.category.position - b.category.position);
  }

  validateHierarchy(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const visitedIds = new Set<string>();

    for (const category of this.categories.values()) {
      // Check for circular references
      if (this.hasCircularReference(category.id, visitedIds)) {
        errors.push(`Circular reference detected for category ${category.id.value}`);
      }

      // Check if parent exists
      if (category.parentId && !this.categories.has(category.parentId.value)) {
        errors.push(`Parent category ${category.parentId.value} not found for category ${category.id.value}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private hasCircularReference(categoryId: ProductCategoryId, visited: Set<string>): boolean {
    if (visited.has(categoryId.value)) return true;

    const category = this.categories.get(categoryId.value);
    if (!category || !category.parentId) return false;

    visited.add(categoryId.value);
    const hasCircular = this.hasCircularReference(category.parentId, visited);
    visited.delete(categoryId.value);

    return hasCircular;
  }
}

// Category node for tree representation
export interface CategoryNode {
  category: ProductCategory;
  children: CategoryNode[];
  parent: CategoryNode | null;
}

// Category specification for queries
export class CategorySpecification {
  static isActive() {
    return (category: ProductCategory) => category.isActive();
  }

  static isRoot() {
    return (category: ProductCategory) => category.isRoot();
  }

  static hasParent(parentId: ProductCategoryId) {
    return (category: ProductCategory) => category.parentId?.equals(parentId) ?? false;
  }

  static byType(type: CategoryType) {
    return (category: ProductCategory) => category.type === type;
  }

  static byStatus(status: CategoryStatus) {
    return (category: ProductCategory) => category.status === status;
  }

  static isVisible() {
    return (category: ProductCategory) => category.isVisible;
  }
}