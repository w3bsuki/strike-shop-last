'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { SiteHeader } from '@/components/navigation';
import { ErrorBoundary } from '@/components/error-boundary';
import { QuickViewProvider } from '@/contexts/QuickViewContext';
import { 
  ProductScrollSkeleton, 
  CategoryScrollSkeleton,
  HeroBannerSkeleton 
} from '@/components/ui/loading-states';
import { Hero, OptimizedHeroImage as HeroImage, HeroContent, HeroTitle, HeroDescription, HeroActions, HeroMarquee, HeroMarqueeItem } from '@/components/hero';
import { CategorySection, CategoryHeader, CategoryScroll, CategoryCard } from '@/components/category';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// PERFORMANCE: Below-the-fold components (lazy loaded with smart preloading)

const ProductShowcase = dynamic(() => 
  import('@/components/product/product-showcase').then(mod => ({ default: mod.ProductShowcase })), {
  ssr: false,
  loading: () => <div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>
});

// Promo components
const PromoSection = dynamic(() => 
  import('@/components/promo').then(mod => ({ default: mod.PromoSection })), {
  ssr: false,
  loading: () => <div style={{ minHeight: '120px' }} className="bg-gray-100 animate-pulse" />
});

const PromoContent = dynamic(() => 
  import('@/components/promo').then(mod => ({ default: mod.PromoContent })), {
  ssr: false,
  loading: () => null
});

const PromoTitle = dynamic(() => 
  import('@/components/promo').then(mod => ({ default: mod.PromoTitle })), {
  ssr: false,
  loading: () => null
});

const PromoDescription = dynamic(() => 
  import('@/components/promo').then(mod => ({ default: mod.PromoDescription })), {
  ssr: false,
  loading: () => null
});

const PromoBadge = dynamic(() => 
  import('@/components/promo').then(mod => ({ default: mod.PromoBadge })), {
  ssr: false,
  loading: () => null
});

const PromoActions = dynamic(() => 
  import('@/components/promo').then(mod => ({ default: mod.PromoActions })), {
  ssr: false,
  loading: () => null
});

const PromoBackground = dynamic(() => 
  import('@/components/promo').then(mod => ({ default: mod.PromoBackground })), {
  ssr: false,
  loading: () => null
});

// Community section using same pattern as products
const CommunityShowcase = dynamic(() => 
  import('@/components/community/community-showcase').then(mod => ({ default: mod.CommunityShowcase })), {
  ssr: false,
  loading: () => <div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>
});

const QuickViewModal = dynamic(() => 
  import('@/components/QuickViewModal').then(mod => ({ default: mod.QuickViewModal })), {
  ssr: false,
  loading: () => null
});

const Footer = dynamic(() => import('@/components/footer'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '256px' }} className="bg-muted animate-pulse" />
});

// Updated to use new modular mobile navigation
const MobileNav = dynamic(() => import('@/components/mobile/navigation').then(mod => ({ default: mod.MobileNav })), {
  ssr: false,
  loading: () => null
});

// Divider components
const DividerSection = dynamic(() => 
  import('@/components/divider').then(mod => ({ default: mod.DividerSection })), {
  ssr: false,
  loading: () => null
});

const DividerLine = dynamic(() => 
  import('@/components/divider').then(mod => ({ default: mod.DividerLine })), {
  ssr: false,
  loading: () => null
});

const DividerText = dynamic(() => 
  import('@/components/divider').then(mod => ({ default: mod.DividerText })), {
  ssr: false,
  loading: () => null
});

import type { HomePageProps } from '@/types/home-page';

export default function HomePageClient({
  categories,
  newArrivals,
  saleItems,
  sneakers,
  kidsItems,
}: HomePageProps) {
  return (
    <QuickViewProvider>
      <main className="bg-white">
        <SiteHeader />

        <Hero size="lg">
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

        <ErrorBoundary>
          <Suspense fallback={<div style={{ minHeight: '320px' }}><CategoryScrollSkeleton /></div>}>
            <CategorySection spacing="default">
              <CategoryHeader 
                title="SHOP BY CATEGORY" 
                viewAllText="View All Categories"
                viewAllHref="/categories"
              />
              <CategoryScroll showControls={false}>
                {categories.map((category, index) => (
                  <div key={category.id} className="flex-none w-[200px] sm:w-[240px] md:w-[280px] lg:w-[320px]">
                    <CategoryCard
                      name={category.name}
                      image={category.image}
                      href={`/${category.slug}`}
                      count={category.count}
                      priority={index < 3}
                      aspectRatio="portrait"
                      overlay="gradient"
                    />
                  </div>
                ))}
              </CategoryScroll>
            </CategorySection>
          </Suspense>
        </ErrorBoundary>

        {/* Winter Sale Banner - Black background + White text */}
        <section className="bg-black text-white">
          <div className="strike-container py-4 sm:py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-typewriter font-bold uppercase tracking-wider text-white">
                  WINTER SALE
                </h2>
                <span className="text-2xl sm:text-3xl md:text-4xl font-typewriter font-bold text-white">
                  70% OFF
                </span>
              </div>
              <Button
                asChild
                size="sm"
                className="font-typewriter uppercase tracking-wider flex-shrink-0 bg-white text-black hover:bg-gray-200"
              >
                <Link href="/sale">SHOP NOW</Link>
              </Button>
            </div>
          </div>
        </section>

        <ErrorBoundary>
          <Suspense fallback={<div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>}>
            <ProductShowcase
              title="SS25 MENS"
              products={saleItems}
              viewAllLink="/sale/men"
              layout="scroll"
              showBadge={true}
              badgeText="SALE"
              badgeVariant="sale"
              description="Exclusive deals on premium streetwear essentials and seasonal favorites"
            />
          </Suspense>
        </ErrorBoundary>

        {/* Divider Section using modular components */}
        <DividerSection theme="default" size="sm">
          <div className="flex items-center justify-center gap-4">
            <DividerLine variant="solid" color="default" className="flex-1" />
            <DividerText text="LUXURY STREETWEAR" size="sm" spacing="normal" />
            <DividerLine variant="solid" color="default" className="flex-1" />
          </div>
        </DividerSection>

        <ErrorBoundary>
          <Suspense fallback={<div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>}>
            <ProductShowcase
              title="NEW ARRIVALS"
              products={newArrivals}
              viewAllLink="/new"
              layout="scroll"
              showBadge={true}
              badgeText="NEW"
              badgeVariant="new"
              description="Fresh drops and latest designs from our cutting-edge SS25 collection"
            />
          </Suspense>
        </ErrorBoundary>

        <DividerSection theme="default" size="sm">
          <div className="flex items-center justify-center gap-4">
            <DividerLine variant="solid" color="default" className="flex-1" />
            <DividerText text="PREMIUM QUALITY" size="sm" spacing="normal" />
            <DividerLine variant="solid" color="default" className="flex-1" />
          </div>
        </DividerSection>

        <ErrorBoundary>
          <Suspense fallback={<div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>}>
            <ProductShowcase
              title="FEATURED FOOTWEAR"
              products={sneakers}
              viewAllLink="/footwear"
              layout="scroll"
              description="Premium sneakers and footwear for the modern streetwear enthusiast"
            />
          </Suspense>
        </ErrorBoundary>

        <DividerSection theme="default" size="sm">
          <div className="flex items-center justify-center gap-4">
            <DividerLine variant="solid" color="default" className="flex-1" />
            <DividerText text="NEXT GENERATION" size="sm" spacing="normal" />
            <DividerLine variant="solid" color="default" className="flex-1" />
          </div>
        </DividerSection>

        <ErrorBoundary>
          <Suspense fallback={<div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>}>
            <ProductShowcase
              title="KIDS COLLECTION"
              products={kidsItems}
              viewAllLink="/kids"
              layout="scroll"
              description="Next generation streetwear for the young and bold - mini versions of our iconic pieces"
            />
          </Suspense>
        </ErrorBoundary>

        <DividerSection theme="default" size="sm">
          <div className="flex items-center justify-center gap-4">
            <DividerLine variant="solid" color="default" className="flex-1" />
            <DividerText text="COMMUNITY" size="sm" spacing="normal" />
            <DividerLine variant="solid" color="default" className="flex-1" />
          </div>
        </DividerSection>

        <ErrorBoundary>
          <Suspense fallback={<div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>}>
            <CommunityShowcase
              title="COMMUNITY STYLE"
              description="Real customers, real style. Tag us @strike for a chance to be featured"
              viewAllLink="/community"
              viewAllText="VIEW ALL"
              instagramPosts={[
                {
                  id: '1',
                  username: '@streetstyle_maven',
                  userAvatar: '/placeholder.svg?height=40&width=40',
                  images: ['/placeholder.svg?height=400&width=400'],
                  caption: 'Living for this oversized fit! Perfect for those cozy street vibes ✨ #StrikeStyle',
                  likes: 1247,
                  comments: 89,
                },
                {
                  id: '2',
                  username: '@minimal_mode',
                  userAvatar: '/placeholder.svg?height=40&width=40',
                  images: ['/placeholder.svg?height=400&width=400'],
                  caption: 'Monochrome perfection. These cargos are everything! 🖤 #MinimalVibes',
                  likes: 892,
                  comments: 45,
                },
                {
                  id: '3',
                  username: '@urban_explorer',
                  userAvatar: '/placeholder.svg?height=40&width=40',
                  images: ['/placeholder.svg?height=400&width=400'],
                  caption: 'STRIKE never misses. Quality and style in every piece 💯',
                  likes: 634,
                  comments: 23,
                },
                {
                  id: '4',
                  username: '@style_maven',
                  userAvatar: '/placeholder.svg?height=40&width=40',
                  images: ['/placeholder.svg?height=400&width=400'],
                  caption: 'New drop hits different. Already planning my next order 🔥',
                  likes: 1156,
                  comments: 67,
                },
              ]}
              reviews={[
                {
                  id: '1',
                  author: {
                    name: 'Sarah Johnson',
                    username: '@sarahj',
                    avatar: '/placeholder.svg?height=40&width=40',
                    verified: true,
                  },
                  content: 'The quality is absolutely incredible. The oversized hoodie fits perfectly and the material feels premium.',
                  rating: 5,
                  date: '2 days ago',
                  product: {
                    name: 'STRIKE™ OVERSIZED HOODIE',
                    href: '/products/oversized-hoodie',
                  },
                },
                {
                  id: '2',
                  author: {
                    name: 'Mike Chen',
                    username: '@mikechen',
                    avatar: '/placeholder.svg?height=40&width=40',
                    verified: true,
                  },
                  content: 'Best streetwear brand I\'ve found. The attention to detail is amazing and the fit is perfect.',
                  rating: 5,
                  date: '1 week ago',
                  product: {
                    name: 'STRIKE™ CARGO PANTS',
                    href: '/products/cargo-pants',
                  },
                },
                {
                  id: '3',
                  author: {
                    name: 'Alex Rivera',
                    username: '@alexr',
                    avatar: '/placeholder.svg?height=40&width=40',
                    verified: false,
                  },
                  content: 'Fast shipping, great customer service, and the clothes are exactly as described. Will definitely order again!',
                  rating: 5,
                  date: '3 days ago',
                },
              ]}
            />
          </Suspense>
        </ErrorBoundary>

        <Footer />
        <MobileNav variant="default" showLabels={true} />
      </main>

      {/* Quick View Modal */}
      <QuickViewModal />
    </QuickViewProvider>
  );
}
