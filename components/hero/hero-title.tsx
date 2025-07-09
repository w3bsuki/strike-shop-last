import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const heroTitleVariants = cva(
  "font-bold tracking-tight text-white leading-tight font-primary",
  {
    variants: {
      size: {
        sm: "text-xl sm:text-2xl md:text-3xl lg:text-4xl",
        default: "text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl",
        lg: "text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl",
        xl: "text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl",
        massive: "text-5xl sm:text-6xl md:text-8xl lg:text-9xl xl:text-[10rem]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface HeroTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof heroTitleVariants> {
  as?: "h1" | "h2" | "h3";
}

const HeroTitle = React.forwardRef<HTMLHeadingElement, HeroTitleProps>(
  ({ className, size, as: Comp = "h1", children, ...props }, ref) => {
    return (
      <Comp
        ref={ref}
        className={cn(heroTitleVariants({ size }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
HeroTitle.displayName = "HeroTitle";

export { HeroTitle, heroTitleVariants };