"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const productPriceVariants = cva(
  "font-typewriter",
  {
    variants: {
      size: {
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg",
        xl: "text-xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface ProductPriceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof productPriceVariants> {
  price: string;
  originalPrice?: string;
  currency?: string;
  showCurrency?: boolean;
}

const ProductPrice = React.forwardRef<HTMLDivElement, ProductPriceProps>(
  ({ className, size, price, originalPrice, currency = "€", showCurrency = true, ...props }, ref) => {
    const formattedPrice = showCurrency && !price.includes(currency) ? `${currency}${price}` : price;
    const formattedOriginalPrice = originalPrice && showCurrency && !originalPrice.includes(currency) 
      ? `${currency}${originalPrice}` 
      : originalPrice;

    return (
      <div
        ref={ref}
        className={cn("flex items-baseline gap-2", className)}
        role="group"
        aria-label="Product pricing"
        {...props}
      >
        <span 
          className={cn(productPriceVariants({ size }), "font-bold")}
          aria-label={`Current price ${formattedPrice}`}
        >
          {formattedPrice}
        </span>
        {formattedOriginalPrice && (
          <span 
            className={cn(
              productPriceVariants({ size }), 
              "line-through text-muted-foreground"
            )}
            aria-label={`Original price ${formattedOriginalPrice}`}
          >
            {formattedOriginalPrice}
          </span>
        )}
      </div>
    );
  }
);
ProductPrice.displayName = "ProductPrice";

export { ProductPrice, productPriceVariants };