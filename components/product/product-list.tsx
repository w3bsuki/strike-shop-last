import React from "react"
import { DataService } from "@/lib/data-service"
import { ProductGrid } from "./product-grid"
import { ProductFilters } from "./product-filters"
import { ProductSort } from "./product-sort"
import type { ProductFilters as FilterType, ProductSortOption } from "@/types/integrated"

interface ProductListProps {
  category?: string
  filters?: FilterType
  sort?: ProductSortOption
  limit?: number
}

/**
 * Server Component - Product List
 * Fetches products and renders them with filters
 */
export async function ProductList({ 
  category, 
  filters = {}, 
  sort = 'newest',
  limit = 20 
}: ProductListProps) {
  // Fetch products server-side
  const response = await DataService.getProducts({
    category,
    filters,
    sort,
    limit,
  })

  return (
    <div className="space-y-6">
      {/* Header with count and sort */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {response.pagination.total} {response.pagination.total === 1 ? 'product' : 'products'}
        </p>
        <ProductSort currentSort={sort} />
      </div>

      {/* Main content area */}
      <div className="flex gap-8">
        {/* Filters sidebar - Client Component */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <ProductFilters 
            filters={response.filters}
            applied={response.applied}
          />
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          <ProductGrid products={response.products} />
        </div>
      </div>
    </div>
  )
}