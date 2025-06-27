import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { MedusaProductService } from '@/lib/medusa-service-refactored';
import type { MedusaProduct, MedusaProductCategory } from '@/types/medusa';

/**
 * React Query hooks for Medusa products with built-in caching and deduplication
 */

// Categories
export function useMedusaCategories(
  options?: Omit<UseQueryOptions<MedusaProductCategory[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: MedusaProductService.getCategories,
    staleTime: 10 * 60 * 1000, // Categories are fresh for 10 minutes
    ...options,
  });
}

// Products
export function useMedusaProducts(
  params?: {
    limit?: number;
    offset?: number;
    category_id?: string[];
    collection_id?: string[];
    tags?: string[];
    sales_channel_id?: string[];
  },
  options?: Omit<UseQueryOptions<{ products: MedusaProduct[]; count: number }, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['medusa-products', params] as const,
    queryFn: () => MedusaProductService.getProducts(params),
    ...options,
  });
}

// Single product
export function useMedusaProduct(
  handleOrId: string,
  options?: Omit<UseQueryOptions<MedusaProduct | null, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.product(handleOrId),
    queryFn: () => MedusaProductService.getProduct(handleOrId),
    enabled: Boolean(handleOrId),
    ...options,
  });
}

// Products by category
export function useMedusaProductsByCategory(
  categoryId: string,
  limit = 50,
  options?: Omit<UseQueryOptions<MedusaProduct[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.productsByCategory(categoryId),
    queryFn: () => MedusaProductService.getProductsByCategory(categoryId, limit),
    enabled: Boolean(categoryId),
    ...options,
  });
}

// Search products
export function useMedusaProductSearch(
  query: string,
  limit = 20,
  options?: Omit<UseQueryOptions<MedusaProduct[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.productSearch(query),
    queryFn: () => MedusaProductService.searchProducts(query, limit),
    enabled: Boolean(query && query.length > 2), // Only search with 3+ characters
    staleTime: 30 * 1000, // Search results are fresh for 30 seconds
    ...options,
  });
}

// Featured products
export function useMedusaFeaturedProducts(
  limit = 8,
  options?: Omit<UseQueryOptions<MedusaProduct[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['medusa-featured-products', limit] as const,
    queryFn: () => MedusaProductService.getFeaturedProducts(limit),
    ...options,
  });
}

// Product recommendations
export function useMedusaRecommendations(
  productId: string,
  limit = 4,
  options?: Omit<UseQueryOptions<MedusaProduct[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['medusa-recommendations', productId, limit] as const,
    queryFn: () => MedusaProductService.getRecommendations(productId, limit),
    enabled: Boolean(productId),
    ...options,
  });
}

// Collections
export function useMedusaCollections(
  options?: Omit<UseQueryOptions<unknown[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['medusa-collections'] as const,
    queryFn: MedusaProductService.getCollections,
    staleTime: 10 * 60 * 1000, // Collections are fresh for 10 minutes
    ...options,
  });
}