// Server Component - CVE-2025-29927 Compliant Performance Optimization
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Hero, HeroImage, HeroContent, HeroTitle, HeroDescription, HeroActions, HeroBadge, HeroMarquee, HeroMarqueeItem } from "@/components/hero";
import { type HeroConfig } from "@/config/hero";
import { cn } from "@/lib/utils";

interface HeroSectionProps extends HeroConfig {
  className?: string;
  showMarquee?: boolean;
  marqueeItems?: string[];
}

export function HeroSection({
  title,
  subtitle,
  image,
  cta,
  badge,
  variant = "default",
  size = "default",
  overlay = "gradient",
  className,
  showMarquee = false,
  marqueeItems = [
    "FREE SHIPPING ON ORDERS OVER $150",
    "PREMIUM QUALITY",
    "SUSTAINABLE MATERIALS",
    "24/7 SUPPORT",
  ],
}: HeroSectionProps) {
  // Server-side calculations (moved from useMemo for performance)
  const contentPosition = (() => {
    switch (variant) {
      case "centered":
        return "center";
      case "split":
        return "center-left";
      case "minimal":
        return "bottom-left";
      default:
        return "bottom-left";
    }
  })();

  const titleSize = (() => {
    if (variant === "minimal") return "sm";
    if (variant === "centered" && size === "lg") return "massive";
    if (size === "lg") return "lg";
    if (size === "sm") return "sm";
    return "default";
  })();

  return (
    <Hero size={size} className={className}>
      <HeroImage src={image} alt={title} overlay={overlay}>
        <HeroContent position={contentPosition}>
          {badge && (
            <HeroBadge variant={variant === "centered" ? "secondary" : "destructive"}>
              {badge}
            </HeroBadge>
          )}
          <HeroTitle size={titleSize}>{title}</HeroTitle>
          {subtitle && <HeroDescription>{subtitle}</HeroDescription>}
          {cta && (
            <HeroActions align={variant === "centered" ? "center" : "start"}>
              <Button
                asChild
                variant={cta.variant || "default"}
                size="lg"
                className={cn(
                  "uppercase tracking-wider",
                  variant === "centered" && "bg-background text-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Link href={cta.href}>{cta.text}</Link>
              </Button>
            </HeroActions>
          )}
        </HeroContent>
      </HeroImage>
      {showMarquee && (
        <HeroMarquee speed="normal" pauseOnHover>
          {marqueeItems.map((item, index) => (
            <React.Fragment key={item}>
              <HeroMarqueeItem>{item}</HeroMarqueeItem>
              {index < marqueeItems.length - 1 && (
                <span className="text-primary-foreground/50" aria-hidden="true">•</span>
              )}
            </React.Fragment>
          ))}
        </HeroMarquee>
      )}
    </Hero>
  );
}