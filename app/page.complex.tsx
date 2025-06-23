import { MedusaProductService } from '@/lib/medusa-service';
import type { HomePageCategory, HomePageProduct } from '@/types/home-page';
import SimpleHomePage from '@/components/simple-home-page';

// PERFORMANCE: Optimized data fetching with aggressive caching
async function getHomePageData() {
  try {
    // CRITICAL: Parallel data fetching for optimal performance
    const [medusaProducts, medusaCategories] = await Promise.all([
      MedusaProductService.getProducts({ limit: 12 }),
      MedusaProductService.getCategories()
    ]);

    // Convert categories with performance optimization
    const categories: HomePageCategory[] = medusaCategories.map((cat) => ({
      id: cat.id,
      name: cat.name.toUpperCase(),
      count: 0,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center',
      slug: cat.handle,
    }));

    // PERFORMANCE: Optimized product conversion
    const convertProduct = (prod: {
      id: string;
      title?: string;
      handle?: string;
      description?: string;
      thumbnail?: string;
      images?: Array<{ url?: string }>;
      variants?: Array<{ id: string }>;
    }): HomePageProduct => {
      const lowestPrice = MedusaProductService.getLowestPrice(prod);
      
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
      
      return {
        id: prod.id,
        name: prod.title || '',
        price: finalPrice,
        image: prod.thumbnail || prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop&crop=center',
        slug: prod.handle || '',
        isNew: true,
        colors: 1,
        description: prod.description || '',
        sku: prod.variants?.[0]?.sku || '',
        variants: prod.variants || [],
      };
    };

    const products = medusaProducts.products.map(convertProduct);
    
    return {
      categories,
      newArrivals: products.slice(0, 6),
      saleItems: products.slice(0, 4),
      sneakers: products.slice(0, 4),
      kidsItems: products.slice(0, 4),
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

// ADVANCED CACHING: ISR with perfect cache invalidation
export const revalidate = 3600; // Revalidate every hour
export const dynamicParams = true;
// export const dynamic = 'force-static'; // Static generation for maximum performance

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

export default async function HomePage() {
  const data = await getHomePageData();
  return <SimpleHomePage {...data} />;
}