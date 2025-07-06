"use client";

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
  // Client-side calculations
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
          <HeroTitle 
            size={titleSize}
            className={cn(
              "drop-shadow-lg",
              variant === "centered" && "text-center",
              "font-bold tracking-tight"
            )}
          >
            {title}
          </HeroTitle>
          {subtitle && (
            <HeroDescription 
              className={cn(
                "drop-shadow-md max-w-2xl",
                variant === "centered" && "text-center mx-auto"
              )}
            >
              {subtitle}
            </HeroDescription>
          )}
          {cta && (
            <HeroActions align={variant === "centered" ? "center" : "start"}>
              <Button
                asChild
                variant="strike-outline"
                size="lg"
                className={cn(
                  "bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white hover:text-black",
                  "font-bold tracking-wider transition-all duration-300",
                  "shadow-lg hover:shadow-xl"
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