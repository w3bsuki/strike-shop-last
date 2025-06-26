"use client";

import * as React from "react";
import { Menu, Search, User, Heart, Package, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { mainNavItems } from "@/config/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("lg:hidden h-12 w-12", className)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-sm p-0">
        <SheetHeader className="border-b p-6">
          <SheetTitle className="text-left text-2xl font-typewriter font-bold uppercase">STRIKE™</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col h-full">
          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-6">
              <h3 className="px-6 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Shop
              </h3>
              <ul className="space-y-1">
                {mainNavItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between px-6 py-3 text-base font-typewriter font-semibold uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
                    >
                      {item.title}
                      {item.badge && (
                        <span className="text-xs font-typewriter font-semibold text-white bg-red-600 px-2 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Account Section */}
            <div className="py-6 border-t">
              <h3 className="px-6 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Account
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/search"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-base font-typewriter font-semibold uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
                  >
                    <Search className="h-5 w-5" />
                    Search
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-base font-typewriter font-semibold uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
                  >
                    <User className="h-5 w-5" />
                    My Account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/orders"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-base font-typewriter font-semibold uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
                  >
                    <Package className="h-5 w-5" />
                    Orders
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wishlist"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-base font-typewriter font-semibold uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
                  >
                    <Heart className="h-5 w-5" />
                    Wishlist
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t p-6 bg-muted/30">
            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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