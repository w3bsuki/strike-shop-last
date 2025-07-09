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
  
  if (topic !== 'products/create') {
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
    logWebhookEvent('products/create', shopDomain, webhookId, product);

    // Process the new product
    await processNewProduct(product);

    return webhookResponse(true, 'Product created successfully');
  } catch (error) {
    const err = error as Error;
    logWebhookEvent('products/create', shopDomain, webhookId, null, err);
    return webhookResponse(false, err.message);
  }
}

async function processNewProduct(product: ShopifyProduct) {
  try {
    console.log('Processing new product:', {
      productId: product.id,
      title: product.title,
      handle: product.handle,
      vendor: product.vendor,
      productType: product.product_type,
      status: product.status,
      variantCount: product.variants.length,
      imageCount: product.images.length,
    });

    // Process variants
    if (product.variants) {
      for (const variant of product.variants) {
        console.log('Product variant:', {
          variantId: variant.id,
          title: variant.title,
          sku: variant.sku,
          price: variant.price,
          inventoryQuantity: variant.inventory_quantity,
        });
      }
    }

    // Process images
    if (product.images) {
      for (const image of product.images) {
        console.log('Product image:', {
          imageId: image.id,
          position: image.position,
          src: image.src,
        });
      }
    }

    // TODO: Implement actual business logic here
    // - Cache product data for faster access
    // - Update search index (if using Algolia/Elasticsearch)
    // - Generate SEO metadata
    // - Create product recommendations
    // - Send notifications to subscribers
    // - Update product catalog in database
    // - Trigger image optimization
    
  } catch (error) {
    console.error('Error processing new product:', error);
    throw error;
  }
}