import { ShopifyService } from '@/lib/shopify/services';
import { i18n, type Locale } from '@/lib/i18n/config';

export default async function SimplePage({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const products = await ShopifyService.getProducts(10);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Products Test</h1>
      <p>Language: {lang}</p>
      <p>Products found: {products.length}</p>
      
      <div className="grid gap-4 mt-8">
        {products.map((product) => (
          <div key={product.id} className="border p-4">
            <h2 className="font-bold">{product.content.name}</h2>
            <p>{product.pricing.displayPrice}</p>
            <p>Available: {!product.badges.isSoldOut ? 'Yes' : 'No'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}