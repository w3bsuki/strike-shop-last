import { NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';

export async function GET() {
  try {
    if (!shopifyClient) {
      return NextResponse.json({ error: 'Shopify client not initialized' }, { status: 500 });
    }

    // Simple products query
    const query = `
      query {
        products(first: 5) {
          edges {
            node {
              id
              title
              handle
              availableForSale
              publishedAt
            }
          }
        }
      }
    `;

    const result = await shopifyClient.query<any>(query);
    const products = result.products.edges.map((edge: any) => edge.node);
    
    return NextResponse.json({ 
      success: true,
      count: products.length,
      products,
      message: products.length > 0 ? 'Products found' : 'No products found - check if products are published to Online Store channel'
    });
  } catch (error) {
    console.error('Products test error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}