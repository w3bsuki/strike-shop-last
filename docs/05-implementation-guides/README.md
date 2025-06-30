# Implementation Guides

> **Comprehensive guides for implementing features and maintaining the Strike Shop codebase**

## 📋 Table of Contents

- [Component Development](./component-development.md) - Creating and maintaining components
- [API Integration](./api-integration.md) - Working with external APIs
- [State Management](./state-management.md) - Managing application state
- [Testing Strategy](./testing.md) - Comprehensive testing approach
- [Deployment](./deployment.md) - Deployment and CI/CD processes

## 🎯 Implementation Philosophy

Our implementation approach is built on these core principles:

### **1. Developer Experience First**
- **Fast feedback loops** with hot reload and TypeScript
- **Comprehensive tooling** with ESLint, Prettier, and testing
- **Clear documentation** for all APIs and patterns
- **Consistent patterns** that reduce cognitive load

### **2. Quality by Design**
- **Type safety** at compile time and runtime
- **Test-driven development** with comprehensive coverage
- **Performance monitoring** built into the development process
- **Security considerations** from the start

### **3. Maintainable Architecture**
- **Clear separation of concerns** between components
- **Reusable patterns** that scale across the application
- **Documentation-driven development** for long-term maintainability
- **Refactoring-friendly** structure that supports evolution

## 🚀 Quick Start Guide

### **Setting Up Development Environment**

```bash
# Clone and setup
git clone [repository-url]
cd strike-shop-1-main
npm install

# Environment configuration
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev

# Run tests
npm test

# Check code quality
npm run lint
npm run type-check
```

### **Project Structure Overview**

```
strike-shop-1-main/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication routes
│   ├── (shop)/            # Shopping routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── features/         # Feature-specific components
│   ├── layout/           # Layout components
│   └── forms/            # Form components
├── lib/                  # Core utilities and configurations
│   ├── api/              # API clients and utilities
│   ├── stores/           # Zustand state stores
│   ├── utils/            # Helper functions
│   └── validations/      # Zod schemas
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── styles/               # Global styles and design tokens
└── docs/                 # Project documentation
```

## 🧩 Component Development Patterns

### **Server Component Pattern**
```typescript
// app/products/page.tsx
import { getProducts } from '@/lib/api/products';
import { ProductGrid } from '@/components/features/product-grid';

export default async function ProductsPage() {
  const products = await getProducts();
  
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      <ProductGrid products={products} />
    </main>
  );
}
```

### **Client Component Pattern**
```typescript
// components/features/add-to-cart-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { toast } from '@/hooks/use-toast';

interface AddToCartButtonProps {
  productId: string;
  variantId: string;
  disabled?: boolean;
}

export function AddToCartButton({ 
  productId, 
  variantId, 
  disabled 
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await addItem({ productId, variantId, quantity: 1 });
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleAddToCart}
      disabled={disabled || loading}
      className="w-full"
    >
      {loading ? "Adding..." : "Add to Cart"}
    </Button>
  );
}
```

## 🔌 API Integration Patterns

### **Shopify API Client**
```typescript
// lib/api/shopify.ts
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient(
  `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2024-10/graphql.json`,
  {
    headers: {
      'X-Shopify-Storefront-Access-Token': 
        process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
    },
  }
);

export async function getProduct(handle: string) {
  const query = `
    query getProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        description
        handle
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              priceV2 {
                amount
                currencyCode
              }
              availableForSale
            }
          }
        }
      }
    }
  `;

  const data = await client.request(query, { handle });
  return data.productByHandle;
}
```

### **Error Handling Pattern**
```typescript
// lib/api/error-handling.ts
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Log error for monitoring
    console.error('API Error:', {
      context,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Re-throw with consistent format
    if (error instanceof APIError) {
      throw error;
    }

    throw new APIError(
      `Failed to ${context || 'complete operation'}`,
      500,
      'INTERNAL_ERROR'
    );
  }
}
```

## 🏪 State Management Patterns

### **Zustand Store Pattern**
```typescript
// lib/stores/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, CartState } from '@/types/cart';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      addItem: async (item: CartItem) => {
        set({ isLoading: true, error: null });
        
        try {
          // Optimistic update
          const currentItems = get().items;
          const existingItem = currentItems.find(i => i.variantId === item.variantId);
          
          if (existingItem) {
            set({
              items: currentItems.map(i =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              )
            });
          } else {
            set({ items: [...currentItems, item] });
          }

          // Sync with backend
          await cartAPI.addItem(item);
          
        } catch (error) {
          // Rollback optimistic update
          set({ 
            items: get().items,
            error: error instanceof Error ? error.message : 'Failed to add item'
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const currentItems = get().items;
          set({ items: currentItems.filter(i => i.variantId !== variantId) });
          
          await cartAPI.removeItem(variantId);
        } catch (error) {
          // Restore item on failure
          set({ items: get().items });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () => set({ items: [], error: null }),
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => 
          total + (item.price * item.quantity), 0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => 
          total + item.quantity, 0
        );
      }
    }),
    {
      name: 'cart-store',
      partialize: (state) => ({ items: state.items }) // Only persist items
    }
  )
);
```

## 🧪 Testing Patterns

### **Component Testing**
```typescript
// components/features/__tests__/product-card.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductCard } from '../product-card';
import { useCart } from '@/hooks/use-cart';

// Mock the cart hook
jest.mock('@/hooks/use-cart');
const mockUseCart = useCart as jest.MockedFunction<typeof useCart>;

const mockProduct = {
  id: 'product-1',
  title: 'Test Product',
  handle: 'test-product',
  price: 29.99,
  image: {
    url: 'https://example.com/image.jpg',
    altText: 'Test Product Image'
  },
  available: true
};

describe('ProductCard', () => {
  beforeEach(() => {
    mockUseCart.mockReturnValue({
      addItem: jest.fn(),
      items: [],
      isLoading: false,
      error: null
    });
  });

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product Image')).toBeInTheDocument();
  });

  it('adds product to cart when button is clicked', async () => {
    const mockAddItem = jest.fn();
    mockUseCart.mockReturnValue({
      addItem: mockAddItem,
      items: [],
      isLoading: false,
      error: null
    });

    render(<ProductCard product={mockProduct} />);
    
    const addButton = screen.getByText('Add to Cart');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'product-1',
        variantId: expect.any(String),
        quantity: 1
      });
    });
  });

  it('shows loading state when adding to cart', async () => {
    mockUseCart.mockReturnValue({
      addItem: jest.fn(),
      items: [],
      isLoading: true,
      error: null
    });

    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### **API Testing**
```typescript
// lib/api/__tests__/shopify.test.ts
import { getProduct } from '../shopify';
import { GraphQLClient } from 'graphql-request';

// Mock the GraphQL client
jest.mock('graphql-request');
const mockClient = GraphQLClient as jest.MockedClass<typeof GraphQLClient>;

describe('Shopify API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches product data correctly', async () => {
    const mockProduct = {
      productByHandle: {
        id: 'product-1',
        title: 'Test Product',
        handle: 'test-product'
      }
    };

    mockClient.prototype.request.mockResolvedValue(mockProduct);

    const result = await getProduct('test-product');

    expect(result).toEqual(mockProduct.productByHandle);
    expect(mockClient.prototype.request).toHaveBeenCalledWith(
      expect.stringContaining('productByHandle'),
      { handle: 'test-product' }
    );
  });

  it('handles API errors gracefully', async () => {
    mockClient.prototype.request.mockRejectedValue(
      new Error('Network error')
    );

    await expect(getProduct('invalid-handle')).rejects.toThrow('Network error');
  });
});
```

## 📝 Documentation Standards

### **Component Documentation**
```typescript
/**
 * ProductCard component displays product information with add-to-cart functionality
 * 
 * @example
 * ```tsx
 * <ProductCard 
 *   product={product}
 *   priority={false}
 *   className="custom-styles"
 * />
 * ```
 */
export interface ProductCardProps {
  /** Product data from Shopify */
  product: Product;
  /** Whether to prioritize image loading */
  priority?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether the add-to-cart button should be disabled */
  disabled?: boolean;
}

export function ProductCard({ 
  product, 
  priority = false, 
  className,
  disabled = false 
}: ProductCardProps) {
  // Component implementation
}
```

### **API Documentation**
```typescript
/**
 * Retrieves a product by its handle from Shopify
 * 
 * @param handle - The product handle (URL slug)
 * @returns Promise<Product | null> - Product data or null if not found
 * 
 * @throws {APIError} When the request fails or product is not found
 * 
 * @example
 * ```typescript
 * const product = await getProduct('summer-dress');
 * if (product) {
 *   console.log(product.title);
 * }
 * ```
 */
export async function getProduct(handle: string): Promise<Product | null> {
  // Implementation
}
```

## 🔧 Development Tools

### **TypeScript Configuration**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### **ESLint Configuration**
```javascript
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

## 🚀 Performance Guidelines

### **Bundle Optimization**
```typescript
// Use dynamic imports for large dependencies
const Chart = dynamic(() => import('recharts'), {
  ssr: false,
  loading: () => <ChartSkeleton />
});

// Optimize images
import Image from 'next/image';

<Image
  src={product.image.url}
  alt={product.image.altText}
  width={400}
  height={400}
  priority={priority}
  sizes="(max-width: 768px) 100vw, 400px"
  className="object-cover"
/>
```

### **Caching Strategies**
```typescript
// ISR for product pages
export const revalidate = 3600; // 1 hour

// On-demand revalidation
export async function POST(request: Request) {
  const { tag } = await request.json();
  revalidateTag(tag);
  return Response.json({ revalidated: true });
}
```

---

## 📚 Additional Resources

### **Internal Documentation**
- [Architecture Overview](../02-architecture/) - System design principles
- [Best Practices](../06-best-practices/) - Coding standards and guidelines
- [Component Library](../07-component-docs/) - Component usage documentation
- [API Reference](../08-api-docs/) - API specifications

### **External Resources**
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React Server Components](https://react.dev/reference/react/use-server)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)

---

*These implementation guides serve as the definitive reference for developing features in the Strike Shop codebase. Always consult these patterns before implementing new functionality.*

**Last Updated**: 2024-12-30  
**Next Review**: 2025-01-07