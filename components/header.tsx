"use client"

import { useState, useEffect } from "react"
import { User, ShoppingBag, Menu, X, Search } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useCartStore } from "@/lib/cart-store"
import { useAuthStore } from "@/lib/auth-store"
import AuthModal from "./auth-modal"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNewsletterVisible, setIsNewsletterVisible] = useState(true)
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const { openCart, getTotalItems } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const totalItems = getTotalItems()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: "/sale", label: "SALE" },
    { href: "/new", label: "NEW" },
    { href: "/hot", label: "HOT" },
    { href: "/men", label: "MEN" },
    { href: "/women", label: "WOMEN" },
    { href: "/kids", label: "KIDS" },
    { href: "/special", label: "SPECIAL" },
  ]

  return (
    <>
      {isNewsletterVisible && (
        <div className="bg-black text-white text-center py-2 text-[10px] font-normal tracking-wider relative uppercase">
          Sign up to our community newsletter for 10% off your next order
          <button
            className="absolute right-4 top-1/2 transform -translate-y-1/2"
            onClick={() => setIsNewsletterVisible(false)}
            aria-label="Close newsletter"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <header
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm transition-shadow duration-300 ${isScrolled ? "shadow-sm" : ""}`}
      >
        <div className="strike-container">
          <div className="flex items-center justify-between h-14">
            {/* Mobile Menu Button - Left Side */}
            <div className="lg:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(true)} aria-label="Open menu" className="p-3 -ml-3">
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Logo - Perfectly Centered */}
            <div className="flex-1 flex justify-center lg:justify-start lg:flex-none">
              <Link href="/" className="text-lg font-bold tracking-tight flex items-center">
                STRIKE™
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-3">
              <button
                className="hidden sm:flex items-center p-3"
                aria-label="Search"
                onClick={() => setIsSearchVisible(!isSearchVisible)}
              >
                <Search className="h-5 w-5" />
              </button>

              {isAuthenticated ? (
                <Link href="/account" className="nav-link hidden lg:flex items-center p-3" aria-label="Account">
                  <User className="h-5 w-5" />
                </Link>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="nav-link hidden lg:flex items-center p-3"
                  aria-label="Sign in"
                >
                  <User className="h-5 w-5" />
                </button>
              )}

              <button onClick={openCart} className="nav-link flex items-center p-3 -mr-3 relative" aria-label="Shopping bag">
                <ShoppingBag className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>
              <div className="hidden lg:flex items-center">
                <button onClick={() => setIsMenuOpen(true)} aria-label="Open menu" className="p-1">
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Category Navigation */}
        <div className={`hidden lg:block border-t border-subtle ${isScrolled ? "" : "border-b border-subtle"}`}>
          <div className="strike-container">
            <nav className="flex justify-center items-center h-10 space-x-6">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className="nav-link">
                  "{item.label}"
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Search Bar - Desktop */}
        {isSearchVisible && (
          <div className="hidden sm:block border-t border-subtle py-3 bg-white">
            <div className="strike-container">
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--subtle-text-color)]" />
                <Input placeholder="Search products..." className="search-input pl-10 w-full h-10" autoFocus />
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-[var(--subtle-text-color)] hover:text-black"
                  onClick={() => setIsSearchVisible(false)}
                >
                  ESC
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar - Mobile - Fixed */}
        <div className="sm:hidden border-t border-subtle py-3">
          <div className="strike-container">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--subtle-text-color)] pointer-events-none" />
              <Input placeholder="Search products..." className="search-input pl-11 pr-4 w-full h-10 text-sm" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Slides from Left */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsMenuOpen(false)} />
          <div
            className={`absolute left-0 top-0 flex flex-col h-full w-full max-w-xs bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className="flex justify-between items-center p-6 border-b border-subtle">
              <Link href="/" className="text-lg font-bold tracking-tight" onClick={() => setIsMenuOpen(false)}>
                STRIKE™
              </Link>
              <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-6 py-4 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block nav-link text-sm py-2 border-b border-subtle/50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  "{item.label}"
                </Link>
              ))}
            </nav>

            <div className="p-6 border-t border-subtle space-y-4">
              {isAuthenticated ? (
                <Link
                  href="/account"
                  className="flex items-center space-x-3 nav-link text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  <span>My Account</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    setIsAuthModalOpen(true)
                  }}
                  className="flex items-center space-x-3 nav-link text-sm w-full text-left"
                >
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              )}
              <Link href="/help" className="block nav-link text-sm" onClick={() => setIsMenuOpen(false)}>
                Help & Support
              </Link>
              <Link href="/stores" className="block nav-link text-sm" onClick={() => setIsMenuOpen(false)}>
                Store Locator
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  )
}
