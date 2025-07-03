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