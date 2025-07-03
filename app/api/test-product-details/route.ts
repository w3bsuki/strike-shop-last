import { NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';

export async function GET() {
  try {
    if (!shopifyClient) {
      return NextResponse.json({ error: 'Shopify client not initialized' }, { status: 500 });
    }

    // Get detailed product info
    const query = `
      query {
        products(first: 2) {
          edges {
            node {
              id
              title
              handle
              availableForSale
              publishedAt
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    quantityAvailable
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
              images(first: 1) {
                edges {
                  node {
                    url
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await shopifyClient.query<any>(query);
    const products = result.products.edges.map((edge: any) => edge.node);
    
    return NextResponse.json({ 
      success: true,
      products,
      note: 'Products need inventory to be availableForSale. Check Shopify admin.'
    });
  } catch (error) {
    console.error('Product details error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}