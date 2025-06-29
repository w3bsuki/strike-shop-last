'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    count: number;
    image: string;
    slug: string;
    description?: string;
  };
  variant?: 'default' | 'featured' | 'minimal';
  priority?: boolean;
  index?: number;
}

export const CategoryCard = React.memo(({ 
  category, 
  variant = 'default',
  priority = false
}: CategoryCardProps) => {

  if (variant === 'minimal') {
    return (
      <div className="group">
        <Link 
          href={`/${category.slug}`}
          className="block relative overflow-hidden bg-gray-50 transition-shadow duration-300 hover:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-primary"
        >
          <div className="aspect-[16/9] relative">
            <div className="absolute inset-0">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={priority}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-typewriter text-base font-semibold">
              {category.name}
            </h3>
            <p className="font-typewriter text-xs opacity-90 mt-1">
              {category.count} {category.count === 1 ? 'Item' : 'Items'}
            </p>
          </div>
        </Link>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="group">
        <Link 
          href={`/${category.slug}`}
          className="block relative overflow-hidden bg-gray-50 transition-all duration-300 hover:shadow-2xl focus:outline-2 focus:outline-offset-2 focus:outline-primary"
        >
          <div className="aspect-[4/5] sm:aspect-[3/4] relative">
            <div className="absolute inset-0">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={priority}
              />
            </div>
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
              <div>
                <h3 className="font-typewriter text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="font-typewriter text-sm text-white/90 mb-3 line-clamp-2">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="font-typewriter text-sm text-white/80">
                    {category.count} {category.count === 1 ? 'Product' : 'Products'}
                  </p>
                  <div className="flex items-center text-white">
                    <span className="font-typewriter text-sm font-semibold mr-2">Shop Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Default variant
  return (
    <div className="group">
      <Link 
        href={`/${category.slug}`}
        className="block relative overflow-hidden bg-gray-50 transition-shadow duration-300 hover:shadow-xl focus:outline-2 focus:outline-offset-2 focus:outline-primary touch-manipulation"
      >
        <div className="aspect-square sm:aspect-[4/5] relative">
          <div className="absolute inset-0">
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
            />
          </div>
          
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <div>
              <h3 className="font-typewriter text-base sm:text-lg font-semibold text-white mb-1">
                {category.name}
              </h3>
              <div className="flex items-center justify-between">
                <p className="font-typewriter text-xs sm:text-sm text-white/90">
                  {category.count} {category.count === 1 ? 'Item' : 'Items'}
                </p>
                <div className="text-white">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
});

CategoryCard.displayName = 'CategoryCard';

// Loading skeleton
export function CategoryCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'featured' | 'minimal' }) {
  const aspectClass = variant === 'minimal' 
    ? 'aspect-[16/9]' 
    : variant === 'featured'
    ? 'aspect-[4/5] sm:aspect-[3/4]'
    : 'aspect-square sm:aspect-[4/5]';

  return (
    <div className="animate-pulse">
      <div className={`bg-gray-200 ${aspectClass} relative`}>
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <div className="h-4 w-24 bg-gray-300 mb-2" />
          <div className="h-3 w-16 bg-gray-300" />
        </div>
      </div>
    </div>
  );
}