'use client';

import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface CategoryHeaderProps {
  categoryName: string;
  productCount: number;
  sortBy: string;
  setSortBy: (value: string) => void;
  activeFiltersCount: number;
  filterContent: React.ReactNode;
}

export function CategoryHeader({
  categoryName,
  productCount,
  sortBy,
  setSortBy,
  activeFiltersCount,
  filterContent,
}: CategoryHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 pb-4 border-b border-subtle">
      <h1 className="text-lg font-bold uppercase tracking-wider mb-4 lg:mb-0 font-['Typewriter']">
        {categoryName}{' '}
        <span className="text-xs font-normal text-muted-foreground ml-1">
          ({productCount} items)
        </span>
      </h1>
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="strike-text"
              className="!border !border-border !py-2.5 !px-4 min-h-[44px] touch-manipulation"
            >
              SORT BY <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="font-['Typewriter'] text-xs"
          >
            <DropdownMenuItem onClick={() => setSortBy('newest')}>
              Newest
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('price-low')}>
              Price: Low to High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('price-high')}>
              Price: High to Low
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('popularity')}>
              Popularity
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile Filter Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="strike-text"
              className="!border !border-border !py-2.5 !px-4 lg:hidden min-h-[44px] touch-manipulation"
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              FILTERS {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-['Typewriter'] text-left">
                FILTERS
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
