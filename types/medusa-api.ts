/**
 * Comprehensive Medusa API type definitions
 * Based on Medusa v2.8.4 API responses
 */

// Base types
export interface Money {
  amount: number;
  currency_code: string;
}

export interface Address {
  id: string;
  address_1: string;
  address_2?: string;
  city: string;
  country_code: string;
  postal_code: string;
  province?: string;
  phone?: string;
  company?: string;
  first_name?: string;
  last_name?: string;
  metadata?: Record<string, unknown>;
}

// Product types
export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  sku?: string;
  barcode?: string;
  ean?: string;
  upc?: string;
  inventory_quantity: number;
  allow_backorder: boolean;
  manage_inventory: boolean;
  hs_code?: string;
  origin_country?: string;
  mid_code?: string;
  material?: string;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  options: ProductOption[];
  prices: ProductVariantPrice[];
  metadata?: Record<string, unknown>;
}

export interface ProductOption {
  id: string;
  product_id: string;
  title: string;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string;
  variant_id: string;
}

export interface ProductVariantPrice {
  id: string;
  variant_id: string;
  currency_code: string;
  amount: number;
  min_quantity?: number;
  max_quantity?: number;
  price_list_id?: string;
  region_id?: string;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  is_giftcard: boolean;
  status: 'draft' | 'proposed' | 'published' | 'rejected';
  images: ProductImage[];
  thumbnail?: string;
  options: ProductOption[];
  variants: ProductVariant[];
  categories?: ProductCategory[];
  type?: ProductType;
  tags?: ProductTag[];
  collection?: ProductCollection;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  hs_code?: string;
  origin_country?: string;
  mid_code?: string;
  material?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  url: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  parent_category_id?: string;
  category_children?: ProductCategory[];
  rank?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductType {
  id: string;
  value: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductTag {
  id: string;
  value: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductCollection {
  id: string;
  title: string;
  handle: string;
  metadata?: Record<string, unknown>;
}

// Cart types
export interface Cart {
  id: string;
  email?: string;
  billing_address_id?: string;
  billing_address?: Address;
  shipping_address_id?: string;
  shipping_address?: Address;
  items: LineItem[];
  region: Region;
  discounts: Discount[];
  gift_cards: GiftCard[];
  customer_id?: string;
  customer?: Customer;
  payment_session?: PaymentSession;
  payment_sessions?: PaymentSession[];
  payment_id?: string;
  shipping_methods: ShippingMethod[];
  type: 'default' | 'swap' | 'draft_order' | 'payment_link' | 'claim';
  completed_at?: string;
  payment_authorized_at?: string;
  idempotency_key?: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  sales_channel_id?: string;
  shipping_total?: Money;
  discount_total?: Money;
  raw_discount_total?: Money;
  tax_total?: Money;
  gift_card_total?: Money;
  subtotal?: Money;
  total?: Money;
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  id: string;
  cart_id?: string;
  order_id?: string;
  swap_id?: string;
  claim_order_id?: string;
  title: string;
  description?: string;
  thumbnail?: string;
  is_return: boolean;
  is_giftcard: boolean;
  should_merge: boolean;
  allow_discounts: boolean;
  has_shipping: boolean;
  unit_price: Money;
  variant_id?: string;
  variant?: ProductVariant;
  product_id?: string;
  product?: Product;
  quantity: number;
  fulfilled_quantity?: number;
  returned_quantity?: number;
  shipped_quantity?: number;
  adjustments?: LineItemAdjustment[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  original_total?: Money;
  original_tax_total?: Money;
  discount_total?: Money;
  raw_discount_total?: Money;
  gift_card_total?: Money;
  includes_tax?: boolean;
  subtotal?: Money;
  tax_total?: Money;
  total?: Money;
  tax_lines?: TaxLine[];
}

export interface LineItemAdjustment {
  id: string;
  item_id: string;
  description: string;
  discount_id?: string;
  amount: Money;
  metadata?: Record<string, unknown>;
}

export interface TaxLine {
  id: string;
  code?: string;
  name: string;
  rate: number;
  shipping_method_id?: string;
}

// Region types
export interface Region {
  id: string;
  name: string;
  currency_code: string;
  tax_rate: number;
  tax_code?: string;
  gift_cards_taxable: boolean;
  automatic_taxes: boolean;
  countries: Country[];
  tax_provider_id?: string;
  payment_providers: PaymentProvider[];
  fulfillment_providers: FulfillmentProvider[];
  includes_tax?: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Country {
  id: string;
  iso_2: string;
  iso_3: string;
  num_code: string;
  name: string;
  display_name: string;
  region_id?: string;
}

// Payment types
export interface PaymentSession {
  id: string;
  cart_id?: string;
  provider_id: string;
  is_selected?: boolean;
  is_initiated: boolean;
  status: 'authorized' | 'pending' | 'requires_more' | 'error' | 'canceled';
  data?: Record<string, unknown>;
  idempotency_key?: string;
  amount?: Money;
  payment_authorized_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentProvider {
  id: string;
  is_installed: boolean;
}

// Shipping types
export interface ShippingMethod {
  id: string;
  shipping_option_id: string;
  order_id?: string;
  claim_order_id?: string;
  cart_id?: string;
  swap_id?: string;
  return_id?: string;
  price: Money;
  data?: Record<string, unknown>;
  includes_tax?: boolean;
  shipping_option?: ShippingOption;
  tax_lines?: TaxLine[];
  subtotal?: Money;
  total?: Money;
  tax_total?: Money;
}

export interface ShippingOption {
  id: string;
  name: string;
  region_id: string;
  profile_id: string;
  provider_id: string;
  price_type: 'flat_rate' | 'calculated';
  amount?: Money;
  is_return: boolean;
  admin_only: boolean;
  requirements?: ShippingOptionRequirement[];
  data?: Record<string, unknown>;
  includes_tax?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ShippingOptionRequirement {
  id: string;
  shipping_option_id: string;
  type: 'min_subtotal' | 'max_subtotal';
  amount: Money;
}

export interface FulfillmentProvider {
  id: string;
  is_installed: boolean;
}

// Customer types
export interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  billing_address_id?: string;
  billing_address?: Address;
  shipping_addresses?: Address[];
  phone?: string;
  has_account: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Discount types
export interface Discount {
  id: string;
  code: string;
  is_dynamic: boolean;
  rule_id: string;
  rule?: DiscountRule;
  is_disabled: boolean;
  parent_discount_id?: string;
  starts_at: string;
  ends_at?: string;
  valid_duration?: string;
  usage_limit?: number;
  usage_count: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DiscountRule {
  id: string;
  description?: string;
  type: 'fixed' | 'percentage' | 'free_shipping';
  value: number;
  allocation?: 'total' | 'item';
  metadata?: Record<string, unknown>;
}

// Gift card types
export interface GiftCard {
  id: string;
  code: string;
  value: Money;
  balance: Money;
  region_id: string;
  is_disabled: boolean;
  ends_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// API Response types
export interface MedusaResponse<T> {
  data: T;
}

export interface MedusaListResponse<T> {
  data: T[];
  count: number;
  offset: number;
  limit: number;
}

export interface MedusaError {
  code: string;
  type: string;
  message: string;
}

// Create/Update types
export interface CreateCartRequest {
  region_id?: string;
  sales_channel_id?: string;
  country_code?: string;
  items?: Array<{
    variant_id: string;
    quantity: number;
  }>;
  context?: Record<string, unknown>;
}

export interface UpdateCartRequest {
  region_id?: string;
  country_code?: string;
  email?: string;
  billing_address?: Partial<Address>;
  shipping_address?: Partial<Address>;
  discounts?: Array<{ code: string }>;
  customer_id?: string;
}

export interface AddLineItemRequest {
  variant_id: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateLineItemRequest {
  quantity: number;
}

export interface CreateCustomerRequest {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

// Utility types
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
