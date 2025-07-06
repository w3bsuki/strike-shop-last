'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface CategoryHeaderProps {
  categoryName: string;
  productCount: number;
  sortBy: string;
  setSortBy: (value: string) => void;
  activeFiltersCount: number;
  filterContent: React.ReactNode;
}

const sortOptions = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
];

export function CategoryHeader({
  categoryName,
  productCount,
  sortBy,
  setSortBy,
  activeFiltersCount,
  filterContent,
}: CategoryHeaderProps) {
  const [isSticky, setIsSticky] = useState(false);
  const selectedSort = sortOptions.find(opt => opt.value === sortBy);

  // Handle sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Main Header */}
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold font-typewriter mb-2 leading-tight"
        >
          {categoryName}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm sm:text-base text-gray-600 font-typewriter"
        >
          {productCount} {productCount === 1 ? 'Product' : 'Products'} Available
        </motion.p>
      </div>

      {/* Controls Bar - Sticky on Mobile */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`
          flex flex-col sm:flex-row justify-between items-start sm:items-center 
          gap-4 mb-6 pb-4 border-b border-gray-200
          ${isSticky ? 'lg:sticky lg:top-[60px] lg:bg-white lg:z-10 lg:pt-4 lg:-mx-4 lg:px-4 lg:shadow-sm' : ''}
        `}
      >
        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-typewriter text-gray-600">Active:</span>
            <Badge variant="secondary" className="font-typewriter text-xs">
              {activeFiltersCount} {activeFiltersCount === 1 ? 'Filter' : 'Filters'}
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 sm:flex-initial justify-between font-typewriter text-xs sm:text-sm min-h-[44px] px-4 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="hidden sm:inline text-gray-600">Sort:</span>
                  <span className="font-semibold">{selectedSort?.label || 'Select'}</span>
                </span>
                <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="font-typewriter w-56"
            >
              {sortOptions.map((option) => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`text-sm ${sortBy === option.value ? 'bg-gray-100 font-semibold' : ''}`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 sm:flex-initial lg:hidden font-typewriter text-xs sm:text-sm min-h-[44px] px-4 hover:bg-gray-50 transition-colors relative"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
              <SheetHeader className="p-6 pb-4 border-b">
                <SheetTitle className="font-typewriter text-lg flex items-center justify-between">
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="font-typewriter text-xs">
                      {activeFiltersCount} Active
                    </Badge>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="p-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                {filterContent}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>
    </>
  );
}
