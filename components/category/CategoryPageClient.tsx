'use client';

import { CategoryHeader } from './CategoryHeader';
import { CategoryFilters } from './CategoryFilters';
import { CategoryProducts } from './CategoryProducts';
import { CategoryProvider, useCategory } from '@/contexts/CategoryContext';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  isNew: boolean;
  slug: string;
  colors?: number;
}

interface CategoryPageClientProps {
  categoryName: string;
  initialProducts: Product[];
}

function CategoryPageContent() {
  const {
    categoryName,
    sortedProducts,
    activeFiltersCount,
    filters,
    setSortBy,
    clearFilters,
  } = useCategory();

  return (
    <div className="section-padding">
      <div className="strike-container">
        <CategoryHeader
          categoryName={categoryName}
          productCount={sortedProducts.length}
          sortBy={filters.sortBy}
          setSortBy={setSortBy}
          activeFiltersCount={activeFiltersCount}
          filterContent={<CategoryFilters />}
        />

        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4 font-['Typewriter']">
                FILTERS
              </h2>
              <CategoryFilters />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <CategoryProducts
              products={sortedProducts}
              clearFilters={clearFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryPageClient({
  categoryName,
  initialProducts,
}: CategoryPageClientProps) {
  return (
    <CategoryProvider
      categoryName={categoryName}
      initialProducts={initialProducts}
    >
      <CategoryPageContent />
    </CategoryProvider>
  );
}
