import * as React from "react";
import { cn } from "@/lib/utils";
import { Section } from "@/components/layout/section";
import { cva, type VariantProps } from "class-variance-authority";

const productSectionVariants = cva(
  "",
  {
    variants: {
      background: {
        none: "",
        subtle: "bg-gray-50",
        contrast: "bg-black text-white",
        gradient: "bg-gradient-to-b from-white to-gray-50",
      },
    },
    defaultVariants: {
      background: "none",
    },
  }
);

export interface ProductSectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof productSectionVariants> {
  as?: "section" | "div";
  container?: boolean;
  size?: "sm" | "default" | "lg";
}

const ProductSection = React.forwardRef<HTMLElement, ProductSectionProps>(
  ({ className, size = "default", background, as = "section", container = true, children, ...props }, ref) => {
    return (
      <Section
        ref={ref as any}
        as={as}
        size={size}
        container={container}
        className={cn(productSectionVariants({ background }), className)}
        {...props}
      >
        {children}
      </Section>
    );
  }
);
ProductSection.displayName = "ProductSection";

export { ProductSection, productSectionVariants };