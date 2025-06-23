/**
 * Product Domain - Product Service Implementation
 * Implements business logic for product operations
 */

import {
  ProductId,
  ProductCategoryId,
  Result,
  ResultUtils,
  ProductErrors,
  ValidationError,
  BusinessRuleViolationError,
  eventDispatcher,
} from '../../../shared/domain';
import { Product, ProductStatus, ProductVariant } from '../entities/product';
import { ProductCategory } from '../entities/product-category';
import {
  IProductRepository,
  IProductCategoryRepository,
  IProductService,
  ProductImportData,
  ProductExportData,
  ProductAnalytics,
} from '../repositories/product-repository';

/**
 * Product Service Implementation
 * Encapsulates complex business logic for product operations
 */
export class ProductService implements IProductService {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: IProductCategoryRepository
  ) {}

  async createProduct(
    title: string,
    handle: string,
    description: string,
    categoryIds: ProductCategoryId[]
  ): Promise<Result<Product>> {
    try {
      // Validate input
      if (!title?.trim()) {
        return ResultUtils.error(ValidationError.required('title'));
      }
      if (!handle?.trim()) {
        return ResultUtils.error(ValidationError.required('handle'));
      }

      // Check if handle is available
      const isHandleAvailable = await this.productRepository.isHandleAvailable(handle);
      if (!isHandleAvailable) {
        return ResultUtils.error(ProductErrors.duplicateHandle(handle));
      }

      // Validate categories exist
      if (categoryIds.length > 0) {
        const categories = await this.categoryRepository.findByIds(categoryIds);
        if (categories.length !== categoryIds.length) {
          const foundIds = categories.map(c => c.id.value);
          const missingIds = categoryIds.filter(id => !foundIds.includes(id.value));
          return ResultUtils.error(
            ValidationError.invalidField(
              'categoryIds',
              missingIds.map(id => id.value),
              'Some categories do not exist'
            )
          );
        }
      }

      // Create product
      const product = Product.create(title, handle, description, categoryIds);

      // Save product
      const savedProduct = await this.productRepository.save(product);

      // Publish domain events
      await this.publishEvents(savedProduct);

      return ResultUtils.success(savedProduct);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async updateProduct(
    productId: ProductId,
    updates: {
      title?: string;
      description?: string;
      vendor?: string;
      productType?: string;
    }
  ): Promise<Result<Product>> {
    try {
      // Find product
      const product = await this.productRepository.findById(productId);
      if (!product) {
        return ResultUtils.error(ProductErrors.notFound(productId.value));
      }

      // Apply updates
      if (updates.title !== undefined || updates.description !== undefined) {
        product.updateBasicInfo(
          updates.title ?? product.title,
          updates.description ?? product.description
        );
      }

      if (updates.vendor !== undefined) {
        product.vendor = updates.vendor;
        product.updatedAt = new Date();
      }

      if (updates.productType !== undefined) {
        product.productType = updates.productType;
        product.updatedAt = new Date();
      }

      // Save product
      const savedProduct = await this.productRepository.save(product);

      // Publish domain events
      await this.publishEvents(savedProduct);

      return ResultUtils.success(savedProduct);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async publishProduct(productId: ProductId): Promise<Result<Product>> {
    try {
      // Find product
      const product = await this.productRepository.findById(productId);
      if (!product) {
        return ResultUtils.error(ProductErrors.notFound(productId.value));
      }

      // Validate product can be published
      const validationResult = this.validateProductForPublishing(product);
      if (!validationResult.isValid) {
        return ResultUtils.error(
          new ValidationError(
            `Cannot publish product: ${validationResult.errors.join(', ')}`,
            'product',
            productId.value
          )
        );
      }

      // Publish product
      product.publish();

      // Save product
      const savedProduct = await this.productRepository.save(product);

      // Publish domain events
      await this.publishEvents(savedProduct);

      return ResultUtils.success(savedProduct);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async unpublishProduct(productId: ProductId): Promise<Result<Product>> {
    try {
      // Find product
      const product = await this.productRepository.findById(productId);
      if (!product) {
        return ResultUtils.error(ProductErrors.notFound(productId.value));
      }

      // Unpublish product
      product.unpublish();

      // Save product
      const savedProduct = await this.productRepository.save(product);

      // Publish domain events
      await this.publishEvents(savedProduct);

      return ResultUtils.success(savedProduct);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async deleteProduct(productId: ProductId): Promise<Result<void>> {
    try {
      // Find product
      const product = await this.productRepository.findById(productId);
      if (!product) {
        return ResultUtils.error(ProductErrors.notFound(productId.value));
      }

      // Check if product can be deleted
      const canDelete = await this.canDeleteProduct(product);
      if (!canDelete) {
        return ResultUtils.error(
          BusinessRuleViolationError.create(
            'cannot_delete_product',
            'Product cannot be deleted because it has associated orders or other dependencies'
          )
        );
      }

      // Delete product
      await this.productRepository.delete(productId);

      return ResultUtils.success(undefined);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async duplicateProduct(
    productId: ProductId,
    newTitle: string,
    newHandle: string
  ): Promise<Result<Product>> {
    try {
      // Find original product
      const originalProduct = await this.productRepository.findById(productId);
      if (!originalProduct) {
        return ResultUtils.error(ProductErrors.notFound(productId.value));
      }

      // Check if handle is available
      const isHandleAvailable = await this.productRepository.isHandleAvailable(newHandle);
      if (!isHandleAvailable) {
        return ResultUtils.error(ProductErrors.duplicateHandle(newHandle));
      }

      // Create new product based on original
      const newProduct = Product.create(
        newTitle,
        newHandle,
        originalProduct.description,
        originalProduct.categoryIds
      );

      // Copy properties
      newProduct.vendor = originalProduct.vendor;
      newProduct.productType = originalProduct.productType;
      newProduct.tags = [...originalProduct.tags];
      newProduct.images = [...originalProduct.images];
      newProduct.seo = originalProduct.seo;
      newProduct.metafields = { ...originalProduct.metafields };

      // Copy variants with new IDs
      for (const originalVariant of originalProduct.variants) {
        const newVariantId = ProductVariantId.create(crypto.randomUUID());
        const newVariant = new ProductVariant(
          newVariantId,
          newProduct.id,
          originalVariant.title,
          this.generateUniqueSku(originalVariant.sku),
          originalVariant.price,
          originalVariant.compareAtPrice,
          0, // Reset inventory for duplicated product
          originalVariant.inventoryManagement,
          originalVariant.allowBackorder,
          { ...originalVariant.options },
          originalVariant.barcode,
          originalVariant.weight,
          originalVariant.dimensions
        );
        newProduct.addVariant(newVariant);
      }

      // Save new product
      const savedProduct = await this.productRepository.save(newProduct);

      // Publish domain events
      await this.publishEvents(savedProduct);

      return ResultUtils.success(savedProduct);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async importProducts(products: ProductImportData[]): Promise<Result<Product[]>> {
    try {
      const importedProducts: Product[] = [];
      const errors: string[] = [];

      for (const productData of products) {
        try {
          // Validate and create product
          const productResult = await this.importSingleProduct(productData);
          if (productResult.success) {
            importedProducts.push(productResult.data);
          } else {
            errors.push(`Product "${productData.title}": ${productResult.error.message}`);
          }
        } catch (error) {
          errors.push(`Product "${productData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (errors.length > 0) {
        return ResultUtils.error(
          new ValidationError(
            `Import completed with errors: ${errors.join('; ')}`,
            'import',
            products.length
          )
        );
      }

      return ResultUtils.success(importedProducts);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async exportProducts(productIds?: ProductId[]): Promise<Result<ProductExportData[]>> {
    try {
      let products: Product[];
      
      if (productIds && productIds.length > 0) {
        products = await this.productRepository.findByIds(productIds);
      } else {
        products = await this.productRepository.findAll();
      }

      const exportData: ProductExportData[] = products.map(product => ({
        id: product.id.value,
        title: product.title,
        handle: product.handle,
        description: product.description,
        status: product.status,
        vendor: product.vendor,
        productType: product.productType,
        tags: [...product.tags],
        categories: product.categoryIds.map(id => id.value),
        variants: product.variants.map(variant => ({
          id: variant.id.value,
          title: variant.title,
          sku: variant.sku,
          price: variant.price.amount,
          currency: variant.price.currency.code,
          compareAtPrice: variant.compareAtPrice?.amount,
          inventoryQuantity: variant.inventoryQuantity,
          options: { ...variant.options },
          barcode: variant.barcode,
          weight: variant.weight,
        })),
        images: product.images.map(image => ({
          url: image.url,
          alt: image.alt,
          position: image.position,
        })),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      }));

      return ResultUtils.success(exportData);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async bulkUpdateProducts(
    productIds: ProductId[],
    updates: Partial<Product>
  ): Promise<Result<Product[]>> {
    try {
      const products = await this.productRepository.findByIds(productIds);
      const updatedProducts: Product[] = [];

      for (const product of products) {
        // Apply allowed updates
        if (updates.vendor !== undefined) {
          product.vendor = updates.vendor;
        }
        if (updates.productType !== undefined) {
          product.productType = updates.productType;
        }
        if (updates.tags) {
          product.tags = [...updates.tags];
        }

        product.updatedAt = new Date();
        updatedProducts.push(product);
      }

      // Save all products
      const savedProducts = await this.productRepository.saveMany(updatedProducts);

      // Publish events for all products
      for (const product of savedProducts) {
        await this.publishEvents(product);
      }

      return ResultUtils.success(savedProducts);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  async getProductAnalytics(productId: ProductId): Promise<Result<ProductAnalytics>> {
    try {
      // Find product
      const product = await this.productRepository.findById(productId);
      if (!product) {
        return ResultUtils.error(ProductErrors.notFound(productId.value));
      }

      // In a real implementation, this would query analytics data from various sources
      // For now, return placeholder data
      const analytics: ProductAnalytics = {
        views: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
        averageOrderValue: 0,
        inventoryTurnover: 0,
        popularVariants: [],
        trafficSources: [],
      };

      return ResultUtils.success(analytics);
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  // Private helper methods
  private validateProductForPublishing(product: Product): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!product.title?.trim()) {
      errors.push('Product must have a title');
    }

    if (!product.handle?.trim()) {
      errors.push('Product must have a handle');
    }

    if (product.variants.length === 0) {
      errors.push('Product must have at least one variant');
    }

    if (product.images.length === 0) {
      errors.push('Product should have at least one image');
    }

    for (const variant of product.variants) {
      if (!variant.sku?.trim()) {
        errors.push(`Variant "${variant.title}" must have a SKU`);
      }
      if (variant.price.amount <= 0) {
        errors.push(`Variant "${variant.title}" must have a valid price`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async canDeleteProduct(product: Product): Promise<boolean> {
    // In a real implementation, check for:
    // - Active orders containing this product
    // - Shopping carts containing this product
    // - Wishlist items
    // - Analytics data retention requirements
    // etc.
    
    // For now, only allow deletion of draft products
    return product.status === ProductStatus.DRAFT;
  }

  private async importSingleProduct(productData: ProductImportData): Promise<Result<Product>> {
    // Generate handle if not provided
    const handle = productData.handle || this.generateHandle(productData.title);

    // Check handle availability
    const isHandleAvailable = await this.productRepository.isHandleAvailable(handle);
    if (!isHandleAvailable) {
      return ResultUtils.error(ProductErrors.duplicateHandle(handle));
    }

    // Resolve category IDs from handles
    const categoryIds: ProductCategoryId[] = [];
    if (productData.categoryHandles) {
      for (const categoryHandle of productData.categoryHandles) {
        const category = await this.categoryRepository.findByHandle(categoryHandle);
        if (category) {
          categoryIds.push(category.id);
        }
      }
    }

    // Create product
    const product = Product.create(
      productData.title,
      handle,
      productData.description || '',
      categoryIds
    );

    // Set additional properties
    if (productData.vendor) product.vendor = productData.vendor;
    if (productData.productType) product.productType = productData.productType;
    if (productData.tags) product.tags = [...productData.tags];

    // Add variants
    for (const variantData of productData.variants) {
      const variantId = ProductVariantId.create(crypto.randomUUID());
      // Implementation would create and add variant here
    }

    // Add images
    if (productData.images) {
      for (const imageData of productData.images) {
        // Implementation would add images here
      }
    }

    // Save product
    const savedProduct = await this.productRepository.save(product);
    await this.publishEvents(savedProduct);

    return ResultUtils.success(savedProduct);
  }

  private generateHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private generateUniqueSku(baseSku: string): string {
    const timestamp = Date.now().toString().slice(-6);
    return `${baseSku}-${timestamp}`;
  }

  private async publishEvents(product: Product): Promise<void> {
    const events = product.getUncommittedEvents();
    for (const event of events) {
      await eventDispatcher.publish(event);
    }
    product.markEventsAsCommitted();
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(`Unknown error: ${error}`);
  }
}

/**
 * Product Search Service
 * Specialized service for product search and filtering
 */
export class ProductSearchService {
  constructor(private readonly productRepository: IProductRepository) {}

  async searchProducts(
    query: string,
    filters: {
      categoryIds?: ProductCategoryId[];
      tags?: string[];
      vendor?: string;
      priceRange?: { min: number; max: number; currency: string };
      availability?: 'in_stock' | 'out_of_stock' | 'all';
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<Result<{ products: Product[]; total: number }>> {
    try {
      // Build search specification based on query and filters
      const specs = [];

      // Text search
      if (query.trim()) {
        specs.push(this.createTextSearchSpec(query));
      }

      // Active products only
      specs.push(this.createActiveSpec());

      // Category filter
      if (filters.categoryIds?.length) {
        specs.push(this.createCategorySpec(filters.categoryIds));
      }

      // Tag filter
      if (filters.tags?.length) {
        specs.push(this.createTagSpec(filters.tags));
      }

      // Vendor filter
      if (filters.vendor) {
        specs.push(this.createVendorSpec(filters.vendor));
      }

      // Price range filter
      if (filters.priceRange) {
        specs.push(this.createPriceRangeSpec(filters.priceRange));
      }

      // Availability filter
      if (filters.availability && filters.availability !== 'all') {
        specs.push(this.createAvailabilitySpec(filters.availability));
      }

      // Combine all specifications
      const combinedSpec = this.combineSpecs(specs);

      // Execute search with pagination
      const result = await this.productRepository.findPaginated(
        combinedSpec,
        pagination.page,
        pagination.limit
      );

      return ResultUtils.success({
        products: result.items,
        total: result.total,
      });
    } catch (error) {
      return ResultUtils.error(this.handleError(error));
    }
  }

  private createTextSearchSpec(query: string) {
    // Implementation would create text search specification
    return { isSatisfiedBy: () => true, toQuery: () => ({}) };
  }

  private createActiveSpec() {
    // Implementation would create active products specification
    return { isSatisfiedBy: () => true, toQuery: () => ({}) };
  }

  private createCategorySpec(categoryIds: ProductCategoryId[]) {
    // Implementation would create category filter specification
    return { isSatisfiedBy: () => true, toQuery: () => ({}) };
  }

  private createTagSpec(tags: string[]) {
    // Implementation would create tag filter specification
    return { isSatisfiedBy: () => true, toQuery: () => ({}) };
  }

  private createVendorSpec(vendor: string) {
    // Implementation would create vendor filter specification
    return { isSatisfiedBy: () => true, toQuery: () => ({}) };
  }

  private createPriceRangeSpec(priceRange: { min: number; max: number; currency: string }) {
    // Implementation would create price range specification
    return { isSatisfiedBy: () => true, toQuery: () => ({}) };
  }

  private createAvailabilitySpec(availability: 'in_stock' | 'out_of_stock') {
    // Implementation would create availability specification
    return { isSatisfiedBy: () => true, toQuery: () => ({}) };
  }

  private combineSpecs(specs: any[]) {
    // Implementation would combine specifications with AND logic
    return { isSatisfiedBy: () => true, toQuery: () => ({}) };
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(`Unknown error: ${error}`);
  }
}