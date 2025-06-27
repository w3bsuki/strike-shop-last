import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteHeader } from '@/components/navigation';
import { useUser, SignInButton, UserButton } from '@/lib/clerk-mock';
import { useWishlistCount } from '@/lib/stores';
import { useRouter } from 'next/navigation';
import { useAria, useFocusManager, useFocusTrap } from '@/components/accessibility/enhanced-focus-manager';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock navigation components
jest.mock('@/components/navigation/newsletter-banner', () => ({
  NewsletterBanner: () => (
    <div role="banner" aria-label="Newsletter signup banner">
      <p>SIGN UP FOR 10% OFF YOUR FIRST ORDER</p>
      <button aria-label="Close newsletter banner">X</button>
    </div>
  ),
}));

jest.mock('@/components/navigation/navbar', () => ({
  NavBar: () => <nav>NavBar</nav>,
}));

jest.mock('@/components/navigation/mobile-nav', () => ({
  MobileNav: () => <div>MobileNav</div>,
}));

jest.mock('@/components/navigation/search-bar', () => ({
  SearchBar: ({ variant }: any) => (
    <button aria-label="Search" data-variant={variant}>Search</button>
  ),
}));

jest.mock('@/components/navigation/user-nav', () => ({
  UserNav: ({ showCart }: any) => (
    <div data-show-cart={showCart}>UserNav</div>
  ),
}));

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href, className, ...props }: any) => (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    ),
  };
});

jest.mock('@/lib/clerk-mock', () => ({
  useUser: jest.fn(),
  SignInButton: ({ children, mode }: any) => (
    <div data-testid="sign-in-button" data-mode={mode}>
      {children}
    </div>
  ),
  UserButton: ({ appearance, afterSignOutUrl }: any) => (
    <div 
      data-testid="user-button" 
      data-after-sign-out-url={afterSignOutUrl}
    >
      User Avatar
    </div>
  ),
}));

jest.mock('@/lib/stores', () => ({
  useWishlistCount: jest.fn(() => 0),
}));

jest.mock('@/components/cart/mini-cart', () => ({
  MiniCart: ({ trigger }: any) => (
    <div data-testid="mini-cart">
      {trigger}
    </div>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ placeholder, value, onChange, className, autoFocus }: any) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
      autoFocus={autoFocus}
      data-testid="search-input"
    />
  ),
}));

jest.mock('@/components/accessibility/enhanced-focus-manager', () => ({
  useFocusManager: jest.fn(() => ({
    restoreFocus: jest.fn(),
  })),
  useFocusTrap: jest.fn(() => React.createRef()),
}));

jest.mock('@/components/accessibility/aria-helpers', () => ({
  useAria: jest.fn(() => ({
    announceToScreenReader: jest.fn(),
  })),
  Landmark: ({ children, role, className, label, as: Component = 'div' }: any) => (
    <Component role={role} className={className} aria-label={label}>
      {children}
    </Component>
  ),
  AccessibleButton: ({ children, onClick, className, pressed, controls, description, variant }: any) => (
    <button
      onClick={onClick}
      className={className}
      aria-pressed={pressed}
      aria-controls={controls}
      aria-label={description}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

describe('SiteHeader', () => {
  const mockPush = jest.fn();
  const mockAnnounceToScreenReader = jest.fn();
  const mockRestoreFocus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useUser as jest.Mock).mockReturnValue({
      isSignedIn: false,
      user: null,
    });
    (useAria as jest.Mock).mockReturnValue({
      announceToScreenReader: mockAnnounceToScreenReader,
    });
    (useFocusManager as jest.Mock).mockReturnValue({
      restoreFocus: mockRestoreFocus,
    });
    
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
    });
  });

  describe('Rendering', () => {
    it('renders all navigation items', () => {
      render(<SiteHeader />);
      
      const navItems = ['SALE', 'NEW', 'HOT', 'MEN', 'WOMEN', 'KIDS', 'SPECIAL'];
      navItems.forEach(item => {
        expect(screen.getByText(`"${item}"`)).toBeInTheDocument();
      });
    });

    it('renders logo with correct link', () => {
      render(<SiteHeader />);
      
      const logo = screen.getByLabelText('STRIKE home');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('href', '/');
      expect(logo).toHaveTextContent('STRIKE™');
    });

    it('renders newsletter banner when visible', () => {
      render(<SiteHeader />);
      
      expect(screen.getByText(/Sign up to our community newsletter/)).toBeInTheDocument();
    });

    it('renders search button on desktop', () => {
      render(<SiteHeader />);
      
      const searchButton = screen.getByLabelText('Search');
      expect(searchButton).toBeInTheDocument();
    });

    it('renders mobile search bar', () => {
      render(<SiteHeader />);
      
      const mobileSearchInputs = screen.getAllByPlaceholderText('Search products...');
      expect(mobileSearchInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Newsletter Banner', () => {
    it('dismisses newsletter banner when close button clicked', async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      
      const closeButton = screen.getByLabelText('Closes the newsletter signup banner');
      await user.click(closeButton);
      
      expect(screen.queryByText(/Sign up to our community newsletter/)).not.toBeInTheDocument();
      expect(mockAnnounceToScreenReader).toHaveBeenCalledWith('Newsletter banner dismissed', 'polite');
    });
  });

  describe('Mobile Menu', () => {
    it('opens mobile menu when menu button clicked', async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      
      const menuButton = screen.getByLabelText('Opens the main navigation menu on mobile devices');
      await user.click(menuButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(mockAnnounceToScreenReader).toHaveBeenCalledWith('Menu opened', 'polite');
    });

    it('closes mobile menu when backdrop clicked', async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      
      // Open menu first
      const menuButton = screen.getByLabelText('Opens the main navigation menu on mobile devices');
      await user.click(menuButton);
      
      // Click backdrop
      const backdrop = screen.getByRole('dialog').querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop!);
      
      expect(mockAnnounceToScreenReader).toHaveBeenCalledWith('Menu closed', 'polite');
      expect(mockRestoreFocus).toHaveBeenCalled();
    });

    it('toggles aria-pressed state on menu button', async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      
      const menuButton = screen.getByLabelText('Opens the main navigation menu on mobile devices');
      expect(menuButton).toHaveAttribute('aria-pressed', 'false');
      
      await user.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Search Functionality', () => {
    it('toggles desktop search visibility', async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      
      const searchButton = screen.getByLabelText('Search');
      await user.click(searchButton);
      
      // Should show desktop search input
      const searchInputs = screen.getAllByTestId('search-input');
      expect(searchInputs.some(input => input.hasAttribute('autoFocus'))).toBe(true);
    });

    it('performs desktop search on form submit', async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      
      // Open search
      const searchButton = screen.getByLabelText('Search');
      await user.click(searchButton);
      
      // Type search query
      const searchInput = screen.getAllByTestId('search-input').find(input => input.hasAttribute('autoFocus'));
      await user.type(searchInput!, 'test query');
      
      // Submit form
      const form = searchInput!.closest('form');
      fireEvent.submit(form!);
      
      expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query');
      expect(mockAnnounceToScreenReader).toHaveBeenCalledWith('Searching for test query', 'polite');
    });

    it('performs mobile search on form submit', async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      
      // Find mobile search input (one without autoFocus)
      const searchInputs = screen.getAllByTestId('search-input');
      const mobileSearchInput = searchInputs.find(input => !input.hasAttribute('autoFocus'));
      
      await user.type(mobileSearchInput!, 'mobile search');
      
      const form = mobileSearchInput!.closest('form');
      fireEvent.submit(form!);
      
      expect(mockPush).toHaveBeenCalledWith('/search?q=mobile%20search');
      expect(mockAnnounceToScreenReader).toHaveBeenCalledWith('Searching for mobile search', 'polite');
    });

    it('closes desktop search with ESC button', async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      
      // Open search
      const searchButton = screen.getByLabelText('Search');
      await user.click(searchButton);
      
      // Click ESC button
      const escButton = screen.getByText('ESC');
      await user.click(escButton);
      
      // Search should be closed
      expect(screen.queryByText('ESC')).not.toBeInTheDocument();
    });

    it('does not search with empty query', async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      
      const searchInputs = screen.getAllByTestId('search-input');
      const mobileSearchInput = searchInputs.find(input => !input.hasAttribute('autoFocus'));
      
      const form = mobileSearchInput!.closest('form');
      fireEvent.submit(form!);
      
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Wishlist', () => {
    it('shows wishlist button when user is signed in', () => {
      (useUser as jest.Mock).mockReturnValue({
        isSignedIn: true,
        user: { id: 'user-123' },
      });
      
      render(<SiteHeader />);
      
      const wishlistLinks = screen.getAllByLabelText(/Wishlist/);
      expect(wishlistLinks.length).toBeGreaterThan(0);
    });

    it('does not show wishlist button when user is not signed in', () => {
      (useUser as jest.Mock).mockReturnValue({
        isSignedIn: false,
        user: null,
      });
      
      render(<SiteHeader />);
      
      expect(screen.queryByLabelText(/Wishlist/)).not.toBeInTheDocument();
    });

    it('displays wishlist count', () => {
      (useUser as jest.Mock).mockReturnValue({
        isSignedIn: true,
        user: { id: 'user-123' },
      });
      (useWishlistCount as jest.Mock).mockReturnValue(5);
      
      render(<SiteHeader />);
      
      expect(screen.getAllByText('5')).toHaveLength(2); // Mobile and desktop
    });

    it('displays 9+ for wishlist count over 9 on mobile', () => {
      (useUser as jest.Mock).mockReturnValue({
        isSignedIn: true,
        user: { id: 'user-123' },
      });
      (useWishlistCount as jest.Mock).mockReturnValue(10);
      
      render(<SiteHeader />);
      
      expect(screen.getByText('9+')).toBeInTheDocument();
    });

    it('displays 99+ for wishlist count over 99 on desktop', () => {
      (useUser as jest.Mock).mockReturnValue({
        isSignedIn: true,
        user: { id: 'user-123' },
      });
      (useWishlistCount as jest.Mock).mockReturnValue(100);
      
      render(<SiteHeader />);
      
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  describe('User Authentication', () => {
    it('shows sign in button when user is not signed in', () => {
      (useUser as jest.Mock).mockReturnValue({
        isSignedIn: false,
        user: null,
      });
      
      render(<SiteHeader />);
      
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Sign in')).toBeInTheDocument();
    });

    it('shows user button when user is signed in', () => {
      (useUser as jest.Mock).mockReturnValue({
        isSignedIn: true,
        user: { id: 'user-123' },
      });
      
      render(<SiteHeader />);
      
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      expect(screen.getByTestId('user-button')).toHaveAttribute('data-after-sign-out-url', '/');
    });
  });

  describe('Scroll Behavior', () => {
    it('adds shadow when scrolled', async () => {
      render(<SiteHeader />);
      
      const header = screen.getByLabelText('Main site header');
      expect(header.className).not.toContain('shadow-sm');
      
      // Simulate scroll
      Object.defineProperty(window, 'scrollY', { value: 50 });
      fireEvent.scroll(window);
      
      await waitFor(() => {
        expect(header.className).toContain('shadow-sm');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper landmark roles', () => {
      render(<SiteHeader />);
      
      expect(screen.getByLabelText('Newsletter signup banner')).toHaveAttribute('role', 'banner');
      expect(screen.getByLabelText('Main site header')).toHaveAttribute('role', 'banner');
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    });

    it('has proper ARIA attributes on mobile menu', async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      
      const menuButton = screen.getByLabelText('Opens the main navigation menu on mobile devices');
      await user.click(menuButton);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'mobile-menu-title');
    });

    it('has accessible labels on all interactive elements', () => {
      render(<SiteHeader />);
      
      expect(screen.getByLabelText('STRIKE home')).toBeInTheDocument();
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
      expect(screen.getByLabelText('Shopping cart')).toBeInTheDocument();
    });

    it('announces state changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      
      // Test menu open/close announcements
      const menuButton = screen.getByLabelText('Opens the main navigation menu on mobile devices');
      await user.click(menuButton);
      expect(mockAnnounceToScreenReader).toHaveBeenCalledWith('Menu opened', 'polite');
      
      await user.click(menuButton);
      expect(mockAnnounceToScreenReader).toHaveBeenCalledWith('Menu closed', 'polite');
    });
  });

  describe('Mini Cart Integration', () => {
    it('renders mini cart with custom trigger', () => {
      render(<SiteHeader />);
      
      expect(screen.getByTestId('mini-cart')).toBeInTheDocument();
      expect(screen.getByLabelText('Shopping cart')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user gracefully', () => {
      (useUser as jest.Mock).mockReturnValue({
        isSignedIn: false,
        user: undefined,
      });
      
      expect(() => render(<SiteHeader />)).not.toThrow();
    });

    it('handles scroll event cleanup on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<SiteHeader />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });
});