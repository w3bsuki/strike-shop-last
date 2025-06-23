import { QueryClient } from '@tanstack/react-query';

// Create a client for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Garbage collection time: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus in development
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query keys factory for consistent naming
export const queryKeys = {
  // Products
  products: ['products'] as const,
  product: (slug: string) => ['products', slug] as const,
  productsByCategory: (category: string) => ['products', 'category', category] as const,
  productSearch: (query: string) => ['products', 'search', query] as const,
  
  // Categories
  categories: ['categories'] as const,
  category: (slug: string) => ['categories', slug] as const,
  
  // User
  user: ['user'] as const,
  userOrders: ['user', 'orders'] as const,
  userAddresses: ['user', 'addresses'] as const,
  
  // Cart
  cart: ['cart'] as const,
  
  // Wishlist
  wishlist: ['wishlist'] as const,
  
  // Orders
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
} as const;