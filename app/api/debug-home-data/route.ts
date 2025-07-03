import { NextResponse } from 'next/server';
import { ShopifyService } from '@/lib/shopify/services';

export async function GET() {
  try {
    const [allProducts, shopifyCollections] = await Promise.all([
      ShopifyService.getFlattenedProducts(50),
      ShopifyService.getCollections()
    ]);
    
    // Check product structure
    const sampleProduct = allProducts[0];
    const productStructure = sampleProduct ? {
      hasId: !!sampleProduct.id,
      hasName: !!sampleProduct.name,
      hasPrice: !!sampleProduct.price,
      hasImage: !!sampleProduct.image,
      hasSlug: !!sampleProduct.slug,
      hasAvailableForSale: sampleProduct.availableForSale !== undefined,
      actualProduct: sampleProduct
    } : null;

    return NextResponse.json({
      productsCount: allProducts.length,
      collectionsCount: shopifyCollections.length,
      sampleProduct: productStructure,
      allProducts: allProducts.slice(0, 3) // First 3 products for debugging
    });
  } catch (error) {
    console.error('[DebugHomeData] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}