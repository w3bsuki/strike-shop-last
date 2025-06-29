'use client';

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import type { IntegratedProduct } from '@/types/integrated';

interface CategoryFilters {
  searchQuery: string;
  selectedColors: string[];
  selectedSizes: string[];
  priceRange: [number, number];
  inStockOnly: boolean;
  sortBy: string;
}

interface CategoryContextType {
  categoryName: string;
  products: IntegratedProduct[];
  filters: CategoryFilters;
  sortedProducts: IntegratedProduct[];
  activeFiltersCount: number;
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  toggleColor: (color: string) => void;
  toggleSize: (size: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setInStockOnly: (inStock: boolean) => void;
  setSortBy: (sort: string) => void;
  clearFilters: () => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

interface CategoryProviderProps {
  children: ReactNode;
  categoryName: string;
  initialProducts: IntegratedProduct[];
}

export function CategoryProvider({ children, categoryName, initialProducts }: CategoryProviderProps) {
  const [products] = useState<IntegratedProduct[]>(initialProducts);
  const [isLoading] = useState(false);
  const [filters, setFilters] = useState<CategoryFilters>({
    searchQuery: '',
    selectedColors: [],
    selectedSizes: [],
    priceRange: [0, 1000],
    inStockOnly: false,
    sortBy: 'newest',
  });

  // Compute filtered and sorted products
  const sortedProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.content.name.toLowerCase().includes(query) ||
          product.content.description?.toLowerCase().includes(query)
      );
    }

    // Color filter
    if (filters.selectedColors.length > 0) {
      filtered = filtered.filter((product) =>
        product.commerce.variants?.some((variant) =>
          filters.selectedColors.includes(variant.options.color?.name as string)
        )
      );
    }

    // Size filter
    if (filters.selectedSizes.length > 0) {
      filtered = filtered.filter((product) =>
        product.commerce.variants?.some((variant) =>
          filters.selectedSizes.includes(variant.options.size as string)
        )
      );
    }

    // Price filter
    filtered = filtered.filter((product) => {
      const price = product.pricing.basePrice || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter((product) => product.commerce.inventory.available);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.pricing.basePrice || 0) - (b.pricing.basePrice || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.pricing.basePrice || 0) - (a.pricing.basePrice || 0));
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.content.name.localeCompare(b.content.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.content.name.localeCompare(a.content.name));
        break;
      case 'newest':
      default:
        // Keep original order (assuming products are already sorted by newest)
        break;
    }

    return filtered;
  }, [products, filters]);

  // Compute active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.selectedColors.length > 0) count++;
    if (filters.selectedSizes.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++;
    if (filters.inStockOnly) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  }, [filters]);

  // Filter update functions
  const setSearchQuery = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  };

  const toggleColor = (color: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedColors: prev.selectedColors.includes(color)
        ? prev.selectedColors.filter((c) => c !== color)
        : [...prev.selectedColors, color],
    }));
  };

  const toggleSize = (size: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedSizes: prev.selectedSizes.includes(size)
        ? prev.selectedSizes.filter((s) => s !== size)
        : [...prev.selectedSizes, size],
    }));
  };

  const setPriceRange = (range: [number, number]) => {
    setFilters((prev) => ({ ...prev, priceRange: range }));
  };

  const setInStockOnly = (inStock: boolean) => {
    setFilters((prev) => ({ ...prev, inStockOnly: inStock }));
  };

  const setSortBy = (sort: string) => {
    setFilters((prev) => ({ ...prev, sortBy: sort }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      selectedColors: [],
      selectedSizes: [],
      priceRange: [0, 1000],
      inStockOnly: false,
      sortBy: 'newest',
    });
  };

  const value: CategoryContextType = {
    categoryName,
    products,
    filters,
    sortedProducts,
    activeFiltersCount,
    isLoading,
    setSearchQuery,
    toggleColor,
    toggleSize,
    setPriceRange,
    setInStockOnly,
    setSortBy,
    clearFilters,
  };

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
}