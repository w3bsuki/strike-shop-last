'use client';

import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';

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

interface CategoryProductsProps {
  products: Product[];
  clearFilters: () => void;
}

export function CategoryProducts({
  products,
  clearFilters,
}: CategoryProductsProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium mb-2 font-['Typewriter']">
          No products found
        </p>
        <p className="text-sm text-[var(--subtle-text-color)] mb-4 font-['Typewriter']">
          Try adjusting your filters or search terms
        </p>
        <Button
          onClick={clearFilters}
          variant="outline"
          className="font-['Typewriter']"
        >
          Clear All Filters
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} className="w-full touch-manipulation" />
        ))}
      </div>

      {products.length > 0 && (
        <div className="flex justify-center mt-10">
          <Button className="button-secondary">LOAD MORE</Button>
        </div>
      )}
    </>
  );
}
