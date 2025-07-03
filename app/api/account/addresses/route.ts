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
        addresses: [],
        message: 'Shopify authentication required',
      });
    }

    const customerService = createCustomerService(shopifyClient);
    
    // Get customer details including addresses
    const customer = await customerService.getCustomer(shopifyToken);
    
    if (!customer) {
      return NextResponse.json({
        addresses: [],
        message: 'Customer not found',
      });
    }

    // Extract addresses
    const addresses = customer.addresses.edges.map(({ node }) => node);

    return NextResponse.json({
      addresses,
      defaultAddress: customer.defaultAddress,
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const shopifyToken = request.headers.get('X-Shopify-Token');
    
    if (!shopifyToken || !shopifyClient) {
      return NextResponse.json(
        { error: 'Shopify authentication required' },
        { status: 401 }
      );
    }

    const address = await request.json();
    const customerService = createCustomerService(shopifyClient);
    
    // Create new address
    const result = await customerService.createAddress(shopifyToken, address);
    
    if (result.customerUserErrors.length > 0) {
      return NextResponse.json(
        { error: result.customerUserErrors[0]?.message || 'Unknown error' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      address: result.customerAddress,
    });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}