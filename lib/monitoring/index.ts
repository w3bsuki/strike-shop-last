/**
 * 2025 Production Monitoring - Clean Exports
 * Replaces the old broken monitoring system
 */

// Export modern infrastructure
export { logger, log } from '../logging';
import { handleError } from '../errors/api-errors';
import { log } from '../logging';

// Simple metrics stub to fix build errors
export const metrics = {
  increment: (name: string, tags?: Record<string, string>) => {
    log.debug(`Metric: ${name}`, tags);
  },
  gauge: (name: string, value: number, tags?: Record<string, string>) => {
    log.debug(`Metric: ${name} = ${value}`, tags);
  },
  histogram: (name: string, value: number, tags?: Record<string, string>) => {
    log.debug(`Metric: ${name} = ${value}`, tags);
  }
};

// Backward compatibility
export const captureShopifyError = (error: unknown, context?: Record<string, string>) => {
  const { message } = handleError(error);
  log.error('Shopify error', { error: message, ...context });
};

export const logWebhookFailed = (type: string, error: unknown) => {
  log.error('Webhook failed', { type, error: error instanceof Error ? error.message : String(error) });
};