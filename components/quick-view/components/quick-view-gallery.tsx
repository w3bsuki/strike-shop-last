'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface QuickViewGalleryProps {
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

export function QuickViewGallery({
  images,
  currentIndex,
  onIndexChange,
  productName,
  badges,
  className,
}: QuickViewGalleryProps) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchStart(touch.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchEnd(touch.clientX);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  return (
    <div className={cn('relative h-full bg-gray-50', className)}>
      {/* Image Container with Swipe Support */}
      <div
        className="relative h-full w-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, idx) => (
            <div key={idx} className="relative h-full w-full flex-shrink-0">
              <Image
                src={image}
                alt={`${productName} - Image ${idx + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority={idx === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onIndexChange(idx)}
              className={cn(
                'h-2 rounded-full transition-all touch-manipulation',
                idx === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 w-2 hover:bg-white/75'
              )}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        {badges?.soldOut && (
          <div className="bg-gray-900 text-white px-2 py-1 text-xs font-bold">
            SOLD OUT
          </div>
        )}
        {!badges?.soldOut && badges?.discount && (
          <div className="bg-destructive text-white px-2 py-1 text-xs font-bold">
            {badges.discount}
          </div>
        )}
        {!badges?.soldOut && !badges?.discount && badges?.isNew && (
          <div className="bg-black text-white px-2 py-1 text-xs font-bold">
            NEW
          </div>
        )}
      </div>
    </div>
  );
}