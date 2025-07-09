/**
 * Shopify Orders/Create Webhook Handler
 * Processes new order creation events from Shopify
 */

import { 
  createTopicHandler, 
  type OrderWebhookPayload,
  type WebhookHandlerResult,
  type ShopifyWebhookTopic
} from '@/lib/shopify/webhooks';
import { createClient } from '@/lib/supabase/server';
import { sendOrderConfirmation } from '@/lib/email/resend';

/**
 * Handle order creation webhook
 */
async function handleOrderCreate(
  payload: OrderWebhookPayload
): Promise<WebhookHandlerResult> {
  try {
    console.log(`Processing order creation: ${payload.name} (${payload.id})`);

    // Extract order data
    const {
      id,
      name,
      email,
      total_price,
      currency,
      financial_status,
      fulfillment_status,
      line_items,
      customer,
      shipping_address,
      billing_address,
      created_at
    } = payload;

    // Save order to Supabase for quick access
    const supabase = await createClient();
    
    const { data: savedOrder, error: dbError } = await supabase
      .from('shopify_orders')
      .insert({
        shopify_order_id: id.toString(),
        shopify_order_name: name,
        shopify_order_number: payload.order_number,
        email: email || customer?.email,
        customer_id: customer?.id?.toString(),
        total_amount: parseFloat(total_price),
        currency: currency,
        financial_status: financial_status,
        fulfillment_status: fulfillment_status || 'unfulfilled',
        line_items: line_items.map(item => ({
          id: item.id,
          title: item.title,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku
        })),
        shipping_address: shipping_address,
        billing_address: billing_address,
        tags: payload.tags?.split(',').map(tag => tag.trim()) || [],
        note: payload.note,
        created_at: created_at,
        shopify_created_at: created_at
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save order to database:', dbError);
      // Don't fail the webhook - we still want to process it
    } else {
      console.log(`Order saved to database: ${savedOrder.id}`);
    }

    // Send order confirmation email
    if (email || customer?.email) {
      const customerEmail = email || customer?.email!;
      const customerName = customer 
        ? `${customer.first_name} ${customer.last_name}`.trim()
        : shipping_address?.name || 'Customer';

      const emailResult = await sendOrderConfirmation({
        order: {
          id: id.toString(),
          order_number: payload.order_number,
          name: name,
          total_price: total_price,
          financial_status: financial_status,
          fulfillment_status: fulfillment_status || 'unfulfilled',
          created_at: created_at,
          currency: currency,
          customer: {
            email: customerEmail
          }
        },
        customerEmail,
        customerName
      });

      if (!emailResult.success) {
        console.error('Failed to send order confirmation email:', emailResult.error);
        // Don't fail webhook for email errors
      } else {
        console.log(`Order confirmation email sent to ${customerEmail}`);
      }
    }

    // Update inventory if needed
    // This would typically trigger another process or queue job
    if (line_items.length > 0) {
      console.log(`Order contains ${line_items.length} items - inventory update may be needed`);
    }

    // Trigger any additional workflows
    // For example: analytics, fulfillment, loyalty points, etc.

    return {
      success: true,
      message: `Order ${name} processed successfully`,
      data: {
        orderId: id,
        orderName: name,
        savedToDb: !!savedOrder,
        emailSent: email ? true : false
      }
    };

  } catch (error) {
    console.error('Error processing order webhook:', error);
    
    // Save failed webhook for retry
    try {
      const supabase = await createClient();
      await supabase
        .from('webhook_retry_queue')
        .insert({
          webhook_type: 'shopify_order_create',
          webhook_id: payload.id.toString(),
          payload: payload,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          retry_count: 0,
          max_retries: 3,
          next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });
    } catch (retryError) {
      console.error('Failed to queue webhook for retry:', retryError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process order webhook'
    };
  }
}

// Export the route handler
export const POST = createTopicHandler(
  'orders/create' as ShopifyWebhookTopic,
  handleOrderCreate,
  {
    onError: (error) => {
      // Additional error handling/monitoring
      console.error('[Order Create Webhook Error]', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  }
);