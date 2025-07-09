'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product/product-card';
import { CategoryFilters } from '@/components/category/CategoryFilters';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { shopifyService } from '@/lib/shopify';
import type { IntegratedProduct } from '@/types';
import type { SimpleProduct } from '@/components/product/types';
import { useDebounce } from '@/hooks/use-debounce';
import { Loading } from '@/components/ui/loading';

// Transform IntegratedProduct to SimpleProduct for ProductCard
const transformToSimpleProduct = (product: IntegratedProduct): SimpleProduct => {
  const mainImageUrl = product.content?.images?.[0]?.url || '/placeholder.svg?height=400&width=400';
  const basePrice = product.pricing?.basePrice || 0;
  const salePrice = product.pricing?.salePrice;
  
  return {
    id: product.id,
    name: product.content?.name || 'Unnamed Product',
    price: `€${basePrice}`,
    originalPrice: salePrice ? `€${basePrice}` : undefined,
    discount: salePrice ? `-${Math.round(((basePrice - salePrice) / basePrice) * 100)}%` : undefined,
    image: mainImageUrl,
    slug: product.slug,
    isNew: product.badges?.isNew || false,
    soldOut: product.badges?.isSoldOut || false,
    colors: product.commerce?.variants?.map(variant => variant.options.color?.name).filter((color): color is string => Boolean(color)) || [],
  };
};

interface SearchPageClientProps {
  initialQuery?: string;
  initialProducts?: IntegratedProduct[];
}

export default function SearchPageClient({ 
  initialQuery = '', 
  initialProducts = [] 
}: SearchPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<IntegratedProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  
  // Filters from URL params
  const [filters, setFilters] = useState({
    colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
    sizes: searchParams.get('sizes')?.split(',').filter(Boolean) || [],
    priceRange: {
      min: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      max: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    },
    inStock: searchParams.get('inStock') === 'true',
    sortBy: searchParams.get('sortBy') || 'relevance',
  });

  // Debounce search query
  const debouncedQuery = useDebounce(query, 300);

  // Update URL with current filters
  const updateURL = useCallback((newQuery: string, newFilters: typeof filters) => {
    const params = new URLSearchParams();
    
    if (newQuery) params.set('q', newQuery);
    if (newFilters.colors.length) params.set('colors', newFilters.colors.join(','));
    if (newFilters.sizes.length) params.set('sizes', newFilters.sizes.join(','));
    if (newFilters.priceRange.min) params.set('minPrice', newFilters.priceRange.min.toString());
    if (newFilters.priceRange.max) params.set('maxPrice', newFilters.priceRange.max.toString());
    if (newFilters.inStock) params.set('inStock', 'true');
    if (newFilters.sortBy !== 'relevance') params.set('sortBy', newFilters.sortBy);
    
    router.push(`/search?${params.toString()}`, { scroll: false });
  }, [router]);

  // Search products
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() && !hasSearched) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const results = await shopifyService.searchProducts(searchQuery);
      setProducts(results);
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [hasSearched]);

  // Effect for debounced search
  useEffect(() => {
    if (debouncedQuery !== initialQuery || hasSearched) {
      searchProducts(debouncedQuery);
      updateURL(debouncedQuery, filters);
    }
  }, [debouncedQuery, searchProducts, updateURL, filters, initialQuery, hasSearched]);

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply filters
    if (filters.colors.length > 0) {
      filtered = filtered.filter(product => 
        product.commerce.variants.some(variant => 
          variant.options.color && filters.colors.includes(variant.options.color.name)
        )
      );
    }

    if (filters.sizes.length > 0) {
      filtered = filtered.filter(product => 
        product.commerce.variants.some(variant => 
          variant.options.size && filters.sizes.includes(variant.options.size)
        )
      );
    }

    if (filters.priceRange.min !== undefined || filters.priceRange.max !== undefined) {
      filtered = filtered.filter(product => {
        const price = product.pricing.salePrice || product.pricing.basePrice;
        if (filters.priceRange.min !== undefined && price < filters.priceRange.min) return false;
        if (filters.priceRange.max !== undefined && price > filters.priceRange.max) return false;
        return true;
      });
    }

    if (filters.inStock) {
      filtered = filtered.filter(product => product.commerce.inventory.available);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => 
          (a.pricing.salePrice || a.pricing.basePrice) - 
          (b.pricing.salePrice || b.pricing.basePrice)
        );
        break;
      case 'price-desc':
        filtered.sort((a, b) => 
          (b.pricing.salePrice || b.pricing.basePrice) - 
          (a.pricing.salePrice || a.pricing.basePrice)
        );
        break;
      case 'name':
        filtered.sort((a, b) => a.content.name.localeCompare(b.content.name));
        break;
      // 'relevance' is default - no sorting needed
    }

    return filtered;
  }, [products, filters]);

  // const handleFilterChange = (newFilters: typeof filters) => {
  //   setFilters(newFilters);
  //   updateURL(query, newFilters);
  // };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchProducts(query);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search Box */}
      <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-10 pr-4 py-3 text-base min-h-[48px]"
            autoFocus
          />
        </div>
      </form>

      {/* Results Header */}
      {hasSearched && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {query ? `Search results for "${query}"` : 'All Products'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            </p>
          </div>

          {/* Mobile Filter Toggle */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px]">
              <CategoryFilters />
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Desktop Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          {hasSearched && (
            <CategoryFilters />
          )}
        </aside>

        {/* Results Grid */}
        <main className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Loading.Skeleton className="aspect-[3/4]" />
                  <Loading.Skeleton className="h-4 w-3/4" />
                  <Loading.Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={transformToSimpleProduct(product)} />
              ))}
            </div>
          ) : hasSearched ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">No products found</h2>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('');
                  setFilters({
                    colors: [],
                    sizes: [],
                    priceRange: { min: undefined, max: undefined },
                    inStock: false,
                    sortBy: 'relevance',
                  });
                  router.push('/search');
                }}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Start searching</h2>
              <p className="text-gray-600">
                Enter a search term to find products
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}