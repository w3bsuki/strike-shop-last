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
  cancelled_at: string;
  cancel_reason?: string;
  currency: string;
  total_price: string;
  subtotal_price: string;
  financial_status: string;
  name: string;
  order_number: number;
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
  }>;
}

export async function POST(request: NextRequest) {
  const topic = getWebhookTopic(request.headers);
  const shopDomain = getShopDomain(request.headers);
  const webhookId = getWebhookId(request.headers);
  
  if (topic !== 'orders/cancelled') {
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
    logWebhookEvent('orders/cancelled', shopDomain, webhookId, order);

    // Process the cancelled order
    await processCancelledOrder(order);

    return webhookResponse(true, 'Order cancellation processed successfully');
  } catch (error) {
    const err = error as Error;
    logWebhookEvent('orders/cancelled', shopDomain, webhookId, null, err);
    return webhookResponse(false, err.message);
  }
}

async function processCancelledOrder(order: ShopifyOrder) {
  try {
    console.log('Processing cancelled order:', {
      orderId: order.id,
      orderNumber: order.order_number,
      cancelledAt: order.cancelled_at,
      cancelReason: order.cancel_reason,
      customerEmail: order.email,
      totalPrice: order.total_price,
    });

    // Cancellation reasons can be:
    // - customer: Customer changed/cancelled order
    // - fraud: Fraudulent order
    // - inventory: Items out of stock
    // - declined: Payment declined
    // - other: Other reasons

    // Handle inventory restoration
    if (order.line_items) {
      for (const item of order.line_items) {
        console.log('Restoring inventory for:', {
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity,
        });
        // TODO: Implement inventory restoration logic
      }
    }

    // Handle refunds if payment was already processed
    if (order.financial_status === 'paid' || order.financial_status === 'partially_paid') {
      console.log('Order requires refund processing:', {
        financialStatus: order.financial_status,
        totalPrice: order.total_price,
      });
      // TODO: Trigger refund process
    }

    // TODO: Implement actual business logic here
    // - Send cancellation email to customer
    // - Update order status in database
    // - Restore inventory levels
    // - Process refunds if applicable
    // - Update analytics
    // - Cancel any pending fulfillments
    
  } catch (error) {
    console.error('Error processing cancelled order:', error);
    throw error;
  }
}