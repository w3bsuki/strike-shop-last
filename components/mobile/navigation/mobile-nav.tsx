'use client';

import { useState } from 'react';
import { Home, Heart, ShoppingBag, User, Grid3X3 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useIsAuthenticated, useWishlistCount, useCartTotalItems } from '@/lib/stores';
import AuthModal from '@/components/auth-modal';
import { MobileNavContainer } from './mobile-nav-container';
import { MobileNavItem } from './mobile-nav-item';
import { MobileNavIcon } from './mobile-nav-icon';
import { MobileNavLabel } from './mobile-nav-label';
import { MobileNavIndicator } from './mobile-nav-indicator';
import { MiniCart } from '@/components/cart/mini-cart';

interface MobileNavProps {
  variant?: 'default' | 'minimal' | 'floating';
  showLabels?: boolean;
  showThreshold?: number;
}

export default function MobileNav({
  variant = 'default',
  showLabels = true,
  showThreshold,
}: MobileNavProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();
  const wishlistCount = useWishlistCount();
  const cartTotalItems = useCartTotalItems();
  // const { setCartOpen } = useCartActions();

  const navItems = [
    { href: '/', icon: Home, label: 'Home', onClick: null },
    { href: '/collections', icon: Grid3X3, label: 'Shop', onClick: null },
    { href: '/wishlist', icon: Heart, label: 'Wishlist', badge: wishlistCount, onClick: null },
    { href: null, icon: ShoppingBag, label: 'Cart', badge: cartTotalItems, onClick: () => setIsCartOpen(true) },
  ];

  const handleAccountClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <MobileNavContainer variant={variant} {...(showThreshold !== undefined && { showThreshold })}>
        {navItems.map((item) => (
          item.onClick ? (
            <MobileNavItem
              key={item.label}
              as="button"
              onClick={item.onClick}
              variant={variant}
            >
              <MobileNavIcon {...(item.badge !== undefined && { badge: item.badge })} badgeVariant="number">
                <item.icon className="h-6 w-6" strokeWidth={1.5} />
              </MobileNavIcon>
              <MobileNavLabel variant={showLabels ? 'default' : 'hidden'} className="text-xs mt-1">
                {item.label}
              </MobileNavLabel>
            </MobileNavItem>
          ) : (
            <MobileNavItem
              key={item.href}
              href={item.href}
              isActive={pathname === item.href}
              variant={variant}
            >
              <MobileNavIcon {...(item.badge !== undefined && { badge: item.badge })} badgeVariant="number">
                <item.icon className="h-6 w-6" strokeWidth={1.5} />
              </MobileNavIcon>
              <MobileNavLabel variant={showLabels ? 'default' : 'hidden'} className="text-xs mt-1">
                {item.label}
              </MobileNavLabel>
              <MobileNavIndicator
                isActive={pathname === item.href}
                variant={variant === 'floating' ? 'dot' : 'line'}
                color={variant === 'minimal' ? 'black' : 'white'}
              />
            </MobileNavItem>
          )
        ))}

        {isAuthenticated ? (
          <MobileNavItem
            href="/account"
            isActive={pathname === '/account'}
            variant={variant}
          >
            <MobileNavIcon>
              <User className="h-6 w-6 mb-1" />
            </MobileNavIcon>
            <MobileNavLabel variant={showLabels ? 'default' : 'hidden'}>
              Account
            </MobileNavLabel>
            <MobileNavIndicator
              isActive={pathname === '/account'}
              variant={variant === 'floating' ? 'dot' : 'line'}
              color={variant === 'minimal' ? 'black' : 'white'}
            />
          </MobileNavItem>
        ) : (
          <MobileNavItem
            as="button"
            onClick={handleAccountClick}
            variant={variant}
          >
            <MobileNavIcon>
              <User className="h-6 w-6 mb-1" />
            </MobileNavIcon>
            <MobileNavLabel variant={showLabels ? 'default' : 'hidden'}>
              Sign In
            </MobileNavLabel>
          </MobileNavItem>
        )}
      </MobileNavContainer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      
      <MiniCart
        isOpen={isCartOpen}
        onOpenChange={setIsCartOpen}
      />
    </>
  );
}