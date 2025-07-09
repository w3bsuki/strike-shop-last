import dynamic from 'next/dynamic';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { QuickViewProvider } from '@/contexts/QuickViewContext';
import { ShopifyService } from '@/lib/shopify/services';

// Dynamic imports for heavy components
const CategoryPageClient = dynamic(() => import('@/components/category/CategoryPageClient'), {
  loading: () => (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
});

const QuickViewModal = dynamic(() => import('@/components/QuickViewModal').then(mod => ({ default: mod.QuickViewModal })));
import { generateCategoryMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

// Define available categories
const CATEGORIES = {
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
  sale: 'Sale',
  'new-arrivals': 'New Arrivals',
  sneakers: 'Sneakers',
  accessories: 'Accessories',
};

// Generate static params for all categories at build time
export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({
    category,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const baseUrl = process.env['NEXT_PUBLIC_SITE_URL'] || 'https://strike-shop.com';
  return generateCategoryMetadata(
    category,
    `${baseUrl}/${category}`
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const categoryName =
    CATEGORIES[category as keyof typeof CATEGORIES] ||
    category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Fetch real products from Shopify
  let products: any[] = [];
  
  try {
    // Special handling for certain categories
    if (category === 'new-arrivals') {
      // Fetch all products and filter for new ones
      const allProducts = await ShopifyService.getProducts(50);
      products = allProducts
        .filter((p: any) => p.badges?.isNew === true)
        .map(convertProduct);
      
      // If not enough new products, just get the latest ones
      if (products.length < 6) {
        products = allProducts.slice(0, 24).map(convertProduct);
      }
    } else if (category === 'sale') {
      // Fetch products that have sale prices
      const allProducts = await ShopifyService.getProducts(50);
      products = allProducts
        .filter((p: any) => p.badges?.isSale === true)
        .map(convertProduct);
      
      // If not enough sale products, just get regular products
      if (products.length < 6) {
        products = allProducts.slice(0, 24).map(convertProduct);
      }
    } else {
      // Try to find a matching collection from Shopify
      const collections = await ShopifyService.getCollections();
      const matchingCollection = collections.find((col: any) => 
        col.slug === category || 
        col.name.toLowerCase() === category.toLowerCase() ||
        col.slug === category.replace(/-/g, '')
      );
      
      if (matchingCollection) {
        // Use products from this collection
        products = matchingCollection.products.map(convertProduct);
      } else {
        // Fallback: search products by category name
        const searchResults = await ShopifyService.searchProducts(category.replace(/-/g, ' '));
        products = searchResults.map(convertProduct);
        
        // If still no products, just show all products
        if (products.length === 0) {
          const allProducts = await ShopifyService.getProducts(24);
          products = allProducts.map(convertProduct);
        }
      }
    }
    
    // Ensure we have at least some products
    if (products.length === 0) {
      const fallbackProducts = await ShopifyService.getProducts(24);
      products = fallbackProducts.map(convertProduct);
    }
    
  } catch (error) {
    console.error('Failed to fetch products:', error);
    // Return empty array on error
    products = [];
  }

  // Convert Shopify product to our format
  function convertProduct(prod: any): any {
    const finalPrice = prod.pricing?.displayPrice || '€0.00';
    const originalPrice = prod.pricing?.displaySalePrice;
    const discount = prod.pricing?.discount?.percentage ? `-${prod.pricing.discount.percentage}%` : undefined;
    
    return {
      id: prod.id,
      name: prod.content?.name || '',
      price: finalPrice,
      originalPrice,
      discount,
      image: prod.content?.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop&crop=center',
      isNew: prod.badges?.isNew === true,
      slug: prod.slug || '',
      colors: prod.commerce?.variants?.length || 1,
      soldOut: prod.badges?.isSoldOut === true,
      variantId: prod.commerce?.variants?.[0]?.id || `variant_${prod.id}_default`,
    };
  }

  return (
    <QuickViewProvider>
      <main className="bg-white">
        <SiteHeader />
        <CategoryPageClient
          categoryName={categoryName}
          initialProducts={products}
        />
        <Footer />
      </main>
      <QuickViewModal />
    </QuickViewProvider>
  );
}
