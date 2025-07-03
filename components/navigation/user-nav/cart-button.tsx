"use client"

import * as React from "react"
import { ShoppingBag } from "lucide-react"
import { Button, ButtonProps } from "@/components/ui/button"
import { MiniCart } from "@/components/cart/mini-cart"
import { cn } from "@/lib/utils"
import { useCartTotalItems } from "@/lib/stores"

interface CartButtonProps extends Omit<ButtonProps, 'children'> {}

export const CartButton = React.forwardRef<
  HTMLButtonElement,
  CartButtonProps
>(({ className, variant = "ghost", size = "icon", ...props }, ref) => {
  const totalItems = useCartTotalItems();
  console.log('CartButton totalItems:', totalItems);
  
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
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-mono">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
          <span className="sr-only">Shopping cart with {totalItems} items</span>
        </Button>
      }
    />
  )
})
CartButton.displayName = "CartButton"