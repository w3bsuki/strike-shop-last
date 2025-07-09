"use client"

import * as React from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Button, ButtonProps } from "@/components/ui/button"
import { useWishlistCount } from "@/lib/stores"
import { cn } from "@/lib/utils"

interface WishlistButtonProps extends Omit<ButtonProps, 'children'> {
  showCount?: boolean
}

export const WishlistButton = React.forwardRef<
  HTMLButtonElement,
  WishlistButtonProps
>(({ className, showCount = true, variant = "ghost", size = "icon", ...props }, ref) => {
  const count = useWishlistCount()
  
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn("relative min-h-[48px] min-w-[48px]", className)}
      asChild
      {...props}
    >
      <Link href="/wishlist">
        <Heart className="h-6 w-6" />
        {showCount && count > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-mono">
            {count > 99 ? "99+" : count}
          </span>
        )}
        <span className="sr-only">Wishlist ({count} items)</span>
      </Link>
    </Button>
  )
})
WishlistButton.displayName = "WishlistButton"