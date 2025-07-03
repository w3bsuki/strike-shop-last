import { NextResponse } from 'next/server';

export async function GET() {
  // Direct GraphQL test
  const domain = 'strike2x.myshopify.com';
  const token = '8674e01617d65ef9adca861da183b232';
  const endpoint = `https://${domain}/api/2024-10/graphql.json`;

  const query = `
    query {
      products(first: 5) {
        edges {
          node {
            id
            title
            handle
            availableForSale
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data,
      productCount: data?.data?.products?.edges?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}