import { NextRequest } from 'next/server';
import { 
  verifyShopifyWebhook, 
  webhookResponse, 
  getWebhookTopic, 
  getShopDomain,
  getWebhookId,
  logWebhookEvent 
} from '@/lib/webhooks/shopify-verify';

interface ShopifyCheckout {
  id: number;
  token: string;
  cart_token: string;
  email?: string;
  gateway?: string;
  buyer_accepts_marketing: boolean;
  created_at: string;
  updated_at: string;
  landing_site?: string;
  note?: string;
  referring_site?: string;
  shipping_lines: Array<{
    code: string;
    price: string;
    source: string;
    title: string;
  }>;
  taxes_included: boolean;
  total_weight: number;
  currency: string;
  completed_at?: string;
  closed_at?: string;
  user_id?: number;
  source?: string;
  source_identifier?: string;
  source_name?: string;
  source_url?: string;
  device_id?: string;
  phone?: string;
  customer_locale?: string;
  line_items: Array<{
    id: number;
    variant_id: number;
    product_id: number;
    title: string;
    variant_title: string;
    quantity: number;
    price: string;
    sku: string;
    vendor: string;
    properties: Array<{
      name: string;
      value: string;
    }>;
  }>;
  abandoned_checkout_url: string;
  discount_codes: Array<{
    code: string;
    amount: string;
    type: string;
  }>;
  tax_lines: Array<{
    price: string;
    rate: number;
    title: string;
  }>;
  billing_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    zip: string;
    phone?: string;
  };
  shipping_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    zip: string;
    phone?: string;
  };
  customer?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  subtotal_price: string;
  total_discounts: string;
  total_line_items_price: string;
  total_price: string;
  total_tax: string;
}

export async function POST(request: NextRequest) {
  const topic = getWebhookTopic(request.headers);
  const shopDomain = getShopDomain(request.headers);
  const webhookId = getWebhookId(request.headers);
  
  if (topic !== 'checkouts/create') {
    return webhookResponse(false, 'Invalid webhook topic');
  }

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256');

    if (!signature) {
      return webhookResponse(false, 'Missing signature');
    }

    // Verify webhook
    const isValid = verifyShopifyWebhook(rawBody, signature);
    if (!isValid) {
      return webhookResponse(false, 'Invalid signature');
    }

    // Parse checkout data
    const checkout: ShopifyCheckout = JSON.parse(rawBody);
    
    // Log the webhook event
    logWebhookEvent('checkouts/create', shopDomain, webhookId, checkout);

    // Process the new checkout
    await processNewCheckout(checkout);

    return webhookResponse(true, 'Checkout created successfully');
  } catch (error) {
    const err = error as Error;
    logWebhookEvent('checkouts/create', shopDomain, webhookId, null, err);
    return webhookResponse(false, err.message);
  }
}

async function processNewCheckout(checkout: ShopifyCheckout) {
  try {
    console.log('Processing new checkout:', {
      checkoutId: checkout.id,
      token: checkout.token,
      email: checkout.email,
      totalPrice: checkout.total_price,
      currency: checkout.currency,
      itemCount: checkout.line_items.length,
      createdAt: checkout.created_at,
    });

    // Analyze checkout details
    const checkoutAnalytics = {
      hasEmail: !!checkout.email,
      hasCustomer: !!checkout.customer,
      itemCount: checkout.line_items.length,
      totalValue: parseFloat(checkout.total_price),
      hasDiscounts: checkout.discount_codes.length > 0,
      discountTotal: parseFloat(checkout.total_discounts),
      source: checkout.source_name || 'direct',
      device: checkout.device_id ? 'mobile' : 'desktop',
      locale: checkout.customer_locale,
    };

    console.log('Checkout analytics:', checkoutAnalytics);

    // Process line items
    if (checkout.line_items) {
      for (const item of checkout.line_items) {
        console.log('Checkout item:', {
          productId: item.product_id,
          variantId: item.variant_id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        });
      }
    }

    // Check for abandoned checkout risk factors
    const riskFactors = [];
    if (!checkout.email) riskFactors.push('no_email');
    if (checkoutAnalytics.totalValue > 500) riskFactors.push('high_value');
    if (checkoutAnalytics.itemCount > 5) riskFactors.push('many_items');
    
    if (riskFactors.length > 0) {
      console.log('Checkout risk factors:', riskFactors);
    }

    // TODO: Implement actual business logic here
    // - Track checkout analytics
    // - Set up abandoned cart recovery
    // - Reserve inventory
    // - Calculate shipping rates
    // - Apply dynamic pricing
    // - Send checkout started notification
    // - Track conversion funnel
    // - Implement fraud detection
    
    // Example: Set up abandoned cart recovery
    if (checkout.email) {
      console.log('Setting up abandoned cart recovery for:', checkout.email);
      // TODO: Schedule abandoned cart emails
      // - 1 hour after abandonment
      // - 24 hours after abandonment
      // - 72 hours after abandonment
    }

  } catch (error) {
    console.error('Error processing new checkout:', error);
    throw error;
  }
}