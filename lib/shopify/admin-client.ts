/**
 * Shopify Admin API Client
 * Handles backend operations like Markets, inventory, orders
 * Uses Admin API token for privileged operations
 */

import { GraphQLClient } from 'graphql-request';

export interface ShopifyAdminConfig {
  domain: string;
  adminAccessToken: string;
  apiVersion?: string;
}

export class ShopifyAdminClient {
  private client: GraphQLClient;

  constructor(config: ShopifyAdminConfig) {
    const endpoint = `https://${config.domain}/admin/api/${config.apiVersion || '2025-04'}/graphql.json`;
    
    this.client = new GraphQLClient(endpoint, {
      headers: {
        'X-Shopify-Access-Token': config.adminAccessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  async query<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    try {
      console.log('[ShopifyAdminClient] Making Admin API request');
      const result = await this.client.request<T>(query, variables);
      console.log('[ShopifyAdminClient] Admin API response received');
      return result;
    } catch (error) {
      console.error('Shopify Admin API error:', error);
      throw error;
    }
  }

  // Markets Management
  async getMarkets(): Promise<any> {
    const query = `
      query getMarkets {
        markets(first: 50) {
          nodes {
            id
            name
            handle
            enabled
            primary
            webPresence {
              defaultLocale {
                name
                isoCode
              }
              alternateLocales {
                name
                isoCode
              }
            }
            priceList {
              id
              name
              currency
            }
            regions(first: 50) {
              nodes {
                id
                name
                countries {
                  code
                  name
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.query<{ markets: { nodes: any[] } }>(query);
    return response.markets.nodes;
  }

  async createMarket(input: {
    name: string;
    handle: string;
    regions: string[]; // Country codes
    currency: string;
    defaultLocale: string;
  }): Promise<any> {
    const mutation = `
      mutation createMarket($input: MarketCreateInput!) {
        marketCreate(input: $input) {
          market {
            id
            name
            handle
            enabled
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const marketInput = {
      name: input.name,
      handle: input.handle,
      enabled: true,
      regions: input.regions.map(countryCode => ({
        countryCode,
      })),
      webPresence: {
        defaultLocale: input.defaultLocale,
      },
    };

    const response = await this.query<{
      marketCreate: {
        market: any;
        userErrors: Array<{ field: string; message: string }>;
      };
    }>(mutation, { input: marketInput });

    if (response.marketCreate.userErrors.length > 0) {
      throw new Error(`Market creation failed: ${response.marketCreate.userErrors[0]?.message || 'Unknown error'}`);
    }

    return response.marketCreate.market;
  }

  // Currency and Pricing
  async updateMarketPricing(marketId: string, adjustmentPercentage: number): Promise<any> {
    const mutation = `
      mutation updateMarketPricing($marketId: ID!, $priceListId: ID!, $percentage: Float!) {
        priceListFixedPricesAdd(
          priceListId: $priceListId
          prices: []
        ) {
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Note: This is a simplified implementation
    // In production, you'd need to update specific product prices
    console.log(`Would update market ${marketId} pricing by ${adjustmentPercentage}%`);
    return { success: true };
  }

  // Inventory Management
  async getInventoryLevels(locationId?: string): Promise<any> {
    const query = `
      query getInventoryLevels($locationId: ID) {
        inventoryItems(first: 250) {
          nodes {
            id
            sku
            tracked
            inventoryLevels(first: 10, locationIds: [$locationId]) {
              nodes {
                id
                available
                location {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.query<{
      inventoryItems: { nodes: any[] };
    }>(query, locationId ? { locationId } : {});

    return response.inventoryItems.nodes;
  }

  async updateInventoryLevel(inventoryItemId: string, locationId: string, availableQuantity: number): Promise<any> {
    const mutation = `
      mutation inventoryAdjustQuantity($input: InventoryAdjustQuantityInput!) {
        inventoryAdjustQuantity(input: $input) {
          inventoryLevel {
            id
            available
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input = {
      inventoryLevelId: `gid://shopify/InventoryLevel/${inventoryItemId}?inventory_item_id=${inventoryItemId}&location_id=${locationId}`,
      availableDelta: availableQuantity,
    };

    const response = await this.query<{
      inventoryAdjustQuantity: {
        inventoryLevel: any;
        userErrors: Array<{ field: string; message: string }>;
      };
    }>(mutation, { input });

    if (response.inventoryAdjustQuantity.userErrors.length > 0) {
      throw new Error(`Inventory update failed: ${response.inventoryAdjustQuantity.userErrors[0]?.message || 'Unknown error'}`);
    }

    return response.inventoryAdjustQuantity.inventoryLevel;
  }

  // Order Management
  async getOrders(customerId?: string, limit: number = 50): Promise<any> {
    const query = `
      query getOrders($customerId: ID, $first: Int!) {
        orders(first: $first, query: $customerId ? "customer_id:${customerId}" : "") {
          nodes {
            id
            name
            email
            createdAt
            updatedAt
            totalPrice
            currencyCode
            financialStatus
            fulfillmentStatus
            customer {
              id
              email
              firstName
              lastName
            }
            lineItems(first: 10) {
              nodes {
                id
                name
                quantity
                variant {
                  id
                  title
                  price
                }
              }
            }
            shippingAddress {
              firstName
              lastName
              address1
              city
              province
              country
              zip
            }
          }
        }
      }
    `;

    const response = await this.query<{ orders: { nodes: any[] } }>(query, {
      customerId,
      first: limit,
    });

    return response.orders.nodes;
  }

  // Webhooks
  async createWebhook(topic: string, endpoint: string): Promise<any> {
    const mutation = `
      mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          webhookSubscription {
            id
            callbackUrl
            topic
            format
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input = {
      callbackUrl: endpoint,
      format: 'JSON',
    };

    const response = await this.query<{
      webhookSubscriptionCreate: {
        webhookSubscription: any;
        userErrors: Array<{ field: string; message: string }>;
      };
    }>(mutation, { topic: topic.toUpperCase(), webhookSubscription: input });

    if (response.webhookSubscriptionCreate.userErrors.length > 0) {
      throw new Error(`Webhook creation failed: ${response.webhookSubscriptionCreate.userErrors[0]?.message || 'Unknown error'}`);
    }

    return response.webhookSubscriptionCreate.webhookSubscription;
  }
}

// Environment validation and client initialization
const validateAdminConfig = () => {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  
  if (!domain || !token) {
    console.warn('⚠️ Shopify Admin API not configured. Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN');
    return null;
  }
  
  return { domain, token };
};

const config = validateAdminConfig();

// Initialize admin client
export const shopifyAdminClient = config ? new ShopifyAdminClient({
  domain: config.domain,
  adminAccessToken: config.token,
  apiVersion: '2025-04',
}) : null;

// Export service functions
export const ShopifyAdminService = {
  // Markets
  async getMarkets() {
    if (!shopifyAdminClient) throw new Error('Admin API not configured');
    return shopifyAdminClient.getMarkets();
  },

  async createMarket(marketData: {
    name: string;
    handle: string;
    regions: string[];
    currency: string;
    defaultLocale: string;
  }) {
    if (!shopifyAdminClient) throw new Error('Admin API not configured');
    return shopifyAdminClient.createMarket(marketData);
  },

  // Inventory
  async getInventoryLevels(locationId?: string) {
    if (!shopifyAdminClient) throw new Error('Admin API not configured');
    return shopifyAdminClient.getInventoryLevels(locationId);
  },

  async updateInventoryLevel(inventoryItemId: string, locationId: string, quantity: number) {
    if (!shopifyAdminClient) throw new Error('Admin API not configured');
    return shopifyAdminClient.updateInventoryLevel(inventoryItemId, locationId, quantity);
  },

  // Orders
  async getCustomerOrders(customerId: string) {
    if (!shopifyAdminClient) throw new Error('Admin API not configured');
    return shopifyAdminClient.getOrders(customerId);
  },

  // Webhooks
  async setupWebhook(topic: string, endpoint: string) {
    if (!shopifyAdminClient) throw new Error('Admin API not configured');
    return shopifyAdminClient.createWebhook(topic, endpoint);
  },
};