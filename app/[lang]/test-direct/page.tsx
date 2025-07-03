import { ShopifyService } from '@/lib/shopify/services';
import { createProductId, createImageURL, createSlug, createSKU, createVariantId, createPrice } from '@/types';
import type { HomePageProduct } from '@/types/home-page';
import { ProductCard } from '@/components/product/product-card';

export default async function TestDirectPage() {
  const [allProducts] = await Promise.all([
    ShopifyService.getFlattenedProducts(5)
  ]);
  
  // Transform products
  const products: HomePageProduct[] = allProducts.map(product => ({
    id: createProductId(product.id),
    name: product.name || 'Product',
    price: `€${product.price}`,
    image: createImageURL(product.image || '/placeholder-product.jpg'),
    slug: createSlug(product.slug),
    isNew: true,
    soldOut: !product.availableForSale,
    colors: product.variants?.length || 1,
    description: product.description || 'Product description',
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
  }));
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Direct Product Cards</h1>
      <div className="grid grid-cols-3 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}