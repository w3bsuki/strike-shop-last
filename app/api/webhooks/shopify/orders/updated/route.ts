import { NextRequest } from 'next/server';
import { 
  verifyShopifyWebhook, 
  webhookResponse, 
  getWebhookTopic, 
  getShopDomain,
  getWebhookId,
  logWebhookEvent 
} from '@/lib/webhooks/shopify-verify';

interface ShopifyOrder {
  id: number;
  admin_graphql_api_id: string;
  email: string;
  created_at: string;
  updated_at: string;
  currency: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  financial_status: string;
  fulfillment_status: string | null;
  name: string;
  order_number: number;
  cancelled_at?: string;
  cancel_reason?: string;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string;
    variant_title: string;
    vendor: string;
    fulfillment_status: string | null;
  }>;
  fulfillments?: Array<{
    id: number;
    status: string;
    created_at: string;
    tracking_company?: string;
    tracking_number?: string;
    tracking_url?: string;
  }>;
  refunds?: Array<{
    id: number;
    created_at: string;
    note?: string;
    refund_line_items: Array<{
      quantity: number;
      line_item_id: number;
      subtotal: string;
    }>;
  }>;
}

export async function POST(request: NextRequest) {
  const topic = getWebhookTopic(request.headers);
  const shopDomain = getShopDomain(request.headers);
  const webhookId = getWebhookId(request.headers);
  
  if (topic !== 'orders/updated') {
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

    // Parse order data
    const order: ShopifyOrder = JSON.parse(rawBody);
    
    // Log the webhook event
    logWebhookEvent('orders/updated', shopDomain, webhookId, order);

    // Process the updated order
    await processUpdatedOrder(order);

    return webhookResponse(true, 'Order updated successfully');
  } catch (error) {
    const err = error as Error;
    logWebhookEvent('orders/updated', shopDomain, webhookId, null, err);
    return webhookResponse(false, err.message);
  }
}

async function processUpdatedOrder(order: ShopifyOrder) {
  try {
    console.log('Processing updated order:', {
      orderId: order.id,
      orderNumber: order.order_number,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      updatedAt: order.updated_at,
    });

    // Handle different update scenarios
    
    // 1. Payment status changed
    if (order.financial_status) {
      console.log('Financial status:', order.financial_status);
      // Handle payment confirmation, refunds, etc.
    }

    // 2. Fulfillment status changed
    if (order.fulfillment_status) {
      console.log('Fulfillment status:', order.fulfillment_status);
      // Send shipping notifications
    }

    // 3. Check for fulfillments (shipping)
    if (order.fulfillments && order.fulfillments.length > 0) {
      for (const fulfillment of order.fulfillments) {
        console.log('Fulfillment update:', {
          id: fulfillment.id,
          status: fulfillment.status,
          trackingNumber: fulfillment.tracking_number,
          trackingCompany: fulfillment.tracking_company,
        });
        // Send tracking info to customer
      }
    }

    // 4. Check for refunds
    if (order.refunds && order.refunds.length > 0) {
      for (const refund of order.refunds) {
        console.log('Refund processed:', {
          id: refund.id,
          createdAt: refund.created_at,
          note: refund.note,
        });
        // Handle refund notifications
      }
    }

    // TODO: Implement actual business logic here
    // - Update order status in database
    // - Send status update emails
    // - Update analytics
    // - Trigger downstream processes
    
  } catch (error) {
    console.error('Error processing updated order:', error);
    throw error;
  }
}