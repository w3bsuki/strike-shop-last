import * as React from "react";
import { cn } from "@/lib/utils";

interface HeroActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
}

const HeroActions = React.forwardRef<HTMLDivElement, HeroActionsProps>(
  ({ className, align = "start", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap gap-4",
          {
            "justify-start": align === "start",
            "justify-center": align === "center",
            "justify-end": align === "end",
          },
          className
        )}
        {...props}
      />
    );
  }
);
HeroActions.displayName = "HeroActions";

export { HeroActions };