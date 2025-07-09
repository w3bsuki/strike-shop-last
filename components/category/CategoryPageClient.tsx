'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CategoryHeader } from './CategoryHeader';
import { CategoryProductsSkeleton } from './CategoryProducts';
import { CategoryProvider, useCategory } from '@/contexts/CategoryContext';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamic imports for heavy components
const CategoryFilters = dynamic(() => import('./CategoryFilters').then(mod => ({ default: mod.CategoryFilters })), {
  
  loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded" />
});

const CategoryProducts = dynamic(() => import('./CategoryProducts').then(mod => ({ default: mod.CategoryProducts })), {
  
  loading: () => <CategoryProductsSkeleton />
});


interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  images?: string[];
  isNew: boolean;
  slug: string;
  colors?: string[];
  soldOut?: boolean;
}

interface CategoryPageClientProps {
  categoryName: string;
  initialProducts: any[];
  totalProducts?: number;
}

function CategoryPageContent() {
  const {
    categoryName,
    sortedProducts,
    activeFiltersCount,
    filters,
    setSortBy,
    clearFilters,
    isLoading,
  } = useCategory();

  // Transform IntegratedProduct to Product format
  const transformedProducts: Product[] = sortedProducts.map((product: any) => {
    const transformed: Product = {
      id: product.id,
      name: product.title || product.content?.name || '',
      price: product.price?.amount ? `£${(product.price.amount / 100).toFixed(2)}` : '£0.00',
      image: product.thumbnail || product.content?.images?.[0]?.url || '/placeholder.jpg',
      isNew: product.isNew || false,
      slug: product.handle || product.slug || '',
      soldOut: product.soldOut || false,
    };
    
    // Add additional images if available
    if (product.content?.images?.length > 1) {
      transformed.images = product.content.images.slice(1).map((img: any) => img.url);
    }
    
    if (product.originalPrice?.amount) {
      transformed.originalPrice = `£${(product.originalPrice.amount / 100).toFixed(2)}`;
    }
    
    if (product.discount) {
      transformed.discount = `${product.discount}%`;
    }
    
    // Transform color variants to color array
    if (product.variants?.length) {
      transformed.colors = product.variants.map((variant: any) => 
        variant.color || variant.option1 || '#000000'
      ).filter(Boolean);
    }
    
    return transformed;
  });

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Category Name */}
      <div className="bg-black text-white py-12 lg:py-16">
        <div className="strike-container">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold uppercase tracking-wider mb-4">
              {categoryName}
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Discover our latest collection of premium {categoryName.toLowerCase()} products
            </p>
          </div>
        </div>
      </div>

      <div className="strike-container py-6 lg:py-8">
        <CategoryHeader
          categoryName={categoryName}
          productCount={transformedProducts.length}
          sortBy={filters.sortBy}
          setSortBy={setSortBy}
          activeFiltersCount={activeFiltersCount}
          filterContent={<CategoryFilters />}
        />

        <div className="flex gap-0 lg:gap-8">
          {/* Desktop Filter Sidebar - Gymshark Style */}
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-gray-50 border-r border-gray-200 p-6 -ml-6 pl-6">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-6 text-black">
                  Filter & Refine
                </h2>
                <CategoryFilters />
              </div>
            </div>
          </aside>

          {/* Products Grid - Full Width */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <CategoryProductsSkeleton />
            ) : (
              <CategoryProducts
                products={transformedProducts}
                clearFilters={clearFilters}
              />
            )}
          </main>
        </div>
      </div>

      {/* Scroll to Top Button - Gymshark Style */}
      {showScrollTop && (
        <div className="fixed bottom-6 right-6 z-40 transition-all duration-300 ease-in-out transform scale-100 opacity-100">
          <Button
            onClick={scrollToTop}
            size="icon"
            className="h-12 w-12 rounded-full bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>
      )}
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
