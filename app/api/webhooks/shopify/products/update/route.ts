import { NextRequest } from 'next/server';
import { 
  verifyShopifyWebhook, 
  webhookResponse, 
  getWebhookTopic, 
  getShopDomain,
  getWebhookId,
  logWebhookEvent 
} from '@/lib/webhooks/shopify-verify';

interface ShopifyProduct {
  id: number;
  admin_graphql_api_id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  tags: string;
  status: string;
  handle: string;
  variants: Array<{
    id: number;
    product_id: number;
    title: string;
    price: string;
    sku: string;
    position: number;
    inventory_policy: string;
    compare_at_price: string | null;
    fulfillment_service: string;
    inventory_management: string | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    created_at: string;
    updated_at: string;
    taxable: boolean;
    barcode: string | null;
    grams: number;
    weight: number;
    weight_unit: string;
    inventory_quantity: number;
    requires_shipping: boolean;
  }>;
  options: Array<{
    id: number;
    product_id: number;
    name: string;
    position: number;
    values: string[];
  }>;
  images: Array<{
    id: number;
    product_id: number;
    position: number;
    created_at: string;
    updated_at: string;
    alt: string | null;
    width: number;
    height: number;
    src: string;
  }>;
}

export async function POST(request: NextRequest) {
  const topic = getWebhookTopic(request.headers);
  const shopDomain = getShopDomain(request.headers);
  const webhookId = getWebhookId(request.headers);
  
  if (topic !== 'products/update') {
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

    // Parse product data
    const product: ShopifyProduct = JSON.parse(rawBody);
    
    // Log the webhook event
    logWebhookEvent('products/update', shopDomain, webhookId, product);

    // Process the updated product
    await processUpdatedProduct(product);

    return webhookResponse(true, 'Product updated successfully');
  } catch (error) {
    const err = error as Error;
    logWebhookEvent('products/update', shopDomain, webhookId, null, err);
    return webhookResponse(false, err.message);
  }
}

async function processUpdatedProduct(product: ShopifyProduct) {
  try {
    console.log('Processing updated product:', {
      productId: product.id,
      title: product.title,
      handle: product.handle,
      status: product.status,
      updatedAt: product.updated_at,
      publishedAt: product.published_at,
    });

    // Check what might have changed
    const updates = {
      title: product.title,
      description: product.body_html,
      status: product.status,
      tags: product.tags,
      vendor: product.vendor,
      productType: product.product_type,
    };

    console.log('Product updates:', updates);

    // Process variant updates
    if (product.variants) {
      for (const variant of product.variants) {
        console.log('Updated variant:', {
          variantId: variant.id,
          price: variant.price,
          compareAtPrice: variant.compare_at_price,
          inventoryQuantity: variant.inventory_quantity,
          sku: variant.sku,
        });
      }
    }

    // Check for new/updated images
    if (product.images) {
      console.log(`Product has ${product.images.length} images`);
    }

    // TODO: Implement actual business logic here
    // - Update cached product data
    // - Update search index
    // - Clear CDN cache for product pages
    // - Update product recommendations
    // - Notify customers if price dropped
    // - Update SEO metadata
    // - Sync inventory changes
    // - Track price history
    
  } catch (error) {
    console.error('Error processing updated product:', error);
    throw error;
  }
}