"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const productGridVariants = cva(
  "grid gap-4 md:gap-6",
  {
    variants: {
      cols: {
        2: "grid-cols-2",
        3: "grid-cols-2 md:grid-cols-3",
        4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
      },
      gap: {
        none: "gap-0",
        sm: "gap-2 md:gap-3",
        default: "gap-4 md:gap-6",
        lg: "gap-6 md:gap-8",
      },
    },
    defaultVariants: {
      cols: 4,
      gap: "default",
    },
  }
);

export interface ProductGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof productGridVariants> {}

const ProductGrid = React.forwardRef<HTMLDivElement, ProductGridProps>(
  ({ className, cols, gap, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(productGridVariants({ cols, gap }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ProductGrid.displayName = "ProductGrid";

export { ProductGrid, productGridVariants };