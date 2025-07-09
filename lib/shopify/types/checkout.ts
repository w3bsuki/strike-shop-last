/**
 * Checkout Types for Shopify Storefront API
 * Based on Shopify Storefront API 2025-01
 */

import type {
  ShopifyID,
  MoneyV2,
  CurrencyCode,
  CountryCode,
  Connection,
  CustomerUserError,
  MailingAddress,
  MailingAddressInput,
  AttributeInput,
  Attribute,
  Customer,
} from '../types';

// ============================================
// Checkout Enums
// ============================================

export enum CheckoutErrorCode {
  BLANK = 'BLANK',
  INVALID = 'INVALID',
  TOO_LONG = 'TOO_LONG',
  PRESENT = 'PRESENT',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL_TO = 'GREATER_THAN_OR_EQUAL_TO',
  LESS_THAN_OR_EQUAL_TO = 'LESS_THAN_OR_EQUAL_TO',
  ALREADY_COMPLETED = 'ALREADY_COMPLETED',
  LOCKED = 'LOCKED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  BAD_DOMAIN = 'BAD_DOMAIN',
  INVALID_FOR_COUNTRY = 'INVALID_FOR_COUNTRY',
  INVALID_FOR_COUNTRY_AND_PROVINCE = 'INVALID_FOR_COUNTRY_AND_PROVINCE',
  INVALID_STATE_IN_COUNTRY = 'INVALID_STATE_IN_COUNTRY',
  INVALID_PROVINCE_IN_COUNTRY = 'INVALID_PROVINCE_IN_COUNTRY',
  INVALID_REGION_IN_COUNTRY = 'INVALID_REGION_IN_COUNTRY',
  SHIPPING_RATE_EXPIRED = 'SHIPPING_RATE_EXPIRED',
  GIFT_CARD_UNUSABLE = 'GIFT_CARD_UNUSABLE',
  GIFT_CARD_DISABLED = 'GIFT_CARD_DISABLED',
  GIFT_CARD_CODE_INVALID = 'GIFT_CARD_CODE_INVALID',
  GIFT_CARD_ALREADY_APPLIED = 'GIFT_CARD_ALREADY_APPLIED',
  GIFT_CARD_CURRENCY_MISMATCH = 'GIFT_CARD_CURRENCY_MISMATCH',
  GIFT_CARD_EXPIRED = 'GIFT_CARD_EXPIRED',
  GIFT_CARD_DEPLETED = 'GIFT_CARD_DEPLETED',
  GIFT_CARD_NOT_FOUND = 'GIFT_CARD_NOT_FOUND',
  CART_DOES_NOT_MEET_DISCOUNT_REQUIREMENTS_NOTICE = 'CART_DOES_NOT_MEET_DISCOUNT_REQUIREMENTS_NOTICE',
  DISCOUNT_EXPIRED = 'DISCOUNT_EXPIRED',
  DISCOUNT_DISABLED = 'DISCOUNT_DISABLED',
  DISCOUNT_LIMIT_REACHED = 'DISCOUNT_LIMIT_REACHED',
  HIGHER_VALUE_DISCOUNT_APPLIED = 'HIGHER_VALUE_DISCOUNT_APPLIED',
  MAXIMUM_DISCOUNT_CODE_LIMIT_REACHED = 'MAXIMUM_DISCOUNT_CODE_LIMIT_REACHED',
  DISCOUNT_NOT_FOUND = 'DISCOUNT_NOT_FOUND',
  CUSTOMER_ALREADY_USED_ONCE_PER_CUSTOMER_DISCOUNT_NOTICE = 'CUSTOMER_ALREADY_USED_ONCE_PER_CUSTOMER_DISCOUNT_NOTICE',
  DISCOUNT_CODE_APPLICATION_FAILED = 'DISCOUNT_CODE_APPLICATION_FAILED',
  EMPTY = 'EMPTY',
  NOT_ENOUGH_IN_STOCK = 'NOT_ENOUGH_IN_STOCK',
  MISSING_PAYMENT_INPUT = 'MISSING_PAYMENT_INPUT',
  TOTAL_PRICE_MISMATCH = 'TOTAL_PRICE_MISMATCH',
  LINE_ITEM_NOT_FOUND = 'LINE_ITEM_NOT_FOUND',
}

// ============================================
// Checkout Types
// ============================================

export interface CheckoutLineItem {
  id: ShopifyID;
  title: string;
  variant?: {
    id: ShopifyID;
    title: string;
    price: MoneyV2;
    image?: {
      url: string;
      altText?: string | null;
    } | null;
    product: {
      id: ShopifyID;
      handle: string;
      title: string;
    };
  } | null;
  quantity: number;
  customAttributes: Attribute[];
  discountAllocations: CheckoutDiscountAllocation[];
}

export interface CheckoutDiscountAllocation {
  allocatedAmount: MoneyV2;
  discountApplication: DiscountApplication;
}

export interface DiscountApplication {
  allocationMethod: string;
  targetSelection: string;
  targetType: string;
  value: MoneyV2 | { percentage: number };
}

export interface AppliedGiftCard {
  id: ShopifyID;
  balance: MoneyV2;
  amountUsed: MoneyV2;
  lastCharacters: string;
  presentmentAmountUsed: MoneyV2;
}

export interface ShippingRate {
  handle: string;
  title: string;
  price: MoneyV2;
  priceV2: MoneyV2; // Deprecated but still returned
}

export interface AvailableShippingRates {
  ready: boolean;
  shippingRates?: ShippingRate[] | null;
}

export interface Checkout {
  id: ShopifyID;
  webUrl: string;
  totalTax: MoneyV2;
  totalTaxV2: MoneyV2; // Deprecated but still returned
  subtotalPrice: MoneyV2;
  subtotalPriceV2: MoneyV2; // Deprecated but still returned
  totalPrice: MoneyV2;
  totalPriceV2: MoneyV2; // Deprecated but still returned
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  email?: string | null;
  discountApplications: Connection<DiscountApplication>;
  appliedGiftCards: AppliedGiftCard[];
  shippingAddress?: MailingAddress | null;
  shippingLine?: ShippingRate | null;
  customAttributes: Attribute[];
  order?: Order | null;
  orderStatusUrl?: string | null;
  shopifyPaymentsAccountId?: string | null;
  buyerIdentity: CheckoutBuyerIdentity;
  lineItems: Connection<CheckoutLineItem>;
  ready: boolean;
  availableShippingRates?: AvailableShippingRates | null;
  currencyCode: CurrencyCode;
  presentmentCurrencyCode?: CurrencyCode;
  requiresShipping: boolean;
  lineItemsSubtotalPrice: MoneyV2;
  paymentDue: MoneyV2;
  paymentDueV2: MoneyV2; // Deprecated but still returned
  taxExempt: boolean;
  taxesIncluded: boolean;
  totalDuties?: MoneyV2 | null;
  note?: string | null;
}

export interface CheckoutBuyerIdentity {
  countryCode?: CountryCode | null;
}

export interface Order {
  id: ShopifyID;
  orderNumber: number;
  processedAt: string;
  totalPrice: MoneyV2;
  totalPriceV2: MoneyV2; // Deprecated but still returned
  customerUrl?: string | null;
  statusUrl: string;
}

// ============================================
// Input Types
// ============================================

export interface CheckoutAttributesUpdateV2Input {
  allowPartialAddresses?: boolean;
  customAttributes?: AttributeInput[];
  note?: string;
}

export interface CheckoutBuyerIdentityInput {
  countryCode?: CountryCode;
}

export interface CheckoutCreateInput {
  email?: string;
  lineItems?: CheckoutLineItemInput[];
  shippingAddress?: MailingAddressInput;
  note?: string;
  customAttributes?: AttributeInput[];
  allowPartialAddresses?: boolean;
  presentmentCurrencyCode?: CurrencyCode;
  buyerIdentity?: CheckoutBuyerIdentityInput;
}

export interface CheckoutLineItemInput {
  customAttributes?: AttributeInput[];
  quantity: number;
  variantId: ShopifyID;
}

export interface CheckoutLineItemUpdateInput {
  id?: ShopifyID;
  variantId?: ShopifyID;
  quantity?: number;
  customAttributes?: AttributeInput[];
}

// ============================================
// Mutation Payload Types
// ============================================

export interface CheckoutUserError {
  field?: string[] | null;
  message: string;
  code?: CheckoutErrorCode | null;
}

export interface CheckoutCreatePayload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
  queueToken?: string | null;
}

export interface CheckoutCustomerAssociateV2Payload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
  customer?: Customer | null;
}

export interface CheckoutEmailUpdateV2Payload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
}

export interface CheckoutShippingAddressUpdateV2Payload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
}

export interface CheckoutShippingLineUpdatePayload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
}

export interface CheckoutAttributesUpdateV2Payload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
}

export interface CheckoutDiscountCodeApplyV2Payload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
}

export interface CheckoutDiscountCodeRemovePayload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
}

export interface CheckoutGiftCardApplyPayload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
}

export interface CheckoutGiftCardRemoveV2Payload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
}

export interface CheckoutCompleteWithCreditCardV2Payload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
  payment?: Payment | null;
}

export interface CheckoutCompleteWithTokenizedPaymentV3Payload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
  payment?: Payment | null;
}

export interface CheckoutCompleteFreePayload {
  checkout?: Checkout | null;
  checkoutUserErrors: CheckoutUserError[];
}

// ============================================
// Payment Types
// ============================================

export interface Payment {
  id: ShopifyID;
  amount: MoneyV2;
  amountV2: MoneyV2; // Deprecated but still returned
  billingAddress?: MailingAddress | null;
  checkout: Checkout;
  creditCard?: CreditCard | null;
  errorMessage?: string | null;
  idempotencyKey?: string | null;
  nextActionUrl?: string | null;
  ready: boolean;
  test: boolean;
  transaction?: Transaction | null;
}

export interface CreditCard {
  brand?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  firstDigits?: string | null;
  firstName?: string | null;
  lastDigits?: string | null;
  lastName?: string | null;
  maskedNumber?: string | null;
}

export interface Transaction {
  id: ShopifyID;
  amount: MoneyV2;
  amountV2: MoneyV2; // Deprecated but still returned
  kind: string;
  status: string;
  statusV2?: string | null;
  test: boolean;
}

export interface CreditCardPaymentInputV2 {
  paymentAmount: MoneyV2;
  idempotencyKey: string;
  billingAddress: MailingAddressInput;
  vaultId: string;
  test?: boolean;
}

export interface TokenizedPaymentInputV3 {
  paymentAmount: MoneyV2;
  idempotencyKey: string;
  billingAddress: MailingAddressInput;
  paymentData: string;
  test?: boolean;
  identifier?: string;
  type: string;
}

// ============================================
// Service Types
// ============================================

export interface CheckoutUpdate {
  email?: string;
  shippingAddress?: MailingAddressInput;
  billingAddress?: MailingAddressInput;
  shippingLine?: string;
  discountCode?: string;
  giftCardCodes?: string[];
  note?: string;
  customAttributes?: AttributeInput[];
}

export interface CheckoutCreateOptions {
  email?: string;
  shippingAddress?: MailingAddressInput;
  note?: string;
  customAttributes?: AttributeInput[];
  allowPartialAddresses?: boolean;
  presentmentCurrencyCode?: CurrencyCode;
  buyerIdentity?: CheckoutBuyerIdentityInput;
}

// ============================================
// Available Payment Gateways
// ============================================

export enum PaymentGateway {
  SHOPIFY_PAYMENTS = 'shopify_payments',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  AMAZON_PAY = 'amazon_payments',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  KLARNA = 'klarna',
  AFTERPAY = 'afterpay',
  AFFIRM = 'affirm',
  SHOP_PAY = 'shop_pay',
}

// ============================================
// Rate Limiting
// ============================================

export interface RateLimitInfo {
  requestsRemaining: number;
  requestsLimit: number;
  retryAfter?: number;
}

// ============================================
// Payment Methods
// ============================================

export interface AvailablePaymentMethod {
  id: string;
  name: string;
  type: string;
  icon?: string;
  available: boolean;
  enabled?: boolean;
  description?: string;
}