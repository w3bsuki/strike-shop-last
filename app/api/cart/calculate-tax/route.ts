import { NextRequest, NextResponse } from 'next/server';

interface TaxCalculationRequest {
  cartItems: Array<{
    id: string;
    quantity: number;
    pricing: {
      unitPrice: number;
      totalPrice: number;
    };
  }>;
  shippingAddress?: {
    country: string;
    state?: string;
    postalCode: string;
    city?: string;
  };
}

interface TaxRate {
  country: string;
  state?: string;
  rate: number;
  shippingRate?: number;
}

// Tax rates database (in production, this would be a proper tax service)
const TAX_RATES: TaxRate[] = [
  // United States
  { country: 'US', state: 'CA', rate: 0.0875, shippingRate: 15.99 },
  { country: 'US', state: 'NY', rate: 0.08, shippingRate: 12.99 },
  { country: 'US', state: 'TX', rate: 0.0825, shippingRate: 14.99 },
  { country: 'US', state: 'FL', rate: 0.06, shippingRate: 11.99 },
  { country: 'US', rate: 0.07, shippingRate: 13.99 }, // Default US rate
  
  // Canada
  { country: 'CA', state: 'ON', rate: 0.13, shippingRate: 18.99 }, // HST
  { country: 'CA', state: 'BC', rate: 0.12, shippingRate: 17.99 }, // PST + GST
  { country: 'CA', state: 'QC', rate: 0.14975, shippingRate: 19.99 }, // GST + QST
  { country: 'CA', rate: 0.05, shippingRate: 16.99 }, // Default GST
  
  // Europe (VAT)
  { country: 'GB', rate: 0.20, shippingRate: 8.99 }, // UK VAT
  { country: 'DE', rate: 0.19, shippingRate: 9.99 }, // German VAT
  { country: 'FR', rate: 0.20, shippingRate: 10.99 }, // French VAT
  { country: 'IT', rate: 0.22, shippingRate: 11.99 }, // Italian VAT
  { country: 'ES', rate: 0.21, shippingRate: 10.99 }, // Spanish VAT
  { country: 'NL', rate: 0.21, shippingRate: 9.99 }, // Dutch VAT
  
  // Other countries
  { country: 'AU', rate: 0.10, shippingRate: 15.99 }, // Australian GST
  { country: 'JP', rate: 0.10, shippingRate: 12.99 }, // Japanese consumption tax
];

export async function POST(request: NextRequest) {
  try {
    const { cartItems, shippingAddress }: TaxCalculationRequest = await request.json();

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json(
        { error: 'Cart items array is required' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.country) {
      return NextResponse.json(
        { error: 'Shipping address with country is required' },
        { status: 400 }
      );
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.pricing.totalPrice || 0);
    }, 0);

    // Find applicable tax rate
    const taxRate = findTaxRate(shippingAddress.country, shippingAddress.state);
    
    // Calculate tax
    const taxAmount = Math.round(subtotal * taxRate.rate);
    
    // Calculate shipping
    const shippingEstimate = calculateShipping(subtotal, shippingAddress, taxRate);
    
    // Calculate total
    const total = subtotal + taxAmount + shippingEstimate;

    const estimate = {
      subtotal,
      taxAmount,
      shippingEstimate,
      total,
      taxRate: taxRate.rate,
      regionCode: `${shippingAddress.country}${shippingAddress.state ? `-${shippingAddress.state}` : ''}`,
    };

    return NextResponse.json({
      success: true,
      data: estimate,
    });

  } catch (error) {
    console.error('Tax calculation error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to calculate tax',
        success: false 
      },
      { status: 500 }
    );
  }
}

function findTaxRate(country: string, state?: string): TaxRate {
  // First try to find exact match with state/province
  if (state) {
    const exactMatch = TAX_RATES.find(rate => 
      rate.country === country && rate.state === state
    );
    if (exactMatch) return exactMatch;
  }
  
  // Fall back to country-level rate
  const countryMatch = TAX_RATES.find(rate => 
    rate.country === country && !rate.state
  );
  if (countryMatch) return countryMatch;
  
  // Default fallback (no tax)
  return { country, rate: 0, shippingRate: 19.99 };
}

function calculateShipping(
  subtotal: number, 
  address: TaxCalculationRequest['shippingAddress'], 
  taxRate: TaxRate
): number {
  if (!address) return 0;
  
  // Free shipping thresholds by region
  const freeShippingThresholds: Record<string, number> = {
    'US': 5000, // $50.00
    'CA': 7500, // $75.00 CAD
    'GB': 5000, // £50.00
    'DE': 5000, // €50.00
    'FR': 5000, // €50.00
    'AU': 10000, // $100.00 AUD
    'default': 7500, // $75.00
  };
  
  const threshold = freeShippingThresholds[address.country] || freeShippingThresholds.default;
  
  if (subtotal >= threshold!) {
    return 0; // Free shipping
  }
  
  // Return base shipping rate for the region
  return Math.round((taxRate.shippingRate || 15.99) * 100); // Convert to cents
}

// Alternative endpoint for real-time tax validation
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const country = searchParams.get('country');
  const state = searchParams.get('state');
  
  if (!country) {
    return NextResponse.json(
      { error: 'Country parameter is required' },
      { status: 400 }
    );
  }
  
  const taxRate = findTaxRate(country, state || undefined);
  
  return NextResponse.json({
    success: true,
    data: {
      country,
      state,
      taxRate: taxRate.rate,
      shippingRate: taxRate.shippingRate || 15.99,
      regionCode: `${country}${state ? `-${state}` : ''}`,
    },
  });
}