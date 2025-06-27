import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, first_name, last_name } = body;

    // Create customer in Medusa
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    if (!backendUrl) {
      console.warn('Medusa backend URL not configured');
      return NextResponse.json({ success: true, customer: null });
    }

    try {
      const response = await fetch(`${backendUrl}/store/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
        body: JSON.stringify({
          email,
          first_name,
          last_name,
          metadata: {
            supabase_user_id: user.id,
          },
        }),
      });

      if (!response.ok) {
        // Check if customer already exists
        if (response.status === 422 || response.status === 409) {
          console.log('Customer already exists in Medusa');
          return NextResponse.json({ success: true, customer: { email } });
        }
        throw new Error(`Failed to create customer: ${response.status}`);
      }

      const { customer } = await response.json();

      // Update user metadata with Medusa customer ID
      await supabase.auth.updateUser({
        data: { medusa_customer_id: customer.id }
      });

      return NextResponse.json({ success: true, customer });
    } catch (error) {
      console.error('Medusa customer creation error:', error);
      // Don't fail the whole auth flow if Medusa is down
      return NextResponse.json({ success: true, customer: null });
    }
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}