import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/server';
import { loginShopifyCustomer, storeShopifyAccessToken } from '@/lib/auth/customer-sync';

/**
 * Login to Shopify using the same credentials as Supabase
 * This creates a Shopify customer access token for API calls
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }

    // Attempt to login to Shopify
    const result = await loginShopifyCustomer(user.email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Login failed' },
        { status: 400 }
      );
    }

    if (result.shopifyAccessToken) {
      // Store the access token securely
      await storeShopifyAccessToken(user.id, result.shopifyAccessToken);
      
      // Also set a secure httpOnly cookie for API access
      const cookieStore = await cookies();
      cookieStore.set('shopify-customer-token', result.shopifyAccessToken.accessToken, {
        expires: new Date(result.shopifyAccessToken.expiresAt),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    return NextResponse.json({
      success: true,
      customerId: result.shopifyCustomerId,
      message: 'Successfully connected to Shopify',
    });
  } catch (error) {
    console.error('Shopify login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}