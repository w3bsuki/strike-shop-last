"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewsletterBannerProps {
  className?: string;
  onDismiss?: () => void;
}

export function NewsletterBanner({ className, onDismiss }: NewsletterBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "bg-black text-white py-2 relative",
        className
      )}
      role="banner"
      aria-label="Newsletter signup banner"
    >
      <div className="strike-container">
        <div className="flex items-center justify-center relative px-10">
          <p className="text-sm md:text-base font-medium tracking-wide text-center text-white">
            SIGN UP FOR 10% OFF YOUR FIRST ORDER
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 h-9 w-9 text-white hover:bg-white/20"
            onClick={handleDismiss}
            aria-label="Close newsletter banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}