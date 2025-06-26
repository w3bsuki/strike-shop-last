"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const productBadgeVariants = cva(
  "inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider",
  {
    variants: {
      variant: {
        sale: "bg-red-600 text-white",
        new: "bg-black text-white",
        soldOut: "bg-gray-600 text-white",
        limited: "bg-gold-600 text-black",
        exclusive: "bg-purple-600 text-white",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        default: "px-2 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
      position: {
        none: "",
        topLeft: "absolute top-2 left-2",
        topRight: "absolute top-2 right-2",
        bottomLeft: "absolute bottom-2 left-2",
        bottomRight: "absolute bottom-2 right-2",
      },
    },
    defaultVariants: {
      variant: "sale",
      size: "default",
      position: "none",
    },
  }
);

export interface ProductBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof productBadgeVariants> {
  label?: string;
}

const ProductBadge = React.forwardRef<HTMLDivElement, ProductBadgeProps>(
  ({ className, variant, size, position, label, children, ...props }, ref) => {
    const content = label || children;
    
    if (!content) return null;

    return (
      <div
        ref={ref}
        className={cn(productBadgeVariants({ variant, size, position }), className)}
        role="status"
        aria-label={`${content} badge`}
        {...props}
      >
        {content}
      </div>
    );
  }
);
ProductBadge.displayName = "ProductBadge";

export { ProductBadge, productBadgeVariants };