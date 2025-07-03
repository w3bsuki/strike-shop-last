'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/error-boundary';
import { 
  ProductScrollSkeleton, 
  CategoryScrollSkeleton
} from '@/components/ui/loading-states';
import { CategorySection, CategoryScroll, CategoryCard } from '@/components/category';
import { ProductHeader } from '@/components/product/product-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/i18n-provider';

// Import directly for immediate rendering (no dynamic loading for critical path)
import { ProductShowcase } from '@/components/product/product-showcase';


// Community section using same pattern as products
const CommunityShowcase = dynamic(() => 
  import('@/components/community/community-showcase').then(mod => ({ default: mod.CommunityShowcase })), {
  
  loading: () => <div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>
});

const QuickViewModal = dynamic(() => 
  import('@/components/QuickViewModal').then(mod => ({ default: mod.QuickViewModal })), {
  
  loading: () => null
});


// Divider components
const DividerSection = dynamic(() => 
  import('@/components/divider').then(mod => ({ default: mod.DividerSection })), {
  
  loading: () => null
});

const DividerLine = dynamic(() => 
  import('@/components/divider').then(mod => ({ default: mod.DividerLine })), {
  
  loading: () => null
});

const DividerText = dynamic(() => 
  import('@/components/divider').then(mod => ({ default: mod.DividerText })), {
  
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
  const t = useTranslations();
  
  console.log('[HomePageClient] Received props:', {
    categories: categories.length,
    newArrivals: newArrivals.length,
    saleItems: saleItems.length,
    sneakers: sneakers.length,
    kidsItems: kidsItems.length,
  });
  
  // Log first product to debug
  if (saleItems.length > 0) {
    console.log('[HomePageClient] First sale item:', saleItems[0]);
  }
  
  return (
    <>

      <ErrorBoundary>
        <Suspense fallback={<div style={{ minHeight: '320px' }}><CategoryScrollSkeleton /></div>}>
          <CategorySection spacing="default">
            <ProductHeader 
              title={t('home.shopByCategory')} 
              viewAllText={t('home.viewAllCategories')}
              viewAllHref="/categories"
            />
            <CategoryScroll showControls={false}>
              {categories.map((category, index) => (
                <div key={category.id} className="flex-none w-[200px] sm:w-[240px] md:w-[280px] lg:w-[320px]">
                  <CategoryCard
                    category={category}
                    priority={index < 3}
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
                {t('home.winterSale')}
              </h2>
            </div>
            <Button
              asChild
              size="sm"
              variant="strike-outline"
              className="font-typewriter font-bold uppercase tracking-wider flex-shrink-0 bg-white text-black border-2 border-white hover:bg-black hover:text-white hover:border-white transition-all duration-200"
            >
              <Link href="/sale">{t('home.shopWinterSale')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {saleItems.length > 0 && (
        <ErrorBoundary>
          <ProductShowcase
            title={t('home.saleItems')}
            products={saleItems}
            viewAllLink="/sale"
            layout="scroll"
            showBadge={true}
            badgeText={t('products.sale')}
            badgeVariant="sale"
            description={t('home.winterSaleDescription')}
          />
        </ErrorBoundary>
      )}

      {/* Divider Section using modular components */}
      <DividerSection theme="default" size="lg" className="border-y-2 border-black">
          <div className="flex items-center justify-center gap-4">
            <DividerLine variant="solid" color="white" className="flex-1" />
            <DividerText text='"LUXURY STREETWEAR"' size="default" color="white" spacing="default" />
            <DividerLine variant="solid" color="white" className="flex-1" />
          </div>
        </DividerSection>

        {newArrivals.length > 0 && (
          <ErrorBoundary>
            <ProductShowcase
              title={t('home.newArrivals')}
              products={newArrivals}
              viewAllLink="/new"
              layout="scroll"
              showBadge={true}
              badgeText={t('products.new')}
              badgeVariant="new"
              description={t('home.newsletterDescription')}
            />
          </ErrorBoundary>
        )}

      <DividerSection theme="default" size="lg" className="border-y-2 border-black">
          <div className="flex items-center justify-center gap-4">
            <DividerLine variant="solid" color="white" className="flex-1" />
            <DividerText text='"PREMIUM QUALITY"' size="default" color="white" spacing="default" />
            <DividerLine variant="solid" color="white" className="flex-1" />
          </div>
        </DividerSection>

        {sneakers.length > 0 && (
          <ErrorBoundary>
            <ProductShowcase
              title={t('home.sneakerCollection')}
              products={sneakers}
              viewAllLink="/footwear"
              layout="scroll"
              description={t('home.newsletterDescription')}
            />
          </ErrorBoundary>
        )}

      <DividerSection theme="default" size="lg" className="border-y-2 border-black">
          <div className="flex items-center justify-center gap-4">
            <DividerLine variant="solid" color="white" className="flex-1" />
            <DividerText text='"NEXT GENERATION"' size="default" color="white" spacing="default" />
            <DividerLine variant="solid" color="white" className="flex-1" />
          </div>
        </DividerSection>

        {kidsItems.length > 0 && (
          <ErrorBoundary>
            <ProductShowcase
              title={t('home.kidsCollection')}
              products={kidsItems}
              viewAllLink="/kids"
              layout="scroll"
              description={t('home.newsletterDescription')}
            />
          </ErrorBoundary>
        )}

      <DividerSection theme="default" size="sm">
          <div className="flex items-center justify-center gap-4">
            <DividerLine variant="solid" color="default" className="flex-1" />
            <DividerText text="COMMUNITY" size="sm" spacing="default" />
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

      {/* Quick View Modal */}
      <QuickViewModal />
    </>
  );
}
