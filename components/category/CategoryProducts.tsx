'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
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
  isNew: boolean;
  slug: string;
  colors?: number;
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

  // Auto-load more when scrolling near bottom
  useEffect(() => {
    if (inView && hasMore && !isLoading && onLoadMore) {
      handleLoadMore();
    }
  }, [inView, hasMore, isLoading]);

  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || isLoading) return;
    
    setIsLoading(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoading(false);
    }
  }, [onLoadMore, isLoading]);

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
        ease: [0.22, 1, 0.36, 1],
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
          We couldn't find any products matching your criteria. Try adjusting your filters or browse our other categories.
        </p>
        <Button
          onClick={clearFilters}
          variant="outline"
          className="font-typewriter min-h-[44px] px-6"
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
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4"
      >
        <AnimatePresence mode="popLayout">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              layout
              className="w-full"
            >
              <ProductCard 
                product={product} 
                priority={index < 10}
                className="w-full touch-manipulation" 
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
              className="button-secondary min-h-[44px] px-8"
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 aspect-[3/4] mb-3" />
          <div className="h-4 bg-gray-200 mb-2 w-3/4" />
          <div className="h-4 bg-gray-200 w-1/2" />
        </div>
      ))}
    </div>
  );
}
