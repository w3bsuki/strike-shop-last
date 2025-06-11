"use client"

import { useState, useEffect } from "react"
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/lib/auth-store"
import AuthModal from "./auth-modal"

export default function BottomNav() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    const handleScroll = () => {
      // Show bottom nav when scrolled past hero (roughly 600px)
      setIsVisible(window.scrollY > 600)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isVisible) return null

  const handleAccountClick = () => {
    if (isAuthenticated) {
      // Navigate to account page - handled by Link
    } else {
      setIsAuthModalOpen(true)
    }
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-subtle lg:hidden">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-3 nav-link min-h-[48px]">
            <Home className="h-5 w-5 mb-1" />
            <span className="text-overline">Home</span>
          </Link>
          <Link href="/search" className="flex flex-col items-center p-3 nav-link min-h-[48px]">
            <Search className="h-5 w-5 mb-1" />
            <span className="text-overline">Search</span>
          </Link>
          <Link href="/wishlist" className="flex flex-col items-center p-3 nav-link min-h-[48px]">
            <Heart className="h-5 w-5 mb-1" />
            <span className="text-overline">Wishlist</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center p-3 nav-link min-h-[48px]">
            <ShoppingBag className="h-5 w-5 mb-1" />
            <span className="text-overline">Cart</span>
          </Link>
          {isAuthenticated ? (
            <Link href="/account" className="flex flex-col items-center p-3 nav-link min-h-[48px]">
              <User className="h-5 w-5 mb-1" />
              <span className="text-overline">Account</span>
            </Link>
          ) : (
            <button onClick={handleAccountClick} className="flex flex-col items-center p-3 nav-link min-h-[48px]">
              <User className="h-5 w-5 mb-1" />
              <span className="text-overline">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  )
}
