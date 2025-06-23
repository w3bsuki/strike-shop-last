/**
 * Infrastructure Layer - Local Cart Repository Implementation
 * Concrete implementation of Cart Repository using local storage and in-memory cache
 */

import {
  CartId,
  UserId,
  InMemoryRepository,
  Specification,
  PaginatedResult,
} from '../../shared/domain';
import {
  Cart,
  CartStatus,
  ICartRepository,
  CartStatistics,
  CartSpecifications,
} from '../../domains/cart';

/**
 * Local Cart Repository Implementation
 * Uses browser localStorage for persistence and in-memory cache for performance
 */
export class LocalCartRepository extends InMemoryRepository<Cart, CartId> implements ICartRepository {
  private readonly storageKey = 'strike-shop-carts';
  private readonly maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  constructor() {
    super();
    this.loadFromStorage();
  }

  async findByUserId(userId: UserId): Promise<Cart | null> {
    const spec = CartSpecifications.byUser(userId);
    return this.findOne(spec);
  }

  async findBySessionId(sessionId: string): Promise<Cart | null> {
    const spec = CartSpecifications.bySession(sessionId);
    return this.findOne(spec);
  }

  async findActiveByUserId(userId: UserId): Promise<Cart | null> {
    const spec = CartSpecifications.activeForUser(userId);
    return this.findOne(spec);
  }

  async findActiveBySessionId(sessionId: string): Promise<Cart | null> {
    const spec = CartSpecifications.activeForSession(sessionId);
    return this.findOne(spec);
  }

  async findByStatus(status: CartStatus): Promise<Cart[]> {
    const spec = CartSpecifications.byStatus(status);
    return this.find(spec);
  }

  async findAbandoned(olderThan?: Date): Promise<Cart[]> {
    const spec = CartSpecifications.isAbandoned(olderThan);
    return this.find(spec);
  }

  async findExpired(): Promise<Cart[]> {
    const spec = CartSpecifications.isExpired();
    return this.find(spec);
  }

  async findInactive(inactiveSince: Date): Promise<Cart[]> {
    return this.find({
      isSatisfiedBy: (cart: Cart) => 
        cart.status === CartStatus.ACTIVE && cart.lastActivityAt < inactiveSince,
      toQuery: () => ({
        where: {
          status: CartStatus.ACTIVE,
          lastActivityAt: { lt: inactiveSince }
        }
      }),
    });
  }

  async cleanupExpired(): Promise<number> {
    const expiredCarts = await this.findExpired();
    const expiredIds = expiredCarts.map(cart => cart.id);
    
    await this.deleteMany(expiredIds);
    this.saveToStorage();
    
    return expiredIds.length;
  }

  async getStatistics(): Promise<CartStatistics> {
    const allCarts = await this.findAll();
    
    const totalCarts = allCarts.length;
    const activeCarts = allCarts.filter(cart => cart.status === CartStatus.ACTIVE).length;
    const abandonedCarts = allCarts.filter(cart => cart.status === CartStatus.ABANDONED).length;
    const expiredCarts = allCarts.filter(cart => cart.isExpired()).length;
    const completedCarts = allCarts.filter(cart => cart.status === CartStatus.COMPLETED).length;

    const cartValues = allCarts
      .filter(cart => cart.status === CartStatus.COMPLETED)
      .map(cart => cart.getTotal().amount);
    
    const averageCartValue = cartValues.length > 0 
      ? cartValues.reduce((sum, value) => sum + value, 0) / cartValues.length 
      : 0;

    const totalItems = allCarts.reduce((sum, cart) => sum + cart.getTotalItems(), 0);
    const averageItemsPerCart = totalCarts > 0 ? totalItems / totalCarts : 0;

    const conversionRate = totalCarts > 0 ? (completedCarts / totalCarts) * 100 : 0;

    return {
      totalCarts,
      activeCarts,
      abandonedCarts,
      expiredCarts,
      completedCarts,
      averageItemsPerCart,
      averageCartValue,
      conversionRate,
    };
  }

  async findByUserIdPaginated(
    userId: UserId,
    page: number,
    limit: number
  ): Promise<PaginatedResult<Cart>> {
    const spec = CartSpecifications.byUser(userId);
    return this.findPaginated(spec, page, limit);
  }

  // Override save to persist to storage
  async save(cart: Cart): Promise<Cart> {
    const savedCart = await super.save(cart);
    this.saveToStorage();
    return savedCart;
  }

  // Override saveMany to persist to storage
  async saveMany(carts: Cart[]): Promise<Cart[]> {
    const savedCarts = await super.saveMany(carts);
    this.saveToStorage();
    return savedCarts;
  }

  // Override delete to persist to storage
  async delete(id: CartId): Promise<void> {
    await super.delete(id);
    this.saveToStorage();
  }

  // Override deleteMany to persist to storage
  async deleteMany(ids: CartId[]): Promise<void> {
    await super.deleteMany(ids);
    this.saveToStorage();
  }

  // Storage persistence methods
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return; // Server-side rendering

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      const now = Date.now();

      // Filter out expired data and reconstruct carts
      const validCarts = data
        .filter((item: any) => now - item.timestamp < this.maxAge)
        .map((item: any) => this.deserializeCart(item.cart));

      // Populate in-memory store
      for (const cart of validCarts) {
        this.entities.set(cart.id.value, cart);
      }
    } catch (error) {
      console.error('Error loading carts from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return; // Server-side rendering

    try {
      const carts = Array.from(this.entities.values());
      const data = carts.map(cart => ({
        cart: this.serializeCart(cart),
        timestamp: Date.now(),
      }));

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving carts to storage:', error);
    }
  }

  private serializeCart(cart: Cart): any {
    return cart.toJSON();
  }

  private deserializeCart(data: any): Cart {
    // Reconstruct cart from JSON data
    // This is a simplified version - in a real implementation,
    // you'd need to properly reconstruct all value objects
    
    const cartId = CartId.create(data.id);
    const currency = { code: data.currency } as any; // Simplified
    
    // For now, return a minimal cart
    // In a real implementation, you'd reconstruct all items, discounts, etc.
    return new Cart(
      cartId,
      currency,
      data.status as CartStatus,
      data.userId ? { value: data.userId } as UserId : undefined,
      data.sessionId,
      undefined, // shipping info
      data.notes,
      [], // items - would need proper reconstruction
      [], // discounts - would need proper reconstruction
      new Date(data.createdAt),
      new Date(data.updatedAt),
      new Date(data.lastActivityAt),
      data.expiresAt ? new Date(data.expiresAt) : undefined
    );
  }

  // Cleanup method to be called periodically
  async cleanup(): Promise<{ removed: number }> {
    const now = Date.now();
    let removed = 0;

    // Remove expired carts from memory
    for (const [id, cart] of this.entities.entries()) {
      if (cart.isExpired()) {
        this.entities.delete(id);
        removed++;
      }
    }

    // Clean up storage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          const validData = data.filter((item: any) => 
            now - item.timestamp < this.maxAge
          );
          
          if (validData.length !== data.length) {
            localStorage.setItem(this.storageKey, JSON.stringify(validData));
            removed += data.length - validData.length;
          }
        }
      } catch (error) {
        console.error('Error cleaning up storage:', error);
      }
    }

    return { removed };
  }

  // Clear all data (useful for testing or user logout)
  async clearAll(): Promise<void> {
    this.entities.clear();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  // Get storage usage info
  getStorageInfo(): { itemCount: number; storageSize: number } {
    let storageSize = 0;
    
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey);
        storageSize = stored ? new Blob([stored]).size : 0;
      } catch (error) {
        console.error('Error getting storage info:', error);
      }
    }

    return {
      itemCount: this.entities.size,
      storageSize,
    };
  }
}

/**
 * Cart Repository Factory
 * Creates appropriate cart repository based on environment
 */
export class CartRepositoryFactory {
  static create(): ICartRepository {
    // In a real application, you might choose different implementations
    // based on environment, configuration, or feature flags
    
    if (typeof window !== 'undefined') {
      // Browser environment - use local storage
      return new LocalCartRepository();
    } else {
      // Server environment - use in-memory (for SSR)
      return new InMemoryCartRepository();
    }
  }
}

/**
 * In-memory Cart Repository (for server-side or testing)
 */
class InMemoryCartRepository extends InMemoryRepository<Cart, CartId> implements ICartRepository {
  async findByUserId(userId: UserId): Promise<Cart | null> {
    const spec = CartSpecifications.byUser(userId);
    return this.findOne(spec);
  }

  async findBySessionId(sessionId: string): Promise<Cart | null> {
    const spec = CartSpecifications.bySession(sessionId);
    return this.findOne(spec);
  }

  async findActiveByUserId(userId: UserId): Promise<Cart | null> {
    const spec = CartSpecifications.activeForUser(userId);
    return this.findOne(spec);
  }

  async findActiveBySessionId(sessionId: string): Promise<Cart | null> {
    const spec = CartSpecifications.activeForSession(sessionId);
    return this.findOne(spec);
  }

  async findByStatus(status: CartStatus): Promise<Cart[]> {
    const spec = CartSpecifications.byStatus(status);
    return this.find(spec);
  }

  async findAbandoned(olderThan?: Date): Promise<Cart[]> {
    const spec = CartSpecifications.isAbandoned(olderThan);
    return this.find(spec);
  }

  async findExpired(): Promise<Cart[]> {
    const spec = CartSpecifications.isExpired();
    return this.find(spec);
  }

  async findInactive(inactiveSince: Date): Promise<Cart[]> {
    return this.find({
      isSatisfiedBy: (cart: Cart) => 
        cart.status === CartStatus.ACTIVE && cart.lastActivityAt < inactiveSince,
      toQuery: () => ({
        where: {
          status: CartStatus.ACTIVE,
          lastActivityAt: { lt: inactiveSince }
        }
      }),
    });
  }

  async cleanupExpired(): Promise<number> {
    const expiredCarts = await this.findExpired();
    const expiredIds = expiredCarts.map(cart => cart.id);
    await this.deleteMany(expiredIds);
    return expiredIds.length;
  }

  async getStatistics(): Promise<CartStatistics> {
    const allCarts = await this.findAll();
    
    return {
      totalCarts: allCarts.length,
      activeCarts: allCarts.filter(cart => cart.status === CartStatus.ACTIVE).length,
      abandonedCarts: allCarts.filter(cart => cart.status === CartStatus.ABANDONED).length,
      expiredCarts: allCarts.filter(cart => cart.isExpired()).length,
      completedCarts: allCarts.filter(cart => cart.status === CartStatus.COMPLETED).length,
      averageItemsPerCart: 0, // Simplified
      averageCartValue: 0, // Simplified
      conversionRate: 0, // Simplified
    };
  }

  async findByUserIdPaginated(
    userId: UserId,
    page: number,
    limit: number
  ): Promise<PaginatedResult<Cart>> {
    const spec = CartSpecifications.byUser(userId);
    return this.findPaginated(spec, page, limit);
  }
}