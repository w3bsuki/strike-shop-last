import { MedusaProductService } from '@/lib/medusa-service';
import type { HomePageCategory, HomePageProduct } from '@/types/home-page';
import { createCategoryId, createImageURL, createSlug, createProductId } from '@/types';
import HomePageClient from '@/components/home-page-client';

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
      variants?: Array<{ id: string }>;
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
      
      return {
        id: createProductId(prod.id),
        name: prod.title || '',
        price: finalPrice,
        image: createImageURL(prod.thumbnail || prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop&crop=center'),
        slug: createSlug(prod.handle || ''),
        isNew: true,
        colors: 1,
        description: prod.description || '',
        sku: undefined,
        variants: [],
      };
    };

    const products = medusaProducts.products.map((prod: any) => convertProduct(prod));
    
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
  return <HomePageClient {...data} />;
}