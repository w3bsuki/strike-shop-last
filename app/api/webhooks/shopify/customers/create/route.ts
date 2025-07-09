import { NextRequest } from 'next/server';
import { 
  verifyShopifyWebhook, 
  webhookResponse, 
  getWebhookTopic, 
  getShopDomain,
  getWebhookId,
  logWebhookEvent 
} from '@/lib/webhooks/shopify-verify';

interface ShopifyCustomer {
  id: number;
  admin_graphql_api_id: string;
  email: string;
  email_marketing_consent: {
    state: string;
    opt_in_level: string;
    consent_updated_at: string | null;
  };
  sms_marketing_consent?: {
    state: string;
    opt_in_level: string;
    consent_updated_at: string | null;
    consent_collected_from: string;
  };
  first_name: string;
  last_name: string;
  orders_count: number;
  state: string;
  total_spent: string;
  verified_email: boolean;
  tax_exempt: boolean;
  tags: string;
  currency: string;
  phone?: string;
  accepts_marketing: boolean;
  accepts_marketing_updated_at: string;
  marketing_opt_in_level?: string;
  created_at: string;
  updated_at: string;
  note?: string;
  default_address?: {
    id: number;
    customer_id: number;
    first_name: string;
    last_name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    zip: string;
    phone?: string;
    province_code?: string;
    country_code: string;
    country_name: string;
    default: boolean;
  };
}

export async function POST(request: NextRequest) {
  const topic = getWebhookTopic(request.headers);
  const shopDomain = getShopDomain(request.headers);
  const webhookId = getWebhookId(request.headers);
  
  if (topic !== 'customers/create') {
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

    // Parse customer data
    const customer: ShopifyCustomer = JSON.parse(rawBody);
    
    // Log the webhook event
    logWebhookEvent('customers/create', shopDomain, webhookId, customer);

    // Process the new customer
    await processNewCustomer(customer);

    return webhookResponse(true, 'Customer created successfully');
  } catch (error) {
    const err = error as Error;
    logWebhookEvent('customers/create', shopDomain, webhookId, null, err);
    return webhookResponse(false, err.message);
  }
}

async function processNewCustomer(customer: ShopifyCustomer) {
  try {
    console.log('Processing new customer:', {
      customerId: customer.id,
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`,
      verifiedEmail: customer.verified_email,
      acceptsMarketing: customer.accepts_marketing,
      currency: customer.currency,
      tags: customer.tags,
    });

    // Check marketing consent
    if (customer.email_marketing_consent) {
      console.log('Email marketing consent:', {
        state: customer.email_marketing_consent.state,
        optInLevel: customer.email_marketing_consent.opt_in_level,
      });
    }

    // Check SMS consent
    if (customer.sms_marketing_consent) {
      console.log('SMS marketing consent:', {
        state: customer.sms_marketing_consent.state,
        optInLevel: customer.sms_marketing_consent.opt_in_level,
      });
    }

    // Check location
    if (customer.default_address) {
      console.log('Customer location:', {
        country: customer.default_address.country_name,
        countryCode: customer.default_address.country_code,
        city: customer.default_address.city,
      });
    }

    // TODO: Implement actual business logic here
    // - Send welcome email
    // - Add to email marketing list (if consented)
    // - Create customer profile in CRM
    // - Assign customer segment/tags
    // - Generate personalized recommendations
    // - Apply new customer discount
    // - Track acquisition source
    // - Set up loyalty program account
    
    // Example: Send welcome email
    if (customer.verified_email && customer.accepts_marketing) {
      console.log('Sending welcome email to:', customer.email);
      // TODO: Implement email sending
    }

    // Example: Apply geo-based personalization
    if (customer.default_address?.country_code) {
      console.log('Setting up regional preferences for:', customer.default_address.country_code);
      // TODO: Set currency, language, shipping options based on location
    }

  } catch (error) {
    console.error('Error processing new customer:', error);
    throw error;
  }
}