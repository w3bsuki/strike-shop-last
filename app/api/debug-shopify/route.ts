import { NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';
import { ShopifyService } from '@/lib/shopify/services';

export async function GET() {
  try {
    // Check if client is initialized
    if (!shopifyClient) {
      return NextResponse.json({ 
        error: 'Shopify client not initialized',
        env: {
          domain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ? 'SET' : 'MISSING',
          token: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ? 'SET' : 'MISSING',
        }
      }, { status: 500 });
    }

    // Try to fetch products
    const products = await ShopifyService.getProducts(10);
    
    return NextResponse.json({
      success: true,
      productCount: products.length,
      products: products.slice(0, 3).map(p => ({
        id: p.id,
        name: p.content.name,
        price: p.pricing.displayPrice,
        available: !p.badges.isSoldOut,
        slug: p.slug,
      })),
      env: {
        domain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
        hasToken: !!process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}