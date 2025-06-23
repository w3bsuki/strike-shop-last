'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/header';
import { ErrorBoundary } from '@/components/error-boundary';
import { QuickViewProvider } from '@/contexts/QuickViewContext';
import { 
  ProductScrollSkeleton, 
  CategoryScrollSkeleton,
  HeroBannerSkeleton 
} from '@/components/ui/loading-states';

// PERFORMANCE: Critical above-the-fold components (immediate loading)
const HeroBannerV2 = dynamic(() => import('@/components/hero-banner-v2'), {
  ssr: true, // Keep SSR for hero content
  loading: () => <HeroBannerSkeleton />
});

// PERFORMANCE: Below-the-fold components (lazy loaded with smart preloading)
const CategoryScroll = dynamic(() => import('@/components/category-scroll'), {
  ssr: false,
  loading: () => <CategoryScrollSkeleton />
});

const ProductScroll = dynamic(() => import('@/components/product-scroll'), {
  ssr: false,
  loading: () => <ProductScrollSkeleton />
});

const SaleBanner = dynamic(() => import('@/components/sale-banner'), {
  ssr: false,
  loading: () => null
});


const CommunityCarouselLazy = dynamic(() => 
  import('@/components/community-carousel-lazy').then(mod => ({ default: mod.CommunityCarouselLazy })), {
  ssr: false,
  loading: () => null
});

const QuickViewModal = dynamic(() => 
  import('@/components/QuickViewModal').then(mod => ({ default: mod.QuickViewModal })), {
  ssr: false,
  loading: () => null
});

const Footer = dynamic(() => import('@/components/footer'), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted animate-pulse" />
});

const BottomNav = dynamic(() => import('@/components/bottom-nav'), {
  ssr: false,
  loading: () => null
});

// Section divider for separating product sections
const SectionDivider = dynamic(() => 
  import('@/components/ui/section-divider').then(mod => ({ default: mod.SectionDivider })), {
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
        <Header />

        <HeroBannerV2
          image="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1920&h=1080&fit=crop&q=80"
          title="STRIKE SS25"
          subtitle="DEFINING THE GRAY AREA BETWEEN BLACK AND WHITE"
          buttonText="EXPLORE COLLECTION"
          buttonLink="/new"
        />

        <ErrorBoundary>
          <Suspense fallback={<CategoryScrollSkeleton />}>
            <CategoryScroll title="SHOP BY CATEGORY" categories={categories} />
          </Suspense>
        </ErrorBoundary>

        <SaleBanner
          title="WINTER SALE"
          subtitle="UP TO 70% OFF SELECTED ITEMS"
          discount="70"
          link="/sale"
          endDate="JANUARY 31"
        />

        <ErrorBoundary>
          <Suspense fallback={<ProductScrollSkeleton />}>
            <ProductScroll
              title="SS25 MENS SALE"
              products={saleItems}
              viewAllLink="/sale/men"
            />
          </Suspense>
        </ErrorBoundary>

        <SectionDivider text="LUXURY STREETWEAR" />

        <ErrorBoundary>
          <Suspense fallback={<ProductScrollSkeleton />}>
            <ProductScroll
              title="NEW ARRIVALS"
              products={newArrivals}
              viewAllLink="/new"
            />
          </Suspense>
        </ErrorBoundary>

        <SectionDivider text="PREMIUM QUALITY" />

        <ErrorBoundary>
          <Suspense fallback={<ProductScrollSkeleton />}>
            <ProductScroll
              title="FEATURED FOOTWEAR"
              products={sneakers}
              viewAllLink="/footwear"
            />
          </Suspense>
        </ErrorBoundary>

        <SectionDivider text="NEXT GENERATION" />

        <ErrorBoundary>
          <Suspense fallback={<ProductScrollSkeleton />}>
            <ProductScroll
              title="KIDS COLLECTION"
              products={kidsItems}
              viewAllLink="/kids"
            />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse" />}>
            <CommunityCarouselLazy />
          </Suspense>
        </ErrorBoundary>

        <Footer />
        <BottomNav />
      </main>

      {/* Quick View Modal */}
      <QuickViewModal />
    </QuickViewProvider>
  );
}
