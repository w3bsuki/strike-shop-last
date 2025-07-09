import { NextRequest } from 'next/server';
import { 
  verifyShopifyWebhook, 
  webhookResponse, 
  getWebhookTopic, 
  getShopDomain,
  getWebhookId,
  logWebhookEvent 
} from '@/lib/webhooks/shopify-verify';

interface InventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at: string;
}

export async function POST(request: NextRequest) {
  const topic = getWebhookTopic(request.headers);
  const shopDomain = getShopDomain(request.headers);
  const webhookId = getWebhookId(request.headers);
  
  if (topic !== 'inventory_levels/update') {
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

    // Parse inventory data
    const inventoryLevel: InventoryLevel = JSON.parse(rawBody);
    
    // Log the webhook event
    logWebhookEvent('inventory_levels/update', shopDomain, webhookId, inventoryLevel);

    // Process the inventory update
    await processInventoryUpdate(inventoryLevel);

    return webhookResponse(true, 'Inventory updated successfully');
  } catch (error) {
    const err = error as Error;
    logWebhookEvent('inventory_levels/update', shopDomain, webhookId, null, err);
    return webhookResponse(false, err.message);
  }
}

async function processInventoryUpdate(inventoryLevel: InventoryLevel) {
  try {
    console.log('Processing inventory update:', {
      inventoryItemId: inventoryLevel.inventory_item_id,
      locationId: inventoryLevel.location_id,
      available: inventoryLevel.available,
      updatedAt: inventoryLevel.updated_at,
    });

    // Determine inventory status
    let stockStatus = 'in_stock';
    if (inventoryLevel.available <= 0) {
      stockStatus = 'out_of_stock';
    } else if (inventoryLevel.available < 10) {
      stockStatus = 'low_stock';
    }

    console.log('Stock status:', stockStatus);

    // TODO: Implement actual business logic here
    // - Update local inventory cache
    // - Trigger low stock alerts
    // - Update product availability on frontend
    // - Send notifications for back-in-stock items
    // - Update search filters
    // - Sync with warehouse management system
    // - Track inventory history
    
    // Example: Send low stock alert
    if (stockStatus === 'low_stock') {
      console.log('Low stock alert triggered for inventory item:', inventoryLevel.inventory_item_id);
      // TODO: Send alert to inventory manager
    }

    // Example: Handle out of stock
    if (stockStatus === 'out_of_stock') {
      console.log('Item out of stock:', inventoryLevel.inventory_item_id);
      // TODO: Update product visibility, notify customers waiting for restock
    }

  } catch (error) {
    console.error('Error processing inventory update:', error);
    throw error;
  }
}