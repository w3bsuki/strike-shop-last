import { Suspense } from 'react';
import { MedusaProductService } from '@/lib/medusa-service';
import type { HomePageCategory, HomePageProduct } from '@/types/home-page';
import { createCategoryId, createImageURL, createSlug, createProductId } from '@/types';
import { SiteHeader } from '@/components/navigation';
import { Hero, OptimizedHeroImage as HeroImage, HeroContent, HeroTitle, HeroDescription, HeroActions, HeroMarquee, HeroMarqueeItem } from '@/components/hero';
import { CategorySection, CategoryHeader, CategoryScroll } from '@/components/category';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Footer from '@/components/footer';
import { 
  ProductScrollSkeleton, 
  CategoryScrollSkeleton,
} from '@/components/ui/loading-states';

// Server Component for categories
async function CategoriesSection() {
  try {
    const medusaCategories = await MedusaProductService.getCategories();
    
    const categoryImages: Record<string, string> = {
      'men': 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=400&h=400&fit=crop&crop=center&q=80',
      'women': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop&crop=center&q=80',
      'footwear': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center&q=80',
      'shoes': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center&q=80',
      'sneakers': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop&crop=center&q=80',
      'accessories': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center&q=80',
      'default': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center&q=80'
    };

    let categories: HomePageCategory[] = medusaCategories.map((cat) => {
      const categoryKey = cat.handle?.toLowerCase() || cat.name.toLowerCase();
      const image = categoryImages[categoryKey] || 
                   categoryImages[categoryKey.replace(/s$/, '')] || 
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

    // Dynamic import for client components
    const { CategoryCard } = await import('@/components/category');

    return (
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
    );
  } catch (error) {
    console.error('Categories fetch error:', error);
    return null;
  }
}

// Server Component for products
async function ProductsSection({ type }: { type: 'new' | 'sale' | 'sneakers' | 'kids' }) {
  try {
    const medusaProducts = await MedusaProductService.getProducts({ limit: 6 });
    
    const convertProduct = (prod: any): HomePageProduct => {
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
    
    // Dynamic import for client components
    const { ProductShowcase } = await import('@/components/product');
    
    const configs = {
      new: {
        title: "NEW ARRIVALS",
        viewAllLink: "/new",
        showBadge: true,
        badgeText: "NEW",
        badgeVariant: "new" as const,
        description: "Fresh drops and latest designs from our cutting-edge SS25 collection"
      },
      sale: {
        title: "SS25 MENS",
        viewAllLink: "/sale/men",
        showBadge: true,
        badgeText: "SALE",
        badgeVariant: "sale" as const,
        description: "Exclusive deals on premium streetwear essentials and seasonal favorites"
      },
      sneakers: {
        title: "FEATURED FOOTWEAR",
        viewAllLink: "/footwear",
        description: "Premium sneakers and footwear for the modern streetwear enthusiast"
      },
      kids: {
        title: "KIDS COLLECTION",
        viewAllLink: "/kids",
        description: "Next generation streetwear for the young and bold - mini versions of our iconic pieces"
      }
    };

    const config = configs[type];

    return (
      <ProductShowcase
        {...config}
        products={products}
        layout="scroll"
      />
    );
  } catch (error) {
    console.error(`Products fetch error for ${type}:`, error);
    return null;
  }
}

// Main Server Component
export default async function HomePage() {
  return (
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

      <Suspense fallback={<div style={{ minHeight: '320px' }}><CategoryScrollSkeleton /></div>}>
        <CategoriesSection />
      </Suspense>

      {/* Winter Sale Banner */}
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

      <Suspense fallback={<div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>}>
        <ProductsSection type="sale" />
      </Suspense>

      <Suspense fallback={<div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>}>
        <ProductsSection type="new" />
      </Suspense>

      <Suspense fallback={<div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>}>
        <ProductsSection type="sneakers" />
      </Suspense>

      <Suspense fallback={<div style={{ minHeight: '380px' }}><ProductScrollSkeleton /></div>}>
        <ProductsSection type="kids" />
      </Suspense>

      <Footer />
    </main>
  );
}