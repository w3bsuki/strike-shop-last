import { MedusaProductService } from '@/lib/medusa-service';

export async function GET() {
  try {
    // Quick product data fetch for immediate display
    const [medusaProducts, medusaCategories] = await Promise.all([
      MedusaProductService.getProducts({ limit: 12 }),
      MedusaProductService.getCategories()
    ]);

    // Convert to simple format for immediate display
    const products = medusaProducts.products.map((prod) => {
      const lowestPrice = MedusaProductService.getLowestPrice(prod);
      return {
        id: prod.id,
        name: prod.title,
        price: lowestPrice 
          ? MedusaProductService.formatPrice(lowestPrice.amount, lowestPrice.currency)
          : '€0.00',
        image: prod.thumbnail || prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop&crop=center',
        slug: prod.handle,
        description: prod.description || '',
        variants: prod.variants || []
      };
    });

    const categories = medusaCategories.map((cat) => ({
      id: cat.id,
      name: cat.name.toUpperCase(),
      slug: cat.handle,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center'
    }));

    return Response.json({
      success: true,
      data: {
        products,
        categories,
        newArrivals: products.slice(0, 6),
        saleItems: products.slice(0, 4),
        sneakers: products.slice(0, 4),
        kidsItems: products.slice(0, 4)
      }
    });
  } catch (error) {

    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}