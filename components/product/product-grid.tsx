import * as React from "react";
import { cn } from "@/lib/utils";
import { SPACING } from "@/lib/layout/config";

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

const ProductGrid = React.forwardRef<HTMLDivElement, ProductGridProps>(
  ({ className, cols = 4, children, ...props }, ref) => {
    const gridClasses = {
      2: "grid-cols-2",
      3: "grid-cols-2 sm:grid-cols-3",
      4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
      5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
      6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          SPACING.productGap,
          gridClasses[cols],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ProductGrid.displayName = "ProductGrid";

export { ProductGrid };