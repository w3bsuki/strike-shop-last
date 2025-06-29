'use client';

import { useState } from 'react';
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useIsAuthenticated, useWishlistCount } from '@/lib/stores';
import AuthModal from '@/components/auth-modal';
import { MobileNavContainer } from './mobile-nav-container';
import { MobileNavItem } from './mobile-nav-item';
import { MobileNavIcon } from './mobile-nav-icon';
import { MobileNavLabel } from './mobile-nav-label';
import { MobileNavIndicator } from './mobile-nav-indicator';

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
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();
  const wishlistCount = useWishlistCount();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/wishlist', icon: Heart, label: 'Wishlist', badge: wishlistCount },
    { href: '/cart', icon: ShoppingBag, label: 'Cart' },
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
          <MobileNavItem
            key={item.href}
            href={item.href}
            isActive={pathname === item.href}
            variant={variant}
          >
            <MobileNavIcon {...(item.badge !== undefined && { badge: item.badge })} badgeVariant="number">
              <item.icon className="h-6 w-6 mb-1" />
            </MobileNavIcon>
            <MobileNavLabel variant={showLabels ? 'default' : 'hidden'}>
              {item.label}
            </MobileNavLabel>
            <MobileNavIndicator
              isActive={pathname === item.href}
              variant={variant === 'floating' ? 'dot' : 'line'}
              color={variant === 'minimal' ? 'black' : 'white'}
            />
          </MobileNavItem>
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
    </>
  );
}