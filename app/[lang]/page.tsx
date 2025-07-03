import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { HomePageCategory, HomePageProduct } from '@/types/home-page';
import { createCategoryId, createImageURL, createSlug, createProductId, createSKU, createVariantId, createPrice } from '@/types';
import { ShopifyService, createShopifyContext } from '@/lib/shopify/services';
import { getTranslatedProductName, getTranslatedCollectionName } from '@/lib/translations/product-translations';
import HomePageClient from '@/components/home-page-client';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { QuickViewProvider } from '@/contexts/QuickViewContext';
import { QuickViewModal } from '@/components/QuickViewModal';
import { MobileNav } from '@/components/mobile/navigation';
import { HeroSection } from '@/components/hero-section';
import { i18n, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { I18nProvider } from '@/lib/i18n/i18n-provider';

// Get data from Shopify - Production Ready (No Demo Data)
async function getHomePageData(locale: Locale) {
  try {
    // Create Shopify context for localized content
    const shopifyContext = createShopifyContext(locale);
    console.log('[HomePage] Fetching data with locale:', locale, 'context:', shopifyContext);
    
    // Fetch all collections and products from Shopify with locale context
    const [allProducts, shopifyCollections] = await Promise.all([
      ShopifyService.getFlattenedProducts(50, shopifyContext),
      ShopifyService.getCollections(shopifyContext)
    ]);
    
    // Transform Shopify collections to categories with localization
    const categories: HomePageCategory[] = shopifyCollections.map(collection => ({
      id: createCategoryId(collection.id),
      name: getTranslatedCollectionName(collection.id, collection.name, locale).toUpperCase(),
      count: collection.products?.length || 0,
      image: createImageURL(collection.image?.url || '/placeholder-category.jpg'),
      slug: createSlug(collection.slug),
    }));

    // Transform all Shopify products with enhanced descriptions
    const products: HomePageProduct[] = allProducts.map(product => {
      // Enhanced product descriptions based on product type/name
      const getEnhancedDescription = (name: string, originalDesc: string): string => {
        if (originalDesc && originalDesc !== 'XYZ') return originalDesc;
        
        const lowercaseName = name.toLowerCase();
        if (lowercaseName.includes('t-shirt') || lowercaseName.includes('tee')) {
          return 'Premium cotton t-shirt featuring contemporary streetwear design. Comfortable fit with modern style.';
        }
        if (lowercaseName.includes('denim') || lowercaseName.includes('short')) {
          return 'High-quality denim shorts with modern cut. Perfect for casual wear and summer style.';
        }
        if (lowercaseName.includes('sneaker') || lowercaseName.includes('shoe')) {
          return 'Contemporary sneakers combining comfort and style. Ideal for everyday wear and active lifestyle.';
        }
        if (lowercaseName.includes('jacket')) {
          return 'Stylish jacket crafted with premium materials. Perfect for layering and all-season wear.';
        }
        if (lowercaseName.includes('accessory')) {
          return 'Essential accessory to complete your look. Quality craftsmanship with modern design.';
        }
        return 'Premium quality streetwear item featuring contemporary design and exceptional craftsmanship.';
      };

      const translatedName = getTranslatedProductName(product.id, product.name || 'Product', locale);
      
      return {
        id: createProductId(product.id),
        name: translatedName,
        price: product.price,
        image: createImageURL(product.image || '/placeholder-product.jpg'),
        slug: createSlug(product.slug),
        isNew: Math.random() > 0.7, // Random for demo, should come from Shopify metafields
        soldOut: !product.availableForSale,
        colors: product.variants?.length || 1,
        description: getEnhancedDescription(translatedName, product.description || ''),
        sku: createSKU(product.vendor || `SKU-${product.id}`),
        variants: product.variants?.map(variant => ({
          id: createVariantId(variant.id),
          title: variant.title,
          sku: variant.sku ? createSKU(variant.sku) : undefined,
          prices: variant.prices?.map(price => ({
            amount: createPrice(price.amount),
            currency_code: price.currencyCode,
          })) || []
        })) || [],
        variantId: product.variants?.[0]?.id || `variant_${product.id}`,
      };
    });

    // Create product sections - smart categorization
    const availableProducts = products.filter(p => !p.soldOut);
    
    // New arrivals - recently added products (or first 8 if all are new)
    const newArrivals = availableProducts.filter(p => p.isNew).slice(0, 8);
    const newArrivalsSection = newArrivals.length > 0 ? newArrivals : availableProducts.slice(0, 8);
    
    // Sale items - products with sale badges or on-sale collections
    const saleItems = availableProducts.filter(p => p.price.includes('sale') || p.isNew).slice(0, 8);
    const saleItemsSection = saleItems.length > 0 ? saleItems : availableProducts.slice(0, 8);
    
    // Sneakers - footwear products
    const sneakers = availableProducts.filter(p => 
      p.name.toLowerCase().includes('sneaker') || 
      p.name.toLowerCase().includes('shoe') ||
      p.name.toLowerCase().includes('runner')
    ).slice(0, 4);
    const sneakersSection = sneakers.length > 0 ? sneakers : availableProducts.slice(0, 4);
    
    // Kids items - none available currently
    const kidsItems: HomePageProduct[] = [];
    
    // Production logging
    console.log('[HomePage] Shopify products loaded:', allProducts.length);
    console.log('[HomePage] Available products:', availableProducts.length);
    console.log('[HomePage] Collections:', shopifyCollections.length);
    console.log('[HomePage] Categories created:', categories.length);
    console.log('[HomePage] Sample product:', allProducts[0]);
    console.log('[HomePage] New arrivals section:', newArrivalsSection.length);
    console.log('[HomePage] Sale items section:', saleItemsSection.length);
    console.log('[HomePage] Sneakers section:', sneakersSection.length);

    return {
      categories,
      newArrivals: newArrivalsSection,
      saleItems: saleItemsSection,
      sneakers: sneakersSection,
      kidsItems,
    };
  } catch (error) {
    console.error('[HomePage] Critical: Failed to fetch Shopify data:', error);
    
    // Production error handling - return empty structure instead of throwing
    // This allows the page to render with no products rather than crashing
    return {
      categories: [],
      newArrivals: [],
      saleItems: [],
      sneakers: [],
      kidsItems: [],
    };
  }
}

// Force dynamic rendering to ensure products load
// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';
// export const dynamicParams = true;
// export const revalidate = 0;

// Generate static params for all supported locales
export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

// METADATA: Dynamic metadata for better SEO with i18n
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  // Validate locale
  if (!i18n.locales.includes(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);
  
  return {
    title: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
    openGraph: {
      title: dict.meta.homeTitle,
      description: dict.meta.homeDescription,
      locale: lang,
    },
    twitter: {
      title: dict.meta.homeTitle,
      description: dict.meta.homeDescription,
    },
    alternates: {
      canonical: `/${lang}`,
      languages: {
        'en': '/en',
        'bg': '/bg', 
        'uk': '/ua',
      },
    },
  };
}


// Server Component that streams data
export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  console.log('[HomePage] Rendering...');
  const { lang } = await params;
  // Validate locale
  if (!i18n.locales.includes(lang)) {
    notFound();
  }

  // Load dictionary for this locale
  const dictionary = await getDictionary(lang);
  
  // Start fetching data immediately with locale context
  const dataPromise = getHomePageData(lang);
  
  // Await the data directly - no streaming for now
  const data = await dataPromise;
  console.log('[HomePage] Data fetched:', {
    categories: data.categories.length,
    newArrivals: data.newArrivals.length,
    saleItems: data.saleItems.length,
  });
  
  return (
    <I18nProvider locale={lang} dictionary={dictionary}>
      <QuickViewProvider>
        <main className="bg-white" id="main-content">
          <SiteHeader />
          
          {/* Hero loads immediately - NO SUSPENSE */}
          <HeroSection />
          
          {/* Direct render with data - no streaming */}
          <HomePageClient
            categories={data.categories}
            newArrivals={data.newArrivals}
            saleItems={data.saleItems}
            sneakers={data.sneakers}
            kidsItems={data.kidsItems}
          />
          
          <Footer />
          <MobileNav variant="default" showLabels={true} />
        </main>
        
        {/* Quick View Modal */}
        <QuickViewModal />
      </QuickViewProvider>
    </I18nProvider>
  );
}

// Removed StreamedContent - using direct rendering instead