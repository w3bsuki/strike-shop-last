'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickViewImageProps {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  productName: string;
  badges?: {
    discount?: string;
    isNew?: boolean;
    soldOut?: boolean;
  };
  className?: string;
}

export function QuickViewImage({
  images,
  currentIndex,
  onIndexChange,
  productName,
  badges,
  className,
}: QuickViewImageProps) {
  const handlePrevious = () => {
    onIndexChange(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  };

  const handleNext = () => {
    onIndexChange(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
  };

  return (
    <div className={cn('relative h-full bg-gray-50 group', className)}>
      {/* Main Image */}
      <div className="relative h-full w-full">
        {(images[currentIndex] || images[0]) && (
          <Image
            src={(images[currentIndex] || images[0]) || '/placeholder.svg?height=400&width=400'}
            alt={`${productName} - Image ${currentIndex + 1}`}
            fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        )}
      </div>

      {/* Navigation Arrows - Only show if multiple images */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={() => onIndexChange(idx)}
              className={cn(
                'relative h-16 w-16 overflow-hidden rounded-md border-2 transition-all',
                idx === currentIndex
                  ? 'border-black ring-2 ring-black ring-offset-2'
                  : 'border-transparent hover:border-gray-400'
              )}
              aria-label={`Go to image ${idx + 1}`}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {badges?.soldOut && (
          <div className="bg-gray-900 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
            Sold Out
          </div>
        )}
        {!badges?.soldOut && badges?.discount && (
          <div className="bg-destructive text-white px-3 py-1.5 text-xs font-bold">
            {badges.discount}
          </div>
        )}
        {!badges?.soldOut && !badges?.discount && badges?.isNew && (
          <div className="bg-black text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
            New
          </div>
        )}
      </div>
    </div>
  );
}