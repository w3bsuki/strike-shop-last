import { ShopifyService } from '@/lib/shopify/services';
import { createProductId, createImageURL, createSlug, createSKU, createVariantId, createPrice } from '@/types';
import type { HomePageProduct } from '@/types/home-page';

export default async function TestProductsPage() {
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
      <h1 className="text-2xl font-bold mb-4">Test Products Page</h1>
      <div className="grid grid-cols-2 gap-4">
        {products.map(product => (
          <div key={product.id} className="border p-4">
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover mb-2" />
            <h3 className="font-bold">{product.name}</h3>
            <p>{product.price}</p>
            <p className="text-sm text-gray-500">ID: {product.id}</p>
          </div>
        ))}
      </div>
      <pre className="mt-8 p-4 bg-gray-100 overflow-auto">
        {JSON.stringify(products, null, 2)}
      </pre>
    </div>
  );
}