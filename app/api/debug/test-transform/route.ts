import { NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';
import { transformShopifyProduct } from '@/lib/shopify/services';

export async function GET() {
  try {
    if (!shopifyClient) {
      return NextResponse.json({ error: 'Shopify client not initialized' }, { status: 500 });
    }

    // Test fetching a single product
    const query = `
      query {
        products(first: 1) {
          edges {
            node {
              id
              title
              handle
              description
              tags
              vendor
              productType
              createdAt
              updatedAt
              images(first: 5) {
                edges {
                  node {
                    id
                    url
                    altText
                    width
                    height
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    availableForSale
                    quantityAvailable
                    selectedOptions {
                      name
                      value
                    }
                    image {
                      url
                      altText
                    }
                  }
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `;

    const response = await shopifyClient.query<any>(query, {});
    const shopifyProduct = response.products.edges[0]?.node;
    
    if (!shopifyProduct) {
      return NextResponse.json({ error: 'No products found' });
    }

    console.log('[Debug] Raw Shopify product:', JSON.stringify(shopifyProduct, null, 2));

    // Try to transform it
    let transformedProduct;
    try {
      transformedProduct = transformShopifyProduct(shopifyProduct);
      console.log('[Debug] Transformed product:', JSON.stringify(transformedProduct, null, 2));
    } catch (transformError) {
      console.error('[Debug] Transform error:', transformError);
      return NextResponse.json({ 
        error: 'Transform failed',
        details: transformError instanceof Error ? transformError.message : 'Unknown error',
        stack: transformError instanceof Error ? transformError.stack : undefined,
        rawProduct: shopifyProduct
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      raw: shopifyProduct,
      transformed: transformedProduct
    });
  } catch (error) {
    console.error('[Debug] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}