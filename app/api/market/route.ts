import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMarketByCountry } from '@/lib/shopify/markets';

export async function POST(request: NextRequest) {
  try {
    const { country, currency } = await request.json();
    
    if (!country || !currency) {
      return NextResponse.json(
        { error: 'Country and currency are required' },
        { status: 400 }
      );
    }
    
    // Get market for the country
    const market = getMarketByCountry(country);
    
    // Set cookies with 1 year expiry
    const cookieOptions = {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    };
    
    const cookieStore = await cookies();
    cookieStore.set('shopify_market', market.handle, cookieOptions);
    cookieStore.set('shopify_country', country, cookieOptions);
    cookieStore.set('shopify_currency', currency, cookieOptions);
    
    return NextResponse.json({ 
      success: true, 
      market: market.handle,
      country,
      currency 
    });
  } catch (error) {
    console.error('Error updating market preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update market preferences' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const cookieStore = await cookies();
  
  const market = cookieStore.get('shopify_market')?.value;
  const country = cookieStore.get('shopify_country')?.value || 'DE';
  const currency = cookieStore.get('shopify_currency')?.value || 'EUR';
  
  return NextResponse.json({
    market,
    country,
    currency,
  });
}