'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    colors: string[];
    sizes: string[];
    priceRange: { min?: number; max?: number };
    inStock: boolean;
    brands?: string[];
    materials?: string[];
  };
  onFiltersChange: (filters: any) => void;
  availableFilters: {
    colors: FilterOption[];
    sizes: FilterOption[];
    brands?: FilterOption[];
    materials?: FilterOption[];
  };
  productCount: number;
}

export function MobileFilterSheet({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableFilters,
  productCount,
}: MobileFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      colors: [],
      sizes: [],
      priceRange: {},
      inStock: false,
      brands: [],
      materials: [],
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFilterCount = 
    localFilters.colors.length +
    localFilters.sizes.length +
    (localFilters.priceRange.min || localFilters.priceRange.max ? 1 : 0) +
    (localFilters.inStock ? 1 : 0) +
    (localFilters.brands?.length || 0) +
    (localFilters.materials?.length || 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
          {/* In Stock Toggle */}
          <div className="pb-6 border-b">
            <div className="flex items-center justify-between">
              <label htmlFor="in-stock" className="text-base font-medium">
                In Stock Only
              </label>
              <Switch
                id="in-stock"
                checked={localFilters.inStock}
                onCheckedChange={(checked) =>
                  setLocalFilters({ ...localFilters, inStock: checked })
                }
              />
            </div>
          </div>

          {/* Price Range */}
          <div className="py-6 border-b">
            <h3 className="text-base font-medium mb-4">Price Range</h3>
            <div className="space-y-4">
              <Slider
                value={[
                  localFilters.priceRange.min || 0,
                  localFilters.priceRange.max || 500,
                ]}
                onValueChange={([min, max]) =>
                  setLocalFilters({
                    ...localFilters,
                    priceRange: { min, max },
                  })
                }
                max={500}
                step={10}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm">
                <span>£{localFilters.priceRange.min || 0}</span>
                <span>£{localFilters.priceRange.max || 500}</span>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="py-6 border-b">
            <h3 className="text-base font-medium mb-4">Colors</h3>
            <div className="grid grid-cols-5 gap-3">
              {availableFilters.colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    const colors = localFilters.colors.includes(color.value)
                      ? localFilters.colors.filter((c) => c !== color.value)
                      : [...localFilters.colors, color.value];
                    setLocalFilters({ ...localFilters, colors });
                  }}
                  className={`relative w-12 h-12 rounded-full border-2 ${
                    localFilters.colors.includes(color.value)
                      ? 'border-primary'
                      : 'border-border'
                  }`}
                  style={{ backgroundColor: color.value }}
                  aria-label={color.label}
                >
                  {localFilters.colors.includes(color.value) && (
                    <Check className="absolute inset-0 m-auto h-6 w-6 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="py-6 border-b">
            <h3 className="text-base font-medium mb-4">Sizes</h3>
            <div className="grid grid-cols-4 gap-2">
              {availableFilters.sizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => {
                    const sizes = localFilters.sizes.includes(size.value)
                      ? localFilters.sizes.filter((s) => s !== size.value)
                      : [...localFilters.sizes, size.value];
                    setLocalFilters({ ...localFilters, sizes });
                  }}
                  className={`py-3 px-4 border rounded-lg text-sm font-medium transition-colors ${
                    localFilters.sizes.includes(size.value)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="flex-col gap-2 pt-4 border-t">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
              disabled={activeFilterCount === 0}
            >
              Reset
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Show {productCount} products
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}