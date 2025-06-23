'use client';

import React, { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  slug: string;
  isNew?: boolean;
  soldOut?: boolean;
  colors?: number;
  category?: string;
  brand?: string;
}

interface EnhancedProductListProps {
  products: Product[];
  className?: string;
  showFilters?: boolean;
  showSearch?: boolean;
  title?: string;
}

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest' | 'name';

export function EnhancedProductList({ 
  products = [], 
  className = '',
  showFilters = true,
  showSearch = true,
  title
}: EnhancedProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Extract unique categories from products
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
    return cats.map(cat => ({ value: cat, label: cat === 'all' ? 'All Categories' : cat }));
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Price filter
    filtered = filtered.filter(product => {
      const price = parseFloat(product.price.replace(/[^0-9.]/g, ''));
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, ''));
        case 'price-high':
          return parseFloat(b.price.replace(/[^0-9.]/g, '')) - parseFloat(a.price.replace(/[^0-9.]/g, ''));
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'featured':
        default:
          return 0;
      }
    });

    return sorted;
  }, [products, searchQuery, sortBy, selectedCategory, priceRange]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange([0, 1000]);
    setSortBy('featured');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || sortBy !== 'featured';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      {title && (
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">{title}</h1>
          <p className="text-[var(--subtle-text-color)]">
            {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
            {hasActiveFilters && ' found'}
          </p>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Category Filter - Desktop */}
          {showFilters && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value || ''}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Sort */}
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filter Button */}
          {showFilters && (
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="sm:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:hidden">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value || ''}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} variant="outline" className="w-full">
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Clear Filters - Desktop */}
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="outline" className="hidden sm:flex">
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your filters or search terms
          </p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredAndSortedProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in-up"
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'both'
              }}
            >
              <ProductCard
                product={product}
                priority={index < 8}
              />
            </div>
          ))}
        </div>
      )}

      {/* Load More Button - Could be implemented for pagination */}
      {filteredAndSortedProducts.length >= 20 && (
        <div className="text-center pt-8">
          <Button variant="outline" size="lg">
            Load More Products
          </Button>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}