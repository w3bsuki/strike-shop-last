"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NewsletterBanner } from "./newsletter-banner";
import { NavBar } from "./navbar";
import { MobileNav } from "./mobile-nav";
import { SearchBar } from "./search-bar";
import { UserNav } from "./user-nav";

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <NewsletterBanner />
      <header
        className={cn(
          "sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50",
          isScrolled && "shadow-sm",
          className
        )}
      >
        <div className="strike-container">
          {/* DESKTOP */}
          <div className="hidden lg:flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-typewriter font-bold tracking-tight uppercase"
            >
              STRIKE™
            </Link>

            {/* Navigation */}
            <NavBar />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <SearchBar variant="icon" />
              <UserNav />
            </div>
          </div>

          {/* MOBILE */}
          <div className="grid lg:hidden grid-cols-3 items-center h-16">
            {/* Left: Hamburger */}
            <div className="justify-self-start">
              <MobileNav />
            </div>

            {/* Center: Logo */}
            <Link
              href="/"
              className="justify-self-center text-xl font-typewriter font-bold tracking-tight uppercase"
            >
              STRIKE™
            </Link>

            {/* Right: Cart only */}
            <div className="justify-self-end">
              <UserNav showCart />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}