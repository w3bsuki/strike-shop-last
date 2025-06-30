'use client';

import { useState, useEffect } from 'react';
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { useIsAuthenticated, useWishlistCount } from '@/lib/stores';

// Import AuthModal directly
import AuthModal from './auth-modal';

export default function BottomNav() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isAuthenticated = useIsAuthenticated();
  const wishlistCount = useWishlistCount();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      // Calculate hero height (65vh on mobile, 70vh on desktop)
      const heroHeight = window.innerWidth < 768 ? window.innerHeight * 0.65 : window.innerHeight * 0.70;
      
      // Show bottom nav after scrolling past hero
      if (window.scrollY > heroHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAccountClick = () => {
    // Haptic feedback for mobile interactions
    if (navigator.vibrate) navigator.vibrate(30);
    
    if (isAuthenticated) {
      // Navigate to account page - handled by Link
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleNavClick = () => {
    // Light haptic feedback for navigation
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  return (
    <>
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-sm border-t border-gray-800 lg:hidden bottom-nav transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        suppressHydrationWarning
      >
        <div className="flex items-center justify-around py-2" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
          <Link
            href="/"
            className="flex flex-col items-center p-3 text-white hover:text-gray-300 transition-colors min-h-[56px] min-w-[48px] touch-manipulation"
            onClick={handleNavClick}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Home
            </span>
          </Link>
          <Link
            href="/search"
            className="flex flex-col items-center p-3 text-white hover:text-gray-300 transition-colors min-h-[56px] min-w-[48px] touch-manipulation"
            onClick={handleNavClick}
          >
            <Search className="h-5 w-5 mb-1" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Search
            </span>
          </Link>
          <Link
            href="/wishlist"
            className="flex flex-col items-center p-3 text-white hover:text-gray-300 transition-colors min-h-[56px] min-w-[48px] touch-manipulation relative"
            onClick={handleNavClick}
          >
            <div className="relative">
              <Heart className="h-5 w-5 mb-1" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium text-[10px]">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">
              Wishlist
            </span>
          </Link>
          <Link
            href="/cart"
            className="flex flex-col items-center p-3 text-white hover:text-gray-300 transition-colors min-h-[56px] min-w-[48px] touch-manipulation"
            onClick={handleNavClick}
          >
            <ShoppingBag className="h-5 w-5 mb-1" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Cart
            </span>
          </Link>
          {isAuthenticated ? (
            <Link
              href="/account"
              className="flex flex-col items-center p-3 text-white hover:text-gray-300 transition-colors min-h-[56px] min-w-[48px] touch-manipulation"
            >
              <User className="h-5 w-5 mb-1" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Account
              </span>
            </Link>
          ) : (
            <button
              onClick={handleAccountClick}
              className="flex flex-col items-center p-3 text-white hover:text-gray-300 transition-colors min-h-[56px] min-w-[48px] touch-manipulation"
            >
              <User className="h-5 w-5 mb-1" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Sign In
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
