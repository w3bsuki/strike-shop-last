import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductsTable } from '@/components/admin/products-table';

// Mock product data - TODO: Replace with real Shopify API call
const mockProducts = Array.from({ length: 50 }, (_, i) => {
  const names = [
    'Monochrome Knit Sweater',
    'Technical Bomber Jacket',
    'Utility Crossbody Bag',
    'Oversized Graphic Hoodie',
    'Chunky Sole Sneakers',
    'Diagonal Stripe Overshirt',
    'Logo Embroidered Cap',
    'Industrial Cargo Pants',
    'Arrow Runner 2.0',
    'Signature Arrow Tote Bag',
  ];
  const categories = ['Clothing', 'Footwear', 'Accessories', 'Bags', 'Homeware'];
  const statuses = ['Active', 'Active', 'Active', 'Draft', 'Out of Stock'];
  
  return {
    id: `prod_${i + 1}`,
    name: names[i % 10],
    sku: `STR-${String.fromCharCode(65 + (i % 26))}-${100 + i}`,
    category: categories[i % 5],
    price: `£${Math.floor(Math.random() * 900) + 100}`,
    stock: Math.floor(Math.random() * 100),
    status: statuses[i % 5],
    image: `/placeholder.svg?height=40&width=40&query=product+${i + 1}`,
    createdAt: new Date(
      Date.now() - Math.floor(Math.random() * 10000000000)
    ).toISOString(),
  };
});

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: string;
  stock: number;
  status: string;
  image: string;
  createdAt: string;
};

// Fetch products data server-side
async function getProducts(): Promise<Product[]> {
  // TODO: Replace with real API call
  // const products = await shopifyService.getProducts();
  return mockProducts as Product[];
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Link href="/admin/products/add">
          <Button className="mt-2 sm:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <ProductsTable products={products} />
    </div>
  );
}
