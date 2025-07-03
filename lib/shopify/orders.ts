// Shopify Order Management Service
import type { ShopifyOrderInput } from '@/lib/stripe/types';

export interface ShopifyOrder {
  id: string;
  order_number: number;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  financial_status: string;
  fulfillment_status: string;
  line_items: any[];
  shipping_address: any;
  billing_address: any;
  customer: any;
}

/**
 * Create order in Shopify via Admin API
 */
export async function createShopifyOrder(orderData: ShopifyOrderInput): Promise<ShopifyOrder> {
  const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopifyDomain || !accessToken) {
    throw new Error('Shopify Admin API credentials not configured');
  }

  const url = `https://${shopifyDomain}/admin/api/2024-01/orders.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      order: orderData,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Shopify order creation failed:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`Failed to create Shopify order: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.order) {
    throw new Error('Invalid response from Shopify API');
  }

  return result.order;
}

/**
 * Get order by ID from Shopify
 */
export async function getShopifyOrder(orderId: string): Promise<ShopifyOrder | null> {
  const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopifyDomain || !accessToken) {
    throw new Error('Shopify Admin API credentials not configured');
  }

  const url = `https://${shopifyDomain}/admin/api/2024-01/orders/${orderId}.json`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch Shopify order: ${response.statusText}`);
  }

  const result = await response.json();
  return result.order;
}

/**
 * Update order fulfillment status
 */
export async function updateOrderFulfillment(orderId: string, fulfillmentData: {
  tracking_number?: string;
  tracking_company?: string;
  tracking_url?: string;
  line_items?: Array<{ id: string; quantity: number }>;
}): Promise<any> {
  const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopifyDomain || !accessToken) {
    throw new Error('Shopify Admin API credentials not configured');
  }

  const url = `https://${shopifyDomain}/admin/api/2024-01/orders/${orderId}/fulfillments.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      fulfillment: {
        tracking_number: fulfillmentData.tracking_number,
        tracking_company: fulfillmentData.tracking_company,
        tracking_url: fulfillmentData.tracking_url,
        line_items: fulfillmentData.line_items,
        notify_customer: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update order fulfillment: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get customer orders from Shopify
 */
export async function getCustomerOrders(customerId: string, limit: number = 10): Promise<ShopifyOrder[]> {
  const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopifyDomain || !accessToken) {
    throw new Error('Shopify Admin API credentials not configured');
  }

  const url = `https://${shopifyDomain}/admin/api/2024-01/customers/${customerId}/orders.json?limit=${limit}&status=any`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch customer orders: ${response.statusText}`);
  }

  const result = await response.json();
  return result.orders || [];
}

/**
 * Cancel order in Shopify
 */
export async function cancelShopifyOrder(orderId: string, reason: string = 'customer'): Promise<ShopifyOrder> {
  const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopifyDomain || !accessToken) {
    throw new Error('Shopify Admin API credentials not configured');
  }

  const url = `https://${shopifyDomain}/admin/api/2024-01/orders/${orderId}/cancel.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      reason,
      email: true, // Send notification to customer
      refund: true, // Automatically refund the order
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel Shopify order: ${response.statusText}`);
  }

  const result = await response.json();
  return result.order;
}

/**
 * Validate variant availability before order creation
 */
export async function validateOrderItems(items: Array<{ variantId: string; quantity: number }>): Promise<{
  valid: boolean;
  errors: string[];
  availableInventory: Record<string, number>;
}> {
  const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopifyDomain || !accessToken) {
    throw new Error('Shopify Admin API credentials not configured');
  }

  const errors: string[] = [];
  const availableInventory: Record<string, number> = {};

  for (const item of items) {
    const url = `https://${shopifyDomain}/admin/api/2024-01/variants/${item.variantId}.json`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      });

      if (!response.ok) {
        errors.push(`Variant ${item.variantId} not found`);
        continue;
      }

      const result = await response.json();
      const variant = result.variant;

      // Check inventory
      if (variant.inventory_management && variant.inventory_policy === 'deny') {
        const available = variant.inventory_quantity || 0;
        availableInventory[item.variantId] = available;

        if (available < item.quantity) {
          errors.push(`Insufficient inventory for variant ${item.variantId}. Available: ${available}, Requested: ${item.quantity}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to validate variant ${item.variantId}: ${error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    availableInventory,
  };
}