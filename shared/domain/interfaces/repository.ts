/**
 * Repository Interfaces
 * Defines contracts for data access following Repository pattern
 */

import type { DomainEvent } from '../events/domain-event';

/**
 * Base repository interface with common CRUD operations
 */
export interface Repository<TEntity, TId> {
  /**
   * Find entity by ID
   */
  findById(id: TId): Promise<TEntity | null>;

  /**
   * Find multiple entities by IDs
   */
  findByIds(ids: TId[]): Promise<TEntity[]>;

  /**
   * Save entity (create or update)
   */
  save(entity: TEntity): Promise<TEntity>;

  /**
   * Save multiple entities
   */
  saveMany(entities: TEntity[]): Promise<TEntity[]>;

  /**
   * Delete entity by ID
   */
  delete(id: TId): Promise<void>;

  /**
   * Delete multiple entities by IDs
   */
  deleteMany(ids: TId[]): Promise<void>;

  /**
   * Check if entity exists
   */
  exists(id: TId): Promise<boolean>;

  /**
   * Count total entities
   */
  count(): Promise<number>;
}

/**
 * Query specification interface for complex queries
 */
export interface Specification<T> {
  isSatisfiedBy(entity: T): boolean;
  toQuery(): QueryFilter<T>;
}

/**
 * Query filter interface
 */
export interface QueryFilter<T> {
  where?: Partial<T>;
  orderBy?: Array<{
    field: keyof T;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
  include?: string[];
}

/**
 * Paginated result interface
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Advanced repository interface with query capabilities
 */
export interface AdvancedRepository<TEntity, TId> extends Repository<TEntity, TId> {
  /**
   * Find entities matching specification
   */
  find(spec: Specification<TEntity>): Promise<TEntity[]>;

  /**
   * Find first entity matching specification
   */
  findOne(spec: Specification<TEntity>): Promise<TEntity | null>;

  /**
   * Find entities with pagination
   */
  findPaginated(
    spec?: Specification<TEntity>,
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<TEntity>>;

  /**
   * Find all entities
   */
  findAll(): Promise<TEntity[]>;

  /**
   * Count entities matching specification
   */
  countBy(spec: Specification<TEntity>): Promise<number>;

  /**
   * Check if any entity matches specification
   */
  existsBy(spec: Specification<TEntity>): Promise<boolean>;
}

/**
 * Event-sourced repository interface
 */
export interface EventSourcedRepository<TEntity, TId> extends Repository<TEntity, TId> {
  /**
   * Get all events for an aggregate
   */
  getEvents(aggregateId: TId): Promise<DomainEvent[]>;

  /**
   * Append events to the event store
   */
  appendEvents(aggregateId: TId, events: DomainEvent[]): Promise<void>;

  /**
   * Rebuild entity from events
   */
  rebuildFromEvents(aggregateId: TId): Promise<TEntity | null>;

  /**
   * Get entity version
   */
  getVersion(aggregateId: TId): Promise<number>;
}

/**
 * Cached repository interface
 */
export interface CachedRepository<TEntity, TId> extends Repository<TEntity, TId> {
  /**
   * Clear cache for specific entity
   */
  clearCache(id: TId): Promise<void>;

  /**
   * Clear all cache
   */
  clearAllCache(): Promise<void>;

  /**
   * Warm up cache
   */
  warmUpCache(ids: TId[]): Promise<void>;

  /**
   * Get cache statistics
   */
  getCacheStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  }>;
}

/**
 * Unit of Work interface for transaction management
 */
export interface UnitOfWork {
  /**
   * Begin transaction
   */
  begin(): Promise<void>;

  /**
   * Commit transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback transaction
   */
  rollback(): Promise<void>;

  /**
   * Execute operation within transaction
   */
  execute<T>(operation: () => Promise<T>): Promise<T>;

  /**
   * Check if transaction is active
   */
  isActive(): boolean;
}

/**
 * Repository factory interface
 */
export interface RepositoryFactory {
  /**
   * Create repository instance
   */
  create<TEntity, TId>(
    entityType: new (...args: any[]) => TEntity
  ): Repository<TEntity, TId>;

  /**
   * Get existing repository instance
   */
  get<TEntity, TId>(
    entityType: new (...args: any[]) => TEntity
  ): Repository<TEntity, TId>;

  /**
   * Register repository implementation
   */
  register<TEntity, TId>(
    entityType: new (...args: any[]) => TEntity,
    repository: Repository<TEntity, TId>
  ): void;
}

/**
 * Abstract base repository with common implementations
 */
export abstract class BaseRepository<TEntity, TId> implements Repository<TEntity, TId> {
  abstract findById(id: TId): Promise<TEntity | null>;
  abstract findByIds(ids: TId[]): Promise<TEntity[]>;
  abstract save(entity: TEntity): Promise<TEntity>;
  abstract delete(id: TId): Promise<void>;

  async saveMany(entities: TEntity[]): Promise<TEntity[]> {
    return Promise.all(entities.map(entity => this.save(entity)));
  }

  async deleteMany(ids: TId[]): Promise<void> {
    await Promise.all(ids.map(id => this.delete(id)));
  }

  async exists(id: TId): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }

  abstract count(): Promise<number>;
}

/**
 * In-memory repository implementation for testing
 */
export class InMemoryRepository<TEntity extends { id: TId }, TId>
  extends BaseRepository<TEntity, TId>
  implements AdvancedRepository<TEntity, TId>
{
  protected entities = new Map<TId, TEntity>();

  async findById(id: TId): Promise<TEntity | null> {
    return this.entities.get(id) ?? null;
  }

  async findByIds(ids: TId[]): Promise<TEntity[]> {
    return ids
      .map(id => this.entities.get(id))
      .filter((entity): entity is TEntity => entity !== undefined);
  }

  async save(entity: TEntity): Promise<TEntity> {
    this.entities.set(entity.id, entity);
    return entity;
  }

  async delete(id: TId): Promise<void> {
    this.entities.delete(id);
  }

  async count(): Promise<number> {
    return this.entities.size;
  }

  async find(spec: Specification<TEntity>): Promise<TEntity[]> {
    return Array.from(this.entities.values()).filter(entity =>
      spec.isSatisfiedBy(entity)
    );
  }

  async findOne(spec: Specification<TEntity>): Promise<TEntity | null> {
    const entities = await this.find(spec);
    return entities[0] ?? null;
  }

  async findPaginated(
    spec?: Specification<TEntity>,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<TEntity>> {
    let entities = Array.from(this.entities.values());

    if (spec) {
      entities = entities.filter(entity => spec.isSatisfiedBy(entity));
    }

    const total = entities.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const items = entities.slice(offset, offset + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  async findAll(): Promise<TEntity[]> {
    return Array.from(this.entities.values());
  }

  async countBy(spec: Specification<TEntity>): Promise<number> {
    const entities = await this.find(spec);
    return entities.length;
  }

  async existsBy(spec: Specification<TEntity>): Promise<boolean> {
    const entity = await this.findOne(spec);
    return entity !== null;
  }

  clear(): void {
    this.entities.clear();
  }
}

/**
 * Specification builder for fluent query building
 */
export class SpecificationBuilder<T> {
  private filters: Array<(entity: T) => boolean> = [];

  where(predicate: (entity: T) => boolean): this {
    this.filters.push(predicate);
    return this;
  }

  and(predicate: (entity: T) => boolean): this {
    this.filters.push(predicate);
    return this;
  }

  build(): Specification<T> {
    const filters = [...this.filters];
    
    return {
      isSatisfiedBy: (entity: T) => filters.every(filter => filter(entity)),
      toQuery: () => ({
        // Implementation depends on the specific query system
        where: {} as Partial<T>,
      }),
    };
  }

  static create<T>(): SpecificationBuilder<T> {
    return new SpecificationBuilder<T>();
  }
}