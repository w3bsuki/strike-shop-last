import { NextRequest, NextResponse } from 'next/server';
import { bulgarianShipping } from '@/lib/shipping/bulgarian-providers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, weight, dimensions } = body;

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing shipping addresses' },
        { status: 400 }
      );
    }

    const quotes = await bulgarianShipping.getShippingQuotes(
      from,
      to,
      weight || 1,
      dimensions
    );

    return NextResponse.json({
      success: true,
      quotes,
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    );
  }
}