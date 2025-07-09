import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createShopifyCustomer } from '@/lib/auth/customer-sync';

/**
 * Create a Shopify customer account after Supabase registration
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign up first' },
        { status: 401 }
      );
    }

    const { password, firstName, lastName } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }

    // Create Shopify customer
    const result = await createShopifyCustomer(
      user,
      password,
      firstName,
      lastName
    );
    
    if (!result.success) {
      // Check if it's because customer already exists
      if (result.error?.includes('already exists')) {
        return NextResponse.json({
          success: true,
          message: 'Customer already exists in Shopify',
          customerId: user.user_metadata?.shopify_customer_id,
        });
      }
      
      return NextResponse.json(
        { error: result.error || 'Failed to create Shopify customer' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      customerId: result.shopifyCustomerId,
      message: 'Shopify customer created successfully',
    });
  } catch (error) {
    console.error('Shopify registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}