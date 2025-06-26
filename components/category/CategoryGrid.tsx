'use client';

import React from 'react';
import { CategoryCard, CategoryCardSkeleton } from './CategoryCard';
import { motion } from 'framer-motion';

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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={gridClasses}
    >
      {categories.map((category, index) => (
        <CategoryCard
          key={category.id}
          category={category}
          variant={variant}
          priority={index < 4}
          index={index}
        />
      ))}
    </motion.div>
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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-4 lg:gap-6"
    >
      {categories.map((category, index) => (
        <div key={category.id} className="break-inside-avoid mb-3 sm:mb-4 lg:mb-6">
          <CategoryCard
            category={category}
            variant={index % 3 === 0 ? 'featured' : 'default'}
            priority={index < 4}
            index={index}
          />
        </div>
      ))}
    </motion.div>
  );
}