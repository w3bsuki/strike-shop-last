"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface SeasonalProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  slug: string;
}

interface SeasonalSlide {
  id: string;
  season: string;
  title: string;
  description: string;
  story: string;
  mainImage: string;
  mobileImage?: string;
  lookImage: string;
  products: SeasonalProduct[];
  cta: {
    text: string;
    href: string;
  };
  theme?: "light" | "dark";
}

interface SeasonalCollectionCarouselProps {
  slides: SeasonalSlide[];
  autoPlayInterval?: number;
  className?: string;
}

export function SeasonalCollectionCarousel({
  slides,
  autoPlayInterval = 10000,
  className
}: SeasonalCollectionCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isAutoPlaying, autoPlayInterval, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const slide = slides[currentIndex];
  if (!slide) return null;
  
  const isLightTheme = slide.theme === "light";

  return (
    <section className={cn("relative w-full overflow-hidden", isLightTheme ? "bg-white text-black" : "bg-black text-white", className)}>
      <div className="relative min-h-[600px] md:min-h-[800px] lg:min-h-[900px]">
        {slides.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              index === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {/* Background Pattern/Texture */}
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, ${isLightTheme ? 'black' : 'white'} 35px, ${isLightTheme ? 'black' : 'white'} 70px)`,
              }} />
            </div>

            {/* Content Grid */}
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 py-12 md:py-16 lg:py-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 h-full">
                {/* Left: Editorial Content */}
                <div className="flex flex-col justify-center">
                  <div className="mb-8">
                    <p className={cn("text-sm font-medium uppercase tracking-wider mb-4", isLightTheme ? "text-black/60" : "text-white/60")}>
                      {item.season}
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black uppercase leading-[0.9] mb-4 md:mb-6">
                      {item.title}
                    </h2>
                    <p className={cn("text-base md:text-lg lg:text-xl mb-4 md:mb-6", isLightTheme ? "text-black/80" : "text-white/80")}>
                      {item.description}
                    </p>
                    <p className={cn("text-sm md:text-base mb-6 md:mb-8", isLightTheme ? "text-black/70" : "text-white/70")}>
                      {item.story}
                    </p>
                    <Link
                      href={item.cta.href}
                      className={cn(
                        "inline-flex items-center gap-3",
                        "px-8 py-4 text-sm font-bold uppercase tracking-wider",
                        "border-2 transition-all duration-300",
                        isLightTheme 
                          ? "bg-black text-white border-black hover:bg-white hover:text-black" 
                          : "bg-white text-black border-white hover:bg-black hover:text-white hover:border-white"
                      )}
                    >
                      <ShoppingBag className="h-5 w-5" />
                      {item.cta.text}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Product Thumbnails */}
                  <div className="mt-8 md:mt-12">
                    <p className={cn("text-xs sm:text-sm font-bold uppercase tracking-wider mb-3 md:mb-4", isLightTheme ? "text-black/60" : "text-white/60")}>
                      FEATURED IN THIS LOOK
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {item.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          className={cn(
                            "group relative aspect-square overflow-hidden",
                            "border-2 transition-all duration-300",
                            isLightTheme ? "border-black/20 hover:border-black" : "border-white/20 hover:border-white"
                          )}
                          onMouseEnter={() => setSelectedProduct(product.id)}
                          onMouseLeave={() => setSelectedProduct(null)}
                        >
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100px, 150px"
                          />
                          <div className={cn(
                            "absolute inset-0 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity",
                            isLightTheme ? "bg-black/60" : "bg-white/20"
                          )}>
                            <div className="text-white text-xs">
                              <p className="font-bold truncate">{product.name}</p>
                              <p>{product.price}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Look Image */}
                <div className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-full order-first lg:order-last">
                  <div className="relative h-full">
                    <Image
                      src={item.lookImage}
                      alt={`${item.title} Look`}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    {/* Hover Product Info */}
                    {selectedProduct && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center animate-fade-in">
                        <div className="bg-white p-4 text-black text-center">
                          <p className="text-sm font-bold uppercase">Click to shop</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className={cn(
                "absolute left-4 lg:left-8 top-1/2 -translate-y-1/2",
                "w-12 h-12 flex items-center justify-center",
                "backdrop-blur-sm border transition-all duration-300",
                isLightTheme
                  ? "bg-black/10 border-black/20 hover:bg-black hover:text-white"
                  : "bg-white/10 border-white/20 hover:bg-white hover:text-black"
              )}
              aria-label="Previous look"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextSlide}
              className={cn(
                "absolute right-4 lg:right-8 top-1/2 -translate-y-1/2",
                "w-12 h-12 flex items-center justify-center",
                "backdrop-blur-sm border transition-all duration-300",
                isLightTheme
                  ? "bg-black/10 border-black/20 hover:bg-black hover:text-white"
                  : "bg-white/10 border-white/20 hover:bg-white hover:text-black"
              )}
              aria-label="Next look"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "transition-all duration-300",
                  index === currentIndex
                    ? `w-12 h-1 ${isLightTheme ? 'bg-black' : 'bg-white'}`
                    : `w-1 h-1 ${isLightTheme ? 'bg-black/40 hover:bg-black/60' : 'bg-white/40 hover:bg-white/60'}`
                )}
                aria-label={`Go to look ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}