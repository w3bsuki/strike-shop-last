import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const productBadgeVariants = cva(
  "absolute top-3 left-3 z-10 font-bold text-xs uppercase tracking-wider px-3 py-1.5 border-0 pointer-events-none",
  {
    variants: {
      variant: {
        sale: "bg-red-500 text-white",
        new: "bg-black text-white",
        soldOut: "bg-gray-500 text-white",
        limited: "bg-yellow-400 text-black",
        exclusive: "bg-purple-600 text-white",
      },
      size: {
        sm: "text-xs px-2 py-1",
        md: "text-xs px-3 py-1.5", 
        lg: "text-sm px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "new",
      size: "md",
    },
  }
);

export interface ProductBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof productBadgeVariants> {}

const ProductBadge = React.forwardRef<HTMLDivElement, ProductBadgeProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    if (!children) return null;
    
    return (
      <div
        ref={ref}
        className={cn(productBadgeVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ProductBadge.displayName = "ProductBadge";

export { ProductBadge, productBadgeVariants };