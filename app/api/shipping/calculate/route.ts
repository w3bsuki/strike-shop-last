import { NextRequest, NextResponse } from 'next/server';
import { calculateShippingRates } from '@/lib/shopify/shipping';
import { logger } from '@/lib/monitoring';
import type { MoneyV2, CountryCode } from '@/lib/shopify/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { countryCode, subtotal, weight = 1, postalCode } = body;

    if (!countryCode || !subtotal) {
      return NextResponse.json(
        { error: 'Missing required fields: countryCode and subtotal' },
        { status: 400 }
      );
    }

    // Validate country code
    if (typeof countryCode !== 'string' || countryCode.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid country code' },
        { status: 400 }
      );
    }

    // Validate subtotal
    if (!subtotal.amount || !subtotal.currencyCode) {
      return NextResponse.json(
        { error: 'Invalid subtotal format' },
        { status: 400 }
      );
    }

    logger.info('Calculating shipping rates', {
      countryCode,
      subtotal,
      weight,
      postalCode,
    });

    // Calculate shipping rates
    const rates = calculateShippingRates(
      countryCode as CountryCode,
      weight,
      subtotal as MoneyV2,
      postalCode
    );

    // Sort rates by price (cheapest first)
    const sortedRates = rates.sort((a, b) => 
      parseFloat(a.price.amount) - parseFloat(b.price.amount)
    );

    return NextResponse.json({
      rates: sortedRates,
      count: sortedRates.length,
    });
  } catch (error) {
    logger.error('Failed to calculate shipping rates', { error });
    
    return NextResponse.json(
      { error: 'Failed to calculate shipping rates' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}