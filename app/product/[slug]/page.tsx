import { Suspense } from 'react';
import { MedusaProductService } from '@/lib/medusa-service';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

const ProductPageClient = dynamic(
  () => import('./ProductPageClient'),
  { 
    ssr: true,
    loading: () => (
      <div className="min-h-screen animate-pulse">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-md" />
            <div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }
);

interface ProductPageProps {
  params: {
    slug: string;
  };
}

// Generate static params for popular products
export async function generateStaticParams() {
  try {
    const { products } = await MedusaProductService.getProducts({ limit: 50 });
    
    return products.map((product: any) => ({
      slug: product.handle || product.id,
    }));
  } catch (error) {
    console.error('Error generating static params for products:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const product = await MedusaProductService.getProduct(params.slug);
    
    if (!product) {
      return {
        title: 'Product Not Found',
      };
    }
    
    return {
      title: `${product.title} | STRIKE™`,
      description: product.description || `Shop ${product.title} from STRIKE™ luxury streetwear collection.`,
      openGraph: {
        title: product.title,
        description: product.description,
        images: product.thumbnail ? [product.thumbnail] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Product | STRIKE™',
    };
  }
}

// Server component that fetches product data
async function ProductData({ slug }: { slug: string }) {
  try {
    const product = await MedusaProductService.getProduct(slug);
    
    if (!product) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
      );
    }
    
    return <ProductPageClient product={product} />;
  } catch (error) {
    console.error('Error fetching product:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Product</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <main className="bg-white">
      <SiteHeader />
      
      <Suspense 
        fallback={
          <div className="min-h-screen animate-pulse">
            <div className="container mx-auto px-4 py-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="h-96 bg-gray-200 rounded-md" />
                <div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
                  <div className="h-32 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        }
      >
        <ProductData slug={params.slug} />
      </Suspense>
      
      <Footer />
    </main>
  );
}