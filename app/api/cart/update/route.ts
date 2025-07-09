import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient, ShopifyCart } from '@/lib/shopify/client';

// Request body type
interface UpdateCartRequest {
  cartId: string;
  lineId: string;
  quantity: number;
}

// Response type
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// POST /api/cart/update - Update item quantity in cart
export async function POST(request: NextRequest) {
  try {
    // Check if Shopify client is initialized
    if (!shopifyClient) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Shopify client not configured'
      }, { status: 500 });
    }

    // Parse request body
    const body: UpdateCartRequest = await request.json();
    
    // Validate required fields
    if (!body.cartId || !body.lineId || body.quantity === undefined) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Cart ID, line ID, and quantity are required'
      }, { status: 400 });
    }

    // Validate quantity
    if (body.quantity < 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Quantity cannot be negative'
      }, { status: 400 });
    }

    let updatedCart: ShopifyCart;

    // If quantity is 0, remove the item
    if (body.quantity === 0) {
      updatedCart = await shopifyClient.removeFromCart(body.cartId, [body.lineId]);
    } else {
      // Update the line item quantity
      // Note: Shopify doesn't have a direct update method, so we need to use cartLinesUpdate mutation
      const mutation = `
        mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
          cartLinesUpdate(cartId: $cartId, lines: $lines) {
            cart {
              id
              checkoutUrl
              totalQuantity
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
                subtotalAmount {
                  amount
                  currencyCode
                }
              }
              lines(first: 100) {
                edges {
                  node {
                    id
                    quantity
                    cost {
                      totalAmount {
                        amount
                        currencyCode
                      }
                    }
                    merchandise {
                      ... on ProductVariant {
                        id
                        title
                        image {
                          url
                          altText
                        }
                        product {
                          id
                          title
                          handle
                        }
                      }
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        cartId: body.cartId,
        lines: [{
          id: body.lineId,
          quantity: body.quantity
        }]
      };

      const response = await shopifyClient.query<{ 
        cartLinesUpdate: { 
          cart: ShopifyCart;
          userErrors: Array<{ field: string[]; message: string }>;
        } 
      }>(mutation, variables);

      // Check for user errors
      if (response.cartLinesUpdate.userErrors.length > 0) {
        const error = response.cartLinesUpdate.userErrors[0];
        return NextResponse.json<ApiResponse>({
          success: false,
          error: error?.message || 'Unknown error occurred'
        }, { status: 400 });
      }

      updatedCart = response.cartLinesUpdate.cart;
    }

    return NextResponse.json<ApiResponse<ShopifyCart>>({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    
    // Check for specific Shopify errors
    if (error instanceof Error) {
      if (error.message.includes('Cart not found')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Cart not found'
        }, { status: 404 });
      }
      
      if (error.message.includes('Line item not found')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Line item not found in cart'
        }, { status: 404 });
      }
      
      if (error.message.includes('Not enough inventory')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Not enough inventory available for requested quantity'
        }, { status: 400 });
      }
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update cart'
    }, { status: 500 });
  }
}