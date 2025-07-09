/**
 * Common Shopify webhook types
 */

export interface ShopifyWebhookHeaders {
  'x-shopify-topic': string;
  'x-shopify-hmac-sha256': string;
  'x-shopify-shop-domain': string;
  'x-shopify-webhook-id': string;
  'x-shopify-api-version': string;
}

export interface ShopifyAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  province_code?: string;
  country: string;
  country_code: string;
  zip: string;
  phone?: string;
  company?: string;
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  tags?: string;
  currency?: string;
  accepts_marketing?: boolean;
  verified_email?: boolean;
  tax_exempt?: boolean;
  orders_count?: number;
  total_spent?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShopifyLineItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  variant_title?: string;
  quantity: number;
  price: string;
  sku?: string;
  vendor?: string;
  fulfillment_status?: string | null;
  properties?: Array<{
    name: string;
    value: string;
  }>;
}

export interface ShopifyDiscountCode {
  code: string;
  amount: string;
  type: string;
}

export interface ShopifyTaxLine {
  price: string;
  rate: number;
  title: string;
}

export interface ShopifyShippingLine {
  code: string;
  price: string;
  source: string;
  title: string;
  discounted_price?: string;
}

export interface ShopifyFulfillment {
  id: number;
  status: string;
  created_at: string;
  tracking_company?: string;
  tracking_number?: string;
  tracking_url?: string;
  line_items?: ShopifyLineItem[];
}

export interface ShopifyRefund {
  id: number;
  created_at: string;
  note?: string;
  refund_line_items: Array<{
    quantity: number;
    line_item_id: number;
    subtotal: string;
  }>;
  transactions?: Array<{
    id: number;
    amount: string;
    currency: string;
    gateway: string;
    status: string;
  }>;
}

export interface ShopifyProductVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string | null;
  fulfillment_service: string;
  inventory_management: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string | null;
  grams: number;
  weight: number;
  weight_unit: string;
  inventory_quantity: number;
  requires_shipping: boolean;
}

export interface ShopifyProductOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyProductImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
}

export interface ShopifyMarketingConsent {
  state: string;
  opt_in_level: string;
  consent_updated_at: string | null;
}

export interface ShopifySmsMarketingConsent extends ShopifyMarketingConsent {
  consent_collected_from: string;
}

/**
 * Webhook event types
 */
export type WebhookTopic = 
  | 'orders/create'
  | 'orders/updated'
  | 'orders/cancelled'
  | 'orders/fulfilled'
  | 'orders/paid'
  | 'orders/partially_fulfilled'
  | 'products/create'
  | 'products/update'
  | 'products/delete'
  | 'inventory_levels/update'
  | 'customers/create'
  | 'customers/update'
  | 'customers/delete'
  | 'checkouts/create'
  | 'checkouts/update'
  | 'checkouts/delete'
  | 'collections/create'
  | 'collections/update'
  | 'collections/delete';

/**
 * Financial status types
 */
export type FinancialStatus = 
  | 'pending'
  | 'authorized'
  | 'partially_paid'
  | 'paid'
  | 'partially_refunded'
  | 'refunded'
  | 'voided';

/**
 * Fulfillment status types
 */
export type FulfillmentStatus = 
  | 'fulfilled'
  | 'partial'
  | 'unfulfilled'
  | 'restocked';

/**
 * Order cancel reasons
 */
export type CancelReason = 
  | 'customer'
  | 'fraud'
  | 'inventory'
  | 'declined'
  | 'other';

/**
 * Product status
 */
export type ProductStatus = 
  | 'active'
  | 'archived'
  | 'draft';