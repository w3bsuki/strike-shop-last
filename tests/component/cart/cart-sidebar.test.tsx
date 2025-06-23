/**
 * CartSidebar Component Tests
 * Comprehensive test suite for CartSidebar component
 * Testing cart operations, error handling, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartSidebar from '@/components/cart-sidebar';
import { useCartStore } from '@/lib/cart-store';

// Mock dependencies
jest.mock('@/lib/cart-store', () => ({
  useCartStore: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className, ...props }: any) => (
    <img src={src} alt={alt} className={className} {...props} />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, onClick, ...props }: any) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, ...props }: any) => (
    <button onClick={onClick} className={className} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

const mockUseCartStore = useCartStore as jest.MockedFunction<typeof useCartStore>;

const mockCartStore = {
  items: [],
  isOpen: true,
  isLoading: false,
  error: null,
  closeCart: jest.fn(),
  updateQuantity: jest.fn(),
  removeItem: jest.fn(),
  getTotalItems: jest.fn(() => 0),
  getTotalPrice: jest.fn(() => 0),
  clearError: jest.fn(),
};

const mockCartItem = {
  lineItemId: 'item-123',
  id: 'product-123',
  name: 'Test Product',
  size: 'M',
  quantity: 2,
  image: 'https://example.com/product.jpg',
  slug: 'test-product',
  sku: 'SKU-123',
  pricing: {
    displayUnitPrice: '£25.00',
    displayUnitSalePrice: '£20.00',
  },
};

describe('CartSidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCartStore.mockReturnValue(mockCartStore);
    
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: jest.fn(),
      writable: true,
    });
  });

  describe('Visibility', () => {
    it('should not render when cart is closed', () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        isOpen: false,
      });
      
      const { container } = render(<CartSidebar />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when cart is open', () => {
      render(<CartSidebar />);
      
      expect(screen.getByText('Cart (0)')).toBeInTheDocument();
    });
  });

  describe('Empty Cart State', () => {
    it('should display empty cart message when no items', () => {
      render(<CartSidebar />);
      
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      expect(screen.getByText('Add some items to get started')).toBeInTheDocument();
      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    });

    it('should close cart when clicking continue shopping in empty state', async () => {
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const continueButton = screen.getByText('Continue Shopping');
      await user.click(continueButton);
      
      expect(mockCartStore.closeCart).toHaveBeenCalled();
    });
  });

  describe('Cart with Items', () => {
    beforeEach(() => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 40),
      });
    });

    it('should display cart items correctly', () => {
      render(<CartSidebar />);
      
      expect(screen.getByText('Cart (2)')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Size: M')).toBeInTheDocument();
      expect(screen.getByText('SKU-123')).toBeInTheDocument();
      expect(screen.getByText('£20.00')).toBeInTheDocument();
      expect(screen.getByText('£25.00')).toBeInTheDocument();
    });

    it('should display item image with correct attributes', () => {
      render(<CartSidebar />);
      
      const image = screen.getByAltText('Test Product');
      expect(image).toHaveAttribute('src', 'https://example.com/product.jpg');
    });

    it('should display item quantity', () => {
      render(<CartSidebar />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display product link that closes cart when clicked', async () => {
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const productLink = screen.getByText('Test Product').closest('a');
      expect(productLink).toHaveAttribute('href', '/product/test-product');
      
      await user.click(productLink!);
      expect(mockCartStore.closeCart).toHaveBeenCalled();
    });
  });

  describe('Quantity Controls', () => {
    beforeEach(() => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 40),
      });
    });

    it('should increase quantity when plus button clicked', async () => {
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const increaseButton = screen.getByLabelText('Increase quantity');
      await user.click(increaseButton);
      
      expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('product-123', 'M', 3);
      expect(navigator.vibrate).toHaveBeenCalledWith(30);
    });

    it('should decrease quantity when minus button clicked', async () => {
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const decreaseButton = screen.getByLabelText('Decrease quantity');
      await user.click(decreaseButton);
      
      expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('product-123', 'M', 1);
      expect(navigator.vibrate).toHaveBeenCalledWith(30);
    });

    it('should disable quantity buttons when loading', () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        isLoading: true,
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 40),
      });
      
      render(<CartSidebar />);
      
      const increaseButton = screen.getByLabelText('Increase quantity');
      const decreaseButton = screen.getByLabelText('Decrease quantity');
      
      expect(increaseButton).toBeDisabled();
      expect(decreaseButton).toBeDisabled();
    });

    it('should handle quantity update errors gracefully', async () => {
      mockCartStore.updateQuantity.mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();
      
      render(<CartSidebar />);
      
      const increaseButton = screen.getByLabelText('Increase quantity');
      await user.click(increaseButton);
      
      // Should not crash and should still call updateQuantity
      expect(mockCartStore.updateQuantity).toHaveBeenCalled();
    });
  });

  describe('Item Removal', () => {
    beforeEach(() => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 40),
      });
    });

    it('should remove item when remove button clicked', async () => {
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const removeButton = screen.getByLabelText('Remove item');
      await user.click(removeButton);
      
      expect(mockCartStore.removeItem).toHaveBeenCalledWith('product-123', 'M');
      expect(navigator.vibrate).toHaveBeenCalledWith([50, 25, 50]);
    });

    it('should disable remove button when loading', () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        isLoading: true,
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 40),
      });
      
      render(<CartSidebar />);
      
      const removeButton = screen.getByLabelText('Remove item');
      expect(removeButton).toBeDisabled();
    });

    it('should handle remove item errors gracefully', async () => {
      mockCartStore.removeItem.mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();
      
      render(<CartSidebar />);
      
      const removeButton = screen.getByLabelText('Remove item');
      await user.click(removeButton);
      
      // Should not crash and should still call removeItem
      expect(mockCartStore.removeItem).toHaveBeenCalled();
    });
  });

  describe('Price Calculations', () => {
    beforeEach(() => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 80),
      });
    });

    it('should display subtotal correctly', () => {
      render(<CartSidebar />);
      
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText('£80.00')).toBeInTheDocument();
    });

    it('should display free shipping when subtotal over £100', () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 120),
      });
      
      render(<CartSidebar />);
      
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('£120.00')).toBeInTheDocument();
    });

    it('should display shipping cost when subtotal under £100', () => {
      render(<CartSidebar />);
      
      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText('£10.00')).toBeInTheDocument();
      expect(screen.getByText('£90.00')).toBeInTheDocument(); // Total
    });

    it('should display free shipping notice when subtotal under £100', () => {
      render(<CartSidebar />);
      
      expect(screen.getByText('Add £20.00 more for free shipping')).toBeInTheDocument();
    });

    it('should not display free shipping notice when subtotal over £100', () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 120),
      });
      
      render(<CartSidebar />);
      
      expect(screen.queryByText(/Add.*more for free shipping/)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error exists', () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        error: 'Something went wrong',
      });
      
      render(<CartSidebar />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should clear error when clear button clicked', async () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        error: 'Something went wrong',
      });
      
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const clearButton = screen.getByLabelText('Clear error');
      await user.click(clearButton);
      
      expect(mockCartStore.clearError).toHaveBeenCalled();
    });

    it('should not display error section when no error', () => {
      render(<CartSidebar />);
      
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Cart Closing', () => {
    it('should close cart when backdrop clicked', async () => {
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const backdrop = screen.getByRole('button', { name: 'Close cart' });
      await user.click(backdrop);
      
      expect(mockCartStore.closeCart).toHaveBeenCalled();
    });

    it('should close cart when X button clicked', async () => {
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const closeButton = screen.getByLabelText('Close cart');
      await user.click(closeButton);
      
      expect(mockCartStore.closeCart).toHaveBeenCalled();
    });

    it('should close cart when checkout link clicked', async () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 80),
      });
      
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const checkoutLink = screen.getByText('Checkout').closest('a');
      expect(checkoutLink).toHaveAttribute('href', '/checkout');
      
      await user.click(checkoutLink!);
      expect(mockCartStore.closeCart).toHaveBeenCalled();
    });

    it('should close cart when continue shopping button clicked in footer', async () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 80),
      });
      
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const continueButtons = screen.getAllByText('Continue Shopping');
      const footerContinueButton = continueButtons[continueButtons.length - 1];
      
      await user.click(footerContinueButton);
      expect(mockCartStore.closeCart).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close cart when Enter pressed on backdrop', async () => {
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const backdrop = screen.getByRole('button', { name: 'Close cart' });
      backdrop.focus();
      await user.keyboard('{Enter}');
      
      expect(mockCartStore.closeCart).toHaveBeenCalled();
    });

    it('should close cart when Space pressed on backdrop', async () => {
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const backdrop = screen.getByRole('button', { name: 'Close cart' });
      backdrop.focus();
      await user.keyboard(' ');
      
      expect(mockCartStore.closeCart).toHaveBeenCalled();
    });

    it('should be keyboard navigable through all interactive elements', async () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 80),
      });
      
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      // Tab through interactive elements
      await user.tab(); // Close button
      expect(screen.getByLabelText('Close cart')).toHaveFocus();
      
      await user.tab(); // Product link
      expect(screen.getByText('Test Product')).toHaveFocus();
      
      await user.tab(); // Decrease quantity
      expect(screen.getByLabelText('Decrease quantity')).toHaveFocus();
      
      await user.tab(); // Increase quantity
      expect(screen.getByLabelText('Increase quantity')).toHaveFocus();
      
      await user.tab(); // Remove item
      expect(screen.getByLabelText('Remove item')).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 80),
      });
      
      render(<CartSidebar />);
      
      expect(screen.getByLabelText('Close cart')).toBeInTheDocument();
      expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument();
      expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove item')).toBeInTheDocument();
    });

    it('should have proper role for backdrop', () => {
      render(<CartSidebar />);
      
      const backdrop = screen.getByRole('button', { name: 'Close cart' });
      expect(backdrop).toHaveAttribute('tabIndex', '0');
    });

    it('should pass automated accessibility tests', async () => {
      const { container } = render(<CartSidebar />);
      await testUtils.testAccessibility(container);
    });
  });

  describe('Mobile Interactions', () => {
    it('should handle touch events properly', async () => {
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 80),
      });
      
      render(<CartSidebar />);
      
      const increaseButton = screen.getByLabelText('Increase quantity');
      
      fireEvent.touchStart(increaseButton);
      fireEvent.touchEnd(increaseButton);
      fireEvent.click(increaseButton);
      
      expect(mockCartStore.updateQuantity).toHaveBeenCalled();
    });

    it('should handle missing navigator.vibrate gracefully', async () => {
      // Remove vibrate support
      delete (navigator as any).vibrate;
      
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [mockCartItem],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 80),
      });
      
      const user = userEvent.setup();
      render(<CartSidebar />);
      
      const increaseButton = screen.getByLabelText('Increase quantity');
      await user.click(increaseButton);
      
      expect(mockCartStore.updateQuantity).toHaveBeenCalled();
      // Should not throw error
    });
  });

  describe('Edge Cases', () => {
    it('should handle item without image', () => {
      const itemWithoutImage = { ...mockCartItem, image: null };
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [itemWithoutImage],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 40),
      });
      
      render(<CartSidebar />);
      
      const image = screen.getByAltText('Test Product');
      expect(image).toHaveAttribute('src', '/placeholder.svg');
    });

    it('should handle item without SKU', () => {
      const itemWithoutSku = { ...mockCartItem, sku: null };
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [itemWithoutSku],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 40),
      });
      
      render(<CartSidebar />);
      
      expect(screen.queryByText('SKU-123')).not.toBeInTheDocument();
    });

    it('should handle item without sale price', () => {
      const itemWithoutSalePrice = {
        ...mockCartItem,
        pricing: {
          displayUnitPrice: '£25.00',
          displayUnitSalePrice: null,
        },
      };
      
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [itemWithoutSalePrice],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 50),
      });
      
      render(<CartSidebar />);
      
      expect(screen.getByText('£25.00')).toBeInTheDocument();
      expect(screen.queryByText('£20.00')).not.toBeInTheDocument();
    });

    it('should handle very long product names', () => {
      const itemWithLongName = {
        ...mockCartItem,
        name: 'This is a very long product name that should be truncated properly to prevent layout issues',
      };
      
      mockUseCartStore.mockReturnValue({
        ...mockCartStore,
        items: [itemWithLongName],
        getTotalItems: jest.fn(() => 2),
        getTotalPrice: jest.fn(() => 40),
      });
      
      render(<CartSidebar />);
      
      expect(screen.getByText(itemWithLongName.name)).toBeInTheDocument();
    });
  });
});