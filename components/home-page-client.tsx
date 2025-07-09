'use client';

// Mobile-First Home Page Client Component
// Rebuilt for perfect mobile responsiveness with TailwindCSS v4
// - Uses consistent layout system from lib/layout/config
// - Mobile-first approach with progressive enhancement
// - Proper touch targets and accessibility
// - Optimized spacing and typography

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/error-boundary';
import { 
  ProductScrollSkeleton, 
  CategoryScrollSkeleton
} from '@/components/ui/loading-states';
import { CategoryCarousel } from '@/components/category/CategoryCarousel';
import { ProductHeader } from '@/components/product/product-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/i18n-provider';
import { Section, SectionTitle } from '@/components/layout/section';
import { ShowcaseSection, SectionHeader, StrikePattern } from '@/components/layout/unified-section';

// Import directly for immediate rendering (no dynamic loading for critical path)
import { ProductShowcase } from '@/components/product/product-showcase';
import { SeasonalCollectionCarousel } from '@/components/seasonal-collection-carousel';

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
  
  // Debug: Log first 2 products to see structure
  if (newArrivals.length > 0) {
    console.log('[HomePageClient] Products:', newArrivals.slice(0, 2));
  }
  
  return (
    <>
      {/* Mobile-First Content Sections with Proper Spacing */}
      {/* 1. NEW ARRIVALS - First product section after hero */}
      {newArrivals.length > 0 && (
        <ErrorBoundary>
          <ShowcaseSection
            color="light"
            pattern={<StrikePattern theme="light" />}
            header={
              <SectionHeader
                title="NEW DROPS"
                description="Fresh arrivals weekly. Latest streetwear drops and exclusive designs from premium brands worldwide."
                theme="light"
                action={
                  <Button
                    asChild
                    size="sm"
                    variant="strike-outline"
                    className="font-typewriter font-bold uppercase tracking-wider bg-black text-white border-2 border-black hover:bg-white hover:text-black hover:border-black transition-all duration-200 text-xs px-3"
                  >
                    <Link href="/new">VIEW ALL ({newArrivals.length})</Link>
                  </Button>
                }
              />
            }
          >
            <ProductShowcase
              products={newArrivals.slice(0, 8)}
              layout="scroll"
              noSection={true}
            />
          </ShowcaseSection>
        </ErrorBoundary>
      )}


      {/* 3. PREMIUM COLLECTION - Seasonal Campaign - Desktop Only */}
      <div className="hidden lg:block">
        <Section size="sm" className="bg-gray-300 text-black relative overflow-hidden mt-8">
            {/* Strike Brand Background Pattern - Silver/Black */}
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
              <div 
                className="w-full h-full" 
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, black 35px, black 70px)`,
                }} 
              />
            </div>
            
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-typewriter font-bold uppercase tracking-wider text-black">
                  PREMIUM COLLECTION
                </h2>
                <p className="text-xs sm:text-sm text-black/70 mt-1">
                  Exclusive seasonal drops. Limited quantities available.
                </p>
              </div>
              <Button
                  asChild
                  size="sm"
                  variant="strike-outline"
                  className="font-typewriter font-bold uppercase tracking-wider bg-black text-white border-2 border-black hover:bg-white hover:text-black hover:border-black transition-all duration-200 rounded-md text-xs sm:text-sm px-3 sm:px-6"
                >
                  <Link href="/collections/premium">VIEW ALL</Link>
                </Button>
            </div>
        </Section>
      </div>
      
      <div className="hidden lg:block">
        <ErrorBoundary>
          <SeasonalCollectionCarousel
            slides={[
              {
                id: "seasonal-1",
                season: "SPRING/SUMMER 2025",
                title: "CONCRETE JUNGLE",
                description: "Where nature meets urban decay. A collection inspired by resilience.",
                story: "In the cracks of concrete, wildflowers bloom. This collection celebrates the unstoppable force of nature reclaiming urban spaces, translated into wearable art that speaks to the streets.",
                mainImage: "/images/seasonal/ss25-main.webp",
                mobileImage: "/images/seasonal/ss25-main-mobile.webp",
                lookImage: "/images/seasonal/ss25-look.webp",
                products: [
                  {
                    id: "ss25-1",
                    name: "BLOOM GRAPHIC TEE",
                    price: "$79",
                    image: "/images/products/bloom-tee.webp",
                    slug: "bloom-graphic-tee"
                  },
                  {
                    id: "ss25-2",
                    name: "CONCRETE WASH DENIM",
                    price: "$169",
                    image: "/images/products/concrete-denim.webp",
                    slug: "concrete-wash-denim"
                  },
                  {
                    id: "ss25-3",
                    name: "URBAN FLORA JACKET",
                    price: "$249",
                    image: "/images/products/flora-jacket.webp",
                    slug: "urban-flora-jacket"
                  }
                ],
                cta: {
                  text: "SHOP THE COLLECTION",
                  href: "/collections/ss25"
                },
                theme: "light"
              }
            ]}
            autoPlayInterval={10000}
          />
        </ErrorBoundary>
      </div>

      {/* 4. SALE SECTION - Single instance only */}
      {saleItems.length > 0 && (
        <ErrorBoundary>
          <ShowcaseSection
            color="black"
            pattern={<StrikePattern theme="dark" />}
            header={
              <SectionHeader
                title="WINTER SALE"
                description="Up to 50% off selected items. Limited time seasonal clearance on premium streetwear essentials and accessories."
                theme="dark"
                action={
                  <Button
                    asChild
                    size="sm"
                    variant="strike-outline"
                    className="font-typewriter font-bold uppercase tracking-wider bg-white text-black border-2 border-white hover:bg-black hover:text-white hover:border-white transition-all duration-200 text-xs px-3"
                  >
                    <Link href="/sale">SHOP SALE ({saleItems.length})</Link>
                  </Button>
                }
              />
            }
          >
            <ProductShowcase
              products={saleItems.slice(0, 8)}
              layout="scroll"
              noSection={true}
            />
          </ShowcaseSection>
        </ErrorBoundary>
      )}

      {/* 5. TRENDING NOW - Fixed with unified layout */}
      {newArrivals.length > 0 && (
        <ErrorBoundary>
          <ShowcaseSection
            color="light"
            pattern={<StrikePattern theme="light" />}
            header={
              <SectionHeader
                title="TRENDING NOW"
                description="Oversized silhouettes and tech wear dominating the streets. Current fashion movements and viral styles."
                theme="light"
                action={
                  <Button
                    asChild
                    size="sm"
                    variant="strike-outline"
                    className="font-typewriter font-bold uppercase tracking-wider bg-black text-white border-2 border-black hover:bg-white hover:text-black hover:border-black transition-all duration-200 text-xs px-3"
                  >
                    <Link href="/trending">VIEW ALL ({newArrivals.length})</Link>
                  </Button>
                }
              />
            }
          >
            <ProductShowcase
              products={newArrivals.slice(0, 8)}
              layout="scroll"
              noSection={true}
            />
          </ShowcaseSection>
        </ErrorBoundary>
      )}

      {/* 6. FOOTWEAR FOCUS */}
      {sneakers.length > 0 && (
        <ErrorBoundary>
          <ShowcaseSection
            color="black"
            pattern={<StrikePattern theme="dark" />}
            header={
              <SectionHeader
                title="FOOTWEAR"
                description="Premium sneakers and streetwear footwear. Comfort meets style with cutting-edge design and innovation."
                theme="dark"
                action={
                  <Button
                    asChild
                    size="sm"
                    variant="strike-outline"
                    className="font-typewriter font-bold uppercase tracking-wider bg-white text-black border-2 border-white hover:bg-black hover:text-white hover:border-white transition-all duration-200 text-xs px-3"
                  >
                    <Link href="/footwear">VIEW ALL ({sneakers.length})</Link>
                  </Button>
                }
              />
            }
          >
            <ProductShowcase
              products={sneakers}
              layout="scroll"
              noSection={true}
            />
          </ShowcaseSection>
        </ErrorBoundary>
      )}

      {/* 7. COMMUNITY - Social proof near the end */}
      <ErrorBoundary>
        <ShowcaseSection
          color="light"
          pattern={<StrikePattern theme="light" />}
          header={
            <SectionHeader
              title="COMMUNITY STYLE"
              description="Real customers, real style. Tag us @strike for a chance to be featured"
              theme="light"
              action={
                <Button
                  asChild
                  size="sm"
                  variant="strike-outline"
                  className="font-typewriter font-bold uppercase tracking-wider bg-black text-white border-2 border-black hover:bg-white hover:text-black hover:border-black transition-all duration-200 text-xs px-3"
                >
                  <Link href="/community">VIEW ALL</Link>
                </Button>
              }
            />
          }
        >
          <CommunityShowcase
            noSection={true}
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
        </ShowcaseSection>
      </ErrorBoundary>

      {/* Quick View Modal */}
      <QuickViewModal />
    </>
  );
}