/**
 * Centralized monitoring exports
 * Provides logging, metrics, and error tracking
 */

export * from './logger';
export * from './metrics';
export * from './error-tracker';

// Import main instances
import { logger } from './logger';
import { metrics } from './metrics';
import { errorTracker } from './error-tracker';

// Re-export main instances
export { logger, metrics, errorTracker };

// Combined monitoring utilities
export const monitoring = {
  // Log with context
  log: (message: string, data?: any) => {
    logger.info(message, data);
  },

  // Track performance
  track: (eventName: string, properties?: any) => {
    metrics.increment(eventName, properties);
  },

  // Capture errors
  error: (error: Error | any, context?: any) => {
    errorTracker.captureException(error, context);
  },

  // Time async operations
  time: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      logger.info(`Timing: ${label}`, { duration });
      metrics.timing(label, duration);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      logger.error(`Timing failed: ${label}`, error);
      metrics.timing(label, duration, { error: 'true' });
      
      throw error;
    }
  },
};