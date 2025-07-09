"use client";

import * as React from "react";
import { Menu, Search, User, Heart, Package, ShoppingBag, Users, Sparkles, Globe, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { mainNavItems } from "@/config/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

interface MobileNavProps {
  className?: string;
  currentLocale?: string;
}

export function MobileNav({ className, currentLocale = 'en' }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const [announceText, setAnnounceText] = React.useState('');
  const { triggerHaptic } = useHapticFeedback();
  
  // Swipe gesture to close menu with enhanced touch feedback
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (open) {
        triggerHaptic('light');
        setAnnounceText('Menu closed via swipe');
        handleClose();
      }
    },
    onSwipeRight: () => {
      if (open) {
        triggerHaptic('light');
      }
    },
    threshold: 50,
    preventScroll: true
  });

  const handleClose = React.useCallback(() => {
    setOpen(false);
    triggerHaptic('light');
    setAnnounceText('Menu closed');
  }, [triggerHaptic]);

  const handleOpen = React.useCallback(() => {
    setOpen(true);
    triggerHaptic('light');
    setAnnounceText('Menu opened');
  }, [triggerHaptic]);

  // Focus management and focus trap
  const menuRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const firstFocusableRef = React.useRef<HTMLElement>(null);
  const lastFocusableRef = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  // Focus trap implementation
  React.useEffect(() => {
    if (!open) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = menuRef.current?.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [open]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  return (
    <React.Fragment>
      {/* Live region for announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        aria-label="Navigation status"
      >
        {announceText}
      </div>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("lg:hidden h-11 w-11 text-foreground hover:bg-gray-100 focus:bg-gray-100 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2", className)}
            aria-label="Open navigation menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={handleOpen}
          >
            <Menu className="h-6 w-6 text-foreground" strokeWidth={2} />
          </Button>
        </SheetTrigger>
        <SheetContent 
          ref={menuRef}
          side="left" 
          className="w-[85vw] max-w-sm p-0 bg-background text-foreground focus:outline-none"
          id="mobile-navigation"
          aria-modal="true"
          role="dialog"
          aria-labelledby="mobile-nav-title"
          {...swipeHandlers}
        >
          <SheetHeader className="border-b border-gray-200 p-4 bg-gray-50/50 flex-row items-center justify-between">
            <SheetTitle 
              id="mobile-nav-title"
              className="text-left text-xl font-bold uppercase text-foreground tracking-wider"
            >
              STRIKE™
            </SheetTitle>
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-gray-600 hover:text-foreground hover:bg-gray-200 focus:bg-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetHeader>
        <nav className="flex flex-col h-full bg-background">
          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-4">
              <h3 className="px-6 mb-3 text-[10px] font-typewriter font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Shop
              </h3>
              <ul className="space-y-1">
                {mainNavItems.map((item) => {
                  const getIcon = (title: string) => {
                    switch (title.toLowerCase()) {
                      case 'men': return Users;
                      case 'women': return Users;
                      case 'kids': return Users;
                      case 'sale': return Sparkles;
                      default: return ShoppingBag;
                    }
                  };
                  const IconComponent = getIcon(item.title);
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between px-6 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group focus:bg-accent focus:text-accent-foreground focus:ring-2 focus:ring-inset focus:ring-gray-900 min-h-[44px]"
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                          <span className="group-hover:translate-x-1 transition-transform duration-200">{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className="text-xs font-semibold text-destructive-foreground bg-destructive px-2 py-0.5 rounded-sm">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            {/* Region Settings */}
            <div className="py-4 border-t border-border/30">
              <h3 className="px-6 mb-3 text-[10px] font-typewriter font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Settings
              </h3>
              <div className="px-6">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Region</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LanguageSwitcher variant="mobile" currentLocale={currentLocale as any} />
                    <div className="h-4 w-px bg-border" />
                    <CurrencySwitcher variant="mobile" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Account Section */}
            <div className="py-4 border-t border-border/30">
              <h3 className="px-6 mb-3 text-[10px] font-typewriter font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Account
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/search"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group focus:bg-accent focus:text-accent-foreground focus:ring-2 focus:ring-inset focus:ring-gray-900 min-h-[44px]"
                  >
                    <Search className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                    <span className="group-hover:translate-x-1 transition-transform duration-200">Search</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group focus:bg-accent focus:text-accent-foreground focus:ring-2 focus:ring-inset focus:ring-gray-900 min-h-[44px]"
                  >
                    <User className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                    <span className="group-hover:translate-x-1 transition-transform duration-200">My Account</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/orders"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group focus:bg-accent focus:text-accent-foreground focus:ring-2 focus:ring-inset focus:ring-gray-900 min-h-[44px]"
                  >
                    <Package className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                    <span className="group-hover:translate-x-1 transition-transform duration-200">Orders</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wishlist"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group focus:bg-accent focus:text-accent-foreground focus:ring-2 focus:ring-inset focus:ring-gray-900 min-h-[44px]"
                  >
                    <Heart className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                    <span className="group-hover:translate-x-1 transition-transform duration-200">Wishlist</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
        </nav>
      </SheetContent>
    </Sheet>
    </React.Fragment>
  );
}