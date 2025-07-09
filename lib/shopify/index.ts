/**
 * Shopify integration exports
 * Centralized export point for all Shopify-related functionality
 */

// Export types
export * from './types';

// Export client
export { 
  ShopifyClient, 
  shopifyClient,
  formatPrice,
  getFirstImageUrl,
  isProductOnSale,
  type ShopifyConfig 
} from './client';

// Import shopifyClient for local use
import { shopifyClient } from './client';

// Add createClient alias for backward compatibility
export const createClient = () => {
  if (!shopifyClient) {
    throw new Error('Shopify client not initialized. Check your environment variables.');
  }
  return shopifyClient;
};

// Export services
export {
  transformShopifyProduct,
  transformShopifyVariant,
  transformShopifyCollection,
  ShopifyService,
  shopifyService
} from './services';

// Export customer service
export { 
  ShopifyCustomerService, 
  createCustomerService 
} from './customer';