import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

// Import existing Medusa service functions
// Note: These would need to be implemented in your Medusa service
interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: { url: string }[];
  variants: ProductVariant[];
  collection?: { title: string };
  metadata?: Record<string, any>;
}

interface ProductVariant {
  id: string;
  title: string;
  prices: { amount: number; currency_code: string }[];
  inventory_quantity?: number;
  options?: { value: string }[];
}

// API functions (these would connect to your Medusa backend)
const productAPI = {
  getAll: async (): Promise<Product[]> => {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },
  
  getBySlug: async (slug: string): Promise<Product> => {
    const response = await fetch(`/api/products/${slug}`);
    if (!response.ok) throw new Error(`Failed to fetch product: ${slug}`);
    return response.json();
  },
  
  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await fetch(`/api/products?category=${category}`);
    if (!response.ok) throw new Error(`Failed to fetch products for category: ${category}`);
    return response.json();
  },
  
  search: async (query: string): Promise<Product[]> => {
    const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`Failed to search products: ${query}`);
    return response.json();
  },
};

// Custom hooks for products
export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: productAPI.getAll,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => productAPI.getBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useProductsByCategory(category: string) {
  return useQuery({
    queryKey: queryKeys.productsByCategory(category),
    queryFn: () => productAPI.getByCategory(category),
    enabled: Boolean(category),
  });
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.productSearch(query),
    queryFn: () => productAPI.search(query),
    enabled: Boolean(query && query.length > 2), // Only search with 3+ characters
    staleTime: 30 * 1000, // Search results are fresh for 30 seconds
  });
}

// Mutation for updating product data (admin use)
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: (updatedProduct) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.setQueryData(queryKeys.product(updatedProduct.handle), updatedProduct);
    },
  });
}

// Prefetch products for better UX
export function usePrefetchProduct() {
  const queryClient = useQueryClient();
  
  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.product(slug),
      queryFn: () => productAPI.getBySlug(slug),
      staleTime: 5 * 60 * 1000, // Keep prefetched data fresh for 5 minutes
    });
  };
}