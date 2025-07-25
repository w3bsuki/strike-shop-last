'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Package } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

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

interface CategoryProductsProps {
  products: Product[];
  clearFilters: () => void;
  totalProducts?: number;
  onLoadMore?: () => Promise<void>;
}

export function CategoryProducts({
  products,
  clearFilters,
  totalProducts = products.length,
  onLoadMore,
}: CategoryProductsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadMoreRef, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const hasMore = totalProducts > products.length;

  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || isLoading) return;
    
    setIsLoading(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoading(false);
    }
  }, [onLoadMore, isLoading]);

  // Auto-load more when scrolling near bottom
  useEffect(() => {
    if (inView && hasMore && !isLoading && onLoadMore) {
      handleLoadMore();
    }
  }, [inView, hasMore, isLoading, handleLoadMore]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-4"
      >
        <Package className="h-16 w-16 mx-auto mb-6 text-gray-300" />
        <h3 className="text-lg sm:text-xl font-semibold mb-2 font-typewriter">
          No products found
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-6 font-typewriter max-w-md mx-auto">
          We couldn&apos;t find any products matching your criteria. Try adjusting your filters or browse our other categories.
        </p>
        <Button
          onClick={clearFilters}
          variant="outline"
          className="font-typewriter min-h-[48px] min-w-[48px] px-6 py-3 touch-manipulation rounded-none"
        >
          Clear All Filters
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6"
        style={{
          touchAction: 'pan-y', // Allow vertical scrolling
          WebkitTouchCallout: 'none'
        }}
      >
        <AnimatePresence mode="popLayout">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              className="w-full"
            >
              <ProductCard 
                product={product} 
                variant="detailed"
                priority={index < 8}
                className="w-full touch-manipulation select-none" 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More Section */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center mt-8 sm:mt-10 lg:mt-12">
          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-typewriter text-sm">Loading more products...</span>
            </div>
          ) : (
            <Button 
              onClick={handleLoadMore}
              variant="outline"
              className="button-secondary min-h-[48px] min-w-[48px] px-8 py-3 touch-manipulation rounded-none"
              disabled={isLoading}
            >
              Load More
              <span className="ml-2 text-xs opacity-70">
                ({products.length} of {totalProducts})
              </span>
            </Button>
          )}
        </div>
      )}
    </>
  );
}

// Loading skeleton for products grid
export function CategoryProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white border border-gray-100 overflow-hidden">
          <div className="bg-gray-200 aspect-[3/4]" />
          <div className="p-3 space-y-1">
            <div className="h-4 bg-gray-200 w-3/4" />
            <div className="h-4 bg-gray-200 w-1/2 mt-0.5" />
            <div className="flex gap-1 mt-1.5">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="w-3 h-3 bg-gray-200 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
