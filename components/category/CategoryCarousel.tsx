"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  count: number;
}

interface CategoryCarouselProps {
  categories: Category[];
  title?: string;
  className?: string;
}

export function CategoryCarousel({ categories, title = "SHOP BY CATEGORY", className }: CategoryCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScrollButtons = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  React.useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
    return undefined;
  }, [checkScrollButtons]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className={cn("relative w-full", className)}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-strike-label text-black">
            {title}
          </h2>
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                "w-10 h-10 flex items-center justify-center",
                "border-2 border-black bg-white",
                "transition-all duration-300",
                "hover:bg-black hover:text-white",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
              )}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={cn(
                "w-10 h-10 flex items-center justify-center",
                "border-2 border-black bg-white",
                "transition-all duration-300",
                "hover:bg-black hover:text-white",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
              )}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Category Carousel */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="flex-shrink-0 w-[280px] md:w-[320px] lg:w-[360px] group"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="strike-category-card">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="strike-category-image"
                    sizes="(max-width: 768px) 280px, (max-width: 1024px) 320px, 360px"
                  />
                  <div className="strike-category-overlay" />
                  <div className="strike-category-content">
                    <h3 className="strike-category-title">
                      {category.name}
                    </h3>
                    <p className="strike-category-count">
                      {category.count} PRODUCTS
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Scroll Indicator */}
        <div className="flex justify-center mt-6 gap-1 md:hidden">
          {categories.map((_, index) => (
            <div
              key={index}
              className="w-1.5 h-1.5 bg-gray-300"
            />
          ))}
        </div>
      </div>
    </section>
  );
}