/**
 * Shopify Webhooks Module
 * Exports all webhook-related utilities and types
 */

// Export verification utilities
export {
  verifyWebhookSignature,
  checkWebhookRateLimit,
  parseWebhookHeaders,
  validateWebhookPayload,
  createWebhookError,
  logWebhookEvent,
  formatWebhookResponse
} from './verify';

// Export handler utilities
export {
  registerWebhookHandler,
  createWebhookHandler,
  createTopicHandler,
  batchProcessWebhooks,
  retryWebhook
} from './handler';

// Re-export types from webhooks types
export type {
  // Headers and Topics
  ShopifyWebhookHeaders,
  
  // Base Types
  BaseWebhookPayload,
  WebhookPayload,
  WebhookVerificationResult,
  WebhookHandlerResult,
  WebhookHandler,
  
  // Order Types
  OrderWebhookPayload,
  OrderLineItem,
  
  // Product Types
  ProductWebhookPayload,
  
  // Customer Types
  CustomerWebhookPayload,
  
  // Inventory Types
  InventoryItemWebhookPayload,
  InventoryLevelWebhookPayload,
  
  // Collection Types
  CollectionWebhookPayload,
  
  // Fulfillment Types
  FulfillmentWebhookPayload,
  
  // Cart Types
  CartWebhookPayload,
  
  // Shop Types
  ShopWebhookPayload,
  
  // App Types
  AppUninstalledWebhookPayload,
  
  // Registration Types
  WebhookSubscription,
  WebhookRegistrationInput,
  
  // Error Types
  WebhookVerificationError,
  WebhookHandlerError
} from '../types/webhooks';

// Re-export the enum separately for easier access
export { ShopifyWebhookTopic } from '../types/webhooks';