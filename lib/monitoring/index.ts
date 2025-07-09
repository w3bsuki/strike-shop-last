/**
 * 2025 Production Monitoring - Clean Exports
 * Replaces the old broken monitoring system
 */

// Export modern infrastructure
export { logger, log } from '../logging';
// DISABLED: Causing build warnings - export { metrics } from '../telemetry';
import { handleError } from '../errors/api-errors';
import { log } from '../logging';

// Backward compatibility
export const captureShopifyError = (error: unknown, context?: Record<string, string>) => {
  const { message } = handleError(error);
  log.error('Shopify error', { error: message, ...context });
};

export const logWebhookFailed = (type: string, error: unknown) => {
  log.error('Webhook failed', { type, error: error instanceof Error ? error.message : String(error) });
};