// Stripe Payment Types
export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  automatic_payment_methods: {
    enabled: boolean;
  };
  metadata: {
    cartId?: string;
    userId?: string;
    customerId?: string;
    orderItems?: string; // JSON string of order items
    totals?: string; // JSON string of order totals
    customer_email?: string;
    customer_name?: string;
    billing_address?: string; // JSON string
    shipping_address?: string; // JSON string
  };
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface CheckoutFormData {
  email: string;
  fullName: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  shipping?: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export interface OrderItem {
  variantId: string;
  productId: string;
  quantity: number;
  price: number;
  title: string;
  image?: string;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  orderId?: string;
  error?: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface ShopifyOrderInput {
  email: string;
  financial_status: 'paid' | 'pending' | 'authorized';
  fulfillment_status?: 'fulfilled' | 'partial' | 'unfulfilled';
  line_items: Array<{
    variant_id: string;
    quantity: number;
    price: string;
  }>;
  customer?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  billing_address: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
  };
  shipping_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
  };
  tags?: string;
  note?: string;
  gateway: string;
  source_name: string;
  transactions: Array<{
    kind: 'sale' | 'authorization' | 'capture';
    status: 'success' | 'pending' | 'failure';
    amount: string;
    currency: string;
    gateway: string;
    source_name: string;
    payment_details: {
      credit_card_bin?: string;
      avs_result_code?: string;
      cvv_result_code?: string;
      credit_card_number?: string;
      credit_card_company?: string;
    };
  }>;
}

export interface ExpressPaymentOptions {
  country: string;
  currency: string;
  total: {
    label: string;
    amount: number;
  };
  displayItems?: Array<{
    label: string;
    amount: number;
  }>;
  requestPayerName?: boolean;
  requestPayerEmail?: boolean;
  requestPayerPhone?: boolean;
  requestShipping?: boolean;
  shippingOptions?: Array<{
    id: string;
    label: string;
    amount: number;
    detail?: string;
  }>;
}