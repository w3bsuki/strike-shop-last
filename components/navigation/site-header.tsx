"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, Search, ShoppingBag, Heart } from "lucide-react";
import { NavBar } from "./navbar";
import { SearchBar } from "./search-bar";
import { UserNav } from "./user-nav";
import { MarketSelector } from "@/components/market-selector";
import { mainNavItems } from "@/config/navigation";
import { useTranslations, useLocale } from "@/lib/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import { layoutClasses } from "@/lib/layout/config";

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params.lang || 'en') as Locale;
  const t = useTranslations();
  const locale = useLocale();

  // Memoized handlers for better performance
  const toggleMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(prev => {
      const newState = !prev;
      console.log('[SiteHeader] Mobile menu toggled:', newState);
      return newState;
    });
  }, []);

  const closeMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleSearch = React.useCallback(() => {
    setIsSearchOpen(prev => !prev);
  }, []);

  const closeSearch = React.useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on escape key
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
        closeSearch();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeMobileMenu, closeSearch]);

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Debug logging
  React.useEffect(() => {
    console.log('[SiteHeader] Render - isMobileMenuOpen:', isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        role="banner"
        className={cn(
          "sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50",
          isScrolled && "shadow-sm",
          className
        )}
        suppressHydrationWarning
      >
        {/* DESKTOP */}
        <div className={cn(layoutClasses.container, "hidden lg:block")}>
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl typewriter-brand"
              aria-label="Strike Shop - Home"
            >
              STRIKE™
            </Link>

            {/* Navigation */}
            <NavBar />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <SearchBar variant="icon" />
              <MarketSelector />
              <UserNav />
            </div>
          </div>
        </div>

        {/* MOBILE - Header with perfectly centered logo */}
        <div className={cn(layoutClasses.container, "flex lg:hidden items-center h-16 px-3")}>
          {/* Left Section: Hamburger Menu */}
          <div className="flex-1 flex justify-start items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="min-h-[44px] min-w-[44px] hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {/* Center Section: Logo */}
          <div className="flex-1 flex justify-center items-center">
            <Link
              href={`/${locale}`}
              className="text-lg md:text-xl typewriter-brand flex items-center"
              aria-label="Strike Shop - Home"
            >
              STRIKE™
            </Link>
          </div>

          {/* Right Section: Search & Cart */}
          <div className="flex-1 flex justify-end items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSearch}
              className="min-h-[44px] min-w-[44px] hover:bg-muted"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <UserNav showCart className="min-h-[44px] min-w-[44px]" />
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={closeMobileMenu}
          />
          
          {/* Menu Panel - Modern slide from left */}
          <div className="absolute inset-y-0 left-0 w-[85vw] max-w-sm bg-white shadow-2xl pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-left duration-300 border-r border-gray-100">
            {/* Menu Header - Minimalist design */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-2xl font-bold tracking-tight">
                STRIKE™
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobileMenu}
                className="min-h-[44px] min-w-[44px] hover:bg-gray-100 rounded-full transition-all"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Menu Content - Better spacing and typography */}
            <div className="flex flex-col h-[calc(100%-76px)] overflow-y-auto">
              {/* Main Navigation - Premium feel */}
              <nav role="navigation" aria-label="Mobile navigation" className="px-6 py-6">
                <ul className="space-y-1">
                  {mainNavItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={`/${locale}${item.href}`}
                        onClick={closeMobileMenu}
                        className="group flex items-center justify-between w-full px-4 py-4 text-lg font-medium tracking-tight hover:bg-black hover:text-white rounded-lg transition-all duration-200 min-h-[56px]"
                      >
                        <span className="font-semibold">{item.titleKey ? t(item.titleKey) : item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-red-600 px-2 py-1 rounded-full">
                            {item.badgeKey ? t(item.badgeKey) : item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Divider - Subtle */}
              <div className="mx-6 border-t border-gray-100" />

              {/* User Actions - Modern shadcn buttons */}
              <div className="px-6 py-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {/* Account Button */}
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="flex flex-col items-center gap-2 h-20 border-2 hover:bg-black hover:text-white hover:border-black transition-all duration-200"
                  >
                    <Link href={`/${locale}/account`} onClick={closeMobileMenu}>
                      <div className="flex flex-col items-center gap-1">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-xs font-medium">Account</span>
                      </div>
                    </Link>
                  </Button>

                  {/* Wishlist Button */}
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="flex flex-col items-center gap-2 h-20 border-2 hover:bg-black hover:text-white hover:border-black transition-all duration-200"
                  >
                    <Link href={`/${locale}/wishlist`} onClick={closeMobileMenu}>
                      <div className="flex flex-col items-center gap-1 relative">
                        <Heart className="h-6 w-6" />
                        <span className="text-xs font-medium">Wishlist</span>
                      </div>
                    </Link>
                  </Button>

                  {/* Cart Button */}
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="flex flex-col items-center gap-2 h-20 border-2 hover:bg-black hover:text-white hover:border-black transition-all duration-200"
                  >
                    <Link href={`/${locale}/cart`} onClick={closeMobileMenu}>
                      <div className="flex flex-col items-center gap-1 relative">
                        <ShoppingBag className="h-6 w-6" />
                        <span className="text-xs font-medium">Cart</span>
                      </div>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Market Selector - Bottom positioned */}
              <div className="mt-auto px-6 pb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Region & Currency</p>
                  <MarketSelector />
                </div>
              </div>

              {/* Footer Info - Minimal */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">© 2025 Strike Shop. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={closeSearch}
          />
          
          {/* Search Panel - Slide from top */}
          <div className="absolute top-0 left-0 right-0 bg-white shadow-2xl animate-in slide-in-from-top duration-300">
            <div className="flex items-center px-6 py-4 gap-4">
              <div className="flex-1">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const query = formData.get('search') as string;
                    if (query.trim()) {
                      router.push(`/${locale}/search?q=${encodeURIComponent(query)}`);
                      closeSearch();
                    }
                  }}
                  className="w-full"
                >
                  <Input
                    name="search"
                    placeholder="What are you looking for?"
                    autoFocus
                    className="w-full h-14 text-lg border-2 border-gray-200 focus:border-black rounded-full px-6 transition-all"
                  />
                </form>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeSearch}
                className="min-h-[48px] min-w-[48px] hover:bg-gray-100 rounded-full transition-all"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Quick Search Suggestions */}
            <div className="px-6 pb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {['Sneakers', 'New Arrivals', 'Sale', 'Accessories'].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      router.push(`/${locale}/search?q=${encodeURIComponent(term.toLowerCase())}`);
                      closeSearch();
                    }}
                    className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-black hover:text-white rounded-full transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}