/**
 * Shopify Webhook Types
 * Based on Shopify Admin API Webhook Events
 */

import type { 
  ShopifyID, 
  OrderFinancialStatus, 
  OrderFulfillmentStatus,
  MailingAddress,
  MoneyV2,
  Product,
  ProductVariant,
  Customer
} from '../types';

// ============================================
// Webhook Topic Types
// ============================================

export enum ShopifyWebhookTopic {
  // Order Events
  ORDERS_CREATE = 'orders/create',
  ORDERS_UPDATED = 'orders/updated',
  ORDERS_PAID = 'orders/paid',
  ORDERS_CANCELLED = 'orders/cancelled',
  ORDERS_FULFILLED = 'orders/fulfilled',
  ORDERS_PARTIALLY_FULFILLED = 'orders/partially_fulfilled',
  
  // Product Events
  PRODUCTS_CREATE = 'products/create',
  PRODUCTS_UPDATE = 'products/update',
  PRODUCTS_DELETE = 'products/delete',
  
  // Customer Events
  CUSTOMERS_CREATE = 'customers/create',
  CUSTOMERS_UPDATE = 'customers/update',
  CUSTOMERS_DELETE = 'customers/delete',
  CUSTOMERS_ENABLE = 'customers/enable',
  CUSTOMERS_DISABLE = 'customers/disable',
  
  // Inventory Events
  INVENTORY_ITEMS_CREATE = 'inventory_items/create',
  INVENTORY_ITEMS_UPDATE = 'inventory_items/update',
  INVENTORY_ITEMS_DELETE = 'inventory_items/delete',
  INVENTORY_LEVELS_UPDATE = 'inventory_levels/update',
  
  // Collection Events
  COLLECTIONS_CREATE = 'collections/create',
  COLLECTIONS_UPDATE = 'collections/update',
  COLLECTIONS_DELETE = 'collections/delete',
  
  // Fulfillment Events
  FULFILLMENTS_CREATE = 'fulfillments/create',
  FULFILLMENTS_UPDATE = 'fulfillments/update',
  
  // Cart Events
  CARTS_CREATE = 'carts/create',
  CARTS_UPDATE = 'carts/update',
  
  // App Events
  APP_UNINSTALLED = 'app/uninstalled',
  
  // Shop Events
  SHOP_UPDATE = 'shop/update',
}

// ============================================
// Webhook Header Types
// ============================================

export interface ShopifyWebhookHeaders {
  'x-shopify-topic': ShopifyWebhookTopic;
  'x-shopify-hmac-sha256': string;
  'x-shopify-shop-domain': string;
  'x-shopify-api-version': string;
  'x-shopify-webhook-id': string;
  'x-shopify-triggered-at': string;
}

// ============================================
// Base Webhook Payload
// ============================================

export interface BaseWebhookPayload {
  id: number | string;
  admin_graphql_api_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Order Webhook Payloads
// ============================================

export interface OrderLineItem {
  id: number;
  variant_id: number;
  title: string;
  quantity: number;
  price: string;
  sku: string;
  variant_title: string | null;
  vendor: string | null;
  fulfillment_service: string;
  product_id: number;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  name: string;
  variant_inventory_management: string | null;
  properties: Array<{
    name: string;
    value: string;
  }>;
  product_exists: boolean;
  fulfillable_quantity: number;
  grams: number;
  total_discount: string;
  fulfillment_status: string | null;
  price_set: {
    shop_money: MoneyV2;
    presentment_money: MoneyV2;
  };
  total_discount_set: {
    shop_money: MoneyV2;
    presentment_money: MoneyV2;
  };
  discount_allocations: Array<{
    amount: string;
    discount_application_index: number;
    amount_set: {
      shop_money: MoneyV2;
      presentment_money: MoneyV2;
    };
  }>;
  tax_lines: Array<{
    title: string;
    price: string;
    rate: number;
    price_set: {
      shop_money: MoneyV2;
      presentment_money: MoneyV2;
    };
  }>;
}

export interface OrderWebhookPayload extends BaseWebhookPayload {
  email: string;
  closed_at: string | null;
  number: number;
  note: string | null;
  token: string;
  gateway: string;
  test: boolean;
  total_price: string;
  subtotal_price: string;
  total_weight: number;
  total_tax: string;
  taxes_included: boolean;
  currency: string;
  financial_status: OrderFinancialStatus;
  confirmed: boolean;
  total_discounts: string;
  total_line_items_price: string;
  cart_token: string | null;
  buyer_accepts_marketing: boolean;
  name: string;
  referring_site: string | null;
  landing_site: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  total_price_usd: string;
  checkout_token: string | null;
  reference: string | null;
  user_id: number | null;
  location_id: number | null;
  source_identifier: string | null;
  source_url: string | null;
  processed_at: string;
  device_id: number | null;
  phone: string | null;
  customer_locale: string | null;
  app_id: number;
  browser_ip: string | null;
  landing_site_ref: string | null;
  order_number: number;
  discount_applications: any[];
  discount_codes: Array<{
    code: string;
    amount: string;
    type: string;
  }>;
  note_attributes: Array<{
    name: string;
    value: string;
  }>;
  payment_gateway_names: string[];
  processing_method: string;
  checkout_id: number | null;
  source_name: string;
  fulfillment_status: OrderFulfillmentStatus | null;
  tax_lines: Array<{
    title: string;
    price: string;
    rate: number;
  }>;
  tags: string;
  contact_email: string;
  order_status_url: string;
  presentment_currency: string;
  total_line_items_price_set: {
    shop_money: MoneyV2;
    presentment_money: MoneyV2;
  };
  total_discounts_set: {
    shop_money: MoneyV2;
    presentment_money: MoneyV2;
  };
  total_shipping_price_set: {
    shop_money: MoneyV2;
    presentment_money: MoneyV2;
  };
  subtotal_price_set: {
    shop_money: MoneyV2;
    presentment_money: MoneyV2;
  };
  total_price_set: {
    shop_money: MoneyV2;
    presentment_money: MoneyV2;
  };
  total_tax_set: {
    shop_money: MoneyV2;
    presentment_money: MoneyV2;
  };
  line_items: OrderLineItem[];
  fulfillments: any[];
  refunds: any[];
  total_tip_received: string;
  original_total_duties_set: any | null;
  current_total_duties_set: any | null;
  payment_terms: any | null;
  admin_graphql_api_id: string;
  shipping_lines: Array<{
    id: number;
    title: string;
    price: string;
    code: string;
    source: string;
    phone: string | null;
    requested_fulfillment_service_id: any | null;
    delivery_category: any | null;
    carrier_identifier: any | null;
    discounted_price: string;
    price_set: {
      shop_money: MoneyV2;
      presentment_money: MoneyV2;
    };
    discounted_price_set: {
      shop_money: MoneyV2;
      presentment_money: MoneyV2;
    };
    discount_allocations: any[];
    tax_lines: any[];
  }>;
  billing_address: MailingAddress | null;
  shipping_address: MailingAddress | null;
  customer: {
    id: number;
    email: string;
    accepts_marketing: boolean;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    orders_count: number;
    state: string;
    total_spent: string;
    last_order_id: number | null;
    note: string | null;
    verified_email: boolean;
    multipass_identifier: any | null;
    tax_exempt: boolean;
    phone: string | null;
    tags: string;
    last_order_name: string | null;
    currency: string;
    accepts_marketing_updated_at: string;
    marketing_opt_in_level: string | null;
    admin_graphql_api_id: string;
    default_address: MailingAddress | null;
  } | null;
}

// ============================================
// Product Webhook Payloads
// ============================================

export interface ProductWebhookPayload extends BaseWebhookPayload {
  title: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  handle: string;
  published_at: string | null;
  template_suffix: string | null;
  tags: string;
  published_scope: string;
  variants: Array<{
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
    image_id: number | null;
    weight: number;
    weight_unit: string;
    inventory_item_id: number;
    inventory_quantity: number;
    old_inventory_quantity: number;
    requires_shipping: boolean;
    admin_graphql_api_id: string;
  }>;
  options: Array<{
    id: number;
    product_id: number;
    name: string;
    position: number;
    values: string[];
  }>;
  images: Array<{
    id: number;
    product_id: number;
    position: number;
    created_at: string;
    updated_at: string;
    alt: string | null;
    width: number;
    height: number;
    src: string;
    variant_ids: number[];
    admin_graphql_api_id: string;
  }>;
  image: {
    id: number;
    product_id: number;
    position: number;
    created_at: string;
    updated_at: string;
    alt: string | null;
    width: number;
    height: number;
    src: string;
    variant_ids: number[];
    admin_graphql_api_id: string;
  } | null;
}

// ============================================
// Customer Webhook Payloads
// ============================================

export interface CustomerWebhookPayload extends BaseWebhookPayload {
  email: string;
  accepts_marketing: boolean;
  created_at: string;
  updated_at: string;
  first_name: string | null;
  last_name: string | null;
  orders_count: number;
  state: string;
  total_spent: string;
  last_order_id: number | null;
  note: string | null;
  verified_email: boolean;
  multipass_identifier: any | null;
  tax_exempt: boolean;
  phone: string | null;
  tags: string;
  last_order_name: string | null;
  currency: string;
  addresses: MailingAddress[];
  accepts_marketing_updated_at: string;
  marketing_opt_in_level: string | null;
  admin_graphql_api_id: string;
  default_address: MailingAddress | null;
}

// ============================================
// Inventory Webhook Payloads
// ============================================

export interface InventoryItemWebhookPayload extends BaseWebhookPayload {
  sku: string;
  tracked: boolean;
  requires_shipping: boolean;
  cost: string | null;
  country_code_of_origin: string | null;
  province_code_of_origin: string | null;
  harmonized_system_code: string | null;
  country_harmonized_system_codes: any[];
}

export interface InventoryLevelWebhookPayload {
  inventory_item_id: number;
  location_id: number;
  available: number | null;
  updated_at: string;
}

// ============================================
// Collection Webhook Payloads
// ============================================

export interface CollectionWebhookPayload extends BaseWebhookPayload {
  handle: string;
  title: string;
  body_html: string | null;
  published_at: string;
  sort_order: string;
  template_suffix: string | null;
  disjunctive: boolean;
  rules: Array<{
    column: string;
    relation: string;
    condition: string;
  }>;
  published_scope: string;
  image: {
    created_at: string;
    alt: string | null;
    width: number;
    height: number;
    src: string;
  } | null;
}

// ============================================
// Fulfillment Webhook Payloads
// ============================================

export interface FulfillmentWebhookPayload extends BaseWebhookPayload {
  order_id: number;
  status: string;
  location_id: number;
  shipment_status: string | null;
  tracking_company: string | null;
  tracking_number: string | null;
  tracking_numbers: string[];
  tracking_url: string | null;
  tracking_urls: string[];
  receipt: any;
  name: string;
  line_items: Array<{
    id: number;
    variant_id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string;
    variant_title: string | null;
    vendor: string | null;
    fulfillment_service: string;
    product_id: number;
    requires_shipping: boolean;
    taxable: boolean;
    gift_card: boolean;
    name: string;
    variant_inventory_management: string | null;
    properties: any[];
    product_exists: boolean;
    fulfillable_quantity: number;
    grams: number;
    total_discount: string;
    fulfillment_status: string;
    price_set: {
      shop_money: MoneyV2;
      presentment_money: MoneyV2;
    };
    total_discount_set: {
      shop_money: MoneyV2;
      presentment_money: MoneyV2;
    };
    discount_allocations: any[];
    tax_lines: any[];
  }>;
}

// ============================================
// Cart Webhook Payloads
// ============================================

export interface CartWebhookPayload extends BaseWebhookPayload {
  token: string;
  note: string | null;
  attributes: any;
  original_total_price: number;
  total_price: number;
  total_discount: number;
  total_weight: number;
  item_count: number;
  items: Array<{
    id: number;
    properties: any;
    quantity: number;
    variant_id: number;
    key: string;
    title: string;
    price: number;
    original_price: number;
    discounted_price: number;
    line_price: number;
    original_line_price: number;
    total_discount: number;
    discounts: any[];
    sku: string;
    grams: number;
    vendor: string;
    taxable: boolean;
    product_id: number;
    product_has_only_default_variant: boolean;
    gift_card: boolean;
    final_price: number;
    final_line_price: number;
    url: string;
    featured_image: {
      aspect_ratio: number;
      alt: string;
      height: number;
      url: string;
      width: number;
    };
    image: string;
    handle: string;
    requires_shipping: boolean;
    product_type: string;
    product_title: string;
    product_description: string;
    variant_title: string;
    variant_options: string[];
    options_with_values: Array<{
      name: string;
      value: string;
    }>;
    line_level_discount_allocations: any[];
    line_level_total_discount: number;
  }>;
  requires_shipping: boolean;
  currency: string;
  items_subtotal_price: number;
  cart_level_discount_applications: any[];
}

// ============================================
// Shop Webhook Payloads
// ============================================

export interface ShopWebhookPayload extends BaseWebhookPayload {
  name: string;
  email: string;
  domain: string;
  province: string;
  country: string;
  address1: string;
  zip: string;
  city: string;
  source: any;
  phone: string;
  latitude: number;
  longitude: number;
  primary_locale: string;
  address2: string | null;
  created_at: string;
  updated_at: string;
  country_code: string;
  country_name: string;
  currency: string;
  customer_email: string;
  timezone: string;
  iana_timezone: string;
  shop_owner: string;
  money_format: string;
  money_with_currency_format: string;
  weight_unit: string;
  province_code: string;
  taxes_included: boolean;
  tax_shipping: boolean;
  county_taxes: boolean;
  plan_display_name: string;
  plan_name: string;
  has_discounts: boolean;
  has_gift_cards: boolean;
  myshopify_domain: string;
  google_apps_domain: any;
  google_apps_login_enabled: any;
  money_in_emails_format: string;
  money_with_currency_in_emails_format: string;
  eligible_for_payments: boolean;
  requires_extra_payments_agreement: boolean;
  password_enabled: boolean;
  has_storefront: boolean;
  eligible_for_card_reader_giveaway: boolean;
  finances: boolean;
  primary_location_id: number;
  cookie_consent_level: string;
  checkout_api_supported: boolean;
  multi_location_enabled: boolean;
  setup_required: boolean;
  pre_launch_enabled: boolean;
  enabled_presentment_currencies: string[];
}

// ============================================
// App Webhook Payloads
// ============================================

export interface AppUninstalledWebhookPayload {
  id: number;
  name: string;
  email: string;
  domain: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Webhook Payload Union Type
// ============================================

export type WebhookPayload = 
  | OrderWebhookPayload
  | ProductWebhookPayload
  | CustomerWebhookPayload
  | InventoryItemWebhookPayload
  | InventoryLevelWebhookPayload
  | CollectionWebhookPayload
  | FulfillmentWebhookPayload
  | CartWebhookPayload
  | ShopWebhookPayload
  | AppUninstalledWebhookPayload;

// ============================================
// Webhook Verification Types
// ============================================

export interface WebhookVerificationResult {
  verified: boolean;
  topic?: ShopifyWebhookTopic;
  domain?: string;
  error?: string;
}

export interface WebhookHandlerResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

// ============================================
// Webhook Handler Function Type
// ============================================

export type WebhookHandler<T = WebhookPayload> = (
  payload: T,
  headers: ShopifyWebhookHeaders
) => Promise<WebhookHandlerResult>;

// ============================================
// Webhook Registration Types
// ============================================

export interface WebhookSubscription {
  id: ShopifyID;
  address: string;
  topic: ShopifyWebhookTopic;
  created_at: string;
  updated_at: string;
  format: 'json' | 'xml';
  fields: string[];
  metafield_namespaces: string[];
  api_version: string;
  private_metafield_namespaces: string[];
}

export interface WebhookRegistrationInput {
  topic: ShopifyWebhookTopic;
  address: string;
  format?: 'json' | 'xml';
  fields?: string[];
  metafield_namespaces?: string[];
  private_metafield_namespaces?: string[];
}

// ============================================
// Error Types
// ============================================

export class WebhookVerificationError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_SIGNATURE' | 'MISSING_HEADER' | 'INVALID_PAYLOAD' | 'EXPIRED_WEBHOOK'
  ) {
    super(message);
    this.name = 'WebhookVerificationError';
  }
}

export class WebhookHandlerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'WebhookHandlerError';
  }
}