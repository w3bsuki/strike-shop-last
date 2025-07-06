"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { layoutClasses } from "@/lib/layout/config";

// Category Navigation Component
interface CategoryNavigationProps {
  categories: {
    id: string;
    name: string;
    count: number;
    href: string;
  }[];
}

function CategoryNavigation({ categories }: CategoryNavigationProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const itemWidth = 180; // Approximate width per category
  const maxScroll = Math.max(0, (categories.length * itemWidth) - (typeof window !== 'undefined' ? window.innerWidth - 200 : 800));

  const scrollLeft = () => {
    const newPosition = Math.max(0, scrollPosition - itemWidth * 3);
    setScrollPosition(newPosition);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const newPosition = Math.min(maxScroll, scrollPosition + itemWidth * 3);
    setScrollPosition(newPosition);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white border-t border-black flex-grow relative">
      <div className={cn(layoutClasses.container, "md:block px-0 md:px-6")}>
        {/* Desktop: Single row with arrows */}
        <div className="hidden md:flex items-center py-3">
          {/* Left Arrow */}
          <button
            onClick={scrollLeft}
            disabled={scrollPosition <= 0}
            className="flex-shrink-0 p-2 mr-4 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Categories */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex -ml-px">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={category.href}
                  className="group relative bg-black text-white hover:bg-white hover:text-black border border-white hover:border-black transition-all duration-200 flex-shrink-0 -ml-px first:ml-0"
                  style={{ minWidth: `${itemWidth}px` }}
                >
                  <div className="px-5 py-4 text-center">
                    <div className="font-bold text-sm uppercase tracking-wider mb-1">
                      {category.name}
                    </div>
                    <div className="text-xs opacity-80 group-hover:opacity-100">
                      {category.count} ITEMS
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={scrollRight}
            disabled={scrollPosition >= maxScroll}
            className="flex-shrink-0 p-2 ml-4 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Scroll categories right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile: Single Row Horizontal Scroll */}
        <div className="md:hidden overflow-x-auto scrollbar-hide">
          <div className="flex">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="group bg-black text-white hover:bg-white hover:text-black border-r border-white hover:border-black transition-all duration-200 flex-shrink-0 last:border-r-0"
              >
                <div className="py-6 px-4 text-center min-w-[140px]">
                  <div className="font-bold text-sm uppercase tracking-wider">
                    {category.name}
                  </div>
                  <div className="text-xs mt-1 opacity-80 group-hover:opacity-100">
                    {category.count} ITEMS
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface HeroSlide {
  id: string;
  image: string;
  mobileImage?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  cta: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  theme?: "light" | "dark";
}

interface StrikeHeroCarouselProps {
  slides: HeroSlide[];
  autoPlayInterval?: number;
  showCategoryBar?: boolean;
  categories?: {
    id: string;
    name: string;
    count: number;
    href: string;
  }[];
}

export function StrikeHeroCarousel({ 
  slides, 
  autoPlayInterval = 8000,
  showCategoryBar = true,
  categories = []
}: StrikeHeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isAutoPlaying, autoPlayInterval, slides.length]);

  // Handle navigation
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0]?.clientX || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX || 0);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && distance !== 0) {
      nextSlide();
    } else if (isRightSwipe && distance !== 0) {
      prevSlide();
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="relative w-full bg-white overflow-hidden flex flex-col">
      {/* Hero Carousel - Fixed height */}
      <section
        className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden bg-white flex-shrink-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Strike Brand Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div 
            className="w-full h-full" 
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, black 35px, black 70px)`,
            }} 
          />
        </div>
        
        {/* Slides */}
        <div className="relative w-full h-full">
          {slides.map((slideItem, index) => (
            <div
              key={slideItem.id}
              className={cn(
                "absolute inset-0 w-full h-full transition-opacity duration-1000",
                index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src={slideItem.mobileImage || slideItem.image}
                  alt={slideItem.title}
                  fill
                  priority={index === 0}
                  quality={90}
                  className="object-cover md:hidden"
                  sizes="100vw"
                />
                <Image
                  src={slideItem.image}
                  alt={slideItem.title}
                  fill
                  priority={index === 0}
                  quality={90}
                  className="hidden md:block object-cover"
                  sizes="100vw"
                />
              </div>

              {/* Content Overlay - Perfect center alignment */}
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <div className="text-center max-w-4xl mx-auto">
                  {/* Badge */}
                  {slideItem.badge && (
                    <div className="mb-4 md:mb-6">
                      <span className="inline-block px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] bg-black text-white">
                        {slideItem.badge}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black uppercase leading-[0.85] tracking-[-0.02em] mb-4 md:mb-6">
                    {slideItem.title}
                  </h1>

                  {/* Subtitle */}
                  {slideItem.subtitle && (
                    <p className="text-sm md:text-lg lg:text-xl font-medium uppercase tracking-[0.1em] opacity-90 max-w-2xl mx-auto">
                      {slideItem.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows - Desktop Only */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 bg-black/10 backdrop-blur-sm border border-black/20 hover:bg-black hover:text-white transition-all duration-300 group"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextSlide}
              className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 bg-black/10 backdrop-blur-sm border border-black/20 hover:bg-black hover:text-white transition-all duration-300 group"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* CTA Button - Bottom center */}
        {slide && (
          <div className="absolute bottom-8 md:bottom-12 lg:bottom-16 left-1/2 -translate-x-1/2">
            <Link
              href={slide.cta.href}
              className={cn(
                "group inline-flex items-center justify-center",
                "px-8 py-3 md:px-10 md:py-4",
                "text-xs md:text-sm font-bold uppercase tracking-[0.15em]",
                "transition-all duration-300",
                "border-2 min-w-[200px]",
                "bg-black text-white border-black hover:bg-white hover:text-black"
              )}
            >
              {slide.cta.text}
              <ArrowRight className="ml-3 h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}

      </section>

      {/* Moving Marquee - Separation between hero and categories */}
      <div className="bg-white text-black py-2 overflow-hidden flex-shrink-0 border-t border-black/10">
        <div className="whitespace-nowrap animate-marquee">
          <span className="inline-block px-8 text-xs font-bold uppercase tracking-wider">
            FREE SHIPPING ON ORDERS OVER $150 • PREMIUM QUALITY • SUSTAINABLE MATERIALS • 24/7 SUPPORT • NEW ARRIVALS WEEKLY • EXCLUSIVE MEMBER DEALS • FREE RETURNS • PREMIUM QUALITY • SUSTAINABLE MATERIALS • 24/7 SUPPORT • NEW ARRIVALS WEEKLY • EXCLUSIVE MEMBER DEALS • FREE RETURNS • FREE SHIPPING ON ORDERS OVER $150 • PREMIUM QUALITY • SUSTAINABLE MATERIALS • 24/7 SUPPORT • NEW ARRIVALS WEEKLY • EXCLUSIVE MEMBER DEALS • FREE RETURNS • PREMIUM QUALITY • SUSTAINABLE MATERIALS • 24/7 SUPPORT • NEW ARRIVALS WEEKLY • EXCLUSIVE MEMBER DEALS • FREE RETURNS
          </span>
        </div>
      </div>

      {/* Category Bar - Single row with navigation */}
      {showCategoryBar && categories.length > 0 && (
        <CategoryNavigation categories={categories} />
      )}
    </div>
  );
}