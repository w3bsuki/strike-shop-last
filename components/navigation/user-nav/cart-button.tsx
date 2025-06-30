"use client"

import * as React from "react"
import { ShoppingBag } from "lucide-react"
import { Button, ButtonProps } from "@/components/ui/button"
import { MiniCart } from "@/components/cart/mini-cart"
import { cn } from "@/lib/utils"

interface CartButtonProps extends Omit<ButtonProps, 'children'> {}

export const CartButton = React.forwardRef<
  HTMLButtonElement,
  CartButtonProps
>(({ className, variant = "ghost", size = "icon", ...props }, ref) => {
  return (
    <MiniCart
      trigger={
        <Button
          ref={ref}
          variant={variant}
          size={size}
          className={cn("relative min-h-[48px] min-w-[48px]", className)}
          {...props}
        >
          <ShoppingBag className="h-6 w-6" />
          <span className="sr-only">Shopping cart</span>
        </Button>
      }
    />
  )
})
CartButton.displayName = "CartButton"