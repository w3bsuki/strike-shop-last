import { ShopifyService } from '@/lib/shopify/services';

export default async function VerifyShopifyPage() {
  const [products, collections] = await Promise.all([
    ShopifyService.getFlattenedProducts(5),
    ShopifyService.getCollections()
  ]);
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Shopify Integration Status</h1>
      
      <div className="bg-green-100 border border-green-400 rounded p-4 mb-8">
        <h2 className="text-xl font-semibold text-green-800 mb-2">✓ Connection Successful</h2>
        <p className="text-green-700">
          Successfully fetched {products.length} products and {collections.length} collections from Shopify
        </p>
      </div>
      
      {/* Products */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Products ({products.length})</h2>
        <div className="grid gap-4">
          {products.map((product: any) => (
            <div key={product.id} className="border rounded p-4 bg-gray-50">
              <div className="flex items-start gap-4">
                {product.mainImage && (
                  <img 
                    src={product.mainImage.url} 
                    alt={product.name} 
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-gray-600">Price: €{product.price}</p>
                  <p className="text-sm text-gray-500">ID: {product.id}</p>
                  <p className="text-sm text-gray-500">
                    Available: {product.availableForSale ? '✓ Yes' : '✗ No'}
                  </p>
                  {product.variants && (
                    <p className="text-sm text-gray-500">
                      Variants: {product.variants.length}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Collections */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Collections ({collections.length})</h2>
        <div className="grid gap-4">
          {collections.map((collection: any) => (
            <div key={collection.id} className="border rounded p-4 bg-gray-50">
              <h3 className="font-semibold">{collection.name}</h3>
              <p className="text-sm text-gray-500">Handle: {collection.slug}</p>
              <p className="text-sm text-gray-500">
                Products: {collection.products?.length || 0}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}