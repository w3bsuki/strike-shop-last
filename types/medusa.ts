/**
 * Medusa API Type Definitions
 * Comprehensive types for Medusa commerce platform
 */

export interface MedusaImage {
  id: string;
  url: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaPrice {
  id: string;
  currency_code: string;
  amount: number;
  min_quantity?: number | null;
  max_quantity?: number | null;
  price_list_id?: string | null;
  region_id?: string | null;
  price_list?: MedusaPriceList | null;
  variant_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MedusaPriceList {
  id: string;
  name: string;
  description: string;
  type: 'sale' | 'override';
  status: 'active' | 'draft';
  starts_at: string | null;
  ends_at: string | null;
  customer_groups: MedusaCustomerGroup[];
  prices: MedusaPrice[];
  includes_tax: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MedusaCustomerGroup {
  id: string;
  name: string;
  customers: MedusaCustomer[];
  price_lists: MedusaPriceList[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaProductVariant {
  id: string;
  title: string;
  product_id: string;
  product?: MedusaProduct;
  prices: MedusaPrice[];
  sku: string | null;
  barcode: string | null;
  ean: string | null;
  upc: string | null;
  variant_rank: number | null;
  inventory_quantity: number;
  allow_backorder: boolean;
  manage_inventory: boolean;
  hs_code: string | null;
  origin_country: string | null;
  mid_code: string | null;
  material: string | null;
  weight: number | null;
  length: number | null;
  height: number | null;
  width: number | null;
  options: MedusaProductOptionValue[];
  inventory_items?: MedusaInventoryItem[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
  original_price?: number;
  calculated_price?: number;
}

export interface MedusaProductOption {
  id: string;
  title: string;
  product_id: string;
  product?: MedusaProduct;
  values: MedusaProductOptionValue[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaProductOptionValue {
  id: string;
  value: string;
  option_id: string;
  option?: MedusaProductOption;
  variant_id: string;
  variant?: MedusaProductVariant;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaProduct {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  handle: string | null;
  is_giftcard: boolean;
  status: 'draft' | 'proposed' | 'published' | 'rejected';
  images: MedusaImage[];
  thumbnail: string | null;
  options: MedusaProductOption[];
  variants: MedusaProductVariant[];
  categories: MedusaProductCategory[];
  profile_id: string;
  profile?: MedusaShippingProfile;
  weight: number | null;
  length: number | null;
  height: number | null;
  width: number | null;
  hs_code: string | null;
  origin_country: string | null;
  mid_code: string | null;
  material: string | null;
  collection_id: string | null;
  collection?: MedusaProductCollection;
  type_id: string | null;
  type?: MedusaProductType;
  tags: MedusaProductTag[];
  discountable: boolean;
  external_id: string | null;
  sales_channels?: MedusaSalesChannel[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaProductCategory {
  id: string;
  name: string;
  description: string;
  handle: string;
  mpath: string;
  is_active: boolean;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  parent_category_id: string | null;
  parent_category?: MedusaProductCategory | null;
  category_children: MedusaProductCategory[];
  rank: number;
  products?: MedusaProduct[];
  metadata: Record<string, unknown> | null;
}

export interface MedusaProductCollection {
  id: string;
  title: string;
  handle: string | null;
  products?: MedusaProduct[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaProductType {
  id: string;
  value: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaProductTag {
  id: string;
  value: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaShippingProfile {
  id: string;
  name: string;
  type: 'default' | 'gift_card' | 'custom';
  products?: MedusaProduct[];
  shipping_options: MedusaShippingOption[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaShippingOption {
  id: string;
  name: string;
  region_id: string;
  region?: MedusaRegion;
  profile_id: string;
  profile?: MedusaShippingProfile;
  provider_id: string;
  provider?: MedusaFulfillmentProvider;
  price_type: 'flat_rate' | 'calculated';
  amount: number | null;
  is_return: boolean;
  admin_only: boolean;
  requirements: MedusaShippingOptionRequirement[];
  data: Record<string, unknown>;
  includes_tax: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaShippingOptionRequirement {
  id: string;
  shipping_option_id: string;
  shipping_option?: MedusaShippingOption;
  type: 'min_subtotal' | 'max_subtotal';
  amount: number;
  deleted_at: string | null;
}

export interface MedusaFulfillmentProvider {
  id: string;
  is_installed: boolean;
}

export interface MedusaSalesChannel {
  id: string;
  name: string;
  description: string | null;
  is_disabled: boolean;
  locations?: MedusaStockLocation[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaStockLocation {
  id: string;
  name: string;
  address_id: string;
  address?: MedusaAddress;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaInventoryItem {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sku: string | null;
  origin_country: string | null;
  hs_code: string | null;
  requires_shipping: boolean;
  mid_code: string | null;
  material: string | null;
  weight: number | null;
  length: number | null;
  height: number | null;
  width: number | null;
  metadata: Record<string, unknown> | null;
}

// Cart Types
export interface MedusaCart {
  id: string;
  email: string | null;
  billing_address_id: string | null;
  billing_address: MedusaAddress | null;
  shipping_address_id: string | null;
  shipping_address: MedusaAddress | null;
  items: MedusaLineItem[];
  region_id: string;
  region: MedusaRegion;
  discounts: MedusaDiscount[];
  gift_cards: MedusaGiftCard[];
  customer_id: string | null;
  customer?: MedusaCustomer;
  payment_session?: MedusaPaymentSession | null;
  payment_sessions?: MedusaPaymentSession[];
  payment_id: string | null;
  payment?: MedusaPayment;
  shipping_methods: MedusaShippingMethod[];
  type: 'default' | 'swap' | 'draft_order' | 'payment_link' | 'claim';
  completed_at: string | null;
  payment_authorized_at: string | null;
  idempotency_key: string | null;
  context: Record<string, unknown> | null;
  sales_channel_id: string | null;
  sales_channel?: MedusaSalesChannel;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
  shipping_total?: number;
  discount_total?: number;
  item_tax_total?: number;
  shipping_tax_total?: number;
  tax_total?: number;
  refunded_total?: number;
  total?: number;
  subtotal?: number;
  refundable_amount?: number;
  gift_card_total?: number;
  gift_card_tax_total?: number;
}

export interface MedusaLineItem {
  id: string;
  cart_id: string;
  cart?: MedusaCart;
  order_id: string | null;
  order?: MedusaOrder;
  swap_id: string | null;
  swap?: MedusaSwap;
  claim_order_id: string | null;
  claim_order?: MedusaClaimOrder;
  tax_lines?: MedusaTaxLine[];
  adjustments?: MedusaLineItemAdjustment[];
  original_item_id?: string | null;
  order_edit_id?: string | null;
  order_edit?: MedusaOrderEdit;
  title: string;
  description: string | null;
  thumbnail: string | null;
  is_return: boolean;
  is_giftcard: boolean;
  should_merge: boolean;
  allow_discounts: boolean;
  has_shipping: boolean | null;
  unit_price: number;
  variant_id: string | null;
  variant: MedusaProductVariant | null;
  quantity: number;
  fulfilled_quantity: number | null;
  returned_quantity: number | null;
  shipped_quantity: number | null;
  refundable?: number;
  subtotal?: number;
  tax_total?: number;
  total?: number;
  original_total?: number;
  original_tax_total?: number;
  discount_total?: number;
  raw_discount_total?: number;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface MedusaRegion {
  id: string;
  name: string;
  currency_code: string;
  currency?: MedusaCurrency;
  tax_rate: number;
  tax_rates?: MedusaTaxRate[];
  tax_code: string | null;
  gift_cards_taxable: boolean;
  automatic_taxes: boolean;
  countries: MedusaCountry[];
  tax_provider_id: string | null;
  tax_provider?: MedusaTaxProvider;
  payment_providers: MedusaPaymentProvider[];
  fulfillment_providers: MedusaFulfillmentProvider[];
  includes_tax: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaCurrency {
  code: string;
  symbol: string;
  symbol_native: string;
  name: string;
}

export interface MedusaCountry {
  id: number;
  iso_2: string;
  iso_3: string;
  num_code: number;
  name: string;
  display_name: string;
  region_id: string | null;
  region?: MedusaRegion;
}

export interface MedusaTaxRate {
  id: string;
  rate: number | null;
  code: string | null;
  name: string;
  region_id: string;
  region?: MedusaRegion;
  products?: MedusaProduct[];
  product_types?: MedusaProductType[];
  shipping_options?: MedusaShippingOption[];
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface MedusaTaxProvider {
  id: string;
  is_installed: boolean;
}

export interface MedusaPaymentProvider {
  id: string;
  is_installed: boolean;
}

export interface MedusaAddress {
  id: string;
  customer_id: string | null;
  customer?: MedusaCustomer;
  company: string | null;
  first_name: string | null;
  last_name: string | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  country_code: string | null;
  country?: MedusaCountry;
  province: string | null;
  postal_code: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaCustomer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  billing_address_id: string | null;
  billing_address?: MedusaAddress;
  shipping_addresses?: MedusaAddress[];
  phone: string | null;
  has_account: boolean;
  orders?: MedusaOrder[];
  groups?: MedusaCustomerGroup[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaDiscount {
  id: string;
  code: string;
  is_dynamic: boolean;
  rule_id: string;
  rule?: MedusaDiscountRule;
  is_disabled: boolean;
  parent_discount_id: string | null;
  parent_discount?: MedusaDiscount;
  starts_at: string;
  ends_at: string | null;
  valid_duration: string | null;
  regions?: MedusaRegion[];
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaDiscountRule {
  id: string;
  description: string | null;
  type: 'fixed' | 'percentage' | 'free_shipping';
  value: number;
  allocation: 'total' | 'item';
  conditions?: MedusaDiscountCondition[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaDiscountCondition {
  id: string;
  type:
    | 'products'
    | 'product_types'
    | 'product_collections'
    | 'product_tags'
    | 'customer_groups';
  operator: 'in' | 'not_in';
  discount_rule_id: string;
  discount_rule?: MedusaDiscountRule;
  products?: MedusaProduct[];
  product_types?: MedusaProductType[];
  product_tags?: MedusaProductTag[];
  product_collections?: MedusaProductCollection[];
  customer_groups?: MedusaCustomerGroup[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaGiftCard {
  id: string;
  code: string;
  value: number;
  balance: number;
  region_id: string;
  region?: MedusaRegion;
  order_id: string | null;
  order?: MedusaOrder;
  is_disabled: boolean;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaPaymentSession {
  id: string;
  cart_id: string | null;
  cart?: MedusaCart;
  provider_id: string;
  is_selected: boolean | null;
  is_initiated: boolean;
  status: 'authorized' | 'pending' | 'requires_more' | 'error' | 'canceled';
  data: Record<string, unknown>;
  idempotency_key: string | null;
  amount: number | null;
  payment_authorized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedusaPayment {
  id: string;
  swap_id: string | null;
  swap?: MedusaSwap;
  cart_id: string | null;
  cart?: MedusaCart;
  order_id: string | null;
  order?: MedusaOrder;
  amount: number;
  amount_refunded: number;
  provider_id: string;
  data: Record<string, unknown>;
  captured_at: string | null;
  canceled_at: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface MedusaShippingMethod {
  id: string;
  shipping_option_id: string;
  order_id: string | null;
  order?: MedusaOrder;
  claim_order_id: string | null;
  claim_order?: MedusaClaimOrder;
  cart_id: string | null;
  cart?: MedusaCart;
  swap_id: string | null;
  swap?: MedusaSwap;
  return_id: string | null;
  return_order?: MedusaReturn;
  shipping_option?: MedusaShippingOption;
  tax_lines?: MedusaTaxLine[];
  price: number;
  data: Record<string, unknown>;
  includes_tax: boolean;
  subtotal?: number;
  total?: number;
  tax_total?: number;
}

export interface MedusaTaxLine {
  id: string;
  code: string | null;
  name: string;
  rate: number;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface MedusaLineItemAdjustment {
  id: string;
  item_id: string;
  item?: MedusaLineItem;
  description: string;
  discount_id: string | null;
  discount?: MedusaDiscount;
  amount: number;
  metadata: Record<string, unknown> | null;
}

export interface MedusaOrder {
  id: string;
  status: 'pending' | 'completed' | 'archived' | 'canceled' | 'requires_action';
  fulfillment_status:
    | 'not_fulfilled'
    | 'partially_fulfilled'
    | 'fulfilled'
    | 'partially_shipped'
    | 'shipped'
    | 'partially_returned'
    | 'returned'
    | 'canceled'
    | 'requires_action';
  payment_status:
    | 'not_paid'
    | 'awaiting'
    | 'captured'
    | 'partially_refunded'
    | 'refunded'
    | 'canceled'
    | 'requires_action';
  display_id: number;
  cart_id: string | null;
  cart?: MedusaCart;
  customer_id: string;
  customer?: MedusaCustomer;
  email: string;
  billing_address_id: string | null;
  billing_address?: MedusaAddress;
  shipping_address_id: string | null;
  shipping_address?: MedusaAddress;
  region_id: string;
  region?: MedusaRegion;
  currency_code: string;
  currency?: MedusaCurrency;
  tax_rate: number | null;
  discounts?: MedusaDiscount[];
  gift_cards?: MedusaGiftCard[];
  shipping_methods?: MedusaShippingMethod[];
  payments?: MedusaPayment[];
  fulfillments?: MedusaFulfillment[];
  returns?: MedusaReturn[];
  claims?: MedusaClaimOrder[];
  refunds?: MedusaRefund[];
  swaps?: MedusaSwap[];
  draft_order_id: string | null;
  draft_order?: MedusaDraftOrder;
  items: MedusaLineItem[];
  edits?: MedusaOrderEdit[];
  gift_card_transactions?: MedusaGiftCardTransaction[];
  canceled_at: string | null;
  no_notification: boolean;
  idempotency_key: string | null;
  external_id: string | null;
  sales_channel_id: string | null;
  sales_channel?: MedusaSalesChannel;
  shipping_total?: number;
  raw_discount_total?: number;
  discount_total?: number;
  item_tax_total?: number;
  shipping_tax_total?: number;
  tax_total?: number;
  refunded_total?: number;
  total?: number;
  subtotal?: number;
  paid_total?: number;
  refundable_amount?: number;
  gift_card_total?: number;
  gift_card_tax_total?: number;
  returnable_items?: MedusaLineItem[];
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface MedusaSwap {
  id: string;
  fulfillment_status:
    | 'not_fulfilled'
    | 'fulfilled'
    | 'shipped'
    | 'partially_shipped'
    | 'canceled'
    | 'requires_action';
  payment_status:
    | 'not_paid'
    | 'awaiting'
    | 'captured'
    | 'confirmed'
    | 'canceled'
    | 'difference_refunded'
    | 'partially_refunded'
    | 'refunded'
    | 'requires_action';
  order_id: string;
  order?: MedusaOrder;
  additional_items?: MedusaLineItem[];
  return_order?: MedusaReturn;
  fulfillments?: MedusaFulfillment[];
  payment?: MedusaPayment;
  difference_due: number | null;
  shipping_address_id: string | null;
  shipping_address?: MedusaAddress;
  shipping_methods?: MedusaShippingMethod[];
  cart_id: string | null;
  cart?: MedusaCart;
  confirmed_at: string | null;
  canceled_at: string | null;
  no_notification: boolean | null;
  allow_backorder: boolean;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaClaimOrder {
  id: string;
  type: 'refund' | 'replace';
  payment_status: 'na' | 'not_refunded' | 'refunded';
  fulfillment_status:
    | 'not_fulfilled'
    | 'partially_fulfilled'
    | 'fulfilled'
    | 'partially_shipped'
    | 'shipped'
    | 'partially_returned'
    | 'returned'
    | 'canceled'
    | 'requires_action';
  claim_items: MedusaClaimItem[];
  additional_items?: MedusaLineItem[];
  order_id: string;
  order?: MedusaOrder;
  return_order?: MedusaReturn;
  shipping_address_id: string | null;
  shipping_address?: MedusaAddress;
  shipping_methods?: MedusaShippingMethod[];
  fulfillments?: MedusaFulfillment[];
  refund_amount: number | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
  no_notification: boolean | null;
  idempotency_key: string | null;
}

export interface MedusaClaimItem {
  id: string;
  images: MedusaClaimImage[];
  claim_order_id: string;
  claim_order?: MedusaClaimOrder;
  item_id: string;
  item?: MedusaLineItem;
  variant_id: string;
  variant?: MedusaProductVariant;
  reason: 'missing_item' | 'wrong_item' | 'production_failure' | 'other';
  note: string | null;
  quantity: number;
  fulfillment_created: boolean;
  return_requested: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaClaimImage {
  id: string;
  claim_item_id: string;
  claim_item?: MedusaClaimItem;
  url: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaFulfillment {
  id: string;
  claim_order_id: string | null;
  claim_order?: MedusaClaimOrder;
  swap_id: string | null;
  swap?: MedusaSwap;
  order_id: string | null;
  order?: MedusaOrder;
  provider_id: string;
  provider?: MedusaFulfillmentProvider;
  location_id: string | null;
  items: MedusaFulfillmentItem[];
  tracking_links: MedusaTrackingLink[];
  tracking_numbers: string[];
  data: Record<string, unknown>;
  shipped_at: string | null;
  no_notification: boolean | null;
  canceled_at: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface MedusaFulfillmentItem {
  fulfillment_id: string;
  item_id: string;
  fulfillment?: MedusaFulfillment;
  item?: MedusaLineItem;
  quantity: number;
}

export interface MedusaTrackingLink {
  id: string;
  url: string | null;
  tracking_number: string;
  fulfillment_id: string;
  fulfillment?: MedusaFulfillment;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaReturn {
  id: string;
  status: 'requested' | 'received' | 'requires_action' | 'canceled';
  items?: MedusaReturnItem[];
  swap_id: string | null;
  swap?: MedusaSwap;
  claim_order_id: string | null;
  claim_order?: MedusaClaimOrder;
  order_id: string | null;
  order?: MedusaOrder;
  shipping_method?: MedusaShippingMethod;
  shipping_data: Record<string, unknown> | null;
  location_id: string | null;
  refund_amount: number;
  no_notification: boolean | null;
  idempotency_key: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface MedusaReturnItem {
  return_id: string;
  item_id: string;
  return_order?: MedusaReturn;
  item?: MedusaLineItem;
  quantity: number;
  is_requested: boolean;
  requested_quantity: number | null;
  received_quantity: number | null;
  reason_id: string | null;
  reason?: MedusaReturnReason;
  note: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaReturnReason {
  id: string;
  value: string;
  label: string;
  description: string | null;
  parent_return_reason_id: string | null;
  parent_return_reason?: MedusaReturnReason | null;
  return_reason_children?: MedusaReturnReason[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaRefund {
  id: string;
  order_id: string | null;
  order?: MedusaOrder;
  payment_id: string | null;
  payment?: MedusaPayment;
  amount: number;
  note: string | null;
  reason: 'discount' | 'return' | 'swap' | 'claim' | 'other';
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface MedusaDraftOrder {
  id: string;
  status: 'open' | 'completed';
  display_id: string;
  cart_id: string | null;
  cart?: MedusaCart;
  order_id: string | null;
  order?: MedusaOrder;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown> | null;
  idempotency_key: string | null;
  no_notification_order: boolean | null;
}

export interface MedusaOrderEdit {
  id: string;
  order_id: string;
  order?: MedusaOrder;
  changes: MedusaOrderItemChange[];
  internal_note: string | null;
  created_by: string;
  requested_by: string | null;
  requested_at: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  declined_by: string | null;
  declined_reason: string | null;
  declined_at: string | null;
  canceled_by: string | null;
  canceled_at: string | null;
  payment_collection_id: string | null;
  payment_collection?: MedusaPaymentCollection;
  created_at: string;
  updated_at: string;
}

export interface MedusaOrderItemChange {
  id: string;
  type: 'item_add' | 'item_remove' | 'item_update';
  order_edit_id: string;
  order_edit?: MedusaOrderEdit;
  original_line_item_id: string | null;
  original_line_item?: MedusaLineItem | null;
  line_item_id: string | null;
  line_item?: MedusaLineItem | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MedusaPaymentCollection {
  id: string;
  type: 'order_edit';
  status:
    | 'not_paid'
    | 'awaiting'
    | 'authorized'
    | 'partially_authorized'
    | 'canceled';
  description: string | null;
  amount: number;
  authorized_amount: number | null;
  region_id: string;
  region?: MedusaRegion;
  currency_code: string;
  currency?: MedusaCurrency;
  payment_sessions?: MedusaPaymentSession[];
  payments?: MedusaPayment[];
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MedusaGiftCardTransaction {
  id: string;
  gift_card_id: string;
  gift_card?: MedusaGiftCard;
  order_id: string;
  order?: MedusaOrder;
  amount: number;
  created_at: string;
  is_taxable: boolean | null;
  tax_rate: number | null;
}
