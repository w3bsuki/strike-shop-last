'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SectionHeader } from '@/components/ui/section-header';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAria, AccessibleButton } from '@/components/accessibility/aria-helpers';

type Category = {
  id: string;
  name: string;
  count: number;
  image: string;
  slug: string;
};

interface CategoryScrollProps {
  title: string;
  categories: Category[];
}

export default function CategoryScroll({
  title,
  categories,
}: CategoryScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { announceToScreenReader } = useAria();

  // Check scroll position to show/hide navigation buttons
  const checkScrollPosition = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Scroll handler with smooth animation
  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
    const targetScroll = direction === 'left' 
      ? scrollContainerRef.current.scrollLeft - scrollAmount
      : scrollContainerRef.current.scrollLeft + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    
    // Announce to screen readers
    announceToScreenReader(
      `Scrolled ${direction} in category carousel`,
      'polite'
    );
  }, [announceToScreenReader]);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', checkScrollPosition);
    checkScrollPosition();
    
    return () => container.removeEventListener('scroll', checkScrollPosition);
  }, [checkScrollPosition]);

  return (
    <section className="py-8 md:py-12 lg:py-16 bg-white" aria-labelledby="category-section-title">
      <div className="strike-container">
        <SectionHeader 
          id="category-section-title"
          title={title}
          ctaText="View All"
          ctaHref="/categories"
        />

        {/* Category Carousel Container */}
        <div className="relative group">
          {/* Navigation Buttons - Desktop Only */}
          <div className="hidden lg:block">
            <AccessibleButton
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-sm shadow-lg p-3 transition-all duration-200 ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              variant="ghost"
              description="Scroll categories carousel left"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </AccessibleButton>
            
            <AccessibleButton
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-sm shadow-lg p-3 transition-all duration-200 ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              variant="ghost"
              description="Scroll categories carousel right"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </AccessibleButton>
          </div>

          {/* Scrollable Container */}
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide scroll-smooth touch-pan-x"
            role="region"
            aria-label="Category carousel"
            tabIndex={0}
          >
            <div className="flex gap-3 sm:gap-4 lg:gap-6 pb-4">
              {categories.map((category, index) => (
                <Link
                  href={`/${category.slug}`}
                  key={category.id}
                  className="group relative flex-shrink-0 focus:outline-2 focus:outline-offset-2 focus:outline-primary rounded-none"
                  aria-label={`${category.name} category with ${category.count} items`}
                >
                  <div className="relative overflow-hidden bg-gray-50 transition-all duration-300 hover:shadow-xl active:scale-[0.98] touch-manipulation">
                    {/* Responsive aspect ratio container */}
                    <div className="relative aspect-square sm:aspect-[3/4] md:aspect-[4/5] lg:aspect-[3/4] w-[160px] sm:w-[180px] md:w-[200px] lg:w-[240px]">
                      <Image
                        src={category.image}
                        alt={`${category.name} category`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 240px"
                        priority={index < 3}
                        loading={index < 3 ? 'eager' : 'lazy'}
                      />
                      
                      {/* Subtle gradient overlay - 40% opacity */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/50" />
                      
                      {/* Category content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 lg:p-6">
                        <h3 className="text-white font-typewriter text-sm sm:text-base lg:text-lg font-semibold mb-1 transform transition-transform duration-300 group-hover:translate-y-[-2px]">
                          {category.name}
                        </h3>
                        <p className="text-white/90 font-typewriter text-xs sm:text-sm tracking-wide">
                          {category.count} {category.count === 1 ? 'Item' : 'Items'}
                        </p>
                      </div>

                      {/* Hover accent - subtle corner indicator */}
                      <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
                        <div className="absolute top-6 right-6 w-12 h-12 bg-white transform rotate-45 translate-x-full -translate-y-full transition-transform duration-300 group-hover:translate-x-1/2 group-hover:-translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile scroll indicator */}
          <div className="flex justify-center gap-1 mt-4 lg:hidden" role="tablist" aria-label="Category carousel pages">
            {categories.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 transition-all duration-300 ${index === 0 ? 'w-6 bg-black' : 'w-1.5 bg-gray-300'}`}
                role="tab"
                aria-selected={index === 0}
                aria-label={`Go to category page ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Loading skeleton for category cards
export function CategoryScrollSkeleton() {
  return (
    <section className="py-8 md:py-12 lg:py-16 bg-white">
      <div className="strike-container">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-gray-200 animate-pulse rounded-none" />
          <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-none" />
        </div>
        
        <div className="overflow-hidden">
          <div className="flex gap-3 sm:gap-4 lg:gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <div className="relative bg-gray-200 animate-pulse rounded-none">
                  <div className="aspect-square sm:aspect-[3/4] md:aspect-[4/5] lg:aspect-[3/4] w-[160px] sm:w-[180px] md:w-[200px] lg:w-[240px]" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 lg:p-6">
                    <div className="h-4 w-24 bg-gray-300 mb-2 rounded-none" />
                    <div className="h-3 w-16 bg-gray-300 rounded-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
