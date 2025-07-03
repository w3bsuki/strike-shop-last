// Server Component - CVE-2025-29927 Compliant Performance Optimization
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SimpleHeroProps {
  title: string;
  subtitle?: string;
  image: string;
  buttonText?: string;
  buttonLink?: string;
  className?: string;
}

export default function SimpleHero({
  title,
  subtitle,
  image,
  buttonText = "SHOP NOW",
  buttonLink = "/",
  className,
}: SimpleHeroProps) {
  return (
    <section className={cn("relative h-[80vh] md:h-[85vh] w-full overflow-hidden", className)}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={90}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-4 text-6xl md:text-8xl lg:text-9xl xl:text-[10rem] font-bold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mb-8 text-lg md:text-xl lg:text-2xl text-white/90">
              {subtitle}
            </p>
          )}
          <Button
            asChild
            size="lg"
            className="bg-white text-black hover:bg-black hover:text-white uppercase tracking-wider"
          >
            <Link href={buttonLink}>{buttonText}</Link>
          </Button>
        </div>
      </div>

      {/* Marquee */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden bg-black text-white py-3 md:py-4">
        <div className="flex animate-marquee whitespace-nowrap">
          <div className="flex items-center space-x-8 px-4">
            <span className="text-sm font-medium uppercase tracking-wider">FREE SHIPPING ON ORDERS OVER $150</span>
            <span className="text-white/50">•</span>
            <span className="text-sm font-medium uppercase tracking-wider">PREMIUM QUALITY</span>
            <span className="text-white/50">•</span>
            <span className="text-sm font-medium uppercase tracking-wider">SUSTAINABLE MATERIALS</span>
            <span className="text-white/50">•</span>
            <span className="text-sm font-medium uppercase tracking-wider">24/7 SUPPORT</span>
          </div>
          <div className="flex items-center space-x-8 px-4" aria-hidden="true">
            <span className="text-sm font-medium uppercase tracking-wider">FREE SHIPPING ON ORDERS OVER $150</span>
            <span className="text-white/50">•</span>
            <span className="text-sm font-medium uppercase tracking-wider">PREMIUM QUALITY</span>
            <span className="text-white/50">•</span>
            <span className="text-sm font-medium uppercase tracking-wider">SUSTAINABLE MATERIALS</span>
            <span className="text-white/50">•</span>
            <span className="text-sm font-medium uppercase tracking-wider">24/7 SUPPORT</span>
          </div>
        </div>
      </div>
    </section>
  );
}