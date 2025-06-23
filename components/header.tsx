'use client';

import { useState, useEffect } from 'react';
import { User, ShoppingBag, Menu, X, Search, Heart } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { MiniCart } from '@/components/cart/mini-cart';
import { SignInButton, UserButton, useUser } from '@/lib/clerk-mock';
import { useRouter } from 'next/navigation';
import { useWishlistCount } from '@/lib/stores';
import { useFocusManager, useFocusTrap } from '@/components/accessibility/enhanced-focus-manager';
import { useAria, Landmark, AccessibleButton } from '@/components/accessibility/aria-helpers';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNewsletterVisible, setIsNewsletterVisible] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const wishlistCount = useWishlistCount();
  
  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAria();
  const { restoreFocus } = useFocusManager();
  const menuTrapRef = useFocusTrap(isMenuOpen);

  useEffect(() => {
    setIsClient(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/sale', label: 'SALE' },
    { href: '/new', label: 'NEW' },
    { href: '/hot', label: 'HOT' },
    { href: '/men', label: 'MEN' },
    { href: '/women', label: 'WOMEN' },
    { href: '/kids', label: 'KIDS' },
    { href: '/special', label: 'SPECIAL' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchVisible(false);
      setSearchQuery('');
      announceToScreenReader(`Searching for ${searchQuery}`, 'polite');
    }
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      announceToScreenReader(`Searching for ${searchQuery}`, 'polite');
    }
  };

  const handleMenuToggle = () => {
    const newMenuState = !isMenuOpen;
    setIsMenuOpen(newMenuState);
    
    if (newMenuState) {
      announceToScreenReader('Menu opened', 'polite');
    } else {
      announceToScreenReader('Menu closed', 'polite');
      restoreFocus();
    }
  };

  const handleNewsletterDismiss = () => {
    setIsNewsletterVisible(false);
    announceToScreenReader('Newsletter banner dismissed', 'polite');
  };

  return (
    <>
      {isNewsletterVisible && (
        <Landmark 
          role="banner" 
          className="bg-black text-center py-2 text-[10px] font-normal tracking-wider relative uppercase"
          label="Newsletter signup banner"
        >
          <div className="relative">
            <p className="px-12 font-typewriter font-medium text-white">
              Sign up to our community newsletter for 10% off your next order
            </p>
            <AccessibleButton
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation bg-transparent text-white hover:bg-white/10 focus:bg-white/10"
              onClick={handleNewsletterDismiss}
              variant="ghost"
              description="Closes the newsletter signup banner"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Close newsletter banner</span>
            </AccessibleButton>
          </div>
        </Landmark>
      )}

      <Landmark
        role="banner"
        as="header"
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm transition-shadow duration-300 ${isScrolled ? 'shadow-sm' : ''}`}
        label="Main site header"
      >
        <nav className="strike-container" role="navigation" aria-label="Main navigation">
          <div className="flex items-center justify-between h-14">
            {/* Mobile Menu Button - Left Side */}
            <div className="lg:hidden flex items-center">
              <AccessibleButton
                onClick={handleMenuToggle}
                pressed={isMenuOpen}
                controls="mobile-menu"
                description="Opens the main navigation menu on mobile devices"
                className="p-3 -ml-3 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation bg-transparent hover:bg-gray-50 focus:bg-gray-50 transition-colors rounded-sm"
                variant="ghost"
              >
                <Menu className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
                <span className="sr-only">
                  {isMenuOpen ? 'Close main menu' : 'Open main menu'}
                </span>
              </AccessibleButton>
            </div>

            {/* Logo - Left on Desktop, Centered on Mobile */}
            <div className="flex-1 flex justify-center lg:justify-start lg:flex-none">
              <Link
                href="/"
                className="text-lg font-bold tracking-tight flex items-center font-typewriter"
                aria-label="STRIKE home"
              >
                STRIKE™
              </Link>
            </div>

            {/* Desktop Categories - Integrated into Main Navbar */}
            <div className="hidden lg:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className="nav-link">
                  "{item.label}"
                </Link>
              ))}
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-1">
              {/* Mobile Wishlist Button */}
              {isSignedIn && (
                <Link href="/wishlist" className="relative lg:hidden flex items-center p-2 min-h-[44px] min-w-[44px] justify-center touch-manipulation hover:bg-gray-50 transition-colors rounded-sm">
                  <Heart className="h-5 w-5 stroke-[1.5]" />
                  {isClient && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium text-[10px] font-typewriter">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                  <span className="sr-only">Wishlist ({wishlistCount} items)</span>
                </Link>
              )}
              
              {/* Search Button */}
              <button
                className="hidden sm:flex items-center p-3 min-h-[44px] min-w-[44px] justify-center touch-manipulation hover:bg-gray-50 transition-colors rounded-sm"
                aria-label="Search"
                onClick={() => setIsSearchVisible(!isSearchVisible)}
              >
                <Search className="h-5 w-5 stroke-[1.5]" />
              </button>

              {/* Desktop Wishlist Button */}
              {isSignedIn && (
                <Link href="/wishlist" className="relative hidden lg:flex items-center p-3 min-h-[44px] min-w-[44px] justify-center touch-manipulation hover:bg-gray-50 transition-colors rounded-sm">
                  <Heart className="h-5 w-5 stroke-[1.5]" />
                  {isClient && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium font-typewriter">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                  <span className="sr-only">Wishlist ({wishlistCount} items)</span>
                </Link>
              )}

              {/* Account Button */}
              {isSignedIn ? (
                <div className="hidden lg:flex items-center p-3 min-h-[44px] min-w-[44px] justify-center touch-manipulation hover:bg-gray-50 transition-colors rounded-sm">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'h-6 w-6',
                        userButtonPopoverCard: 'bg-white shadow-lg border',
                        userButtonPopoverActionButton: 'hover:bg-gray-50',
                      },
                    }}
                    afterSignOutUrl="/"
                  />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button
                    className="hidden lg:flex items-center p-3 min-h-[44px] min-w-[44px] justify-center touch-manipulation hover:bg-gray-50 transition-colors rounded-sm"
                    aria-label="Sign in"
                  >
                    <User className="h-5 w-5 stroke-[1.5]" />
                  </button>
                </SignInButton>
              )}

              {/* Shopping Cart */}
              <MiniCart trigger={
                <button className="relative p-3 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation hover:bg-gray-50 transition-colors rounded-sm" aria-label="Shopping cart">
                  <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
                </button>
              } />
              
              {/* Desktop Menu Button */}
              <div className="hidden lg:flex items-center">
                <button
                  onClick={() => setIsMenuOpen(true)}
                  aria-label="Open menu"
                  className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation hover:bg-gray-50 transition-colors rounded-sm"
                >
                  <Menu className="h-5 w-5 stroke-[1.5]" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Search Bar - Desktop */}
        {isSearchVisible && (
          <div className="hidden sm:block border-t border-subtle py-3 bg-white">
            <div className="strike-container">
              <div className="relative max-w-md mx-auto">
                <form onSubmit={handleSearch} className="relative w-full">
                  <Input
                    placeholder="Search products..."
                    className="search-input w-full h-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 hover:text-black p-1 min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
                    onClick={() => {
                      setIsSearchVisible(false);
                      setSearchQuery('');
                    }}
                  >
                    ESC
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar - Mobile - Fixed */}
        <div className="sm:hidden border-t border-subtle py-3">
          <div className="strike-container">
            <div className="relative">
              <form onSubmit={handleMobileSearch} className="relative w-full">
                <Input
                  placeholder="Search products..."
                  className="search-input w-full h-12 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
          </div>
        </div>
      </Landmark>

      {/* Mobile Menu Overlay - Slides from Left */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={handleMenuToggle}
            aria-hidden="true"
          />
          <div
            ref={menuTrapRef}
            id="mobile-menu"
            className={`absolute left-0 top-0 flex flex-col h-full w-full max-w-xs bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="flex justify-between items-center p-6 border-b border-subtle">
              <h2 id="mobile-menu-title" className="sr-only">Main Navigation</h2>
              <Link
                href="/"
                className="text-lg font-bold tracking-tight focus:outline-2 focus:outline-offset-2 focus:outline-primary font-typewriter"
                onClick={handleMenuToggle}
              >
                STRIKE™
              </Link>
              <AccessibleButton
                onClick={handleMenuToggle}
                description="Closes the main navigation menu"
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation bg-transparent hover:bg-gray-50 focus:bg-gray-50"
                variant="ghost"
              >
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Close menu</span>
              </AccessibleButton>
            </div>

            <nav className="flex-1 px-6 py-4 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block nav-link text-sm py-2 border-b border-subtle/50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  "{item.label}"
                </Link>
              ))}
            </nav>

            <div className="p-6 border-t border-subtle space-y-4">
              {isSignedIn ? (
                <>
                  <Link
                    href="/account"
                    className="flex items-center space-x-3 nav-link text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>My Account</span>
                  </Link>
                  <Link
                    href="/wishlist"
                    className="flex items-center justify-between nav-link text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <Heart className="h-4 w-4" />
                      <span>Wishlist</span>
                    </div>
                    {isClient && wishlistCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <SignInButton mode="modal">
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 nav-link text-sm w-full text-left"
                  >
                    <User className="h-4 w-4" />
                    <span>Sign In</span>
                  </button>
                </SignInButton>
              )}
              <Link
                href="/help"
                className="block nav-link text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Help & Support
              </Link>
              <Link
                href="/stores"
                className="block nav-link text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Store Locator
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
