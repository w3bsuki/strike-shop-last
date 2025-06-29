import { Suspense } from 'react';
import { MedusaProductService } from '@/lib/medusa-service-refactored';
import type { HomePageCategory, HomePageProduct } from '@/types/home-page';
import { createCategoryId, createImageURL, createSlug, createProductId } from '@/types';
import HomePageClient from '@/components/home-page-client';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { QuickViewProvider } from '@/contexts/QuickViewContext';
import dynamic from 'next/dynamic';
import { 
  ProductScrollSkeleton, 
  CategoryScrollSkeleton,
} from '@/components/ui/loading-states';
import { HeroSection } from '@/components/hero-section';

// PERFORMANCE: Optimized data fetching with aggressive caching
async function getHomePageData() {
  try {
    // CRITICAL: Parallel data fetching for optimal performance
    const [medusaProducts, medusaCategories] = await Promise.all([
      MedusaProductService.getProducts({ limit: 12 }),
      MedusaProductService.getCategories()
    ]);

    // Convert categories with luxury streetwear images
    const categoryImages: Record<string, string> = {
      'men': 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=400&h=400&fit=crop&crop=center&q=80',
      'women': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop&crop=center&q=80',
      'footwear': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center&q=80',
      'shoes': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center&q=80',
      'sneakers': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop&crop=center&q=80',
      'accessories': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center&q=80',
      'shirts': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center&q=80',
      'hoodies': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop&crop=center&q=80',
      'jackets': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop&crop=center&q=80',
      'pants': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center&q=80',
      'jeans': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center&q=80',
      'default': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center&q=80'
    };

    let categories: HomePageCategory[] = medusaCategories.map((cat) => {
      const categoryKey = cat.handle?.toLowerCase() || cat.name.toLowerCase();
      const image = categoryImages[categoryKey] || 
                   categoryImages[categoryKey.replace(/s$/, '')] || // Try singular form
                   categoryImages['default'];
      
      return {
        id: createCategoryId(cat.id),
        name: cat.name.toUpperCase(),
        count: 0,
        image: createImageURL(image || ''),
        slug: createSlug(cat.handle),
      };
    });

    // Fallback categories if none exist or less than 4
    if (categories.length < 4) {
      const fallbackCategories: HomePageCategory[] = [
        {
          id: createCategoryId('men-fallback'),
          name: "MEN'S CLOTHING",
          count: 0,
          image: createImageURL(categoryImages['men'] || ''),
          slug: createSlug('men'),
        },
        {
          id: createCategoryId('women-fallback'),
          name: "WOMEN'S CLOTHING",
          count: 0,
          image: createImageURL(categoryImages['women'] || ''),
          slug: createSlug('women'),
        },
        {
          id: createCategoryId('footwear-fallback'),
          name: 'FOOTWEAR',
          count: 0,
          image: createImageURL(categoryImages['footwear'] || ''),
          slug: createSlug('footwear'),
        },
        {
          id: createCategoryId('accessories-fallback'),
          name: 'ACCESSORIES',
          count: 0,
          image: createImageURL(categoryImages['accessories'] || ''),
          slug: createSlug('accessories'),
        },
      ];
      
      categories = categories.length === 0 ? fallbackCategories : [...categories, ...fallbackCategories.slice(categories.length)];
    }

    // PERFORMANCE: Optimized product conversion
    const convertProduct = (prod: {
      id: string;
      title?: string;
      handle?: string;
      description?: string;
      thumbnail?: string;
      images?: Array<{ url?: string }>;
      variants?: Array<{ id: string; prices?: Array<{ amount: number; currency_code: string }>; calculated_price?: { calculated_amount: number; currency_code: string } }>;
      metadata?: Record<string, any>;
      categories?: Array<{ name: string }>;
    }): HomePageProduct => {
      const lowestPrice = MedusaProductService.getLowestPrice(prod as any);
      
      let finalPrice = '€0.00';
      if (lowestPrice) {
        let priceAmount = lowestPrice.amount;
        if (priceAmount < 100) {
          priceAmount = priceAmount * 100;
        }
        finalPrice = MedusaProductService.formatPrice(priceAmount, lowestPrice.currency);
      } else {
        // Smart fallback pricing
        const fallbackPrices = {
          't-shirt': 2500, 'shirt': 2500, 'hoodie': 4500, 'sweatshirt': 3500,
          'jeans': 6500, 'pants': 5500, 'sneakers': 8500, 'shoes': 7500,
        };
        
        const productTitle = prod.title?.toLowerCase() || '';
        let fallbackAmount = 2500;
        
        for (const [keyword, price] of Object.entries(fallbackPrices)) {
          if (productTitle.includes(keyword)) {
            fallbackAmount = price;
            break;
          }
        }
        
        finalPrice = MedusaProductService.formatPrice(fallbackAmount, 'eur');
      }
      
      // Get variant ID for add to cart functionality
      const variantId = prod.variants?.[0]?.id || `variant_${prod.id}_default`;
      
      // Check if product is new (metadata or created date)
      const isNew = prod.metadata?.isNew === true || false;
      
      // Get color count from variants or metadata
      const colorCount = prod.metadata?.colors || prod.variants?.length || 1;
      
      return {
        id: createProductId(prod.id),
        name: prod.title || '',
        price: finalPrice,
        image: createImageURL(prod.thumbnail || prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop&crop=center'),
        slug: createSlug(prod.handle || ''),
        isNew: isNew,
        colors: colorCount,
        description: prod.description || '',
        sku: (prod.variants?.[0] as any)?.sku || (prod as any)?.sku || '',
        variants: [],
        variantId: variantId, // Add variant ID for cart functionality
      };
    };

    const products = medusaProducts.products.map((prod: any) => convertProduct(prod));
    
    // Categorize products based on their actual categories or metadata
    const newArrivals = products.filter((p: any) => p.isNew).slice(0, 6);
    const saleItems = products.filter((p: any) => p.originalPrice).slice(0, 4);
    
    // Filter by category names if available
    const sneakers = products.filter((p: any) => {
      const prod = medusaProducts.products.find((mp: any) => mp.id === p.id.replace('product_', ''));
      return prod?.categories?.some((c: any) => 
        c.name?.toLowerCase().includes('sneaker') || 
        c.name?.toLowerCase().includes('shoe') ||
        c.handle?.toLowerCase().includes('footwear')
      ) || prod?.title?.toLowerCase().includes('sneaker');
    }).slice(0, 4);
    
    const kidsItems = products.filter((p: any) => {
      const prod = medusaProducts.products.find((mp: any) => mp.id === p.id.replace('product_', ''));
      return prod?.categories?.some((c: any) => 
        c.name?.toLowerCase().includes('kid') || 
        c.handle?.toLowerCase().includes('kid')
      ) || prod?.title?.toLowerCase().includes('kid');
    }).slice(0, 4);
    
    // Fill in with regular products if we don't have enough categorized items
    return {
      categories,
      newArrivals: newArrivals.length >= 6 ? newArrivals : [...newArrivals, ...products.slice(0, 6 - newArrivals.length)],
      saleItems: saleItems.length >= 4 ? saleItems : [...saleItems, ...products.slice(0, 4 - saleItems.length)],
      sneakers: sneakers.length >= 4 ? sneakers : [...sneakers, ...products.slice(0, 4 - sneakers.length)],
      kidsItems: kidsItems.length >= 4 ? kidsItems : [...kidsItems, ...products.slice(0, 4 - kidsItems.length)],
    };
  } catch (error) {
    console.error('Homepage data fetch error:', error);
    // RESILIENCE: Return fallback data
    return {
      categories: [],
      newArrivals: [],
      saleItems: [],
      sneakers: [],
      kidsItems: [],
    };
  }
}

// NEXT.JS 14 CACHING: Use ISR with clear boundaries
// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600;

// METADATA: Dynamic metadata for better SEO
export async function generateMetadata() {
  return {
    title: 'STRIKE™ | Luxury Streetwear & Fashion',
    description: 'Discover the latest in luxury streetwear and fashion at STRIKE™. Premium quality, cutting-edge designs.',
    openGraph: {
      title: 'STRIKE™ | Luxury Streetwear & Fashion',
      description: 'Discover the latest in luxury streetwear and fashion at STRIKE™.',
      images: ['/images/hero-image.png'],
    },
  };
}

// Dynamic import for modals
const QuickViewModal = dynamic(() => 
  import('@/components/QuickViewModal').then(mod => ({ default: mod.QuickViewModal })), {
  loading: () => null
});

const MobileNav = dynamic(() => 
  import('@/components/mobile/navigation').then(mod => ({ default: mod.MobileNav })), {
  loading: () => null
});

// Server Component that streams data
export default async function HomePage() {
  // Start fetching data immediately
  const dataPromise = getHomePageData();
  
  return (
    <QuickViewProvider>
      <main className="bg-white">
        <SiteHeader />
        
        {/* Hero loads immediately - NO SUSPENSE */}
        <HeroSection />
        
        {/* Stream only the dynamic content */}
        <Suspense 
          fallback={
            <div>
              <CategoryScrollSkeleton />
              <ProductScrollSkeleton />
            </div>
          }
        >
          <StreamedContent dataPromise={dataPromise} />
        </Suspense>
        
        <Footer />
        <MobileNav variant="default" showLabels={true} />
      </main>
      
      {/* Quick View Modal */}
      <QuickViewModal />
    </QuickViewProvider>
  );
}

// Async component that waits for data
async function StreamedContent({ dataPromise }: { dataPromise: Promise<any> }) {
  const data = await dataPromise;
  return <HomePageClient {...data} />;
}