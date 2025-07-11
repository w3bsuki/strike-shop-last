// API type definitions for Strike Shop
import type { 
  CartId, LineItemId, VariantId, ProductId, 
  Price as BrandedPrice, Quantity, ImageURL, Slug, SKU 
} from './branded';
import type { CartItem as StoreCartItem } from './store';

// ============================================================
// CART API TYPES
// ============================================================

// Cart API Request Types
export interface AddCartItemRequest {
  variantId: VariantId;
  quantity: Quantity;
  productId?: ProductId | undefined; // Optional for backward compatibility
}

export interface UpdateCartItemRequest {
  quantity: Quantity;
}

export interface SyncCartRequest {
  items: StoreCartItem[];
  cartId?: CartId | null | undefined;
}

// Cart API Response Types
export interface CartAPIResponse {
  cart: Cart;
  cartId: CartId;
}

export interface CartSyncResponse {
  cart: Cart;
  cartId: CartId;
  syncedItems: CartItem[];
}

// Cart Types (from API responses)
export interface Cart {
  id: CartId;
  items?: CartItem[] | undefined;
  region?: {
    currency_code: string | undefined;
    id: string;
    name: string;
  };
  total?: BrandedPrice | undefined;
  subtotal?: BrandedPrice | undefined;
  tax_total?: BrandedPrice | undefined;
  shipping_total?: BrandedPrice | undefined;
  discount_total?: BrandedPrice | undefined;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: LineItemId;
  variant_id: VariantId;
  variant?: Variant | undefined;
  product_id?: ProductId | undefined;
  title: string;
  quantity: Quantity;
  thumbnail?: ImageURL | undefined;
  unit_price: BrandedPrice;
  subtotal?: BrandedPrice | undefined;
  total?: BrandedPrice | undefined;
  original_total?: BrandedPrice | undefined;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: VariantId;
  product_id?: ProductId | undefined;
  product?: Product | undefined;
  title?: string | undefined;
  sku?: SKU | undefined;
  prices?: BrandedPrice[] | undefined;
  inventory_quantity?: number | undefined;
  manage_inventory?: boolean | undefined;
  allow_backorder?: boolean | undefined;
}

export interface Product {
  id: ProductId;
  handle?: Slug | undefined;
  title?: string | undefined;
  description?: string | undefined;
  thumbnail?: ImageURL | undefined;
  status?: string | undefined;
}

export interface Price {
  id: string;
  amount: BrandedPrice;
  currency_code: string;
  min_quantity?: number | undefined;
  max_quantity?: number | undefined;
}

// ============================================================
// PAYMENT API TYPES
// ============================================================

// Payment API Request Types
export interface CreatePaymentIntentRequest {
  amount: BrandedPrice;
  currency?: string | undefined;
  items: PaymentLineItem[];
  shipping?: ShippingDetails | undefined;
  metadata?: Record<string, string>;
}

export interface PaymentLineItem {
  id: ProductId;
  name: string;
  price: BrandedPrice;
  quantity: Quantity;
  size?: string | undefined;
  sku?: SKU | undefined;
  image?: ImageURL | undefined;
}

export interface ShippingDetails {
  name: string;
  address: ShippingAddress;
  phone?: string | undefined;
}

export interface ShippingAddress {
  line1: string;
  line2?: string | undefined;
  city: string;
  postal_code: string;
  country: string;
  state?: string | undefined;
}

// Payment API Response Types
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: BrandedPrice;
  currency: string;
  status: PaymentIntentStatus;
  metadata?: Record<string, string>;
}

export interface PaymentStatusResponse {
  paymentIntent: StripePaymentIntent;
  status: PaymentIntentStatus;
  lastPaymentError?: StripeError | undefined;
}

// Stripe Types (properly typed from Stripe API)
export interface StripePaymentIntent {
  id: string;
  amount: BrandedPrice;
  currency: string;
  status: PaymentIntentStatus;
  client_secret: string;
  created: number;
  description?: string | undefined;
  metadata: Record<string, string>;
  receipt_email?: string | undefined;
  shipping?: StripeShipping | undefined;
  last_payment_error?: StripeError | undefined;
}

export interface StripeShipping {
  address: {
    city?: string | undefined;
    country?: string | undefined;
    line1?: string | undefined;
    line2?: string | undefined;
    postal_code?: string | undefined;
    state?: string | undefined;
  };
  name: string;
  phone?: string | undefined;
}

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

export interface StripeError {
  code?: string | undefined;
  decline_code?: string | undefined;
  doc_url?: string | undefined;
  message?: string | undefined;
  param?: string | undefined;
  type: string;
}

// ============================================================
// ERROR TYPES
// ============================================================

// Standard API Error Response
export interface APIErrorResponse {
  error: string;
  message?: string | undefined;
  details?: unknown | undefined;
  code?: string | undefined;
  timestamp?: string | undefined;
}

// Typed Error Classes
export class CartAPIError extends Error {
  public readonly code: string;
  public readonly details?: unknown | undefined;
  public readonly httpStatus?: number | undefined;

  constructor(
    message: string, 
    code: string = 'CART_ERROR', 
    details?: unknown | undefined,
    httpStatus?: number
  ) {
    super(message);
    this.name = 'CartAPIError';
    this.code = code;
    this.details = details;
    this.httpStatus = httpStatus;
  }
}

export class PaymentAPIError extends Error {
  public readonly code: string;
  public readonly details?: unknown | undefined;
  public readonly httpStatus?: number | undefined;

  constructor(
    message: string, 
    code: string = 'PAYMENT_ERROR', 
    details?: unknown | undefined,
    httpStatus?: number
  ) {
    super(message);
    this.name = 'PaymentAPIError';
    this.code = code;
    this.details = details;
    this.httpStatus = httpStatus;
  }
}

// Error Union Types
export type CartError = CartAPIError | Error;
export type PaymentError = PaymentAPIError | Error;
export type APIError = CartAPIError | PaymentAPIError | Error;

// ============================================================
// UTILITY TYPES
// ============================================================

// Type guards for runtime checking
export function isCartAPIError(error: unknown): error is CartAPIError {
  return error instanceof CartAPIError;
}

export function isPaymentAPIError(error: unknown): error is PaymentAPIError {
  return error instanceof PaymentAPIError;
}

export function isAPIErrorResponse(response: unknown): response is APIErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as APIErrorResponse).error === 'string'
  );
}

// Response validation helpers
export function validateCart(data: unknown): data is Cart {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as Cart).id === 'string'
  );
}

export function validatePaymentIntentResponse(data: unknown): data is PaymentIntentResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'clientSecret' in data &&
    'paymentIntentId' in data &&
    'amount' in data &&
    'currency' in data &&
    typeof (data as PaymentIntentResponse).clientSecret === 'string' &&
    typeof (data as PaymentIntentResponse).paymentIntentId === 'string'
  );
}

// Generic API response wrapper
export interface APIResponse<T> {
  success: boolean;
  data?: T | undefined;
  error?: APIErrorResponse | undefined;
  timestamp: string;
}

// HTTP Method types
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request configuration
export interface APIRequestConfig {
  method: HTTPMethod;
  headers?: Record<string, string>;
  body?: unknown | undefined;
  cartId?: CartId | null | undefined;
  timeout?: number | undefined;
}