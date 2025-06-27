import dynamic from 'next/dynamic';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { QuickViewProvider } from '@/contexts/QuickViewContext';
import { MedusaProductService } from '@/lib/medusa-service';
import { createProductId, createSlug, createImageURL } from '@/types';

// Dynamic imports for heavy components
const CategoryPageClient = dynamic(() => import('@/components/category-page-client'), {
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
  params: {
    category: string;
  };
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

  // Fetch real products from Medusa
  let products: any[] = [];
  
  try {
    // Special handling for certain categories
    if (category === 'new-arrivals') {
      // Fetch all products and filter for new ones
      const { products: allProducts } = await MedusaProductService.getProducts({ limit: 50 });
      products = allProducts
        .filter((p: any) => p.metadata?.isNew === true)
        .map(convertProduct);
      
      // If not enough new products, just get the latest ones
      if (products.length < 6) {
        products = allProducts.slice(0, 24).map(convertProduct);
      }
    } else if (category === 'sale') {
      // Fetch products that have sale prices
      const { products: allProducts } = await MedusaProductService.getProducts({ limit: 50 });
      products = allProducts
        .filter((p: any) => {
          // Check if any variant has a sale price
          return p.variants?.some((v: any) => 
            v.prices?.some((price: any) => price.includes_tax && price.amount < price.original_amount)
          );
        })
        .map(convertProduct);
      
      // If not enough sale products, just get regular products
      if (products.length < 6) {
        products = allProducts.slice(0, 24).map(convertProduct);
      }
    } else {
      // Try to find a matching category from Medusa
      const categories = await MedusaProductService.getCategories();
      const matchingCategory = categories.find((cat: any) => 
        cat.handle === category || 
        cat.name.toLowerCase() === category.toLowerCase() ||
        cat.handle === category.replace(/-/g, '')
      );
      
      if (matchingCategory) {
        // Fetch products for this specific category
        const categoryProducts = await MedusaProductService.getProductsByCategory(matchingCategory.id, 50);
        products = categoryProducts.map(convertProduct);
      } else {
        // Fallback: fetch all products and filter by name/description
        const { products: allProducts } = await MedusaProductService.getProducts({ limit: 50 });
        products = allProducts
          .filter((p: any) => {
            const searchTerm = category.toLowerCase();
            return p.title?.toLowerCase().includes(searchTerm) ||
                   p.description?.toLowerCase().includes(searchTerm) ||
                   p.categories?.some((c: any) => c.name?.toLowerCase().includes(searchTerm));
          })
          .map(convertProduct);
        
        // If still no products, just show all products
        if (products.length === 0) {
          products = allProducts.slice(0, 24).map(convertProduct);
        }
      }
    }
    
    // Ensure we have at least some products
    if (products.length === 0) {
      const { products: fallbackProducts } = await MedusaProductService.getProducts({ limit: 24 });
      products = fallbackProducts.map(convertProduct);
    }
    
  } catch (error) {
    console.error('Failed to fetch products:', error);
    // Return empty array on error
    products = [];
  }

  // Convert Medusa product to our format
  function convertProduct(prod: any): any {
    const lowestPrice = MedusaProductService.getLowestPrice(prod);
    
    let finalPrice = '€0.00';
    let originalPrice = undefined;
    let discount = undefined;
    
    if (lowestPrice) {
      let priceAmount = lowestPrice.amount;
      if (priceAmount < 100) {
        priceAmount = priceAmount * 100;
      }
      finalPrice = MedusaProductService.formatPrice(priceAmount, lowestPrice.currency);
      
      // Check for sale price
      const variant = prod.variants?.[0];
      if (variant?.prices?.length > 0) {
        const price = variant.prices[0];
        if (price.original_amount && price.original_amount > price.amount) {
          originalPrice = MedusaProductService.formatPrice(price.original_amount, price.currency_code);
          discount = `-${Math.floor(((price.original_amount - price.amount) / price.original_amount) * 100)}%`;
        }
      }
    }
    
    return {
      id: prod.id,
      name: prod.title || '',
      price: finalPrice,
      originalPrice,
      discount,
      image: prod.thumbnail || prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop&crop=center',
      isNew: prod.metadata?.isNew === true,
      slug: prod.handle || '',
      colors: prod.variants?.length || 1,
      soldOut: prod.variants?.every((v: any) => v.inventory_quantity === 0) || false,
      variantId: prod.variants?.[0]?.id || `variant_${prod.id}_default`,
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
