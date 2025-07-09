import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { shopifyClient, createCustomerService } from '@/lib/shopify';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Shopify token from header
    const shopifyToken = request.headers.get('X-Shopify-Token');
    
    if (!shopifyToken || !shopifyClient) {
      return NextResponse.json({
        orders: [],
        message: 'Shopify authentication required',
      });
    }

    const customerService = createCustomerService(shopifyClient);
    
    // Fetch customer orders
    const { orders, hasNextPage, endCursor } = await customerService.getOrders(
      shopifyToken,
      10 // Fetch last 10 orders
    );

    return NextResponse.json({
      orders,
      hasNextPage,
      endCursor,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}