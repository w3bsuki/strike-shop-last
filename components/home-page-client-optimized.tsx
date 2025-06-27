'use client';

import { Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import type { HomePageCategory, HomePageProduct } from '@/types/home-page';

// Dynamic imports for heavy components - reduces initial bundle by ~150KB
const CategoryScroll = dynamic(() => import('./category-scroll'), {
  loading: () => <CategoryScrollSkeleton />,
  
});

const ProductScroll = dynamic(() => import('./product-scroll'), {
  loading: () => <ProductScrollSkeleton />,
  
});

const PromoBar = dynamic(() => import('./Promo-bar-v2'), {
  loading: () => <div className="h-10 bg-gray-100 animate-pulse" />,
  
});

const HeroSection = dynamic(() => import('./home/hero-section'), {
  loading: () => <div className="h-[60vh] bg-gray-100 animate-pulse" />,
  ssr: true // Hero is critical for SEO
});

// Loading skeletons
function CategoryScrollSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductScrollSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface HomePageClientProps {
  categories: HomePageCategory[];
  newArrivals: HomePageProduct[];
  saleItems: HomePageProduct[];
  sneakers: HomePageProduct[];
  kidsItems: HomePageProduct[];
}

export default function HomePageClientOptimized({
  categories,
  newArrivals,
  saleItems,
  sneakers,
  kidsItems,
}: HomePageClientProps) {
  return (
    <>
      {/* Critical content loads immediately */}
      <PromoBar />
      <HeroSection />
      
      {/* Non-critical content loads progressively */}
      <Suspense fallback={<CategoryScrollSkeleton />}>
        <CategoryScroll categories={categories} />
      </Suspense>
      
      <Suspense fallback={<ProductScrollSkeleton />}>
        <ProductScroll
          title="NEW ARRIVALS"
          products={newArrivals}
          viewAllLink="/new-arrivals"
        />
      </Suspense>
      
      <Suspense fallback={<ProductScrollSkeleton />}>
        <ProductScroll
          title="SALE"
          products={saleItems}
          viewAllLink="/sale"
          variant="sale"
        />
      </Suspense>
      
      <Suspense fallback={<ProductScrollSkeleton />}>
        <ProductScroll
          title="TRENDING SNEAKERS"
          products={sneakers}
          viewAllLink="/sneakers"
        />
      </Suspense>
      
      <Suspense fallback={<ProductScrollSkeleton />}>
        <ProductScroll
          title="KIDS COLLECTION"
          products={kidsItems}
          viewAllLink="/kids"
        />
      </Suspense>
    </>
  );
}