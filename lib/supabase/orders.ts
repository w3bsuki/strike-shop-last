import { createClient } from '@/lib/supabase/client';

// Temporary types until we regenerate Supabase types
type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'payment_failed';

interface OrderItem {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price: number;
  title: string;
  variant_title?: string;
  image_url?: string;
  sku?: string;
}

interface Address {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone?: string;
}

interface OrderMetadata {
  shopify_order_number?: number;
  email?: string;
  notes?: string;
  tracking_number?: string;
  tracking_company?: string;
  [key: string]: unknown; // Allow additional metadata
}

interface Order {
  id: string;
  user_id: string | null;
  payment_id: string | null;
  medusa_order_id: string | null;
  stripe_payment_intent_id: string | null;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  metadata: OrderMetadata;
  created_at: string;
  updated_at: string;
}

interface OrderInput {
  user_id?: string | null;
  payment_id?: string | null;
  medusa_order_id?: string | null;
  stripe_payment_intent_id?: string | null;
  status?: OrderStatus;
  total_amount: number;
  currency: string;
  items: OrderItem[];
  shipping_address?: Address;
  billing_address?: Address;
  metadata?: OrderMetadata;
}

export interface CreateOrderInput {
  stripePaymentIntentId: string;
  shopifyOrderId: string;
  shopifyOrderNumber: number;
  userId?: string;
  email: string;
  amount: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
}

/**
 * Create order in Supabase after successful payment
 */
export async function createOrder(input: CreateOrderInput): Promise<Order | null> {
  const supabase = createClient();

  const orderData: OrderInput = {
    stripe_payment_intent_id: input.stripePaymentIntentId,
    medusa_order_id: input.shopifyOrderId, // Using medusa_order_id field for Shopify order ID
    user_id: input.userId || null,
    total_amount: input.amount,
    currency: input.currency,
    status: 'pending',
    items: input.items,
    shipping_address: input.shippingAddress,
    billing_address: input.billingAddress,
    metadata: {
      shopify_order_number: input.shopifyOrderNumber,
      email: input.email,
    },
  };

  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (error) {
    console.error('Failed to create order in Supabase:', error);
    return null;
  }

  return data;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  metadata?: Partial<OrderMetadata>
): Promise<Order | null> {
  const supabase = createClient();

  const updateData: Partial<Order> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (metadata) {
    updateData.metadata = metadata as OrderMetadata;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update order status:', error);
    return null;
  }

  return data;
}

/**
 * Get orders for a specific user
 */
export async function getOrdersByUser(
  userId: string,
  limit: number = 10
): Promise<Order[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch user orders:', error);
    return [];
  }

  return data || [];
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Failed to fetch order:', error);
    return null;
  }

  return data;
}

/**
 * Get order by Stripe payment intent ID
 */
export async function getOrderByPaymentIntent(
  paymentIntentId: string
): Promise<Order | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (error) {
    console.error('Failed to fetch order by payment intent:', error);
    return null;
  }

  return data;
}

/**
 * Get order by Shopify order ID
 */
export async function getOrderByShopifyId(
  shopifyOrderId: string
): Promise<Order | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('medusa_order_id', shopifyOrderId)
    .single();

  if (error) {
    console.error('Failed to fetch order by Shopify ID:', error);
    return null;
  }

  return data;
}

/**
 * Get all orders (admin)
 */
export async function getAllOrders(
  limit: number = 50,
  offset: number = 0,
  status?: OrderStatus
): Promise<{ orders: Order[]; count: number }> {
  const supabase = createClient();

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch all orders:', error);
    return { orders: [], count: 0 };
  }

  return { orders: data || [], count: count || 0 };
}

/**
 * Search orders by email or order number
 */
export async function searchOrders(query: string): Promise<Order[]> {
  const supabase = createClient();

  // Try to parse as order number
  const orderNumber = parseInt(query);
  
  if (!isNaN(orderNumber)) {
    // Search by order number in metadata
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .contains('metadata', { shopify_order_number: orderNumber })
      .limit(10);

    if (!error && data && data.length > 0) {
      return data;
    }
  }

  // Search by email in metadata
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .contains('metadata', { email: query })
    .limit(10);

  if (error) {
    console.error('Failed to search orders:', error);
    return [];
  }

  return data || [];
}