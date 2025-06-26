import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryScroll, { CategoryScrollSkeleton } from '@/components/category-scroll';
import { useAria } from '@/components/accessibility/aria-helpers';

// Mock dependencies
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: (props: any) => <img {...props} />,
  };
});

jest.mock('@/components/ui/section-header', () => ({
  SectionHeader: ({ title, ctaText, ctaHref, id }: any) => (
    <div>
      <h2 id={id}>{title}</h2>
      <a href={ctaHref}>{ctaText}</a>
    </div>
  ),
}));

jest.mock('@/components/accessibility/aria-helpers', () => ({
  useAria: jest.fn(() => ({
    announceToScreenReader: jest.fn(),
  })),
  AccessibleButton: ({ children, onClick, disabled, description, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={description}
      className={className}
    >
      {children}
    </button>
  ),
}));

const mockCategories = [
  {
    id: '1',
    name: 'Electronics',
    count: 45,
    image: '/images/electronics.jpg',
    slug: 'electronics',
  },
  {
    id: '2',
    name: 'Clothing',
    count: 120,
    image: '/images/clothing.jpg',
    slug: 'clothing',
  },
  {
    id: '3',
    name: 'Books',
    count: 89,
    image: '/images/books.jpg',
    slug: 'books',
  },
  {
    id: '4',
    name: 'Home & Garden',
    count: 67,
    image: '/images/home-garden.jpg',
    slug: 'home-garden',
  },
  {
    id: '5',
    name: 'Sports',
    count: 34,
    image: '/images/sports.jpg',
    slug: 'sports',
  },
];

describe('CategoryScroll', () => {
  const mockAnnounceToScreenReader = jest.fn();
  
  beforeEach(() => {
    (useAria as jest.Mock).mockReturnValue({
      announceToScreenReader: mockAnnounceToScreenReader,
    });
    mockAnnounceToScreenReader.mockClear();
  });

  describe('Rendering', () => {
    it('renders the component with all categories', () => {
      render(<CategoryScroll title="Shop by Category" categories={mockCategories} />);
      
      expect(screen.getByText('Shop by Category')).toBeInTheDocument();
      expect(screen.getByText('View All')).toBeInTheDocument();
      
      mockCategories.forEach(category => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
        expect(screen.getByText(`${category.count} Items`)).toBeInTheDocument();
      });
    });

    it('renders correct singular/plural for item count', () => {
      const singleItemCategory = {
        id: '6',
        name: 'Limited Edition',
        count: 1,
        image: '/images/limited.jpg',
        slug: 'limited-edition',
      };
      
      render(<CategoryScroll title="Categories" categories={[singleItemCategory]} />);
      expect(screen.getByText('1 Item')).toBeInTheDocument();
    });

    it('renders links with correct href', () => {
      render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      mockCategories.forEach(category => {
        const link = screen.getByLabelText(`${category.name} category with ${category.count} items`);
        expect(link).toHaveAttribute('href', `/${category.slug}`);
      });
    });

    it('renders images with correct attributes', () => {
      render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const images = screen.getAllByRole('img');
      images.forEach((img, index) => {
        expect(img).toHaveAttribute('src', mockCategories[index].image);
        expect(img).toHaveAttribute('alt', `${mockCategories[index].name} category`);
      });
    });

    it('sets priority loading for first 3 images', () => {
      render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const images = screen.getAllByRole('img');
      images.forEach((img, index) => {
        if (index < 3) {
          expect(img).toHaveAttribute('loading', 'eager');
          expect(img).toHaveAttribute('priority', 'true');
        } else {
          expect(img).toHaveAttribute('loading', 'lazy');
          expect(img).not.toHaveAttribute('priority');
        }
      });
    });
  });

  describe('Scroll Navigation', () => {
    beforeEach(() => {
      // Mock scrollTo
      Element.prototype.scrollTo = jest.fn();
    });

    it('shows navigation buttons on desktop', () => {
      render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      expect(screen.getByLabelText('Scroll categories carousel left')).toBeInTheDocument();
      expect(screen.getByLabelText('Scroll categories carousel right')).toBeInTheDocument();
    });

    it('disables left button initially', () => {
      render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const leftButton = screen.getByLabelText('Scroll categories carousel left');
      expect(leftButton).toBeDisabled();
      expect(leftButton.className).toContain('opacity-0');
    });

    it('enables right button when content is scrollable', () => {
      render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const rightButton = screen.getByLabelText('Scroll categories carousel right');
      expect(rightButton).not.toBeDisabled();
      expect(rightButton.className).toContain('opacity-100');
    });

    it('scrolls right when right button is clicked', async () => {
      const { container } = render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const scrollContainer = container.querySelector('[role="region"][aria-label="Category carousel"]');
      const rightButton = screen.getByLabelText('Scroll categories carousel right');
      
      fireEvent.click(rightButton);
      
      expect(scrollContainer?.scrollTo).toHaveBeenCalledWith({
        left: expect.any(Number),
        behavior: 'smooth',
      });
      
      expect(mockAnnounceToScreenReader).toHaveBeenCalledWith(
        'Scrolled right in category carousel',
        'polite'
      );
    });

    it('scrolls left when left button is clicked', async () => {
      const { container } = render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const scrollContainer = container.querySelector('[role="region"][aria-label="Category carousel"]');
      const leftButton = screen.getByLabelText('Scroll categories carousel left');
      
      // Simulate that we've scrolled right first
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        value: 500,
        configurable: true,
      });
      
      fireEvent.click(leftButton);
      
      expect(scrollContainer?.scrollTo).toHaveBeenCalledWith({
        left: expect.any(Number),
        behavior: 'smooth',
      });
      
      expect(mockAnnounceToScreenReader).toHaveBeenCalledWith(
        'Scrolled left in category carousel',
        'polite'
      );
    });

    it('updates button states on scroll', () => {
      const { container } = render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const scrollContainer = container.querySelector('[role="region"][aria-label="Category carousel"]');
      
      // Simulate scroll to middle
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        value: 500,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, 'scrollWidth', {
        value: 1500,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, 'clientWidth', {
        value: 800,
        configurable: true,
      });
      
      fireEvent.scroll(scrollContainer!);
      
      const leftButton = screen.getByLabelText('Scroll categories carousel left');
      const rightButton = screen.getByLabelText('Scroll categories carousel right');
      
      expect(leftButton).not.toBeDisabled();
      expect(rightButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<CategoryScroll title="Shop by Category" categories={mockCategories} />);
      
      expect(screen.getByRole('region', { name: 'Category carousel' })).toBeInTheDocument();
      expect(screen.getByLabelText('Shop by Category')).toBeInTheDocument();
      expect(screen.getByRole('tablist', { name: 'Category carousel pages' })).toBeInTheDocument();
    });

    it('has keyboard-accessible scroll container', () => {
      const { container } = render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const scrollContainer = container.querySelector('[role="region"][aria-label="Category carousel"]');
      expect(scrollContainer).toHaveAttribute('tabIndex', '0');
    });

    it('provides screen reader announcements on scroll', () => {
      render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const rightButton = screen.getByLabelText('Scroll categories carousel right');
      fireEvent.click(rightButton);
      
      expect(mockAnnounceToScreenReader).toHaveBeenCalledWith(
        'Scrolled right in category carousel',
        'polite'
      );
    });

    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const firstLink = screen.getByLabelText(`${mockCategories[0].name} category with ${mockCategories[0].count} items`);
      
      await user.tab();
      expect(firstLink).toHaveFocus();
    });
  });

  describe('Mobile Experience', () => {
    it('shows scroll indicators on mobile', () => {
      render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const indicators = screen.getAllByRole('tab');
      expect(indicators).toHaveLength(mockCategories.length);
      
      // First indicator should be selected
      expect(indicators[0]).toHaveAttribute('aria-selected', 'true');
      expect(indicators[0].className).toContain('w-6 bg-black');
      
      // Others should not be selected
      indicators.slice(1).forEach(indicator => {
        expect(indicator).toHaveAttribute('aria-selected', 'false');
        expect(indicator.className).toContain('w-1.5 bg-gray-300');
      });
    });

    it('has touch-friendly scrolling', () => {
      const { container } = render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const scrollContainer = container.querySelector('[role="region"][aria-label="Category carousel"]');
      expect(scrollContainer?.className).toContain('touch-pan-x');
    });
  });

  describe('Performance', () => {
    it('cleans up event listeners on unmount', () => {
      const { container, unmount } = render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const scrollContainer = container.querySelector('[role="region"][aria-label="Category carousel"]');
      const removeEventListenerSpy = jest.spyOn(scrollContainer!, 'removeEventListener');
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });

  describe('Edge Cases', () => {
    it('handles empty categories array', () => {
      render(<CategoryScroll title="Categories" categories={[]} />);
      
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('handles missing scroll container ref', () => {
      render(<CategoryScroll title="Categories" categories={mockCategories} />);
      
      const rightButton = screen.getByLabelText('Scroll categories carousel right');
      
      // This should not throw
      expect(() => fireEvent.click(rightButton)).not.toThrow();
    });
  });
});

describe('CategoryScrollSkeleton', () => {
  it('renders loading skeleton with correct structure', () => {
    render(<CategoryScrollSkeleton />);
    
    // Check for animated loading elements
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
    
    // Check for correct number of skeleton cards
    const skeletonCards = document.querySelectorAll('.flex-shrink-0');
    expect(skeletonCards).toHaveLength(5);
  });

  it('has correct accessibility attributes', () => {
    const { container } = render(<CategoryScrollSkeleton />);
    
    // Should have section element
    expect(container.querySelector('section')).toBeInTheDocument();
  });
});