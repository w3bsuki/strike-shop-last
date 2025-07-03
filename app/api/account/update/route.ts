import { NextResponse } from 'next/server';
import { getCurrentUser, createServerSupabaseClient } from '@/lib/auth/server';
import { shopifyClient, createCustomerService } from '@/lib/shopify';
import { getShopifyAccessToken } from '@/lib/auth/customer-sync';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Shopify access token from user metadata
    const accessToken = await getShopifyAccessToken(user);
    
    if (!accessToken || !shopifyClient) {
      return NextResponse.json(
        { error: 'Shopify authentication required' },
        { status: 401 }
      );
    }

    const { firstName, lastName, phone, acceptsMarketing } = await request.json();
    const customerService = createCustomerService(shopifyClient);
    
    // Update customer profile
    const result = await customerService.updateCustomer(accessToken, {
      firstName,
      lastName,
      phone,
      acceptsMarketing,
    });
    
    if (result.customerUserErrors.length > 0) {
      return NextResponse.json(
        { error: result.customerUserErrors[0]?.message || 'Unknown error' },
        { status: 400 }
      );
    }

    // Update Supabase user metadata to keep in sync
    if (result.customer) {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          first_name: result.customer.firstName || user.user_metadata?.first_name,
          last_name: result.customer.lastName || user.user_metadata?.last_name,
          phone: result.customer.phone || user.user_metadata?.phone,
        },
      });
    }

    return NextResponse.json({
      success: true,
      customer: result.customer,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// Support both PUT and POST for flexibility
export async function POST(request: Request) {
  return PUT(request);
}