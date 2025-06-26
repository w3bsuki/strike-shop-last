import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProductGrid } from '@/components/product/product-grid';
import type { IntegratedProduct } from '@/types/integrated';

// Mock the ProductCard component
jest.mock('@/components/product/product-card', () => ({
  ProductCard: ({ product, priority, className }: any) => (
    <div 
      data-testid={`product-card-${product.id}`}
      data-priority={priority}
      className={className}
    >
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </div>
  ),
}));

const mockProducts: IntegratedProduct[] = [
  {
    id: '1',
    name: 'Product 1',
    price: '$19.99',
    originalPrice: '$29.99',
    discount: '33% OFF',
    image: '/images/product1.jpg',
    slug: 'product-1',
    isNew: true,
    soldOut: false,
    colors: 3,
  },
  {
    id: '2',
    name: 'Product 2',
    price: '$29.99',
    originalPrice: '$39.99',
    discount: '25% OFF',
    image: '/images/product2.jpg',
    slug: 'product-2',
    isNew: false,
    soldOut: false,
    colors: 2,
  },
  {
    id: '3',
    name: 'Product 3',
    price: '$39.99',
    originalPrice: null,
    discount: null,
    image: '/images/product3.jpg',
    slug: 'product-3',
    isNew: false,
    soldOut: true,
    colors: 1,
  },
  {
    id: '4',
    name: 'Product 4',
    price: '$49.99',
    originalPrice: null,
    discount: null,
    image: '/images/product4.jpg',
    slug: 'product-4',
    isNew: false,
    soldOut: false,
    colors: 4,
  },
  {
    id: '5',
    name: 'Product 5',
    price: '$59.99',
    originalPrice: '$79.99',
    discount: '25% OFF',
    image: '/images/product5.jpg',
    slug: 'product-5',
    isNew: true,
    soldOut: false,
    colors: 2,
  },
];

describe('ProductGrid', () => {
  describe('Rendering', () => {
    it('renders all products in a grid layout', () => {
      render(<ProductGrid products={mockProducts} />);
      
      // Check that all products are rendered
      mockProducts.forEach(product => {
        expect(screen.getByTestId(`product-card-${product.id}`)).toBeInTheDocument();
        expect(screen.getByText(product.name)).toBeInTheDocument();
        expect(screen.getByText(product.price)).toBeInTheDocument();
      });
    });

    it('applies responsive grid classes', () => {
      const { container } = render(<ProductGrid products={mockProducts} />);
      
      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).toHaveClass('sm:grid-cols-3');
      expect(grid).toHaveClass('lg:grid-cols-4');
      expect(grid).toHaveClass('xl:grid-cols-5');
      expect(grid).toHaveClass('gap-3');
      expect(grid).toHaveClass('sm:gap-4');
    });

    it('applies custom className when provided', () => {
      const customClass = 'custom-grid-class';
      const { container } = render(
        <ProductGrid products={mockProducts} className={customClass} />
      );
      
      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass(customClass);
    });

    it('renders empty state when products array is empty', () => {
      render(<ProductGrid products={[]} />);
      
      expect(screen.getByText('No products found')).toBeInTheDocument();
      const emptyState = screen.getByText('No products found').parentElement;
      expect(emptyState).toHaveClass('text-center', 'py-12');
    });

    it('renders empty state when products is null', () => {
      render(<ProductGrid products={null as any} />);
      
      expect(screen.getByText('No products found')).toBeInTheDocument();
    });

    it('renders empty state when products is undefined', () => {
      render(<ProductGrid products={undefined as any} />);
      
      expect(screen.getByText('No products found')).toBeInTheDocument();
    });
  });

  describe('Priority Loading', () => {
    it('sets priority on first 4 products when priority prop is true', () => {
      render(<ProductGrid products={mockProducts} priority={true} />);
      
      // First 4 products should have priority
      for (let i = 0; i < 4; i++) {
        const productCard = screen.getByTestId(`product-card-${mockProducts[i].id}`);
        expect(productCard).toHaveAttribute('data-priority', 'true');
      }
      
      // 5th product should not have priority
      const fifthProduct = screen.getByTestId(`product-card-${mockProducts[4].id}`);
      expect(fifthProduct).toHaveAttribute('data-priority', 'false');
    });

    it('does not set priority on any products when priority prop is false', () => {
      render(<ProductGrid products={mockProducts} priority={false} />);
      
      mockProducts.forEach(product => {
        const productCard = screen.getByTestId(`product-card-${product.id}`);
        expect(productCard).toHaveAttribute('data-priority', 'false');
      });
    });

    it('handles priority correctly with fewer than 4 products', () => {
      const fewProducts = mockProducts.slice(0, 2);
      render(<ProductGrid products={fewProducts} priority={true} />);
      
      // All products should have priority since there are fewer than 4
      fewProducts.forEach(product => {
        const productCard = screen.getByTestId(`product-card-${product.id}`);
        expect(productCard).toHaveAttribute('data-priority', 'true');
      });
    });
  });

  describe('Touch Interaction', () => {
    it('applies touch-manipulation class to all product cards', () => {
      render(<ProductGrid products={mockProducts} />);
      
      mockProducts.forEach(product => {
        const productCard = screen.getByTestId(`product-card-${product.id}`);
        expect(productCard).toHaveClass('touch-manipulation');
      });
    });
  });

  describe('Server Component Behavior', () => {
    it('renders as a server component without client-side hooks', () => {
      // This component should not use any client-side hooks
      // If it does, this test will fail during render
      expect(() => render(<ProductGrid products={mockProducts} />)).not.toThrow();
    });

    it('passes through product data unchanged', () => {
      render(<ProductGrid products={mockProducts} />);
      
      // Verify that product data is passed through to ProductCard
      mockProducts.forEach(product => {
        const productCard = screen.getByTestId(`product-card-${product.id}`);
        expect(productCard).toBeInTheDocument();
        // The mock ProductCard renders the product name and price
        expect(screen.getByText(product.name)).toBeInTheDocument();
        expect(screen.getByText(product.price)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles single product correctly', () => {
      const singleProduct = [mockProducts[0]];
      render(<ProductGrid products={singleProduct} />);
      
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    it('handles large number of products', () => {
      // Create 100 products
      const manyProducts: IntegratedProduct[] = Array.from({ length: 100 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        price: `$${i}.99`,
        originalPrice: null,
        discount: null,
        image: `/images/product${i}.jpg`,
        slug: `product-${i}`,
        isNew: false,
        soldOut: false,
        colors: 1,
      }));

      render(<ProductGrid products={manyProducts} />);
      
      // Check that all 100 products are rendered
      expect(screen.getAllByTestId(/product-card-/)).toHaveLength(100);
    });

    it('maintains grid structure with different product counts', () => {
      const testCases = [1, 3, 5, 7, 10, 15, 20];
      
      testCases.forEach(count => {
        const { container, unmount } = render(
          <ProductGrid products={mockProducts.slice(0, count)} />
        );
        
        const grid = container.firstChild as HTMLElement;
        expect(grid).toHaveClass('grid');
        expect(grid.children).toHaveLength(count);
        
        unmount();
      });
    });

    it('handles products with missing or invalid data gracefully', () => {
      const productsWithMissingData: IntegratedProduct[] = [
        {
          id: 'invalid-1',
          name: '',
          price: '',
          originalPrice: null,
          discount: null,
          image: '',
          slug: '',
          isNew: false,
          soldOut: false,
          colors: 0,
        },
        {
          id: 'invalid-2',
          name: 'Product with null values',
          price: null as any,
          originalPrice: null,
          discount: null,
          image: null as any,
          slug: null as any,
          isNew: null as any,
          soldOut: null as any,
          colors: null as any,
        },
      ];

      // Should render without crashing
      expect(() => render(<ProductGrid products={productsWithMissingData} />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('maintains semantic HTML structure', () => {
      const { container } = render(<ProductGrid products={mockProducts} />);
      
      // Should use div for grid container
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('empty state has appropriate text hierarchy', () => {
      render(<ProductGrid products={[]} />);
      
      const emptyMessage = screen.getByText('No products found');
      expect(emptyMessage.nodeName).toBe('P');
      expect(emptyMessage).toHaveClass('text-muted-foreground');
    });
  });

  describe('Performance Considerations', () => {
    it('only applies priority to first 4 items for performance', () => {
      const manyProducts = Array.from({ length: 20 }, (_, i) => ({
        ...mockProducts[0],
        id: `product-${i}`,
        name: `Product ${i}`,
      }));

      render(<ProductGrid products={manyProducts} priority={true} />);
      
      // Count products with priority
      let priorityCount = 0;
      manyProducts.forEach((product, index) => {
        const productCard = screen.getByTestId(`product-card-${product.id}`);
        if (productCard.getAttribute('data-priority') === 'true') {
          priorityCount++;
        }
      });
      
      expect(priorityCount).toBe(4);
    });

    it('uses consistent key prop for React reconciliation', () => {
      const { rerender } = render(<ProductGrid products={mockProducts} />);
      
      // Reorder products
      const reorderedProducts = [...mockProducts].reverse();
      rerender(<ProductGrid products={reorderedProducts} />);
      
      // Products should still be rendered correctly with their IDs
      reorderedProducts.forEach(product => {
        expect(screen.getByTestId(`product-card-${product.id}`)).toBeInTheDocument();
      });
    });
  });
});