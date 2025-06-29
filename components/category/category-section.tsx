"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const categorySectionVariants = cva(
  "w-full",
  {
    variants: {
      spacing: {
        none: "",
        sm: "py-8 md:py-12",
        default: "py-12 md:py-16 lg:py-20",
        lg: "py-16 md:py-24 lg:py-32",
      },
      background: {
        none: "",
        subtle: "bg-gray-50",
        contrast: "bg-black text-white",
        gradient: "bg-gradient-to-b from-white to-gray-50",
      },
    },
    defaultVariants: {
      spacing: "default",
      background: "none",
    },
  }
);

export interface CategorySectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof categorySectionVariants> {
  as?: "section" | "div";
  container?: boolean;
}

const CategorySection = React.forwardRef<HTMLElement, CategorySectionProps>(
  ({ className, spacing, background, as: Comp = "section", container = true, children, ...props }, ref) => {
    return (
      <Comp
        ref={ref as any}
        className={cn(categorySectionVariants({ spacing, background }), className)}
        {...props}
      >
        {container ? (
          <div className="strike-container">
            {children}
          </div>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
CategorySection.displayName = "CategorySection";

export { CategorySection, categorySectionVariants };