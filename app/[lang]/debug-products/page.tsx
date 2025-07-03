import { ShopifyService } from '@/lib/shopify/services';

export default async function DebugProductsPage() {
  const products = await ShopifyService.getProducts(50);
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Debug: Shopify Products</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p>Total products found: <strong>{products.length}</strong></p>
        <p>Available products: <strong>{products.filter(p => !p.badges.isSoldOut).length}</strong></p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border border-gray-300 rounded-lg p-4">
            {product.content.images[0] && (
              <img 
                src={product.content.images[0].url as string} 
                alt={product.content.name}
                className="w-full h-48 object-cover mb-4 rounded"
              />
            )}
            <h2 className="font-bold text-lg mb-2">{product.content.name}</h2>
            <p className="text-gray-600 mb-2">{product.pricing.displayPrice}</p>
            <div className="space-y-1 text-sm">
              <p>ID: {product.id}</p>
              <p>Slug: {product.slug}</p>
              <p>Available: {product.badges.isSoldOut ? '❌ Sold Out' : '✅ In Stock'}</p>
              <p>New: {product.badges.isNew ? 'Yes' : 'No'}</p>
              <p>Sale: {product.badges.isSale ? 'Yes' : 'No'}</p>
              <p>Variants: {product.commerce.variants.length}</p>
            </div>
          </div>
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-red-600">No products found!</p>
          <p className="text-gray-600 mt-2">Check the console for errors.</p>
        </div>
      )}
    </div>
  );
}