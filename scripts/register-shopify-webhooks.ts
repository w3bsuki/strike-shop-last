/**
 * Script to register Shopify webhooks
 * Run with: npx tsx scripts/register-shopify-webhooks.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface WebhookConfig {
  topic: string;
  address: string;
}

const WEBHOOK_CONFIGS: WebhookConfig[] = [
  {
    topic: 'orders/create',
    address: '/api/webhooks/shopify/orders/create',
  },
  {
    topic: 'orders/updated',
    address: '/api/webhooks/shopify/orders/updated',
  },
  {
    topic: 'orders/cancelled',
    address: '/api/webhooks/shopify/orders/cancelled',
  },
  {
    topic: 'products/create',
    address: '/api/webhooks/shopify/products/create',
  },
  {
    topic: 'products/update',
    address: '/api/webhooks/shopify/products/update',
  },
  {
    topic: 'inventory_levels/update',
    address: '/api/webhooks/shopify/inventory/update',
  },
  {
    topic: 'customers/create',
    address: '/api/webhooks/shopify/customers/create',
  },
  {
    topic: 'checkouts/create',
    address: '/api/webhooks/shopify/checkouts/create',
  },
];

async function registerWebhook(config: WebhookConfig) {
  const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!shopDomain || !accessToken) {
    throw new Error('Missing required environment variables');
  }

  const webhookUrl = `https://${shopDomain}/admin/api/2024-01/webhooks.json`;
  const fullAddress = `${siteUrl}${config.address}`;

  console.log(`Registering webhook: ${config.topic} -> ${fullAddress}`);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: config.topic,
          address: fullAddress,
          format: 'json',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to register webhook: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Registered: ${config.topic} (ID: ${result.webhook.id})`);
    return result.webhook;
  } catch (error) {
    console.error(`❌ Failed to register ${config.topic}:`, error);
    throw error;
  }
}

async function listWebhooks() {
  const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopDomain || !accessToken) {
    throw new Error('Missing required environment variables');
  }

  const webhookUrl = `https://${shopDomain}/admin/api/2024-01/webhooks.json`;

  try {
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list webhooks: ${response.statusText}`);
    }

    const result = await response.json();
    return result.webhooks;
  } catch (error) {
    console.error('Failed to list webhooks:', error);
    throw error;
  }
}

async function deleteWebhook(id: number) {
  const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopDomain || !accessToken) {
    throw new Error('Missing required environment variables');
  }

  const webhookUrl = `https://${shopDomain}/admin/api/2024-01/webhooks/${id}.json`;

  try {
    const response = await fetch(webhookUrl, {
      method: 'DELETE',
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete webhook: ${response.statusText}`);
    }

    console.log(`✅ Deleted webhook ID: ${id}`);
  } catch (error) {
    console.error(`Failed to delete webhook ${id}:`, error);
    throw error;
  }
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'register':
        console.log('🚀 Registering webhooks...\n');
        for (const config of WEBHOOK_CONFIGS) {
          await registerWebhook(config);
        }
        console.log('\n✨ All webhooks registered successfully!');
        break;

      case 'list':
        console.log('📋 Listing current webhooks...\n');
        const webhooks = await listWebhooks();
        if (webhooks.length === 0) {
          console.log('No webhooks registered.');
        } else {
          webhooks.forEach((webhook: any) => {
            console.log(`- ${webhook.topic}: ${webhook.address} (ID: ${webhook.id})`);
          });
        }
        break;

      case 'cleanup':
        console.log('🧹 Cleaning up webhooks...\n');
        const existingWebhooks = await listWebhooks();
        for (const webhook of existingWebhooks) {
          await deleteWebhook(webhook.id);
        }
        console.log('\n✨ All webhooks deleted!');
        break;

      default:
        console.log(`
Strike Shop - Shopify Webhook Manager

Usage:
  npx tsx scripts/register-shopify-webhooks.ts [command]

Commands:
  register  - Register all webhooks
  list      - List current webhooks
  cleanup   - Delete all webhooks

Environment variables required:
  - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
  - SHOPIFY_ADMIN_ACCESS_TOKEN
  - NEXT_PUBLIC_SITE_URL (optional, defaults to http://localhost:3000)
        `);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();