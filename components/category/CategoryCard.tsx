'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

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
          className="block relative overflow-hidden bg-gray-800 rounded-md border border-border transition-all duration-200 hover:shadow-lg hover:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
        >
          <div className="aspect-[16/9] relative p-4 flex flex-col justify-between">
            {/* Icon */}
            <div className="flex justify-end">
              <div className="h-8 w-8 bg-gray-700 rounded-md flex items-center justify-center">
                <CategoryIcon 
                  categoryName={category.name} 
                  size={16}
                  className="text-gray-300"
                />
              </div>
            </div>
            
            {/* Content */}
            <div className="text-white">
              <h3 className="font-typewriter text-base font-semibold">
                {category.name}
              </h3>
              <p className="font-typewriter text-xs text-gray-300 mt-1">
                {category.count} {category.count === 1 ? 'Item' : 'Items'}
              </p>
            </div>
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
          className="block relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-md border border-border transition-all duration-200 hover:shadow-2xl hover:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
        >
          <div className="aspect-[4/5] sm:aspect-[3/4] relative p-6 lg:p-8 flex flex-col justify-between">
            {/* Icon */}
            <div className="flex justify-end">
              <div className="h-12 w-12 bg-primary/20 rounded-md flex items-center justify-center">
                <CategoryIcon 
                  categoryName={category.name} 
                  size={24}
                  className="text-primary-foreground"
                />
              </div>
            </div>
            
            {/* Content */}
            <div>
              <h3 className="font-typewriter text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                {category.name}
              </h3>
              {category.description && (
                <p className="font-professional text-sm text-gray-300 mb-3 line-clamp-2">
                  {category.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="font-professional text-sm text-gray-400">
                  {category.count} {category.count === 1 ? 'Product' : 'Products'}
                </p>
                <div className="flex items-center text-white">
                  <span className="font-typewriter text-sm font-semibold mr-2">Shop Now</span>
                  <ArrowRight className="h-4 w-4" />
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
        className="block relative overflow-hidden bg-gray-900 rounded-md border border-border transition-all duration-200 hover:shadow-lg hover:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary touch-manipulation"
      >
        <div className="aspect-square sm:aspect-[4/5] relative p-4 sm:p-5 flex flex-col justify-between">
          {/* Icon */}
          <div className="flex justify-end">
            <div className="h-10 w-10 bg-gray-800 rounded-md flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
              <CategoryIcon 
                categoryName={category.name} 
                size={20}
                className="text-gray-300 group-hover:text-primary-foreground transition-colors duration-200"
              />
            </div>
          </div>
          
          {/* Content */}
          <div>
            <h3 className="font-typewriter text-base sm:text-lg font-semibold text-white mb-1">
              {category.name}
            </h3>
            <div className="flex items-center justify-between">
              <p className="font-professional text-xs sm:text-sm text-gray-400">
                {category.count} {category.count === 1 ? 'Item' : 'Items'}
              </p>
              <div className="text-gray-300 group-hover:text-white transition-colors duration-200">
                <ArrowRight className="h-4 w-4" />
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

  const bgClass = variant === 'featured'
    ? 'bg-gradient-to-br from-gray-900 to-black'
    : variant === 'minimal' 
    ? 'bg-gray-800'
    : 'bg-gray-900';

  return (
    <div className="animate-pulse">
      <div className={`${bgClass} ${aspectClass} relative rounded-md border border-border p-4 sm:p-5 flex flex-col justify-between`}>
        {/* Icon skeleton */}
        <div className="flex justify-end">
          <div className="h-8 w-8 bg-gray-700 rounded-md" />
        </div>
        
        {/* Content skeleton */}
        <div>
          <div className="h-4 w-24 bg-gray-700 mb-2 rounded" />
          <div className="h-3 w-16 bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}