'use client';

import { Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { SizeGuideModal } from '../size-guide-modal';
import { useCategory } from '@/contexts/CategoryContext';

const AVAILABLE_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Gray', value: '#808080' },
  { name: 'Navy', value: '#000080' },
  { name: 'Brown', value: '#8B4513' },
  { name: 'Beige', value: '#F5F5DC' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
];

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function CategoryFilters() {
  const {
    filters: {
      searchQuery,
      selectedColors,
      selectedSizes,
      priceRange,
      inStockOnly,
    },
    setSearchQuery,
    toggleColor,
    toggleSize,
    setPriceRange,
    setInStockOnly,
    activeFiltersCount,
    clearFilters,
  } = useCategory();
  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium mb-2 font-['Typewriter']">
          SEARCH
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-['Typewriter'] text-xs"
          />
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-medium mb-3 font-['Typewriter']">
          COLOR
        </label>
        <div className="grid grid-cols-4 gap-2">
          {AVAILABLE_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => toggleColor(color.name)}
              className={`w-11 h-11 rounded-full border-2 transition-all flex items-center justify-center touch-manipulation ${
                selectedColors.includes(color.name)
                  ? 'border-black ring-2 ring-offset-1 ring-black'
                  : 'border-gray-300 hover:border-gray-500'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {selectedColors.includes(color.name) &&
                (color.value.toUpperCase() === '#FFFFFF' ||
                  color.value.toUpperCase() === '#F5F5DC') && (
                  <Check className="h-4 w-4 text-black" />
                )}
              {selectedColors.includes(color.name) &&
                !(
                  color.value.toUpperCase() === '#FFFFFF' ||
                  color.value.toUpperCase() === '#F5F5DC'
                ) && <Check className="h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium font-['Typewriter']">
            SIZE
          </label>
          <SizeGuideModal>
            <button className="text-xs font-medium text-gray-500 hover:text-black underline underline-offset-2">
              Size Guide
            </button>
          </SizeGuideModal>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {AVAILABLE_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`py-2 px-3 text-xs border font-['Typewriter'] transition-all min-h-[44px] touch-manipulation ${
                selectedSizes.includes(size)
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium mb-3 font-['Typewriter']">
          PRICE: £{priceRange[0]} - £{priceRange[1]}
        </label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={500}
          min={0}
          step={10}
          className="w-full"
        />
      </div>

      {/* In Stock */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="in-stock"
          checked={inStockOnly}
          onCheckedChange={(checked) => setInStockOnly(checked === true)}
        />
        <label
          htmlFor="in-stock"
          className="text-sm font-medium font-['Typewriter']"
        >
          IN STOCK ONLY
        </label>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full font-['Typewriter'] text-xs"
        >
          CLEAR ALL FILTERS ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
}
