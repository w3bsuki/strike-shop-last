import React from 'react';
// import { dataService } from '@/lib/data-service';
import { ProductGrid } from './product-grid';
import { ProductFilters } from './product-filters';
import { ProductSort } from './product-sort';
import { ProductCard } from './product-card';
import type {
  ProductFilters as FilterType,
  ProductSortOption,
  // IntegratedProduct,
} from '@/types/integrated';
// import type { Price } from '@/types/branded';

interface ProductListProps {
  category?: string;
  filters?: FilterType;
  sort?: ProductSortOption;
  limit?: number;
}

// Convert data service product to expected IntegratedProduct structure
// function convertToIntegratedProduct(product: any): IntegratedProduct {
//   return {
//     id: product.id,
//     slug: product.handle || product.slug || product.id,
//     content: {
//       name: product.title,
//       description: product.description,
//       images: product.images || [],
//       categories: product.categories || [],
//       tags: product.tags || [],
//     },
//     commerce: {
//       variants: product.variants || [],
//       prices: [],
//       inventory: {
//         available: product.inStock,
//       },
//     },
//     pricing: {
//       currency: product.price?.currency || 'GBP',
//       basePrice: product.price?.amount || 0,
//       displayPrice: product.price?.formatted || '£0.00',
//       ...(product.compareAtPrice && {
//         salePrice: product.compareAtPrice.amount,
//         displaySalePrice: product.compareAtPrice.formatted,
//         discount: {
//           amount: (product.compareAtPrice.amount - product.price.amount) as Price,
//           percentage: Math.round(
//             ((product.compareAtPrice.amount - product.price.amount) /
//               product.compareAtPrice.amount) *
//               100
//           ),
//         }
//       }),
//     },
//     badges: {
//       isNew: false,
//       isSale: !!product.compareAtPrice,
//       isLimited: false,
//       isSoldOut: !product.inStock,
//     },
//   };
// }

/**
 * Server Component - Product List
 * Fetches products and renders them with filters
 */
export async function ProductList({
  // category,
  filters = {},
  sort = 'newest',
  // limit = 20,
}: ProductListProps) {
  // Fetch products server-side
  // const response = await dataService.getProducts({
  //   ...(category && { categoryHandle: category }),
  //   limit,
  // });

  // Convert products to expected structure
  // const convertedProducts = response.products.map(convertToIntegratedProduct);
  const convertedProducts: any[] = [];

  return (
    <div className="space-y-6">
      {/* Header with count and sort */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {0} products
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

        {/* Product grid with mobile optimization */}
        <div className="flex-1">
          <ProductGrid>
            {convertedProducts.map((product, index) => {
              return (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  priority={index < 6}
                  className="touch-manipulation"
                />
              );
            })}
          </ProductGrid>
        </div>
      </div>
    </div>
  );
}
