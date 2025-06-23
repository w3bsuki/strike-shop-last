'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  productName: string;
  badges?: {
    discount?: string;
    isNew?: boolean;
    soldOut?: boolean;
  };
}

export function ProductImageGallery({
  images,
  currentIndex,
  onIndexChange,
  productName,
  badges,
}: ProductImageGalleryProps) {
  const nextImage = () => {
    onIndexChange((currentIndex + 1) % images.length);
  };

  const prevImage = () => {
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="relative bg-gray-50">
      <div className="relative aspect-square lg:aspect-auto lg:h-full">
        <Image
          src={images[currentIndex] || '/placeholder.svg'}
          alt={`${productName} - View ${currentIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Image Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => onIndexChange(index)}
                className={`w-2 h-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 space-y-2">
          {badges?.discount && (
            <span className="bg-red-600 text-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
              {badges.discount}
            </span>
          )}
          {badges?.isNew && !badges?.discount && (
            <span className="bg-black text-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
              NEW
            </span>
          )}
          {badges?.soldOut && (
            <span className="bg-gray-600 text-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
              SOLD OUT
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
