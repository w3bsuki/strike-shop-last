"use client";

import * as React from "react";
import { Menu, Search, User, Heart, Package, ShoppingBag, Users, Sparkles, Globe, DollarSign } from "lucide-react";
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
          className={cn("lg:hidden h-10 w-10 text-foreground hover:bg-accent/50", className)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5 text-foreground" strokeWidth={2} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm p-0 bg-background text-foreground">
        <SheetHeader className="border-b border-border/50 p-4 bg-accent/5">
          <SheetTitle className="text-left text-xl font-typewriter font-bold uppercase text-foreground tracking-wider">STRIKE™</SheetTitle>
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
                        className="flex items-center justify-between px-6 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
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
                    className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
                  >
                    <Search className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                    <span className="group-hover:translate-x-1 transition-transform duration-200">Search</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
                  >
                    <User className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                    <span className="group-hover:translate-x-1 transition-transform duration-200">My Account</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/orders"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
                  >
                    <Package className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                    <span className="group-hover:translate-x-1 transition-transform duration-200">Orders</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wishlist"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
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
  );
}