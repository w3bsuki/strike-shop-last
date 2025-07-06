import React from 'react';
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils';
import { ProductCard } from './product-card';
import { mockProduct } from '@/__tests__/utils/mock-data';
import { useStore } from '@/lib/store';

// Mock the store
jest.mock('@/lib/store');

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe('ProductCard', () => {
  const mockAddToCart = jest.fn();
  const mockAddToWishlist = jest.fn();
  const mockIsInWishlist = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as jest.Mock).mockReturnValue({
      actions: {
        cart: { addItem: mockAddToCart },
        wishlist: { 
          addToWishlist: mockAddToWishlist,
          isInWishlist: mockIsInWishlist,
        },
      },
    });
    mockIsInWishlist.mockReturnValue(false);
  });

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
    expect(screen.getByText('€100.00')).toBeInTheDocument();
    expect(screen.getByAltText(mockProduct.featuredImage!.altText!)).toBeInTheDocument();
  });

  it('displays compare at price when available', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('€150.00')).toBeInTheDocument();
    expect(screen.getByText('€150.00')).toHaveClass('line-through');
  });

  it('shows discount percentage when compare at price exists', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('-33%')).toBeInTheDocument();
  });

  it('adds product to cart when Add to Cart is clicked', async () => {
    render(<ProductCard product={mockProduct} />);

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(mockAddToCart).toHaveBeenCalledWith(
      mockProduct.id,
      mockProduct.variants[0].id,
      1,
      expect.objectContaining({
        name: mockProduct.title,
        price: 100,
      })
    );
  });

  it('adds product to wishlist when wishlist button is clicked', () => {
    render(<ProductCard product={mockProduct} />);

    const wishlistButton = screen.getByRole('button', { name: /add to wishlist/i });
    fireEvent.click(wishlistButton);

    expect(mockAddToWishlist).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockProduct.id,
        name: mockProduct.title,
      })
    );
  });

  it('shows filled heart icon when product is in wishlist', () => {
    mockIsInWishlist.mockReturnValue(true);
    render(<ProductCard product={mockProduct} />);

    const wishlistButton = screen.getByRole('button', { name: /remove from wishlist/i });
    expect(wishlistButton).toBeInTheDocument();
  });

  it('disables Add to Cart button when product is not available', () => {
    const unavailableProduct = {
      ...mockProduct,
      availableForSale: false,
      variants: [{
        ...mockProduct.variants[0],
        availableForSale: false,
      }],
    };

    render(<ProductCard product={unavailableProduct} />);

    const addToCartButton = screen.getByText('Out of Stock');
    expect(addToCartButton).toBeDisabled();
  });

  it('shows loading state while adding to cart', async () => {
    mockAddToCart.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ProductCard product={mockProduct} />);

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(screen.getByText('Adding...')).toBeInTheDocument();
  });

  it('applies typewriter font to title and price', () => {
    render(<ProductCard product={mockProduct} />);

    const title = screen.getByText(mockProduct.title);
    const price = screen.getByText('€100.00');

    expect(title).toHaveClass('font-typewriter');
    expect(price).toHaveClass('font-typewriter');
  });

  it('renders correctly in mobile grid layout', () => {
    render(<ProductCard product={mockProduct} />);

    const card = screen.getByRole('article');
    expect(card).toHaveClass('w-[calc((100vw-40px)/2)]', 'max-w-[180px]');
  });
});