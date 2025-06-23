/**
 * Infrastructure Layer - Dependency Injection Container
 * Implements IoC container for managing dependencies
 */

import { MedusaProductRepository, MedusaProductCategoryRepository } from '../repositories/medusa-product-repository';
import { LocalCartRepository, CartRepositoryFactory } from '../repositories/local-cart-repository';
import {
  IProductRepository,
  IProductCategoryRepository,
  IProductService,
  ProductService,
  ProductSearchService,
} from '../../domains/product';
import {
  ICartRepository,
  ICartService,
  CartService,
  CartManagementService,
  CartSynchronizationService,
} from '../../domains/cart';

/**
 * Service container for dependency injection
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();

  private constructor() {
    this.registerFactories();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Register service factories
   */
  private registerFactories(): void {
    // Repository factories
    this.factories.set('IProductRepository', () => new MedusaProductRepository());
    this.factories.set('IProductCategoryRepository', () => new MedusaProductCategoryRepository());
    this.factories.set('ICartRepository', () => CartRepositoryFactory.create());

    // Service factories
    this.factories.set('IProductService', () => {
      const productRepo = this.get<IProductRepository>('IProductRepository');
      const categoryRepo = this.get<IProductCategoryRepository>('IProductCategoryRepository');
      return new ProductService(productRepo, categoryRepo);
    });

    this.factories.set('ProductSearchService', () => {
      const productRepo = this.get<IProductRepository>('IProductRepository');
      return new ProductSearchService(productRepo);
    });

    this.factories.set('ICartService', () => {
      const cartRepo = this.get<ICartRepository>('ICartRepository');
      return new CartService(cartRepo);
    });

    this.factories.set('CartManagementService', () => {
      const cartRepo = this.get<ICartRepository>('ICartRepository');
      const cartService = this.get<ICartService>('ICartService');
      return new CartManagementService(cartRepo, cartService);
    });

    this.factories.set('CartSynchronizationService', () => {
      const cartRepo = this.get<ICartRepository>('ICartRepository');
      return new CartSynchronizationService(cartRepo);
    });
  }

  /**
   * Get service instance
   */
  get<T>(serviceName: string): T {
    // Check if already instantiated
    if (this.services.has(serviceName)) {
      return this.services.get(serviceName) as T;
    }

    // Check if factory exists
    const factory = this.factories.get(serviceName);
    if (!factory) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    // Create and cache instance
    const instance = factory();
    this.services.set(serviceName, instance);
    return instance as T;
  }

  /**
   * Register a service instance
   */
  register<T>(serviceName: string, instance: T): void {
    this.services.set(serviceName, instance);
  }

  /**
   * Register a service factory
   */
  registerFactory<T>(serviceName: string, factory: () => T): void {
    this.factories.set(serviceName, factory);
  }

  /**
   * Check if service is registered
   */
  has(serviceName: string): boolean {
    return this.services.has(serviceName) || this.factories.has(serviceName);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.registerFactories(); // Re-register default factories
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    const serviceNames = new Set([
      ...this.services.keys(),
      ...this.factories.keys(),
    ]);
    return Array.from(serviceNames);
  }
}

/**
 * Convenience functions for dependency injection
 */

// Global container instance
const container = ServiceContainer.getInstance();

/**
 * Get service from container
 */
export function getService<T>(serviceName: string): T {
  return container.get<T>(serviceName);
}

/**
 * Register service instance
 */
export function registerService<T>(serviceName: string, instance: T): void {
  container.register(serviceName, instance);
}

/**
 * Register service factory
 */
export function registerFactory<T>(serviceName: string, factory: () => T): void {
  container.registerFactory(serviceName, factory);
}

/**
 * Service locator pattern for easy access to common services
 */
export class ServiceLocator {
  // Product domain services
  static get productRepository(): IProductRepository {
    return getService<IProductRepository>('IProductRepository');
  }

  static get productCategoryRepository(): IProductCategoryRepository {
    return getService<IProductCategoryRepository>('IProductCategoryRepository');
  }

  static get productService(): IProductService {
    return getService<IProductService>('IProductService');
  }

  static get productSearchService(): ProductSearchService {
    return getService<ProductSearchService>('ProductSearchService');
  }

  // Cart domain services
  static get cartRepository(): ICartRepository {
    return getService<ICartRepository>('ICartRepository');
  }

  static get cartService(): ICartService {
    return getService<ICartService>('ICartService');
  }

  static get cartManagementService(): CartManagementService {
    return getService<CartManagementService>('CartManagementService');
  }

  static get cartSynchronizationService(): CartSynchronizationService {
    return getService<CartSynchronizationService>('CartSynchronizationService');
  }
}

/**
 * Dependency injection decorators
 */

/**
 * Injectable decorator for classes
 */
export function Injectable(serviceName?: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    const name = serviceName || constructor.name;
    
    // Register factory for the class
    registerFactory(name, () => {
      // Resolve constructor dependencies here if needed
      return new constructor();
    });

    return constructor;
  };
}

/**
 * Inject decorator for constructor parameters
 */
export function Inject(serviceName: string) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // Store metadata about injection requirements
    const existingTokens = Reflect.getMetadata('inject:tokens', target) || [];
    existingTokens[parameterIndex] = serviceName;
    Reflect.defineMetadata('inject:tokens', existingTokens, target);
  };
}

/**
 * Service configuration interface
 */
export interface ServiceConfiguration {
  productRepository: {
    type: 'medusa' | 'local' | 'mock';
    config?: any;
  };
  cartRepository: {
    type: 'local' | 'redis' | 'database' | 'mock';
    config?: any;
  };
  caching: {
    enabled: boolean;
    ttl: number;
  };
  events: {
    enabled: boolean;
    async: boolean;
  };
}

/**
 * Service configurator for different environments
 */
export class ServiceConfigurator {
  static configure(config: ServiceConfiguration): void {
    const container = ServiceContainer.getInstance();

    // Configure product repository
    switch (config.productRepository.type) {
      case 'medusa':
        container.registerFactory('IProductRepository', () => new MedusaProductRepository());
        break;
      case 'local':
        // Local implementation
        break;
      case 'mock':
        // Mock implementation for testing
        break;
    }

    // Configure cart repository
    switch (config.cartRepository.type) {
      case 'local':
        container.registerFactory('ICartRepository', () => new LocalCartRepository());
        break;
      case 'redis':
        // Redis implementation
        break;
      case 'database':
        // Database implementation
        break;
      case 'mock':
        // Mock implementation for testing
        break;
    }

    // Configure other services based on config
    // ... additional configuration
  }

  static development(): ServiceConfiguration {
    return {
      productRepository: { type: 'medusa' },
      cartRepository: { type: 'local' },
      caching: { enabled: true, ttl: 300 },
      events: { enabled: true, async: true },
    };
  }

  static production(): ServiceConfiguration {
    return {
      productRepository: { type: 'medusa' },
      cartRepository: { type: 'local' }, // In production, this might be Redis or database
      caching: { enabled: true, ttl: 600 },
      events: { enabled: true, async: true },
    };
  }

  static testing(): ServiceConfiguration {
    return {
      productRepository: { type: 'mock' },
      cartRepository: { type: 'mock' },
      caching: { enabled: false, ttl: 0 },
      events: { enabled: false, async: false },
    };
  }
}

/**
 * Service health check
 */
export class ServiceHealthCheck {
  static async checkServices(): Promise<{ [serviceName: string]: boolean }> {
    const container = ServiceContainer.getInstance();
    const serviceNames = container.getServiceNames();
    const results: { [serviceName: string]: boolean } = {};

    for (const serviceName of serviceNames) {
      try {
        const service = container.get(serviceName);
        // Perform basic health check
        results[serviceName] = service !== null && service !== undefined;
      } catch (error) {
        results[serviceName] = false;
        console.error(`Health check failed for ${serviceName}:`, error);
      }
    }

    return results;
  }

  static async checkRepository(repositoryName: string): Promise<boolean> {
    try {
      const repository = getService(repositoryName);
      
      // For repositories that have a count method, use it as health check
      if (repository && typeof (repository as any).count === 'function') {
        await (repository as any).count();
        return true;
      }
      
      return repository !== null && repository !== undefined;
    } catch (error) {
      console.error(`Repository health check failed for ${repositoryName}:`, error);
      return false;
    }
  }
}

/**
 * Initialize services with configuration
 */
export function initializeServices(environment: 'development' | 'production' | 'testing' = 'development'): void {
  let config: ServiceConfiguration;

  switch (environment) {
    case 'production':
      config = ServiceConfigurator.production();
      break;
    case 'testing':
      config = ServiceConfigurator.testing();
      break;
    default:
      config = ServiceConfigurator.development();
      break;
  }

  ServiceConfigurator.configure(config);
}

// Auto-initialize with environment detection
if (typeof window !== 'undefined') {
  // Browser environment
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  initializeServices(isDevelopment ? 'development' : 'production');
} else {
  // Server environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  initializeServices(nodeEnv as any);
}