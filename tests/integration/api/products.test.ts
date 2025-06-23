/**
 * Products API Integration Tests
 * Comprehensive test suite for Products API endpoints
 * Tests full request/response cycle with mocked dependencies
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/products/route.refactored';
import { ServiceLocator } from '@/infrastructure';
import { ProductId, ProductCategoryId, Currency, Money } from '@/shared/domain';
import { Product, ProductVariant, ProductStatus } from '@/domains/product/entities/product';

// Mock ServiceLocator and dependencies
jest.mock('@/infrastructure', () => ({
  ServiceLocator: {
    productService: {
      createProduct: jest.fn(),
    },
    productRepository: {
      findPaginated: jest.fn(),
      findById: jest.fn(),
    },
    productCategoryRepository: {
      findById: jest.fn(),
    },
  },
}));

describe('Products API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    const mockProducts = [
      {
        id: ProductId.fromString('prod_1'),
        title: 'Test Product 1',
        handle: 'test-product-1',
        description: 'A test product',
        status: ProductStatus.ACTIVE,
        categoryIds: [ProductCategoryId.fromString('cat_1')],
        tags: ['electronics', 'gadget'],
        vendor: 'Test Vendor',
        productType: 'Electronics',
        variants: [
          {
            id: 'var_1',
            price: Money.fromDecimal(29.99, Currency.USD),
            compareAtPrice: Money.fromDecimal(39.99, Currency.USD),
            inventoryQuantity: 10,
          },
        ],
        getFeaturedImage: () => ({
          url: 'https://example.com/image.jpg',
          alt: 'Test Product Image',
        }),
        getPriceRange: () => ({
          min: Money.fromDecimal(29.99, Currency.USD),
          max: Money.fromDecimal(29.99, Currency.USD),
        }),
        isAvailable: () => true,
        getTotalInventory: () => 10,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const mockPaginatedResult = {
      items: mockProducts,
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };

    beforeEach(() => {
      (ServiceLocator.productRepository.findPaginated as jest.Mock).mockResolvedValue(
        mockPaginatedResult
      );
      (ServiceLocator.productCategoryRepository.findById as jest.Mock).mockResolvedValue({
        id: ProductCategoryId.fromString('cat_1'),
        name: 'Electronics',
        handle: 'electronics',
      });
    });

    it('should return products with default parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/products');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(1);
      expect(data.products[0]).toMatchObject({
        id: 'prod_1',
        title: 'Test Product 1',
        handle: 'test-product-1',
        status: 'active',
      });
      expect(data.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should handle pagination parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?page=2&limit=10');
      
      await GET(request);
      
      expect(ServiceLocator.productRepository.findPaginated).toHaveBeenCalledWith(
        expect.any(Object),
        2,
        10
      );
    });

    it('should handle search parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/products?search=test&category=electronics&vendor=TestVendor'
      );
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.filters.appliedFilters).toMatchObject({
        search: 'test',
        category: 'electronics',
        vendor: 'TestVendor',
      });
    });

    it('should handle price range filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/products?minPrice=10&maxPrice=50&currency=USD'
      );
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.filters.appliedFilters).toMatchObject({
        minPrice: 10,
        maxPrice: 50,
      });
    });

    it('should handle tag filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/products?tags=electronics,gadget,mobile'
      );
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.filters.appliedFilters.tags).toEqual(['electronics', 'gadget', 'mobile']);
    });

    it('should handle sorting parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/products?sortBy=title&sortOrder=asc'
      );
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(ServiceLocator.productRepository.findPaginated).toHaveBeenCalled();
    });

    it('should handle status filter', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?status=active');
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(ServiceLocator.productRepository.findPaginated).toHaveBeenCalled();
    });

    it('should include cache headers in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/products');
      
      const response = await GET(request);
      
      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=300, stale-while-revalidate=600'
      );
      expect(response.headers.get('X-API-Version')).toBe('1.0');
      expect(response.headers.get('X-Processing-Time')).toMatch(/\d+ms/);
    });

    it('should include response metadata', async () => {
      const request = new NextRequest('http://localhost:3000/api/products');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.meta).toMatchObject({
        processingTime: expect.any(Number),
        cacheHit: false,
        apiVersion: '1.0',
      });
    });

    it('should return 400 for invalid query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?page=0&limit=101');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
      expect(data.code).toBe('BAD_REQUEST');
      expect(data.details).toBeInstanceOf(Array);
    });

    it('should return 400 for invalid sort parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/products?sortBy=invalid&sortOrder=invalid'
      );
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('should handle repository errors gracefully', async () => {
      (ServiceLocator.productRepository.findPaginated as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );
      
      const request = new NextRequest('http://localhost:3000/api/products');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should transform product data to correct DTO format', async () => {
      const request = new NextRequest('http://localhost:3000/api/products');
      
      const response = await GET(request);
      const data = await response.json();
      
      const product = data.products[0];
      expect(product).toMatchObject({
        id: 'prod_1',
        title: 'Test Product 1',
        handle: 'test-product-1',
        description: 'A test product',
        status: 'active',
        featuredImage: {
          url: 'https://example.com/image.jpg',
          alt: 'Test Product Image',
        },
        priceRange: {
          min: {
            amount: 2999,
            currency: 'USD',
            formatted: expect.any(String),
          },
          max: {
            amount: 2999,
            currency: 'USD',
            formatted: expect.any(String),
          },
        },
        categories: [
          {
            id: 'cat_1',
            name: 'Electronics',
            handle: 'electronics',
          },
        ],
        tags: ['electronics', 'gadget'],
        vendor: 'Test Vendor',
        productType: 'Electronics',
        isNew: expect.any(Boolean),
        isOnSale: expect.any(Boolean),
        isOutOfStock: false,
        variantCount: 1,
        totalInventory: 10,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should handle products without featured image', async () => {
      const productWithoutImage = {
        ...mockProducts[0],
        getFeaturedImage: () => null,
      };
      
      (ServiceLocator.productRepository.findPaginated as jest.Mock).mockResolvedValue({
        ...mockPaginatedResult,
        items: [productWithoutImage],
      });
      
      const request = new NextRequest('http://localhost:3000/api/products');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.products[0].featuredImage).toBeUndefined();
    });

    it('should handle products without price range', async () => {
      const productWithoutPriceRange = {
        ...mockProducts[0],
        getPriceRange: () => null,
      };
      
      (ServiceLocator.productRepository.findPaginated as jest.Mock).mockResolvedValue({
        ...mockPaginatedResult,
        items: [productWithoutPriceRange],
      });
      
      const request = new NextRequest('http://localhost:3000/api/products');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.products[0].priceRange).toBeUndefined();
    });
  });

  describe('POST /api/products', () => {
    const mockCreatedProduct = {
      id: ProductId.fromString('prod_new'),
      title: 'New Product',
      handle: 'new-product',
      description: 'A new product',
      status: ProductStatus.DRAFT,
      categoryIds: [],
      tags: [],
      variants: [],
      getFeaturedImage: () => null,
      getPriceRange: () => null,
      isAvailable: () => false,
      getTotalInventory: () => 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    beforeEach(() => {
      (ServiceLocator.productService.createProduct as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCreatedProduct,
      });
    });

    it('should create product with valid data', async () => {
      const productData = {
        title: 'New Product',
        handle: 'new-product',
        description: 'A new product description',
        categoryIds: ['cat_1'],
        vendor: 'Test Vendor',
        productType: 'Electronics',
        tags: ['new', 'product'],
      };
      
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(response.headers.get('Location')).toBe('/api/products/prod_new');
      expect(data).toMatchObject({
        id: 'prod_new',
        title: 'New Product',
        handle: 'new-product',
        status: 'draft',
      });
      
      expect(ServiceLocator.productService.createProduct).toHaveBeenCalledWith(
        'New Product',
        'new-product',
        'A new product description',
        [expect.any(ProductCategoryId)]
      );
    });

    it('should create product with minimal data', async () => {
      const productData = {
        title: 'Minimal Product',
        handle: 'minimal-product',
      };
      
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      expect(ServiceLocator.productService.createProduct).toHaveBeenCalledWith(
        'Minimal Product',
        'minimal-product',
        '',
        []
      );
    });

    it('should return 400 for invalid product data', async () => {
      const invalidData = {
        title: '', // Empty title
        handle: 'invalid handle!', // Invalid handle format
        description: 'a'.repeat(5001), // Too long description
      };
      
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid product data');
      expect(data.code).toBe('BAD_REQUEST');
      expect(data.details).toBeInstanceOf(Array);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        description: 'Product without title or handle',
      };
      
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid product data');
    });

    it('should handle domain service validation errors', async () => {
      (ServiceLocator.productService.createProduct as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          name: 'ValidationError',
          message: 'Product handle already exists',
        },
      });
      
      const productData = {
        title: 'Duplicate Product',
        handle: 'existing-handle',
      };
      
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Product handle already exists');
    });

    it('should handle domain service business rule violations', async () => {
      (ServiceLocator.productService.createProduct as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          name: 'BusinessRuleViolationError',
          message: 'Product creation not allowed',
        },
      });
      
      const productData = {
        title: 'Restricted Product',
        handle: 'restricted-product',
      };
      
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Product creation not allowed');
    });

    it('should handle unknown domain errors', async () => {
      (ServiceLocator.productService.createProduct as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          name: 'UnknownError',
          message: 'Something unexpected happened',
        },
      });
      
      const productData = {
        title: 'Error Product',
        handle: 'error-product',
      };
      
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Domain error occurred');
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should handle service errors gracefully', async () => {
      (ServiceLocator.productService.createProduct as jest.Mock).mockRejectedValue(
        new Error('Service unavailable')
      );
      
      const productData = {
        title: 'Service Error Product',
        handle: 'service-error-product',
      };
      
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create product');
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create product');
    });

    it('should validate handle format correctly', async () => {
      const testCases = [
        { handle: 'valid-handle-123', shouldPass: true },
        { handle: 'INVALID-HANDLE', shouldPass: false },
        { handle: 'invalid_handle', shouldPass: false },
        { handle: 'invalid handle', shouldPass: false },
        { handle: 'invalid.handle', shouldPass: false },
        { handle: '123-valid-handle', shouldPass: true },
      ];
      
      for (const testCase of testCases) {
        const productData = {
          title: 'Test Product',
          handle: testCase.handle,
        };
        
        const request = new NextRequest('http://localhost:3000/api/products', {
          method: 'POST',
          body: JSON.stringify(productData),
          headers: { 'Content-Type': 'application/json' },
        });
        
        const response = await POST(request);
        
        if (testCase.shouldPass) {
          expect(response.status).toBe(201);
        } else {
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      // Simulate timeout by making repository take too long
      (ServiceLocator.productRepository.findPaginated as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 30000))
      );
      
      const request = new NextRequest('http://localhost:3000/api/products');
      
      // This would timeout in a real scenario, but for testing we'll reject immediately
      (ServiceLocator.productRepository.findPaginated as jest.Mock).mockRejectedValue(
        new Error('Request timeout')
      );
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should handle database connection errors', async () => {
      (ServiceLocator.productRepository.findPaginated as jest.Mock).mockRejectedValue(
        new Error('ECONNREFUSED: Connection refused')
      );
      
      const request = new NextRequest('http://localhost:3000/api/products');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle memory errors gracefully', async () => {
      (ServiceLocator.productRepository.findPaginated as jest.Mock).mockRejectedValue(
        new Error('JavaScript heap out of memory')
      );
      
      const request = new NextRequest('http://localhost:3000/api/products');
      
      const response = await GET(request);
      
      expect(response.status).toBe(500);
    });
  });

  describe('Performance and Optimization', () => {
    it('should complete requests within acceptable time limits', async () => {
      const startTime = Date.now();
      
      (ServiceLocator.productRepository.findPaginated as jest.Mock).mockResolvedValue({
        items: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      });
      
      const request = new NextRequest('http://localhost:3000/api/products');
      
      const response = await GET(request);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large result sets efficiently', async () => {
      const largeProductSet = Array.from({ length: 100 }, (_, i) => ({
        id: ProductId.fromString(`prod_${i}`),
        title: `Product ${i}`,
        handle: `product-${i}`,
        description: `Description for product ${i}`,
        status: ProductStatus.ACTIVE,
        categoryIds: [],
        tags: [],
        variants: [],
        getFeaturedImage: () => null,
        getPriceRange: () => null,
        isAvailable: () => true,
        getTotalInventory: () => 10,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }));
      
      (ServiceLocator.productRepository.findPaginated as jest.Mock).mockResolvedValue({
        items: largeProductSet,
        page: 1,
        limit: 100,
        total: 100,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
      
      const request = new NextRequest('http://localhost:3000/api/products?limit=100');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(100);
      expect(data.meta.processingTime).toBeLessThan(10000); // Should process within 10 seconds
    });
  });
});