'use client';

// Step 6: Core Web Vitals - Responsive hero image optimization for maximum LCP performance
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ResponsivePicture } from '@/components/performance/image-sizing-strategy';
import { useTranslations } from '@/lib/i18n/i18n-provider';

export function HeroSection() {
  const t = useTranslations();

  return (
    <section className="relative w-full min-h-[50vh] md:min-h-[60vh] overflow-hidden bg-black touch-pan-y hero-container">
      <ResponsivePicture
        sources={[
          {
            media: '(max-width: 640px)',
            srcSet: '/images/hero/strike-ss25-hero-480w.webp 1x, /images/hero/strike-ss25-hero-768w.webp 2x',
            type: 'image/webp',
          },
          {
            media: '(max-width: 1024px)', 
            srcSet: '/images/hero/strike-ss25-hero-768w.webp 1x, /images/hero/strike-ss25-hero-1280w.webp 2x',
            type: 'image/webp',
          },
          {
            media: '(min-width: 1025px)',
            srcSet: '/images/hero/strike-ss25-hero-1280w.webp 1x, /images/hero/strike-ss25-hero-1920w.webp 2x',
            type: 'image/webp',
          },
        ]}
        fallbackSrc="/images/hero/strike-ss25-hero.jpg"
        alt={t('home.heroTitle')}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
          {t('home.heroTitle')}
        </h1>
        <p className="text-lg md:text-xl mb-8 text-center max-w-2xl px-4">
          {t('home.heroSubtitle')}
        </p>
        <Button
          asChild
          size="lg"
          variant="strike-outline"
          className="bg-white text-black border-2 border-black hover:bg-black hover:text-white hover:border-white uppercase tracking-wider font-bold transition-all duration-200 min-h-[44px] min-w-[44px] px-6 py-3"
        >
          <Link href="/new">{t('home.exploreCollection')}</Link>
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black text-white py-3 overflow-hidden border-t-2 border-white">
        <div className="relative flex">
          <div className="flex animate-[slide_200s_linear_infinite]">
            <div className="flex whitespace-nowrap pr-12">
              <span className="mx-4 font-typewriter font-bold tracking-wider text-sm uppercase">{t('home.freeShipping')}</span>
              <span className="mx-4 font-bold">•</span>
              <span className="mx-4 font-typewriter font-bold tracking-wider text-sm uppercase">"{t('home.premiumQuality')}"</span>
              <span className="mx-4 font-bold">•</span>
              <span className="mx-4 font-typewriter font-bold tracking-wider text-sm uppercase">{t('home.sustainableMaterials')}</span>
              <span className="mx-4 font-bold">•</span>
              <span className="mx-4 font-typewriter font-bold tracking-wider text-sm uppercase">{t('home.support247')}</span>
              <span className="mx-4 font-bold">•</span>
            </div>
            <div className="flex whitespace-nowrap pr-12" aria-hidden="true">
              <span className="mx-4 font-typewriter font-bold tracking-wider text-sm uppercase">{t('home.freeShipping')}</span>
              <span className="mx-4 font-bold">•</span>
              <span className="mx-4 font-typewriter font-bold tracking-wider text-sm uppercase">"{t('home.premiumQuality')}"</span>
              <span className="mx-4 font-bold">•</span>
              <span className="mx-4 font-typewriter font-bold tracking-wider text-sm uppercase">{t('home.sustainableMaterials')}</span>
              <span className="mx-4 font-bold">•</span>
              <span className="mx-4 font-typewriter font-bold tracking-wider text-sm uppercase">{t('home.support247')}</span>
              <span className="mx-4 font-bold">•</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}