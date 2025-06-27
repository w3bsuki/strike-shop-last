'use client';

import { useRef, useCallback, useState, useEffect, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from '@/lib/dynamic-imports/framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  count: number;
  image: string;
  slug: string;
  description?: string;
}

interface CategoryScrollProps {
  title: string;
  categories: Category[];
  className?: string;
}

// Memoized category card for performance
const CategoryCard = memo(({ category, index }: { category: Category; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={`/${category.slug}`}
        className="group relative block overflow-hidden bg-black"
        aria-label={`${category.name} - ${category.count} items`}
      >
        {/* Card Container with Golden Ratio */}
        <div className="relative aspect-[3/4] w-[200px] sm:w-[240px] md:w-[280px] lg:w-[320px]">
          {/* Optimized Image */}
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 640px) 200px, (max-width: 768px) 240px, (max-width: 1024px) 280px, 320px"
            priority={index < 3}
            quality={85}
          />
          
          {/* Advanced Gradient Overlay */}
          <div className="absolute inset-0">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
          
          {/* Content with Animation */}
          <div className="absolute inset-x-0 bottom-0 p-6 transform transition-transform duration-500 group-hover:translate-y-[-4px]">
            <h3 className="text-white font-bold text-lg md:text-xl lg:text-2xl mb-2 tracking-tight uppercase">
              {category.name}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-white/80 text-sm md:text-base">
                {category.count} {category.count === 1 ? 'Product' : 'Products'}
              </p>
              <motion.div
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                whileHover={{ x: 4 }}
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </motion.div>
            </div>
          </div>
          
          {/* Premium Border Effect */}
          <div className="absolute inset-0 border border-white/0 group-hover:border-white/20 transition-colors duration-500" />
        </div>
      </Link>
    </motion.div>
  );
});

CategoryCard.displayName = 'CategoryCard';

export default function CategoryScrollV2({
  title,
  categories,
  className
}: CategoryScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Optimized scroll check
  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    
    // Calculate current index for indicators
    const cardWidth = scrollRef.current.firstElementChild?.firstElementChild?.clientWidth || 0;
    if (cardWidth > 0) {
      setCurrentIndex(Math.round(scrollLeft / cardWidth));
    }
  }, []);

  // Smooth scroll with easing
  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const cardWidth = container.firstElementChild?.firstElementChild?.clientWidth || 0;
    const gap = 24; // 6 * 4px (gap-6)
    const scrollAmount = cardWidth + gap;
    
    const currentScroll = container.scrollLeft;
    const targetScroll = direction === 'left' 
      ? Math.max(0, currentScroll - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount);
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canScrollLeft) {
        scroll('left');
      } else if (e.key === 'ArrowRight' && canScrollRight) {
        scroll('right');
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [canScrollLeft, canScrollRight, scroll]);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Use passive listener for better performance
    container.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();

    return () => container.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  // Auto-scroll for mobile
  useEffect(() => {
    if (window.innerWidth >= 1024) return; // Desktop only

    const interval = setInterval(() => {
      if (canScrollRight) {
        scroll('right');
      } else {
        // Reset to beginning
        scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [canScrollRight, scroll]);

  return (
    <section className={cn("py-16 md:py-20 lg:py-24 bg-white", className)}>
      <div className="container max-w-[1400px] mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight"
          >
            {title}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex gap-2"
          >
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                "p-3 border border-black transition-all duration-300",
                canScrollLeft 
                  ? "bg-black text-white hover:bg-white hover:text-black" 
                  : "opacity-30 cursor-not-allowed"
              )}
              aria-label="Previous categories"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={cn(
                "p-3 border border-black transition-all duration-300",
                canScrollRight 
                  ? "bg-black text-white hover:bg-white hover:text-black" 
                  : "opacity-30 cursor-not-allowed"
              )}
              aria-label="Next categories"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        </div>

        {/* Scrollable Container */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {categories.map((category, index) => (
              <div 
                key={category.id} 
                className="flex-shrink-0 scroll-snap-align-start"
              >
                <CategoryCard category={category} index={index} />
              </div>
            ))}
          </div>

          {/* Gradient Edges */}
          <AnimatePresence>
            {canScrollLeft && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 top-0 bottom-4 w-24 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"
              />
            )}
            {canScrollRight && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-0 top-0 bottom-4 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Indicators */}
        <div className="flex justify-center gap-2 mt-8 md:hidden">
          {categories.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const container = scrollRef.current;
                if (!container) return;
                
                const cardWidth = container.firstElementChild?.firstElementChild?.clientWidth || 0;
                const gap = 24;
                const targetScroll = index * (cardWidth + gap);
                
                container.scrollTo({
                  left: targetScroll,
                  behavior: 'smooth'
                });
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-8 bg-black" 
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Go to category ${index + 1}`}
            />
          ))}
        </div>

        {/* View All Link */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link 
            href="/categories" 
            className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wide border-b-2 border-black pb-1 hover:gap-4 transition-all duration-300"
          >
            View All Categories
            <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Skeleton Loading State
export function CategoryScrollV2Skeleton() {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="container max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-12">
          <div className="h-8 w-48 bg-gray-200 animate-pulse" />
          <div className="flex gap-2">
            <div className="w-12 h-12 bg-gray-200 animate-pulse" />
            <div className="w-12 h-12 bg-gray-200 animate-pulse" />
          </div>
        </div>
        
        <div className="flex gap-6 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="aspect-[3/4] w-[280px] bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}