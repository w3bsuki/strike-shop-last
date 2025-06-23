import React from 'react';
import { dataService } from '@/lib/data-service';
import { ProductGrid } from './product-grid';
import { ProductFilters } from './product-filters';
import { ProductSort } from './product-sort';
import type {
  ProductFilters as FilterType,
  ProductSortOption,
  IntegratedProduct,
} from '@/types/integrated';

interface ProductListProps {
  category?: string;
  filters?: FilterType;
  sort?: ProductSortOption;
  limit?: number;
}

// Convert data service product to expected IntegratedProduct structure
function convertToIntegratedProduct(product: any): IntegratedProduct {
  return {
    id: product.id,
    slug: product.handle || product.slug || product.id,
    content: {
      name: product.title,
      description: product.description,
      images: product.images || [],
      categories: product.categories || [],
      tags: product.tags || [],
    },
    commerce: {
      variants: product.variants || [],
      prices: [],
      inventory: {
        available: product.inStock,
      },
    },
    pricing: {
      currency: product.price?.currency || 'GBP',
      basePrice: product.price?.amount || 0,
      salePrice: product.compareAtPrice?.amount,
      displayPrice: product.price?.formatted || '£0.00',
      displaySalePrice: product.compareAtPrice?.formatted,
      discount: product.compareAtPrice
        ? {
            amount: product.compareAtPrice.amount - product.price.amount,
            percentage: Math.round(
              ((product.compareAtPrice.amount - product.price.amount) /
                product.compareAtPrice.amount) *
                100
            ),
          }
        : undefined,
    },
    badges: {
      isNew: false,
      isSale: !!product.compareAtPrice,
      isLimited: false,
      isSoldOut: !product.inStock,
    },
  };
}

/**
 * Server Component - Product List
 * Fetches products and renders them with filters
 */
export async function ProductList({
  category,
  filters = {},
  sort = 'newest',
  limit = 20,
}: ProductListProps) {
  // Fetch products server-side
  const response = await dataService.getProducts({
    categoryHandle: category,
    limit,
  });

  // Convert products to expected structure
  const convertedProducts = response.products.map(convertToIntegratedProduct);

  return (
    <div className="space-y-6">
      {/* Header with count and sort */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {response.count} {response.count === 1 ? 'product' : 'products'}
        </p>
        <ProductSort currentSort={sort} />
      </div>

      {/* Main content area */}
      <div className="flex gap-8">
        {/* Filters sidebar - Client Component */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <ProductFilters
            filters={{
              categories: [],
              sizes: [],
              colors: [],
              brands: [],
              priceRange: { min: 0, max: 1000 },
            }}
            applied={filters}
          />
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          <ProductGrid products={convertedProducts} />
        </div>
      </div>
    </div>
  );
}
