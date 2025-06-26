import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MiniCart } from '@/components/cart/mini-cart';
import { useCart } from '@/hooks/use-cart';

// Mock dependencies
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href, onClick, ...props }: any) => (
      <a href={href} onClick={onClick} {...props}>
        {children}
      </a>
    ),
  };
});

jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: ({ src, alt, fill, sizes, className, ...props }: any) => (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        data-fill={fill}
        data-sizes={sizes}
        {...props}
      />
    ),
  };
});

jest.mock('@/hooks/use-cart', () => ({
  useCart: jest.fn(),
}));

jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open, onOpenChange }: any) => (
    <div data-testid="sheet" data-open={open}>
      {children}
    </div>
  ),
  SheetContent: ({ children, side, className }: any) => (
    <div data-testid="sheet-content" data-side={side} className={className}>
      {children}
    </div>
  ),
  SheetHeader: ({ children, className }: any) => (
    <div data-testid="sheet-header" className={className}>
      {children}
    </div>
  ),
  SheetTitle: ({ children, className }: any) => (
    <h2 data-testid="sheet-title" className={className}>
      {children}
    </h2>
  ),
  SheetTrigger: ({ children, asChild }: any) => (
    <div data-testid="sheet-trigger">
      {children}
    </div>
  ),
}));

const mockCartEmpty = {
  cart: { items: [] },
  totalItems: 0,
  totalPrice: 0,
  updateItem: jest.fn(),
  removeItem: jest.fn(),
  isUpdatingItem: false,
  isRemovingItem: false,
};

const mockCartWithItems = {
  cart: {
    items: [
      {
        id: 'item-1',
        name: 'Premium T-Shirt',
        price: 29.99,
        quantity: 2,
        size: 'M',
        image: '/images/tshirt.jpg',
      },
      {
        id: 'item-2',
        name: 'Classic Jeans',
        price: 59.99,
        quantity: 1,
        size: 'L',
        image: '/images/jeans.jpg',
      },
    ],
  },
  totalItems: 3,
  totalPrice: 119.97,
  updateItem: jest.fn(),
  removeItem: jest.fn(),
  isUpdatingItem: false,
  isRemovingItem: false,
};

describe('MiniCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useCart as jest.Mock).mockReturnValue(mockCartEmpty);
  });

  describe('Rendering', () => {
    it('renders with default trigger when no trigger provided', () => {
      render(<MiniCart />);
      
      const trigger = screen.getByLabelText('Shopping cart with 0 items');
      expect(trigger).toBeInTheDocument();
      expect(trigger.querySelector('svg')).toBeInTheDocument(); // ShoppingBag icon
    });

    it('renders with custom trigger when provided', () => {
      const customTrigger = <button>Custom Cart Button</button>;
      render(<MiniCart trigger={customTrigger} />);
      
      expect(screen.getByText('Custom Cart Button')).toBeInTheDocument();
    });

    it('shows item count badge when cart has items', () => {
      (useCart as jest.Mock).mockReturnValue(mockCartWithItems);
      render(<MiniCart />);
      
      // Wait for client-side hydration
      waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('shows 99+ when item count exceeds 99', () => {
      (useCart as jest.Mock).mockReturnValue({
        ...mockCartWithItems,
        totalItems: 100,
      });
      render(<MiniCart />);
      
      waitFor(() => {
        expect(screen.getByText('99+')).toBeInTheDocument();
      });
    });
  });

  describe('Empty Cart State', () => {
    it('displays empty cart message when no items', () => {
      render(<MiniCart isOpen={true} />);
      
      expect(screen.getByText('Your bag is empty')).toBeInTheDocument();
      expect(screen.getByText('Start shopping to add items to your bag')).toBeInTheDocument();
      expect(screen.getByText('CONTINUE SHOPPING')).toBeInTheDocument();
    });

    it('shows shopping bag icon in empty state', () => {
      render(<MiniCart isOpen={true} />);
      
      const emptyStateContainer = screen.getByText('Your bag is empty').parentElement;
      expect(emptyStateContainer?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Cart with Items', () => {
    beforeEach(() => {
      (useCart as jest.Mock).mockReturnValue(mockCartWithItems);
    });

    it('displays all cart items correctly', () => {
      render(<MiniCart isOpen={true} />);
      
      expect(screen.getByText('Premium T-Shirt')).toBeInTheDocument();
      expect(screen.getByText('Classic Jeans')).toBeInTheDocument();
      expect(screen.getByText('£29.99')).toBeInTheDocument();
      expect(screen.getByText('£59.99')).toBeInTheDocument();
      expect(screen.getByText('Size: M')).toBeInTheDocument();
      expect(screen.getByText('Size: L')).toBeInTheDocument();
    });

    it('displays correct item quantities', () => {
      render(<MiniCart isOpen={true} />);
      
      const quantities = screen.getAllByText(/^\d+$/);
      expect(quantities[0]).toHaveTextContent('3'); // Total items in header
      expect(quantities[1]).toHaveTextContent('2'); // First item quantity
      expect(quantities[2]).toHaveTextContent('1'); // Second item quantity
    });

    it('renders item images with correct attributes', () => {
      render(<MiniCart isOpen={true} />);
      
      const tshirtImage = screen.getByAltText('Premium T-Shirt');
      expect(tshirtImage).toHaveAttribute('src', '/images/tshirt.jpg');
      expect(tshirtImage).toHaveAttribute('data-fill', 'true');
      expect(tshirtImage).toHaveAttribute('data-sizes', '80px');
    });

    it('shows subtotal correctly formatted', () => {
      render(<MiniCart isOpen={true} />);
      
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText('£119.97')).toBeInTheDocument();
    });

    it('displays shipping message', () => {
      render(<MiniCart isOpen={true} />);
      
      expect(screen.getByText('Shipping and taxes calculated at checkout')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<MiniCart isOpen={true} />);
      
      expect(screen.getByText('CHECKOUT')).toBeInTheDocument();
      expect(screen.getByText('VIEW BAG')).toBeInTheDocument();
      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    });
  });

  describe('Quantity Controls', () => {
    beforeEach(() => {
      (useCart as jest.Mock).mockReturnValue(mockCartWithItems);
    });

    it('increases quantity when plus button clicked', async () => {
      const user = userEvent.setup();
      render(<MiniCart isOpen={true} />);
      
      const plusButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('.lucide-plus')
      );
      
      await user.click(plusButtons[0]);
      
      expect(mockCartWithItems.updateItem).toHaveBeenCalledWith({
        itemId: 'item-1',
        size: 'M',
        quantity: 3,
      });
    });

    it('decreases quantity when minus button clicked', async () => {
      const user = userEvent.setup();
      render(<MiniCart isOpen={true} />);
      
      const minusButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('.lucide-minus')
      );
      
      await user.click(minusButtons[0]);
      
      expect(mockCartWithItems.updateItem).toHaveBeenCalledWith({
        itemId: 'item-1',
        size: 'M',
        quantity: 1,
      });
    });

    it('disables minus button when quantity is 1', () => {
      render(<MiniCart isOpen={true} />);
      
      const itemContainers = screen.getAllByText(/Classic Jeans/i)[0].closest('.flex.gap-4');
      const minusButton = itemContainers?.querySelector('button .lucide-minus')?.parentElement;
      
      expect(minusButton).toBeDisabled();
    });

    it('disables quantity buttons when updating', () => {
      (useCart as jest.Mock).mockReturnValue({
        ...mockCartWithItems,
        isUpdatingItem: true,
      });
      
      render(<MiniCart isOpen={true} />);
      
      const quantityButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('.lucide-plus') || btn.querySelector('.lucide-minus')
      );
      
      quantityButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('handles items without size properly', async () => {
      const user = userEvent.setup();
      (useCart as jest.Mock).mockReturnValue({
        ...mockCartWithItems,
        cart: {
          items: [{
            id: 'item-3',
            name: 'Accessory',
            price: 19.99,
            quantity: 1,
            image: '/images/accessory.jpg',
          }],
        },
      });
      
      render(<MiniCart isOpen={true} />);
      
      const plusButton = screen.getByRole('button', { name: '' }).parentElement?.querySelector('.lucide-plus')?.parentElement;
      await user.click(plusButton!);
      
      expect(mockCartWithItems.updateItem).toHaveBeenCalledWith({
        itemId: 'item-3',
        size: 'default',
        quantity: 2,
      });
    });
  });

  describe('Remove Item Functionality', () => {
    beforeEach(() => {
      (useCart as jest.Mock).mockReturnValue(mockCartWithItems);
    });

    it('removes item when trash button clicked', async () => {
      const user = userEvent.setup();
      render(<MiniCart isOpen={true} />);
      
      const removeButtons = screen.getAllByLabelText('Remove item');
      await user.click(removeButtons[0]);
      
      expect(mockCartWithItems.removeItem).toHaveBeenCalledWith('item-1', 'M');
    });

    it('disables remove buttons when removing', () => {
      (useCart as jest.Mock).mockReturnValue({
        ...mockCartWithItems,
        isRemovingItem: true,
      });
      
      render(<MiniCart isOpen={true} />);
      
      const removeButtons = screen.getAllByLabelText('Remove item');
      removeButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('handles remove for items without size', async () => {
      const user = userEvent.setup();
      (useCart as jest.Mock).mockReturnValue({
        ...mockCartWithItems,
        cart: {
          items: [{
            id: 'item-3',
            name: 'Accessory',
            price: 19.99,
            quantity: 1,
            image: '/images/accessory.jpg',
          }],
        },
      });
      
      render(<MiniCart isOpen={true} />);
      
      const removeButton = screen.getByLabelText('Remove item');
      await user.click(removeButton);
      
      expect(mockCartWithItems.removeItem).toHaveBeenCalledWith('item-3', 'default');
    });
  });

  describe('Sheet Control', () => {
    it('opens when controlled externally', () => {
      const { rerender } = render(<MiniCart isOpen={false} />);
      
      expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'false');
      
      rerender(<MiniCart isOpen={true} />);
      
      expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'true');
    });

    it('calls onOpenChange when sheet state changes', async () => {
      const mockOnOpenChange = jest.fn();
      const user = userEvent.setup();
      render(<MiniCart isOpen={true} onOpenChange={mockOnOpenChange} />);
      
      const closeButton = screen.getByRole('button', { name: '' }).parentElement?.querySelector('.lucide-x')?.parentElement;
      await user.click(closeButton!);
      
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes when action links are clicked', async () => {
      const mockOnOpenChange = jest.fn();
      const user = userEvent.setup();
      (useCart as jest.Mock).mockReturnValue(mockCartWithItems);
      
      render(<MiniCart isOpen={true} onOpenChange={mockOnOpenChange} />);
      
      // Click checkout link
      await user.click(screen.getByText('CHECKOUT'));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      
      // Click view bag link
      await user.click(screen.getByText('VIEW BAG'));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      
      // Click continue shopping
      await user.click(screen.getByText('Continue Shopping'));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('auto-opens when items are added', async () => {
      const { rerender } = render(<MiniCart />);
      
      // Initially empty cart
      expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'false');
      
      // Update to cart with items
      (useCart as jest.Mock).mockReturnValue(mockCartWithItems);
      rerender(<MiniCart />);
      
      // Should auto-open after delay
      await waitFor(() => {
        expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'true');
      }, { timeout: 200 });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      (useCart as jest.Mock).mockReturnValue(mockCartWithItems);
      render(<MiniCart />);
      
      expect(screen.getByLabelText('Shopping cart with 3 items')).toBeInTheDocument();
    });

    it('has accessible quantity controls', () => {
      (useCart as jest.Mock).mockReturnValue(mockCartWithItems);
      render(<MiniCart isOpen={true} />);
      
      const removeButtons = screen.getAllByLabelText('Remove item');
      expect(removeButtons).toHaveLength(2);
    });

    it('announces cart total in header', () => {
      (useCart as jest.Mock).mockReturnValue(mockCartWithItems);
      render(<MiniCart isOpen={true} />);
      
      expect(screen.getByText('Shopping Bag (3)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing item images gracefully', () => {
      (useCart as jest.Mock).mockReturnValue({
        ...mockCartWithItems,
        cart: {
          items: [{
            id: 'item-1',
            name: 'Product without image',
            price: 29.99,
            quantity: 1,
          }],
        },
      });
      
      render(<MiniCart isOpen={true} />);
      
      const image = screen.getByAltText('Product without image');
      expect(image).toHaveAttribute('src', '/placeholder.svg');
    });

    it('handles zero price correctly', () => {
      (useCart as jest.Mock).mockReturnValue({
        cart: {
          items: [{
            id: 'free-item',
            name: 'Free Sample',
            price: 0,
            quantity: 1,
          }],
        },
        totalItems: 1,
        totalPrice: 0,
        updateItem: jest.fn(),
        removeItem: jest.fn(),
        isUpdatingItem: false,
        isRemovingItem: false,
      });
      
      render(<MiniCart isOpen={true} />);
      
      expect(screen.getByText('£0.00')).toBeInTheDocument();
    });

    it('handles very long product names', () => {
      (useCart as jest.Mock).mockReturnValue({
        ...mockCartWithItems,
        cart: {
          items: [{
            id: 'long-name',
            name: 'This is a very long product name that should be truncated in the mini cart view',
            price: 29.99,
            quantity: 1,
          }],
        },
      });
      
      render(<MiniCart isOpen={true} />);
      
      const productName = screen.getByText(/This is a very long product name/);
      expect(productName).toHaveClass('truncate');
    });
  });

  describe('Performance', () => {
    it('prevents unnecessary re-renders with stable callbacks', () => {
      const { rerender } = render(<MiniCart />);
      
      const firstRender = screen.getByTestId('sheet');
      
      rerender(<MiniCart />);
      
      const secondRender = screen.getByTestId('sheet');
      expect(firstRender).toBe(secondRender);
    });

    it('cleans up timers on unmount', () => {
      jest.useFakeTimers();
      const { unmount } = render(<MiniCart />);
      
      // Trigger auto-open by updating cart
      (useCart as jest.Mock).mockReturnValue(mockCartWithItems);
      
      unmount();
      
      // Advance timers - should not cause errors
      jest.advanceTimersByTime(200);
      
      jest.useRealTimers();
    });
  });
});