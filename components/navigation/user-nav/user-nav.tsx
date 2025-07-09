"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/supabase/hooks"
import { WishlistButton } from "./wishlist-button"
import { UserMenu } from "./user-menu"
import { CartButton } from "./cart-button"

interface UserNavProps {
  className?: string
  showCart?: boolean
}

export function UserNav({ className, showCart = false }: UserNavProps) {
  const { user } = useUser()
  const isSignedIn = !!user

  // Mobile mode - only show cart
  if (showCart) {
    return (
      <div className={cn("flex items-center", className)}>
        <CartButton />
      </div>
    )
  }

  // Desktop mode - show all
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Wishlist - only show when signed in */}
      {isSignedIn && <WishlistButton />}
      
      {/* User Account */}
      <UserMenu />
      
      {/* Shopping Cart */}
      <CartButton />
    </div>
  )
}