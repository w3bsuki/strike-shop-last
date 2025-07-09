import { NextRequest, NextResponse } from 'next/server';
import { getOrderByEmailAndNumber } from '@/lib/shopify/orders';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const orderNumber = formData.get('orderNumber') as string;

    if (!email || !orderNumber) {
      return NextResponse.json(
        { error: 'Email and order number are required' },
        { status: 400 }
      );
    }

    // Find order by email and order number
    const order = await getOrderByEmailAndNumber(email, orderNumber);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Return order ID for redirect
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number || order.id,
    });
  } catch (error) {
    console.error('Order tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track order' },
      { status: 500 }
    );
  }
}