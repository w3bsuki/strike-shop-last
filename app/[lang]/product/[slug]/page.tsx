import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import type { ProductPageData } from '@/types/product';
import { createImageURL, createTagId } from '@/types';
import { ShopifyService } from '@/lib/shopify/services';
import type { IntegratedProduct } from '@/types';

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

// Helper function to transform IntegratedProduct to ProductPageData
function transformToProductPageData(product: IntegratedProduct): ProductPageData {
  const result: ProductPageData = {
    id: product.id,
    title: product.content.name,
    description: product.content.description || '',
    price: product.pricing.displayPrice,
    images: product.content.images.map(img => 
      createImageURL(typeof img === 'string' ? img : img.url)
    ),
    variants: product.commerce.variants.map(variant => ({
      id: variant.id,
      title: variant.title,
      price: variant.pricing.displayPrice,
      available: variant.inventory.available,
    })),
    categories: [], // Shopify doesn't provide categories in the same way, could be enhanced later
    tags: product.content.tags?.map(tag => ({
      id: createTagId(tag),
      value: tag,
    })) || [],
  };

  // Add optional fields
  if (product.content.brand || product.metadata) {
    result.metadata = {
      ...(product.metadata || {}),
      brand: product.content.brand,
    };
  }

  return result;
}

// Fetch product data from Shopify
async function getProduct(slug: string): Promise<ProductPageData | null> {
  try {
    const shopifyProduct = await ShopifyService.getProductBySlug(slug);
    
    if (!shopifyProduct) {
      return null;
    }
    
    return transformToProductPageData(shopifyProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}


interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for could not be found.',
    };
  }

  return {
    title: `${product.title} | STRIKE™`,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.images.slice(0, 1),
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <ProductPageClient product={product} />
      <Footer />
    </>
  );
}