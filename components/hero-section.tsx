'use client';

import { Hero, HeroImage, HeroContent, HeroTitle, HeroDescription, HeroActions, HeroMarquee, HeroMarqueeItem } from '@/components/hero';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function HeroSection() {
  return (
    <Hero size="default">
      <HeroImage 
        src="/images/hero/strike-ss25-hero.jpg" 
        alt="STRIKE SS25" 
        overlay="stark"
      >
        <HeroContent position="center">
          <HeroTitle size="massive">STRIKE SS25</HeroTitle>
          <HeroDescription size="lg">
            DEFINING THE GRAY AREA BETWEEN BLACK AND WHITE
          </HeroDescription>
          <HeroActions align="center">
            <Button
              asChild
              size="lg"
              className="bg-white text-black hover:bg-black hover:text-white uppercase tracking-wider"
            >
              <Link href="/new">EXPLORE COLLECTION</Link>
            </Button>
          </HeroActions>
        </HeroContent>
      </HeroImage>
      <HeroMarquee speed="normal" pauseOnHover>
        <HeroMarqueeItem>FREE SHIPPING ON ORDERS OVER $150</HeroMarqueeItem>
        <span className="text-white/50">•</span>
        <HeroMarqueeItem>PREMIUM QUALITY</HeroMarqueeItem>
        <span className="text-white/50">•</span>
        <HeroMarqueeItem>SUSTAINABLE MATERIALS</HeroMarqueeItem>
        <span className="text-white/50">•</span>
        <HeroMarqueeItem>24/7 SUPPORT</HeroMarqueeItem>
      </HeroMarquee>
    </Hero>
  );
}