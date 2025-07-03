import { NextRequest, NextResponse } from 'next/server';
import { ShopifyService, createShopifyContext } from '@/lib/shopify/services';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') || 'en';
  
  console.log('[DEBUG] Testing locale:', locale);
  
  try {
    // Test with the specified locale
    const shopifyContext = createShopifyContext(locale as any);
    console.log('[DEBUG] Shopify context:', shopifyContext);
    
    // Fetch a few products to compare
    const products = await ShopifyService.getProducts(3, shopifyContext);
    const collections = await ShopifyService.getCollections(shopifyContext);
    
    return NextResponse.json({
      locale,
      shopifyContext,
      products: products.map(p => ({ 
        id: p.id, 
        name: p.content?.name, 
        description: p.content?.description?.substring(0, 100) 
      })),
      collections: collections.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description?.substring(0, 100)
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      locale,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}