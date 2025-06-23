/**
 * Refactored Products API Route
 * Clean Architecture Implementation - API Layer
 * 
 * This route demonstrates proper separation of concerns:
 * - API layer handles HTTP concerns only
 * - Business logic delegated to domain services
 * - Data access abstracted through repositories
 * - Error handling centralized and typed
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Clean Architecture Imports
import { ServiceLocator } from '@/infrastructure';
import type { Result} from '@/shared/domain';
import { ProductCategoryId, ResultUtils } from '@/shared/domain';
import { ProductQueryBuilder } from '@/domains/product/repositories/product-repository';

// Request/Response DTOs (Data Transfer Objects)
const ProductQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional(),
  vendor: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  currency: z.string().default('USD'),
  status: z.enum(['active', 'inactive', 'draft', 'archived']).optional(),
  sortBy: z.enum(['title', 'price', 'created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeOutOfStock: z.coerce.boolean().default(true),
});

type ProductQueryParams = z.infer<typeof ProductQuerySchema>;

interface ProductResponseDTO {
  id: string;
  title: string;
  handle: string;
  description: string;
  status: string;
  featuredImage?: {
    url: string;
    alt: string;
  };
  priceRange?: {
    min: {
      amount: number;
      currency: string;
      formatted: string;
    };
    max: {
      amount: number;
      currency: string;
      formatted: string;
    };
  };
  categories: Array<{
    id: string;
    name: string;
    handle: string;
  }>;
  tags: string[];
  vendor?: string;
  productType?: string;
  isNew: boolean;
  isOnSale: boolean;
  isOutOfStock: boolean;
  variantCount: number;
  totalInventory: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductListResponseDTO {
  products: ProductResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    appliedFilters: Record<string, any>;
    availableFilters: {
      categories: Array<{ id: string; name: string; count: number }>;
      vendors: Array<{ name: string; count: number }>;
      priceRanges: Array<{ min: number; max: number; count: number }>;
    };
  };
  meta: {
    processingTime: number;
    cacheHit: boolean;
    apiVersion: string;
  };
}

/**
 * Product API Controller
 * Handles HTTP requests and delegates to domain services
 */
class ProductAPIController {
  private readonly productService = ServiceLocator.productService;
  private readonly productRepository = ServiceLocator.productRepository;
  private readonly categoryRepository = ServiceLocator.productCategoryRepository;

  /**
   * GET /api/products
   * List products with filtering, sorting, and pagination
   */
  async getProducts(request: NextRequest): Promise<NextResponse<ProductListResponseDTO | { error: string }>> {
    const startTime = Date.now();
    
    try {
      // Parse and validate query parameters
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams);
      
      const validationResult = ProductQuerySchema.safeParse(queryParams);
      if (!validationResult.success) {
        return this.badRequest('Invalid query parameters', validationResult.error.issues);
      }

      const params = validationResult.data;

      // Build domain query using clean architecture patterns
      const queryResult = await this.buildProductQuery(params);
      if (!queryResult.success) {
        return this.internalError('Failed to build query', queryResult.error);
      }

      // Execute query through domain service
      const productsResult = await this.productRepository.findPaginated(
        queryResult.data.specification,
        params.page,
        params.limit
      );

      // Transform domain entities to DTOs
      const productDTOs = await Promise.all(
        productsResult.items.map(product => this.transformProductToDTO(product))
      );

      // Build response with metadata
      const response: ProductListResponseDTO = {
        products: productDTOs,
        pagination: {
          page: productsResult.page,
          limit: productsResult.limit,
          total: productsResult.total,
          totalPages: productsResult.totalPages,
          hasNext: productsResult.hasNext,
          hasPrevious: productsResult.hasPrevious,
        },
        filters: {
          appliedFilters: this.getAppliedFilters(params),
          availableFilters: await this.getAvailableFilters(params),
        },
        meta: {
          processingTime: Date.now() - startTime,
          cacheHit: false, // Would be determined by caching layer
          apiVersion: '1.0',
        },
      };

      return NextResponse.json(response, { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-API-Version': '1.0',
          'X-Processing-Time': `${Date.now() - startTime}ms`,
        },
      });

    } catch (error) {
      console.error('Products API error:', error);
      return this.internalError('Internal server error', error);
    }
  }

  /**
   * POST /api/products
   * Create a new product (admin only)
   */
  async createProduct(request: NextRequest): Promise<NextResponse> {
    try {
      // Authentication check would go here
      // const user = await this.authenticate(request);
      // if (!user.isAdmin) return this.forbidden('Admin access required');

      const body = await request.json();
      
      // Validate input
      const createProductSchema = z.object({
        title: z.string().min(1).max(255),
        handle: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
        description: z.string().max(5000).default(''),
        categoryIds: z.array(z.string()).default([]),
        vendor: z.string().optional(),
        productType: z.string().optional(),
        tags: z.array(z.string()).default([]),
      });

      const validationResult = createProductSchema.safeParse(body);
      if (!validationResult.success) {
        return this.badRequest('Invalid product data', validationResult.error.issues);
      }

      const data = validationResult.data;

      // Convert string IDs to domain IDs
      const categoryIds = data.categoryIds.map(id => ProductCategoryId.create(id));

      // Create product through domain service
      const result = await this.productService.createProduct(
        data.title,
        data.handle,
        data.description,
        categoryIds
      );

      if (!result.success) {
        return this.handleDomainError(result.error);
      }

      // Transform to DTO and return
      const productDTO = await this.transformProductToDTO(result.data);
      
      return NextResponse.json(productDTO, { 
        status: 201,
        headers: {
          'Location': `/api/products/${result.data.id.value}`,
        },
      });

    } catch (error) {
      console.error('Create product error:', error);
      return this.internalError('Failed to create product', error);
    }
  }

  // Private helper methods

  private async buildProductQuery(params: ProductQueryParams): Promise<Result<{ specification: any }>> {
    try {
      const queryBuilder = ProductQueryBuilder.create();

      // Apply filters based on parameters
      queryBuilder.isActive(); // Default to active products

      if (params.category) {
        const categoryId = ProductCategoryId.create(params.category);
        queryBuilder.inCategory(categoryId);
      }

      if (params.search) {
        queryBuilder.searchText(params.search);
      }

      if (params.tags) {
        const tags = params.tags.split(',').map(tag => tag.trim());
        for (const tag of tags) {
          queryBuilder.withTag(tag);
        }
      }

      if (params.vendor) {
        queryBuilder.byVendor(params.vendor);
      }

      if (params.minPrice !== undefined && params.maxPrice !== undefined) {
        queryBuilder.priceRange(params.minPrice, params.maxPrice, params.currency);
      }

      if (!params.includeOutOfStock) {
        queryBuilder.isAvailable();
      }

      // Apply sorting
      switch (params.sortBy) {
        case 'title':
          queryBuilder.sortByTitle(params.sortOrder);
          break;
        case 'created_at':
          queryBuilder.sortByCreatedAt(params.sortOrder);
          break;
        case 'updated_at':
          queryBuilder.sortByUpdatedAt(params.sortOrder);
          break;
        // Price sorting would need special handling
      }

      const specification = queryBuilder.build();
      return ResultUtils.success({ specification });

    } catch (error) {
      return ResultUtils.error({
        name: 'QueryBuildError',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'QUERY_BUILD_FAILED',
        timestamp: new Date(),
        toJSON: () => ({ code: 'QUERY_BUILD_FAILED', message: error instanceof Error ? error.message : 'Unknown error' })
      });
    }
  }

  private async transformProductToDTO(product: any): Promise<ProductResponseDTO> {
    // Get categories
    const categories = await Promise.all(
      product.categoryIds.map(async (id: ProductCategoryId) => {
        const category = await this.categoryRepository.findById(id);
        return category ? {
          id: category.id.value,
          name: category.name,
          handle: category.handle,
        } : null;
      })
    );

    const featuredImage = product.getFeaturedImage();
    const priceRange = product.getPriceRange();

    const dto: ProductResponseDTO = {
      id: product.id.value,
      title: product.title,
      handle: product.handle,
      description: product.description,
      status: product.status,
      categories: categories.filter(Boolean) as any[],
      tags: product.tags || [],
      vendor: product.vendor,
      productType: product.productType,
      isNew: product.isNew(),
      isOnSale: product.isOnSale(),
      isOutOfStock: product.isOutOfStock(),
      variantCount: product.variants.length,
      totalInventory: product.getTotalInventory(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    if (featuredImage) {
      dto.featuredImage = {
        url: featuredImage.url,
        alt: featuredImage.alt,
      };
    }

    if (priceRange) {
      dto.priceRange = {
        min: {
          amount: priceRange.min.amount,
          currency: priceRange.min.currency.code,
          formatted: priceRange.min.format(),
        },
        max: {
          amount: priceRange.max.amount,
          currency: priceRange.max.currency.code,
          formatted: priceRange.max.format(),
        },
      };
    }

    return dto;
  }

  private getAppliedFilters(params: ProductQueryParams): Record<string, any> {
    const applied: Record<string, any> = {};
    
    if (params.category) applied.category = params.category;
    if (params.search) applied.search = params.search;
    if (params.tags) applied.tags = params.tags.split(',');
    if (params.vendor) applied.vendor = params.vendor;
    if (params.minPrice !== undefined) applied.minPrice = params.minPrice;
    if (params.maxPrice !== undefined) applied.maxPrice = params.maxPrice;
    if (params.status) applied.status = params.status;
    
    return applied;
  }

  private async getAvailableFilters(_params: ProductQueryParams) {
    // In a real implementation, this would aggregate available filter options
    // based on the current result set
    return {
      categories: [],
      vendors: [],
      priceRanges: [],
    };
  }

  // Error handling methods
  private badRequest(message: string, details?: any): NextResponse<{ error: string }> {
    return NextResponse.json({
      error: message,
      details,
      code: 'BAD_REQUEST',
    }, { status: 400 });
  }

  private internalError(message: string, _error?: any): NextResponse<{ error: string }> {
    return NextResponse.json({
      error: message,
      code: 'INTERNAL_ERROR',
    }, { status: 500 });
  }

  private handleDomainError(error: Error): NextResponse {
    // Map domain errors to appropriate HTTP responses
    if (error.name === 'ValidationError') {
      return this.badRequest(error.message);
    }
    if (error.name === 'BusinessRuleViolationError') {
      return this.badRequest(error.message);
    }
    if (error.name === 'EntityNotFoundError') {
      return NextResponse.json({
        error: error.message,
        code: 'NOT_FOUND',
      }, { status: 404 });
    }
    
    return this.internalError('Domain error occurred', error);
  }
}

// Route handlers
const controller = new ProductAPIController();

export async function GET(request: NextRequest) {
  return controller.getProducts(request);
}

export async function POST(request: NextRequest) {
  return controller.createProduct(request);
}

// Export types for client-side usage
export type {
  ProductResponseDTO,
  ProductListResponseDTO,
  ProductQueryParams,
};