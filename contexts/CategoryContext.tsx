'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from 'react';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  isNew: boolean;
  slug: string;
  colors?: number;
}

interface FilterState {
  searchQuery: string;
  selectedColors: string[];
  selectedSizes: string[];
  priceRange: [number, number];
  inStockOnly: boolean;
  sortBy: string;
}

interface CategoryContextValue {
  // Data
  categoryName: string;
  allProducts: Product[];
  filteredProducts: Product[];
  sortedProducts: Product[];
  activeFiltersCount: number;
  isLoading: boolean;

  // Filter state
  filters: FilterState;

  // Filter actions
  setSearchQuery: (query: string) => void;
  toggleColor: (colorName: string) => void;
  toggleSize: (size: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setInStockOnly: (inStock: boolean) => void;
  setSortBy: (sortBy: string) => void;
  clearFilters: () => void;
}

const CategoryContext = createContext<CategoryContextValue | undefined>(
  undefined
);

interface CategoryProviderProps {
  children: ReactNode;
  categoryName: string;
  initialProducts: Product[];
}

export function CategoryProvider({
  children,
  categoryName,
  initialProducts,
}: CategoryProviderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(false);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Search filter
      if (
        searchQuery &&
        !product.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Price filter
      const price = Number.parseFloat(product.price.replace('£', ''));
      if (price < priceRange[0] || price > priceRange[1]) {
        return false;
      }

      // For demo purposes, we'll assume color and size filtering works
      // In a real app, products would have these attributes

      return true;
    });
  }, [initialProducts, searchQuery, priceRange]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort(
          (a, b) =>
            Number.parseFloat(a.price.replace('£', '')) -
            Number.parseFloat(b.price.replace('£', ''))
        );
      case 'price-high':
        return sorted.sort(
          (a, b) =>
            Number.parseFloat(b.price.replace('£', '')) -
            Number.parseFloat(a.price.replace('£', ''))
        );
      case 'newest':
        return sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName)
        ? prev.filter((c) => c !== colorName)
        : [...prev, colorName]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([0, 500]);
    setInStockOnly(false);
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    selectedColors.length +
    selectedSizes.length +
    (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const filters: FilterState = {
    searchQuery,
    selectedColors,
    selectedSizes,
    priceRange,
    inStockOnly,
    sortBy,
  };

  const value: CategoryContextValue = {
    categoryName,
    allProducts: initialProducts,
    filteredProducts,
    sortedProducts,
    activeFiltersCount,
    isLoading,
    filters,
    setSearchQuery,
    toggleColor,
    toggleSize,
    setPriceRange,
    setInStockOnly,
    setSortBy,
    clearFilters,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
}
