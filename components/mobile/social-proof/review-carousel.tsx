'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TestimonialCard } from './testimonial-card';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface Review {
  id: string;
  author: {
    name: string;
    avatar?: string;
    username?: string;
    verified?: boolean;
  };
  content: string;
  rating: number;
  date: string;
  product?: {
    name: string;
    href?: string;
  };
  helpful?: {
    yes: number;
    no: number;
  };
}

interface ReviewCarouselProps {
  reviews: Review[];
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'compact' | 'featured';
  showNavigation?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

export function ReviewCarousel({
  reviews,
  title = 'Customer Reviews',
  subtitle,
  variant = 'default',
  showNavigation = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  className,
}: ReviewCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { triggerHaptic } = useHapticFeedback();

  // Calculate average rating
  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);

      // Update active index
      const cardWidth = variant === 'featured' ? 320 : 280;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  // Auto-play functionality - DISABLED on mobile for performance
  useEffect(() => {
    if (!autoPlay || !scrollRef.current) return;
    
    // Disable auto-play on mobile to improve performance
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;

    const interval = setInterval(() => {
      if (activeIndex < reviews.length - 1) {
        scrollToIndex(activeIndex + 1);
      } else {
        scrollToIndex(0);
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, activeIndex, reviews.length]);

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    
    const cardWidth = variant === 'featured' ? 320 : 280;
    const gap = 16; // 4 * 4px (gap-4)
    const scrollPosition = index * (cardWidth + gap);
    
    scrollRef.current.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    });
    
    triggerHaptic('light');
    setTimeout(checkScrollability, 350);
  };

  const scroll = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left' 
      ? Math.max(0, activeIndex - 1)
      : Math.min(reviews.length - 1, activeIndex + 1);
    
    scrollToIndex(newIndex);
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => scroll('right'),
    onSwipeRight: () => scroll('left'),
    threshold: 30,
  });

  return (
    <section className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-1">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
          
          {/* Rating Summary */}
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < Math.round(averageRating)
                      ? 'fill-black text-black'
                      : 'fill-gray-200 text-gray-200'
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium">
              {averageRating.toFixed(1)} ({reviews.length} reviews)
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        {showNavigation && (
          <div className="hidden md:flex space-x-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                'p-2 border transition-all duration-200',
                canScrollLeft
                  ? 'border-black hover:bg-black hover:text-white'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              )}
              aria-label="Previous review"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={cn(
                'p-2 border transition-all duration-200',
                canScrollRight
                  ? 'border-black hover:bg-black hover:text-white'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              )}
              aria-label="Next review"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-visible gap-4 pb-1 horizontal-scroll snap-x snap-mandatory"
          onScroll={checkScrollability}
          {...swipeHandlers}
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              className={cn(
                'flex-shrink-0 snap-start',
                variant === 'compact' && 'w-[250px]',
                variant === 'default' && 'w-[280px] sm:w-[320px]',
                variant === 'featured' && 'w-[320px] sm:w-[400px]'
              )}
            >
              <TestimonialCard
                author={review.author}
                content={review.content}
                rating={review.rating}
                date={review.date}
                {...(review.product && { product: review.product })}
                variant={variant}
                className="h-full"
              />
              
              {/* Helpful Votes */}
              {review.helpful && (
                <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600">
                  <button className="hover:text-black transition-colors">
                    Helpful ({review.helpful.yes})
                  </button>
                  <button className="hover:text-black transition-colors">
                    Not helpful ({review.helpful.no})
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Indicators */}
        <div className="flex justify-center mt-4 space-x-1 md:hidden">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={cn(
                'h-1.5 transition-all duration-200',
                index === activeIndex
                  ? 'bg-black w-6'
                  : 'bg-gray-300 w-1.5',
                'rounded-full'
              )}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}