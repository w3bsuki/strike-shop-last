import { ShopifyService, createShopifyContext } from '@/lib/shopify/services';
import type { Locale } from '@/lib/i18n/config';

export default async function DebugLocalePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const context = createShopifyContext(lang);
  
  // Fetch products with locale context
  const products = await ShopifyService.getFlattenedProducts(5, context);
  
  // Also fetch without context for comparison
  const productsNoContext = await ShopifyService.getFlattenedProducts(5);
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Locale Debug Page</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Current Settings</h2>
        <ul className="space-y-1">
          <li><strong>URL Locale:</strong> {lang}</li>
          <li><strong>Shopify Context:</strong> Language={context.language}, Country={context.country}</li>
        </ul>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Products WITH Locale Context ({lang})</h2>
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="p-4 border rounded">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">ID: {product.id}</p>
                <p className="text-sm">Price: {product.price}</p>
                <p className="text-sm mt-2">{product.description.substring(0, 100)}...</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Products WITHOUT Locale Context</h2>
          <div className="space-y-4">
            {productsNoContext.map((product) => (
              <div key={product.id} className="p-4 border rounded">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">ID: {product.id}</p>
                <p className="text-sm">Price: {product.price}</p>
                <p className="text-sm mt-2">{product.description.substring(0, 100)}...</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Debug Information</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• If both columns show the same content, localization is not working</li>
          <li>• Check if product titles and descriptions differ between locales</li>
          <li>• Navigate to /en/debug-locale, /bg/debug-locale, and /ua/debug-locale to compare</li>
          <li>• Open Network tab in DevTools to see GraphQL requests with locale parameters</li>
        </ul>
      </div>
    </div>
  );
}