'use client';

import { useState } from 'react';
import { Search, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { SizeGuideModal } from '../size-guide-modal';
import { useCategory } from '@/contexts/CategoryContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const AVAILABLE_COLORS = [
  { name: 'Black', value: 'hsl(var(--foreground))' },
  { name: 'White', value: 'hsl(var(--background))' },
  { name: 'Gray', value: 'hsl(var(--muted))' },
  { name: 'Navy', value: 'hsl(220, 100%, 25%)' },
  { name: 'Brown', value: 'hsl(25, 55%, 35%)' },
  { name: 'Beige', value: 'hsl(60, 56%, 91%)' },
  { name: 'Red', value: 'hsl(var(--destructive))' },
  { name: 'Blue', value: 'hsl(var(--primary))' },
  { name: 'Green', value: 'hsl(142, 76%, 36%)' },
  { name: 'Pink', value: 'hsl(350, 100%, 88%)' },
];

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const BRANDS = ['Strike', 'Urban', 'Minimal', 'Essential', 'Premium'];
const MATERIALS = ['Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim'];

// Collapsible filter section component
function FilterSection({ 
  title, 
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 text-left font-typewriter text-sm font-semibold hover:text-muted-foreground transition-colors"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title} filter section`}
      >
        {title}
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted p-3 rounded-none border border-border"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-typewriter text-xs font-semibold">
              Active Filters ({activeFiltersCount})
            </span>
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="h-auto p-1 font-typewriter text-xs"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedColors.map(color => (
              <Badge key={color} variant="secondary" className="text-xs">
                {color}
                <button
                  onClick={() => toggleColor(color)}
                  className="ml-1 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`Remove ${color} color filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedSizes.map(size => (
              <Badge key={size} variant="secondary" className="text-xs">
                Size {size}
                <button
                  onClick={() => toggleSize(size)}
                  className="ml-1 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`Remove size ${size} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div>
        <label className="block text-sm font-semibold mb-2 font-typewriter">
          Search Products
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-typewriter text-sm min-h-[44px]"
          />
        </div>
      </div>

      {/* Colors */}
      <FilterSection title="Colors" defaultOpen={true}>
        <div className="grid grid-cols-5 gap-2">
          {AVAILABLE_COLORS.map((color) => (
            <motion.button
              key={color.name}
              onClick={() => toggleColor(color.name)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`relative min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center touch-manipulation ${
                selectedColors.includes(color.name)
                  ? 'border-primary shadow-lg'
                  : 'border-border hover:border-muted-foreground'
              }`}
              style={{ backgroundColor: color.value }}
              aria-label={`Select ${color.name} color`}
            >
              <AnimatePresence>
                {selectedColors.includes(color.name) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check 
                      className={`h-4 w-4 ${
                        color.name === 'White' || color.name === 'Beige' || color.name === 'Pink'
                          ? 'text-foreground'
                          : 'text-primary-foreground'
                      }`} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className="sr-only">{color.name}</span>
            </motion.button>
          ))}
        </div>
      </FilterSection>

      {/* Sizes */}
      <FilterSection title="Sizes" defaultOpen={true}>
        <div className="mb-3">
          <SizeGuideModal>
            <button className="text-xs font-typewriter text-muted-foreground hover:text-foreground underline underline-offset-2 mb-3">
              View Size Guide
            </button>
          </SizeGuideModal>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {AVAILABLE_SIZES.map((size) => (
            <motion.button
              key={size}
              onClick={() => toggleSize(size)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`py-2.5 px-3 text-xs border font-typewriter transition-all min-h-[44px] touch-manipulation ${
                selectedSizes.includes(size)
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border hover:border-muted-foreground bg-background'
              }`}
            >
              {size}
            </motion.button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" defaultOpen={true}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-typewriter text-sm font-semibold">
              £{priceRange[0]}
            </span>
            <span className="font-typewriter text-xs text-muted-foreground">to</span>
            <span className="font-typewriter text-sm font-semibold">
              £{priceRange[1]}
            </span>
          </div>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={500}
            min={0}
            step={10}
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPriceRange([0, 100])}
              className="font-typewriter text-xs"
            >
              Under £100
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPriceRange([100, 250])}
              className="font-typewriter text-xs"
            >
              £100 - £250
            </Button>
          </div>
        </div>
      </FilterSection>

      {/* Brands */}
      <FilterSection title="Brands" defaultOpen={false}>
        <div className="space-y-2">
          {BRANDS.map((brand) => (
            <label key={brand} className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedBrands([...selectedBrands, brand]);
                  } else {
                    setSelectedBrands(selectedBrands.filter(b => b !== brand));
                  }
                }}
              />
              <span className="font-typewriter text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Materials */}
      <FilterSection title="Materials" defaultOpen={false}>
        <div className="space-y-2">
          {MATERIALS.map((material) => (
            <label key={material} className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={selectedMaterials.includes(material)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedMaterials([...selectedMaterials, material]);
                  } else {
                    setSelectedMaterials(selectedMaterials.filter(m => m !== material));
                  }
                }}
              />
              <span className="font-typewriter text-sm">{material}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <div className="border-b border-border pb-4">
        <label className="flex items-center space-x-3 cursor-pointer">
          <Checkbox
            id="in-stock"
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(checked === true)}
          />
          <span className="font-typewriter text-sm font-semibold">
            In Stock Only
          </span>
        </label>
      </div>

      {/* Clear All Button */}
      {activeFiltersCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="default"
            onClick={clearFilters}
            className="w-full font-typewriter text-sm min-h-[44px]"
          >
            Clear All Filters ({activeFiltersCount})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
