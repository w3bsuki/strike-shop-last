"use client"

import React from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWishlistStore, type WishlistItem } from "@/lib/wishlist-store"
import { cn } from "@/lib/utils"

interface WishlistButtonProps {
  product: WishlistItem
  className?: string
  showLabel?: boolean
}

/**
 * Client Component - Wishlist Button
 * Handles wishlist interactions requiring client-side state
 */
export function WishlistButton({ product, className, showLabel = false }: WishlistButtonProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore()
  const isWishlisted = isInWishlist(product.id)

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation if inside a link
    e.stopPropagation()
    
    if (isWishlisted) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      onClick={handleToggle}
      className={cn(
        "bg-white/80 backdrop-blur-sm hover:bg-white z-20",
        className
      )}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={cn(
          "h-4 w-4",
          isWishlisted && "fill-current text-red-500",
          showLabel && "mr-2"
        )}
      />
      {showLabel && (
        <span className="text-xs uppercase tracking-wider">
          {isWishlisted ? "Saved" : "Save"}
        </span>
      )}
    </Button>
  )
}