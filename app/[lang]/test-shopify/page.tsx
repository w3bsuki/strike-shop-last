import { shopifyClient } from '@/lib/shopify/client';

export default async function TestShopifyPage() {
  let error = null;
  let products = [];
  
  try {
    if (!shopifyClient) {
      throw new Error('Shopify client not initialized');
    }
    
    // Direct query to Shopify
    const response = await shopifyClient.query<{ products: any }>(`
      query {
        products(first: 5) {
          edges {
            node {
              id
              title
              handle
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `);
    
    products = response.products.edges.map((edge: any) => edge.node);
  } catch (e: any) {
    error = e.message;
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Direct Shopify Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="mb-4">
        <p>Products found: <strong>{products.length}</strong></p>
      </div>
      
      {products.length > 0 && (
        <div className="space-y-4">
          {products.map((product: any) => (
            <div key={product.id} className="border p-4 rounded">
              <h2 className="font-bold">{product.title}</h2>
              <p>Handle: {product.handle}</p>
              <p>Price: {product.priceRange.minVariantPrice.currencyCode} {product.priceRange.minVariantPrice.amount}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}