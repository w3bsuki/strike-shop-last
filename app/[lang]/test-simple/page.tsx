import { shopifyService } from '@/lib/shopify/services';
import { ProductCard } from '@/components/product/product-card';

export default async function TestSimplePage() {
  const products = await shopifyService.getFlattenedProducts(10);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Simple Product Test</h1>
      <div className="grid grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border border-red-500 p-2">
            <p className="text-sm font-bold">{product.name}</p>
            <p className="text-sm">{product.price}</p>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}