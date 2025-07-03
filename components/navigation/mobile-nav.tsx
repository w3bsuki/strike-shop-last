"use client";

import * as React from "react";
import { Menu, Search, User, Heart, Package, HelpCircle, Globe, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { mainNavItems } from "@/config/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";

interface MobileNavProps {
  className?: string;
  currentLocale?: string;
}

export function MobileNav({ className, currentLocale = 'en' }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("lg:hidden h-12 w-12 text-foreground hover:bg-muted", className)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6 text-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-sm p-0 bg-background text-foreground">
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle className="text-left text-2xl font-typewriter font-bold uppercase text-foreground">STRIKE™</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col h-full bg-background">
          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-6">
              <h3 className="px-6 mb-3 text-xs font-typewriter font-bold text-foreground uppercase tracking-widest">
                Shop
              </h3>
              <ul className="space-y-1">
                {mainNavItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between px-6 py-3 text-base font-typewriter font-semibold uppercase tracking-wide text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {item.title}
                      {item.badge && (
                        <span className="text-xs font-typewriter font-semibold text-destructive-foreground bg-destructive px-2 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Region Settings */}
            <div className="py-6 border-t border-border">
              <h3 className="px-6 mb-3 text-xs font-typewriter font-bold text-foreground uppercase tracking-widest">
                Settings
              </h3>
              <div className="px-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-typewriter font-medium uppercase text-foreground">Language</span>
                  <LanguageSwitcher variant="mobile" currentLocale={currentLocale as any} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-typewriter font-medium uppercase text-foreground">Currency</span>
                  <CurrencySwitcher variant="mobile" />
                </div>
              </div>
            </div>
            
            {/* Account Section */}
            <div className="py-6 border-t border-border">
              <h3 className="px-6 mb-3 text-xs font-typewriter font-bold text-foreground uppercase tracking-widest">
                Account
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/search"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-base font-typewriter font-semibold uppercase tracking-wide text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Search className="h-5 w-5" />
                    Search
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-base font-typewriter font-semibold uppercase tracking-wide text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <User className="h-5 w-5" />
                    My Account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/orders"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-base font-typewriter font-semibold uppercase tracking-wide text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Package className="h-5 w-5" />
                    Orders
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wishlist"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-base font-typewriter font-semibold uppercase tracking-wide text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Heart className="h-5 w-5" />
                    Wishlist
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t border-border p-6 bg-muted">
            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 text-sm font-typewriter font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Help & Support
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}