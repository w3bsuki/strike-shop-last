import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Supabase Auth Webhook Handler
 * Syncs Supabase users with Shopify customers
 */

// Webhook events we're interested in
type AuthEvent = 
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'session.created';

interface WebhookPayload {
  type: AuthEvent;
  table: string;
  record: any;
  schema: string;
  old_record?: any;
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-webhook-signature');
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!signature || !webhookSecret) {
        return NextResponse.json(
          { error: 'Missing signature or secret' },
          { status: 401 }
        );
      }

      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload: WebhookPayload = JSON.parse(body);

    switch (payload.type) {
      case 'user.created':
        await handleUserCreated(payload.record);
        break;
      
      case 'user.updated':
        await handleUserUpdated(payload.record, payload.old_record);
        break;
      
      case 'user.deleted':
        await handleUserDeleted(payload.record);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${payload.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUserCreated(user: any) {
  console.log('Handling user created:', user.email);
  
  // Note: We can't create Shopify customer here because we don't have the password
  // This will be handled during the sign-up flow instead
  
  // We can prepare user metadata
  if (user.email) {
    // Any initial setup can go here
    console.log(`User ${user.email} created, Shopify sync will happen on first login`);
  }
}

async function handleUserUpdated(newUser: any, oldUser: any) {
  console.log('Handling user updated:', newUser.email);
  
  // Check if email changed
  if (newUser.email !== oldUser.email && newUser.raw_user_meta_data?.shopify_customer_id) {
    // TODO: Update email in Shopify
    console.log('Email changed, need to update Shopify customer');
  }
  
  // Check if profile data changed
  if (
    newUser.raw_user_meta_data?.first_name !== oldUser.raw_user_meta_data?.first_name ||
    newUser.raw_user_meta_data?.last_name !== oldUser.raw_user_meta_data?.last_name
  ) {
    // TODO: Update profile in Shopify
    console.log('Profile data changed, need to update Shopify customer');
  }
}

async function handleUserDeleted(user: any) {
  console.log('Handling user deleted:', user.email);
  
  // Note: We typically don't delete customers from Shopify
  // as they may have order history that needs to be preserved
  // Instead, we might want to anonymize the data
  
  if (user.raw_user_meta_data?.shopify_customer_id) {
    console.log(`User ${user.email} deleted, Shopify customer ${user.raw_user_meta_data.shopify_customer_id} will be retained for order history`);
  }
}