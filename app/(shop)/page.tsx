import { Suspense } from 'react';
import type { HomePageCategory, HomePageProduct } from '@/types/home-page';
import { createCategoryId, createImageURL, createSlug, createProductId } from '@/types';
import { ShopifyService } from '@/lib/shopify/services';
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

// Get data from Shopify
async function getHomePageData() {
  // Mock product helper for fallback
  const mockProduct = (id: string, name: string, price: string, image: string): HomePageProduct => ({
    id: createProductId(id),
    name,
    price,
    image: createImageURL(image) as any,
    slug: createSlug(id),
    isNew: Math.random() > 0.5,
    colors: Math.floor(Math.random() * 3) + 1,
    description: 'Premium quality streetwear',
    sku: `SKU-${id}` as any,
    variants: [],
    variantId: `variant_${id}`,
  });

  // Default products for fallback
  const defaultProducts: HomePageProduct[] = [
    mockProduct('oversized-tee-1', 'OVERSIZED LOGO TEE', '€45.00', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop&crop=center'),
    mockProduct('cargo-pants-1', 'TACTICAL CARGO PANTS', '€120.00', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop&crop=center'),
    mockProduct('sneakers-1', 'STRIKE RUNNER V2', '€180.00', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=400&fit=crop&crop=center'),
    mockProduct('hoodie-1', 'ESSENTIAL HOODIE', '€85.00', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=400&fit=crop&crop=center'),
  ];

  try {
    // Fetch all collections and products from Shopify
    const [allProducts, shopifyCollections] = await Promise.all([
      ShopifyService.getProducts(50), // Get more products
      ShopifyService.getCollections()
    ]);
    
    // Transform Shopify collections to categories for the category section
    const categories: HomePageCategory[] = shopifyCollections.map(collection => ({
      id: createCategoryId(collection.id),
      name: collection.name.toUpperCase(),
      count: collection.products.length,
      image: createImageURL(collection.image?.url || 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=400&h=400&fit=crop&crop=center&q=80'),
      slug: createSlug(collection.slug),
    }));

    // Transform all Shopify products
    const products: HomePageProduct[] = allProducts.map(product => ({
      id: product.id,
      name: product.content?.name || 'Product',
      price: product.pricing?.displayPrice || '€0.00',
      image: (product.content?.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop&crop=center') as any,
      slug: product.slug,
      isNew: product.badges?.isNew || false,
      colors: product.commerce?.variants?.length || 1,
      description: product.content?.description || 'Premium quality streetwear',
      sku: (product.sku || `SKU-${product.id}`) as any,
      variants: (product.commerce?.variants || []) as any,
      variantId: product.commerce?.variants?.[0]?.id || `variant_${product.id}`,
    }));

    // Create sections based on available collections
    // We'll map collection names to our section needs
    const sectionData: Record<string, HomePageProduct[]> = {};
    
    // Process collections and their products
    for (const collection of shopifyCollections) {
      const collectionProducts = collection.products.map(product => {
        // Find the full product data from our allProducts array
        const fullProduct = products.find(p => p.id === createProductId(product.id));
        return fullProduct || mockProduct(product.id, (product as any).name || 'Product', '€0.00', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop&crop=center');
      });
      
      // Store products by collection handle/name
      sectionData[collection.slug.toLowerCase()] = collectionProducts;
      sectionData[collection.name.toLowerCase()] = collectionProducts;
    }

    // Map collections to our sections with fallbacks
    const newArrivals = sectionData['new-arrivals'] || sectionData['new'] || products.slice(0, 8);
    const saleItems = sectionData['sale'] || sectionData['winter-sale'] || products.slice(0, 8);
    const sneakers = sectionData['footwear'] || sectionData['shoes'] || sectionData['обувки'] || 
                    products.filter(p => p.name.toLowerCase().includes('runner') || p.name.toLowerCase().includes('shoe'));
    const kidsItems = sectionData['kids'] || sectionData['children'] || [];

    return {
      categories: categories.length > 0 ? categories : [
        {
          id: createCategoryId('all'),
          name: 'ALL PRODUCTS',
          count: products.length,
          image: createImageURL('https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=400&h=400&fit=crop&crop=center&q=80'),
          slug: createSlug('all'),
        }
      ],
      newArrivals: newArrivals.length > 0 ? newArrivals : products.slice(0, 8),
      saleItems: saleItems.length > 0 ? saleItems : products.slice(0, 8),
      sneakers: sneakers.length > 0 ? sneakers : products.filter(p => p.name.toLowerCase().includes('shoe')).slice(0, 8),
      kidsItems,
    };
  } catch (error) {
    console.error('Error fetching home page data:', error);
    // Return fallback data
    return {
      categories: [
        {
          id: createCategoryId('all'),
          name: 'ALL PRODUCTS',
          count: 4,
          image: createImageURL('https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=400&h=400&fit=crop&crop=center&q=80'),
          slug: createSlug('all'),
        }
      ],
      newArrivals: defaultProducts,
      saleItems: defaultProducts,
      sneakers: defaultProducts.filter(p => p.name.toLowerCase().includes('runner')),
      kidsItems: [],
    };
  }
}

// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600;

// METADATA: Dynamic metadata for better SEO
export async function generateMetadata() {
  return {
    title: 'STRIKE™ | Luxury Streetwear & Fashion',
    description: 'Discover the latest in luxury streetwear and fashion at STRIKE™. Premium quality, cutting-edge designs.',
  };
}

// Lazy load components for perfect CWV
const QuickViewModal = dynamic(() => import('@/components/QuickViewModal').then(mod => ({ default: mod.QuickViewModal })), {
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
      <main className="bg-white" id="main-content">
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

// CRITICAL: Streaming wrapper - this is what makes the magic happen
async function StreamedContent({ dataPromise }: { dataPromise: Promise<any> }) {
  const data = await dataPromise;
  
  return (
    <HomePageClient
      categories={data.categories}
      newArrivals={data.newArrivals}
      saleItems={data.saleItems}
      sneakers={data.sneakers}
      kidsItems={data.kidsItems}
    />
  );
}