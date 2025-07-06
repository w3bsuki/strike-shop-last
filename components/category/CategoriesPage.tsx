'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CategoryGrid, CategoryMasonry } from './CategoryGrid';
import { CategoryCard } from './CategoryCard';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  count: number;
  image: string;
  slug: string;
  description?: string;
}

interface CategoriesPageProps {
  categories: Category[];
  featuredCategories?: Category[];
}

export function CategoriesPage({ 
  categories, 
  featuredCategories = [] 
}: CategoriesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="strike-container py-8 sm:py-12 lg:py-16">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-typewriter mb-4">
            Shop by Category
          </h1>
          <p className="text-base sm:text-lg text-gray-600 font-typewriter max-w-2xl mx-auto">
            Explore our curated collections and find exactly what you're looking for
          </p>
        </motion.div>

        {/* Search and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8 sm:mb-12"
        >
          <div className="relative flex-1 max-w-md mx-auto sm:mx-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-typewriter min-h-[44px]"
            />
          </div>
          
          <div className="flex gap-2 justify-center sm:justify-start">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="font-typewriter text-sm"
            >
              Grid View
            </Button>
            <Button
              variant={viewMode === 'masonry' ? 'default' : 'outline'}
              onClick={() => setViewMode('masonry')}
              className="font-typewriter text-sm"
            >
              Masonry View
            </Button>
          </div>
        </motion.div>

        {/* Featured Categories */}
        {featuredCategories.length > 0 && searchQuery === '' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-12 sm:mb-16"
          >
            <h2 className="text-xl sm:text-2xl font-bold font-typewriter mb-6">
              Featured Collections
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {featuredCategories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  variant="featured"
                  priority={true}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* All Categories */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {searchQuery && (
            <p className="text-sm text-gray-600 font-typewriter mb-4">
              {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} found
            </p>
          )}
          
          {filteredCategories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-lg font-typewriter text-gray-600 mb-4">
                No categories found matching "{searchQuery}"
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="font-typewriter"
              >
                Clear Search
              </Button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <CategoryGrid 
              categories={filteredCategories} 
              columns={{ mobile: 2, tablet: 3, desktop: 4 }}
            />
          ) : (
            <CategoryMasonry categories={filteredCategories} />
          )}
        </motion.div>

        {/* Bottom CTA */}
        {filteredCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-gray-200"
          >
            <h3 className="text-lg sm:text-xl font-semibold font-typewriter mb-4">
              Can't find what you're looking for?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 font-typewriter mb-6">
              Browse all our products or contact us for assistance
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" className="font-typewriter">
                Browse All Products
              </Button>
              <Button variant="default" className="font-typewriter">
                Contact Support
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Loading state component
export function CategoriesPageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="strike-container py-8 sm:py-12 lg:py-16">
        {/* Header skeleton */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="h-10 w-64 bg-gray-200 animate-pulse mx-auto mb-4" />
          <div className="h-6 w-96 bg-gray-200 animate-pulse mx-auto" />
        </div>

        {/* Search skeleton */}
        <div className="mb-8 sm:mb-12">
          <div className="h-11 w-full max-w-md bg-gray-200 animate-pulse mx-auto sm:mx-0" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square sm:aspect-[4/5]" />
              <div className="mt-3">
                <div className="h-4 w-3/4 bg-gray-200 mb-2" />
                <div className="h-3 w-1/2 bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}