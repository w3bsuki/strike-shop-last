// Server Component - CVE-2025-29927 Compliant Performance Optimization
import React from 'react';
import { CategoryCard, CategoryCardSkeleton } from './CategoryCard';

interface Category {
  id: string;
  name: string;
  count: number;
  image: string;
  slug: string;
  description?: string;
}

interface CategoryGridProps {
  categories: Category[];
  variant?: 'default' | 'featured' | 'minimal';
  loading?: boolean;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export function CategoryGrid({ 
  categories, 
  variant = 'default',
  loading = false,
  columns = {
    mobile: 2,
    tablet: 3,
    desktop: 4
  }
}: CategoryGridProps) {
  // CSS-based animation classes (replacing Framer Motion for performance)
  const animationClasses = 'animate-fade-in-up';

  // Generate responsive grid classes
  const gridClasses = `
    grid gap-3 sm:gap-4 lg:gap-6
    grid-cols-${columns.mobile} 
    sm:grid-cols-${columns.tablet} 
    lg:grid-cols-${columns.desktop}
  `;

  if (loading) {
    return (
      <div className={gridClasses}>
        {[...Array(8)].map((_, i) => (
          <CategoryCardSkeleton key={i} variant={variant} />
        ))}
      </div>
    );
  }

  return (
    <div className={`${gridClasses} ${animationClasses}`}>
      {categories.map((category, index) => (
        <div 
          key={category.id}
          className="animate-fade-in-stagger"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CategoryCard
            category={category}
            variant={variant}
            priority={index < 4}
            index={index}
          />
        </div>
      ))}
    </div>
  );
}

// Masonry layout variant for more dynamic displays
export function CategoryMasonry({ 
  categories, 
  loading = false 
}: { 
  categories: Category[];
  loading?: boolean;
}) {
  // CSS-based animation classes (replacing Framer Motion for performance)
  const animationClasses = 'animate-fade-in-up';

  if (loading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="break-inside-avoid mb-3 sm:mb-4 lg:mb-6">
            <CategoryCardSkeleton variant={i % 3 === 0 ? 'featured' : 'default'} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-4 lg:gap-6 ${animationClasses}`}>
      {categories.map((category, index) => (
        <div 
          key={category.id} 
          className="break-inside-avoid mb-3 sm:mb-4 lg:mb-6 animate-fade-in-stagger"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CategoryCard
            category={category}
            variant={index % 3 === 0 ? 'featured' : 'default'}
            priority={index < 4}
            index={index}
          />
        </div>
      ))}
    </div>
  );
}