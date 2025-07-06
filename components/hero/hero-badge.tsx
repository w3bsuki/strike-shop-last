import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const heroBadgeVariants = cva(
  "inline-flex items-center rounded-none px-3 py-1 text-xs font-semibold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        outline: "border border-primary-foreground text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        secondary: "bg-background/20 text-primary-foreground backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface HeroBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof heroBadgeVariants> {}

const HeroBadge = React.forwardRef<HTMLDivElement, HeroBadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(heroBadgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
HeroBadge.displayName = "HeroBadge";

export { HeroBadge, heroBadgeVariants };