import { ShopifyService } from '@/lib/shopify/services';

export default async function TestProducts() {
  let products: any[] = [];
  let error: string | null = null;
  
  try {
    products = await ShopifyService.getProducts(10);
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Products Page</h1>
      
      <div className="mb-4">
        <p><strong>Status:</strong> {error ? 'Error' : 'Success'}</p>
        {error && <p className="text-red-600">Error: {error}</p>}
        <p><strong>Product Count:</strong> {products.length}</p>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product.id} className="border p-4">
            <h2 className="font-bold">{product.content.name}</h2>
            <p>Price: {product.pricing.displayPrice}</p>
            <p>Available: {product.badges.isSoldOut ? 'No' : 'Yes'}</p>
            <p>ID: {product.id}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100">
        <h3 className="font-bold mb-2">Environment Variables:</h3>
        <p>Domain: {process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'NOT SET'}</p>
        <p>Token: {process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ? 'SET' : 'NOT SET'}</p>
      </div>
    </div>
  );
}