'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { ProductFilters as FilterType } from '@/types/integrated';

interface ProductFiltersProps {
  filters: {
    categories: Array<{ value: string; label: string; count: number }>;
    sizes: Array<{ value: string; label: string; count: number }>;
    colors: Array<{
      value: string;
      label: string;
      hex?: string;
      count: number;
    }>;
    brands: Array<{ value: string; label: string; count: number }>;
    priceRange: { min: number; max: number };
  };
  applied: FilterType;
}

/**
 * Client Component - Product Filters
 * Handles filter interactions and URL updates
 */
export function ProductFilters({ filters, applied }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (type: string, value: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValues = params.get(type)?.split(',').filter(Boolean) || [];

    if (checked) {
      currentValues.push(value);
    } else {
      const index = currentValues.indexOf(value);
      if (index > -1) currentValues.splice(index, 1);
    }

    if (currentValues.length > 0) {
      params.set(type, currentValues.join(','));
    } else {
      params.delete(type);
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const updatePriceRange = (values: number[]) => {
    if (values.length < 2 || values[0] === undefined || values[1] === undefined) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('minPrice', values[0].toString());
    params.set('maxPrice', values[1].toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.push(window.location.pathname, { scroll: false });
  };

  const hasActiveFilters = searchParams.toString().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        )}
      </div>

      <Accordion
        type="multiple"
        defaultValue={['categories', 'sizes', 'colors', 'price']}
      >
        {/* Categories */}
        {filters.categories.length > 0 && (
          <AccordionItem value="categories">
            <AccordionTrigger className="text-xs font-bold uppercase tracking-wider">
              Categories
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {filters.categories.map((category) => (
                  <div
                    key={category.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`category-${category.value}`}
                      checked={
                        applied.categories?.includes(category.value) || false
                      }
                      onCheckedChange={(checked) =>
                        updateFilter(
                          'categories',
                          category.value,
                          checked as boolean
                        )
                      }
                    />
                    <Label
                      htmlFor={`category-${category.value}`}
                      className="text-sm font-normal cursor-pointer flex-1 flex justify-between"
                    >
                      <span>{category.label}</span>
                      <span className="text-muted-foreground">
                        ({category.count})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Sizes */}
        {filters.sizes.length > 0 && (
          <AccordionItem value="sizes">
            <AccordionTrigger className="text-xs font-bold uppercase tracking-wider">
              Sizes
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-2">
                {filters.sizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => {
                      const isSelected = applied.sizes?.includes(size.value);
                      updateFilter('sizes', size.value, !isSelected);
                    }}
                    className={`min-h-[44px] px-3 text-xs font-medium border transition-colors touch-manipulation ${
                      applied.sizes?.includes(size.value)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-gray-200 hover:border-black'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Colors */}
        {filters.colors.length > 0 && (
          <AccordionItem value="colors">
            <AccordionTrigger className="text-xs font-bold uppercase tracking-wider">
              Colors
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {filters.colors.map((color) => (
                  <div
                    key={color.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`color-${color.value}`}
                      checked={applied.colors?.includes(color.value) || false}
                      onCheckedChange={(checked) =>
                        updateFilter('colors', color.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`color-${color.value}`}
                      className="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
                    >
                      {color.hex && (
                        <span
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: color.hex }}
                        />
                      )}
                      <span className="flex-1">{color.label}</span>
                      <span className="text-muted-foreground">
                        ({color.count})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider">
            Price
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider
                min={filters.priceRange.min}
                max={filters.priceRange.max}
                step={10}
                value={[
                  applied.priceRange?.min || filters.priceRange.min,
                  applied.priceRange?.max || filters.priceRange.max,
                ]}
                onValueChange={updatePriceRange}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs">
                <span>
                  £{applied.priceRange?.min || filters.priceRange.min}
                </span>
                <span>
                  £{applied.priceRange?.max || filters.priceRange.max}
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Brands */}
        {filters.brands.length > 0 && (
          <AccordionItem value="brands">
            <AccordionTrigger className="text-xs font-bold uppercase tracking-wider">
              Brands
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {filters.brands.map((brand) => (
                  <div
                    key={brand.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`brand-${brand.value}`}
                      checked={applied.brands?.includes(brand.value) || false}
                      onCheckedChange={(checked) =>
                        updateFilter('brands', brand.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`brand-${brand.value}`}
                      className="text-sm font-normal cursor-pointer flex-1 flex justify-between"
                    >
                      <span>{brand.label}</span>
                      <span className="text-muted-foreground">
                        ({brand.count})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
