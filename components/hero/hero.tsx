import * as React from "react";
import { cn } from "@/lib/utils";
import { heroSizeClasses, type HeroSize } from "@/config/hero";

interface HeroProps extends React.HTMLAttributes<HTMLElement> {
  size?: HeroSize;
  asChild?: boolean;
}

const Hero = React.forwardRef<HTMLElement, HeroProps>(
  ({ className, size = "default", asChild = false, children, ...props }, ref) => {
    const containerProps = asChild ? {} : props;

    if (asChild) {
      return <>{children}</>;
    }

    return (
      <section
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden",
          heroSizeClasses[size],
          className
        )}
        {...containerProps}
      >
        {children}
      </section>
    );
  }
);
Hero.displayName = "Hero";

export { Hero };