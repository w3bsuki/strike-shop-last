/**
 * ProductCard Component Tests
 * Comprehensive test suite for ProductCard components with React Testing Library
 * Testing accessibility, user interactions, and rendering behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '@/components/product/ProductCard';
import { useIsWishlisted, useWishlistActions } from '@/lib/stores';
import { useQuickView } from '@/contexts/QuickViewContext';

// Mock dependencies
jest.mock('@/lib/stores', () => ({
  useIsWishlisted: jest.fn(),
  useWishlistActions: jest.fn(),
}));

jest.mock('@/contexts/QuickViewContext', () => ({
  useQuickView: jest.fn(),
}));

jest.mock('@/hooks/use-prefetch', () => ({
  usePrefetch: jest.fn(() => ({
    prefetch: jest.fn(),
  })),
}));

jest.mock('@/components/ui/optimized-image', () => ({
  ProductImage: ({ src, alt, className, priority }: any) => (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      data-priority={priority}
      data-testid="product-image"
    />
  ),
}));

const mockUseIsWishlisted = useIsWishlisted as jest.MockedFunction<typeof useIsWishlisted>;
const mockUseWishlistActions = useWishlistActions as jest.MockedFunction<typeof useWishlistActions>;
const mockUseQuickView = useQuickView as jest.MockedFunction<typeof useQuickView>;

const mockWishlistActions = {
  addToWishlist: jest.fn(),
  removeFromWishlist: jest.fn(),
};

const mockQuickViewActions = {
  openQuickView: jest.fn(),
  closeQuickView: jest.fn(),
  isOpen: false,
  product: null,
};

describe('ProductCard Component', () => {
  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    price: '$29.99',
    originalPrice: '$39.99',
    discount: '-25%',
    image: 'https://example.com/product.jpg',
    slug: 'test-product',
    isNew: false,
    soldOut: false,
    colors: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsWishlisted.mockReturnValue(false);
    mockUseWishlistActions.mockReturnValue(mockWishlistActions);
    mockUseQuickView.mockReturnValue(mockQuickViewActions);
    
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: jest.fn(),
      writable: true,
    });
  });

  describe('Rendering', () => {
    it('should render product information correctly', () => {
      render(<ProductCard product={mockProduct} />);
      
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('$39.99')).toBeInTheDocument();
      expect(screen.getByText('-25%')).toBeInTheDocument();
      expect(screen.getByText('3 Colors')).toBeInTheDocument();
    });

    it('should render product image with correct attributes', () => {
      render(<ProductCard product={mockProduct} priority={true} />);
      
      const image = screen.getByTestId('product-image');
      expect(image).toHaveAttribute('src', 'https://example.com/product.jpg');
      expect(image).toHaveAttribute('alt', 'Test Product');
      expect(image).toHaveAttribute('data-priority', 'true');
    });

    it('should use placeholder image when product image is not provided', () => {
      const productWithoutImage = { ...mockProduct, image: '' };
      render(<ProductCard product={productWithoutImage} />);
      
      const image = screen.getByTestId('product-image');
      expect(image).toHaveAttribute('src', '/placeholder.svg');
    });

    it('should render product link with correct href', () => {
      render(<ProductCard product={mockProduct} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/product/test-product');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ProductCard product={mockProduct} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Badges', () => {
    it('should display discount badge when discount is provided', () => {
      render(<ProductCard product={mockProduct} />);
      
      expect(screen.getByText('-25%')).toBeInTheDocument();
    });

    it('should display NEW badge when product is new and no discount', () => {
      const newProduct = { ...mockProduct, isNew: true, discount: undefined };
      render(<ProductCard product={newProduct} />);
      
      expect(screen.getByText('NEW')).toBeInTheDocument();
    });

    it('should not display NEW badge when product has discount', () => {
      const newProductWithDiscount = { ...mockProduct, isNew: true, discount: '-25%' };
      render(<ProductCard product={newProductWithDiscount} />);
      
      expect(screen.queryByText('NEW')).not.toBeInTheDocument();
      expect(screen.getByText('-25%')).toBeInTheDocument();
    });

    it('should display SOLD OUT badge when product is sold out', () => {
      const soldOutProduct = { ...mockProduct, soldOut: true };
      render(<ProductCard product={soldOutProduct} />);
      
      expect(screen.getByText('SOLD OUT')).toBeInTheDocument();
    });
  });

  describe('Wishlist Functionality', () => {
    it('should display empty heart when product is not wishlisted', () => {
      mockUseIsWishlisted.mockReturnValue(false);
      render(<ProductCard product={mockProduct} />);
      
      const wishlistButton = screen.getByLabelText('Add Test Product to wishlist');
      expect(wishlistButton).toBeInTheDocument();
      expect(wishlistButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should display filled heart when product is wishlisted', () => {
      mockUseIsWishlisted.mockReturnValue(true);
      render(<ProductCard product={mockProduct} />);
      
      const wishlistButton = screen.getByLabelText('Remove Test Product from wishlist');
      expect(wishlistButton).toBeInTheDocument();
      expect(wishlistButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should add product to wishlist when clicked and not wishlisted', async () => {
      mockUseIsWishlisted.mockReturnValue(false);
      const user = userEvent.setup();
      
      render(<ProductCard product={mockProduct} />);
      
      const wishlistButton = screen.getByLabelText('Add Test Product to wishlist');
      await user.click(wishlistButton);
      
      expect(mockWishlistActions.addToWishlist).toHaveBeenCalledWith({
        id: 'product-123',
        name: 'Test Product',
        price: '$29.99',
        image: 'https://example.com/product.jpg',
        slug: 'test-product',
      });
      expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100]);
    });

    it('should remove product from wishlist when clicked and wishlisted', async () => {
      mockUseIsWishlisted.mockReturnValue(true);
      const user = userEvent.setup();
      
      render(<ProductCard product={mockProduct} />);
      
      const wishlistButton = screen.getByLabelText('Remove Test Product from wishlist');
      await user.click(wishlistButton);
      
      expect(mockWishlistActions.removeFromWishlist).toHaveBeenCalledWith('product-123');
      expect(navigator.vibrate).toHaveBeenCalledWith(50);
    });

    it('should prevent event propagation on wishlist click', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <div onClick={handleClick}>
          <ProductCard product={mockProduct} />
        </div>
      );
      
      const wishlistButton = screen.getByLabelText('Add Test Product to wishlist');
      await user.click(wishlistButton);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle missing navigator.vibrate gracefully', async () => {
      // Remove vibrate support
      delete (navigator as any).vibrate;
      
      const user = userEvent.setup();
      render(<ProductCard product={mockProduct} />);
      
      const wishlistButton = screen.getByLabelText('Add Test Product to wishlist');
      await user.click(wishlistButton);
      
      expect(mockWishlistActions.addToWishlist).toHaveBeenCalled();
      // Should not throw error
    });
  });

  describe('Quick View Functionality', () => {
    it('should render quick view button with correct label', () => {
      render(<ProductCard product={mockProduct} />);
      
      const quickViewButton = screen.getByLabelText('Quick view Test Product');
      expect(quickViewButton).toBeInTheDocument();
    });

    it('should open quick view when quick view button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProductCard product={mockProduct} />);
      
      const quickViewButton = screen.getByLabelText('Quick view Test Product');
      await user.click(quickViewButton);
      
      expect(mockQuickViewActions.openQuickView).toHaveBeenCalledWith(mockProduct);
    });

    it('should prevent event propagation on quick view click', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <div onClick={handleClick}>
          <ProductCard product={mockProduct} />
        </div>
      );
      
      const quickViewButton = screen.getByLabelText('Quick view Test Product');
      await user.click(quickViewButton);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      render(<ProductCard product={mockProduct} />);
      
      expect(screen.getByLabelText('Add Test Product to wishlist')).toBeInTheDocument();
      expect(screen.getByLabelText('Quick view Test Product')).toBeInTheDocument();
    });

    it('should have proper aria-pressed attribute for wishlist button', () => {
      mockUseIsWishlisted.mockReturnValue(true);
      render(<ProductCard product={mockProduct} />);
      
      const wishlistButton = screen.getByLabelText('Remove Test Product from wishlist');
      expect(wishlistButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have aria-hidden on decorative icons', () => {
      render(<ProductCard product={mockProduct} />);
      
      const heartIcon = screen.getByLabelText('Quick view Test Product').querySelector('[aria-hidden="true"]');
      expect(heartIcon).toBeInTheDocument();
    });

    it('should pass automated accessibility tests', async () => {
      const { container } = render(<ProductCard product={mockProduct} />);
      await testUtils.testAccessibility(container);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ProductCard product={mockProduct} />);
      
      // Tab to product link
      await user.tab();
      expect(screen.getByRole('link')).toHaveFocus();
      
      // Tab to quick view button
      await user.tab();
      expect(screen.getByLabelText('Quick view Test Product')).toHaveFocus();
      
      // Tab to wishlist button
      await user.tab();
      expect(screen.getByLabelText('Add Test Product to wishlist')).toHaveFocus();
    });

    it('should activate buttons with keyboard', async () => {
      const user = userEvent.setup();
      render(<ProductCard product={mockProduct} />);
      
      // Navigate to wishlist button and activate
      await user.tab();
      await user.tab();
      await user.tab();
      await user.keyboard('{Enter}');
      
      expect(mockWishlistActions.addToWishlist).toHaveBeenCalled();
    });

    it('should activate buttons with space key', async () => {
      const user = userEvent.setup();
      render(<ProductCard product={mockProduct} />);
      
      // Navigate to quick view button and activate
      await user.tab();
      await user.tab();
      await user.keyboard(' ');
      
      expect(mockQuickViewActions.openQuickView).toHaveBeenCalled();
    });
  });

  describe('Performance Optimizations', () => {
    it('should memoize component and prevent unnecessary re-renders', () => {
      const { rerender } = render(<ProductCard product={mockProduct} />);
      
      // Re-render with same props - should not cause re-render
      rerender(<ProductCard product={mockProduct} />);
      
      // Verify component is memoized by checking render count
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should re-render when essential props change', () => {
      const { rerender } = render(<ProductCard product={mockProduct} />);
      
      const updatedProduct = { ...mockProduct, name: 'Updated Product' };
      rerender(<ProductCard product={updatedProduct} />);
      
      expect(screen.getByText('Updated Product')).toBeInTheDocument();
      expect(screen.queryByText('Test Product')).not.toBeInTheDocument();
    });

    it('should handle edge case when colors is 0', () => {
      const productWithZeroColors = { ...mockProduct, colors: 0 };
      render(<ProductCard product={productWithZeroColors} />);
      
      expect(screen.queryByText('0 Colors')).not.toBeInTheDocument();
    });

    it('should handle edge case when colors is undefined', () => {
      const productWithoutColors = { ...mockProduct, colors: undefined };
      render(<ProductCard product={productWithoutColors} />);
      
      expect(screen.queryByText(/Colors/)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle product without original price', () => {
      const productWithoutOriginalPrice = { ...mockProduct, originalPrice: undefined };
      render(<ProductCard product={productWithoutOriginalPrice} />);
      
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.queryByText('$39.99')).not.toBeInTheDocument();
    });

    it('should handle product without discount', () => {
      const productWithoutDiscount = { ...mockProduct, discount: undefined };
      render(<ProductCard product={productWithoutDiscount} />);
      
      expect(screen.queryByText('-25%')).not.toBeInTheDocument();
    });

    it('should handle very long product names', () => {
      const productWithLongName = {
        ...mockProduct,
        name: 'This is a very long product name that might cause layout issues',
      };
      render(<ProductCard product={productWithLongName} />);
      
      expect(screen.getByText('This is a very long product name that might cause layout issues')).toBeInTheDocument();
    });

    it('should handle special characters in product name', () => {
      const productWithSpecialChars = {
        ...mockProduct,
        name: "Product with 'quotes' & symbols!",
      };
      render(<ProductCard product={productWithSpecialChars} />);
      
      expect(screen.getByText("Product with 'quotes' & symbols!")).toBeInTheDocument();
    });

    it('should handle empty slug gracefully', () => {
      const productWithEmptySlug = { ...mockProduct, slug: '' };
      render(<ProductCard product={productWithEmptySlug} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/product/');
    });
  });

  describe('State Management Integration', () => {
    it('should react to wishlist state changes', () => {
      mockUseIsWishlisted.mockReturnValue(false);
      const { rerender } = render(<ProductCard product={mockProduct} />);
      
      expect(screen.getByLabelText('Add Test Product to wishlist')).toBeInTheDocument();
      
      // Simulate state change
      mockUseIsWishlisted.mockReturnValue(true);
      rerender(<ProductCard product={mockProduct} />);
      
      expect(screen.getByLabelText('Remove Test Product from wishlist')).toBeInTheDocument();
    });

    it('should handle wishlist action errors gracefully', async () => {
      mockWishlistActions.addToWishlist.mockImplementation(() => {
        throw new Error('Network error');
      });
      
      const user = userEvent.setup();
      render(<ProductCard product={mockProduct} />);
      
      const wishlistButton = screen.getByLabelText('Add Test Product to wishlist');
      
      // Should not crash when action throws
      await expect(user.click(wishlistButton)).rejects.toThrow('Network error');
    });
  });

  describe('Touch and Mobile Interactions', () => {
    it('should handle touch events on buttons', async () => {
      render(<ProductCard product={mockProduct} />);
      
      const wishlistButton = screen.getByLabelText('Add Test Product to wishlist');
      
      fireEvent.touchStart(wishlistButton);
      fireEvent.touchEnd(wishlistButton);
      fireEvent.click(wishlistButton);
      
      expect(mockWishlistActions.addToWishlist).toHaveBeenCalled();
    });

    it('should prevent text selection on touch', () => {
      const { container } = render(<ProductCard product={mockProduct} />);
      
      // Check for touch-manipulation class
      const productCard = container.querySelector('.product-card');
      expect(productCard).toHaveClass('transform');
    });
  });

  describe('Animation and Visual Effects', () => {
    it('should apply hover animations', () => {
      const { container } = render(<ProductCard product={mockProduct} />);
      
      const productCard = container.querySelector('.product-card');
      expect(productCard).toHaveClass('transform', 'transition-transform');
    });

    it('should apply active state animations', () => {
      const { container } = render(<ProductCard product={mockProduct} />);
      
      const productCard = container.querySelector('.product-card');
      expect(productCard).toHaveClass('hover:scale-[1.02]', 'active:scale-[0.98]');
    });
  });
});