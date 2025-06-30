'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden bg-black">
      <Image
        src="/images/hero/strike-ss25-hero.jpg"
        alt="STRIKE SS25"
        fill
        className="object-cover"
        priority
        sizes="100vw"
        quality={90}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
          STRIKE SS25
        </h1>
        <p className="text-lg md:text-xl mb-8 text-center max-w-2xl px-4">
          DEFINING THE GRAY AREA BETWEEN BLACK AND WHITE
        </p>
        <Button
          asChild
          size="lg"
          className="bg-white text-black hover:bg-black hover:text-white uppercase tracking-wider"
        >
          <Link href="/new">EXPLORE COLLECTION</Link>
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black text-white py-2 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          <span className="mx-4">FREE SHIPPING ON ORDERS OVER $150</span>
          <span className="mx-4">•</span>
          <span className="mx-4">PREMIUM QUALITY</span>
          <span className="mx-4">•</span>
          <span className="mx-4">SUSTAINABLE MATERIALS</span>
          <span className="mx-4">•</span>
          <span className="mx-4">24/7 SUPPORT</span>
        </div>
      </div>
    </section>
  );
}