import { ShopifyService } from '@/lib/shopify/services';

export default async function TestShopifyPage() {
  let products: any[] = [];
  let error = null;
  
  try {
    console.log('Test page: Fetching products...');
    products = await ShopifyService.getProducts(5);
    console.log('Test page: Products fetched:', products);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
    console.error('Test page error:', e);
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Shopify Test Page</h1>
      
      {error && (
        <div className="bg-red-100 p-4 mb-4 rounded">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Environment Check:</h2>
        <ul className="list-disc list-inside">
          <li>Domain: {process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'NOT SET'}</li>
          <li>Token: {process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ? 'SET' : 'NOT SET'}</li>
        </ul>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Products ({products.length}):</h2>
        {products.length === 0 ? (
          <p>No products found. Check the console for debug logs.</p>
        ) : (
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(products, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}