"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const categoryGridVariants = cva(
  "grid gap-4 md:gap-6 lg:gap-8",
  {
    variants: {
      columns: {
        "1": "grid-cols-1",
        "2": "grid-cols-1 sm:grid-cols-2",
        "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        "4": "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        "5": "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        "6": "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
        auto: "grid-cols-[repeat(auto-fit,minmax(250px,1fr))]",
      },
    },
    defaultVariants: {
      columns: "4",
    },
  }
);

export interface CategoryGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof categoryGridVariants> {}

const CategoryGrid = React.forwardRef<HTMLDivElement, CategoryGridProps>(
  ({ className, columns, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(categoryGridVariants({ columns }), className)}
        {...props}
      />
    );
  }
);
CategoryGrid.displayName = "CategoryGrid";

export { CategoryGrid, categoryGridVariants };