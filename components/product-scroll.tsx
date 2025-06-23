'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';

type Product = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  images?: string[];
  isNew?: boolean;
  soldOut?: boolean;
  slug: string;
  colors?: number;
  description?: string;
  sizes?: string[];
  sku?: string;
  variants?: Array<{
    id: string;
    title: string;
    sku?: string;
    prices?: any[];
  }>;
};

interface ProductScrollProps {
  title: string;
  products: Product[];
  viewAllLink?: string;
}

export default function ProductScroll({
  title,
  products,
  viewAllLink,
}: ProductScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollability, 350);
    }
  };

  return (
    <section className="section-padding">
      <div className="strike-container">
        <div className="flex justify-between items-center">
          <SectionHeader 
            title={title}
            ctaText="VIEW ALL"
            ctaHref={viewAllLink}
            showCta={!!viewAllLink}
            className="flex-1"
          />
          <div className="hidden md:flex space-x-2">
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="p-1.5 border border-subtle hover:border-black transition-colors duration-200"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="p-1.5 border border-subtle hover:border-black transition-colors duration-200"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-visible gap-3 md:gap-4 pb-1 horizontal-scroll-optimized"
          style={{ maxWidth: '100%' }}
          onScroll={checkScrollability}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              className="flex-shrink-0 w-44 sm:w-48 md:w-52 lg:w-60 snap-start touch-manipulation"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
