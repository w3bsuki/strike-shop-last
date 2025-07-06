"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
// Removed NewsletterBanner - using AnnouncementBanner in page.tsx instead
import { NavBar } from "./navbar";
import { SearchBar } from "./search-bar";
import { UserNav } from "./user-nav";
import { CurrencySwitcherMinimal, CurrencySwitcherCompact } from "@/components/currency-switcher";
import { LanguageSwitcherMinimal, LanguageSwitcherCompact } from "@/components/language-switcher";
import type { Locale } from "@/lib/i18n/config";
import { layoutClasses } from "@/lib/layout/config";

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const params = useParams();
  const currentLocale = (params.lang || 'en') as Locale;

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
              <LanguageSwitcherMinimal currentLocale={currentLocale} />
              <CurrencySwitcherMinimal />
              <UserNav />
            </div>
          </div>
        </div>

        {/* MOBILE - Clean header without hamburger menu */}
        <div className={cn(layoutClasses.container, "flex lg:hidden items-center justify-between h-14 md:h-16 px-3 md:px-4")}>
          {/* Left: Search - proper touch target */}
          <div className="flex items-center min-w-0">
            <SearchBar variant="icon" className="min-h-[44px] min-w-[44px]" />
          </div>

          {/* Center: Logo */}
          <Link
            href="/"
            className="flex-1 flex items-center justify-center text-lg md:text-xl typewriter-brand min-w-0 px-2"
            aria-label="Strike Shop - Home"
          >
            STRIKE™
          </Link>

          {/* Right: Cart only - proper touch target */}
          <div className="flex items-center justify-end min-w-0">
            <UserNav showCart className="min-h-[44px] min-w-[44px]" />
          </div>
        </div>
      </header>
    </>
  );
}