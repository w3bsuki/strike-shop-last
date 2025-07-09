/**
 * Initialize monitoring services
 * This should be imported early in your application
 */

import { initSentry } from './sentry';
import { logger } from './logger';
import { performanceMonitor } from './performance';
import { monitoringConfig, isMonitoringEnabled } from './config';

// Track initialization status
let initialized = false;

/**
 * Initialize all monitoring services
 */
export function initializeMonitoring() {
  if (initialized) {
    return;
  }

  try {
    // Initialize Sentry first for error tracking
    if (monitoringConfig.sentry.enabled) {
      initSentry();
    }

    // Set performance thresholds
    performanceMonitor.setThresholds(monitoringConfig.performance.thresholds);

    // Log initialization
    logger.info('Monitoring services initialized', {
      environment: monitoringConfig.sentry.environment,
      sentryEnabled: monitoringConfig.sentry.enabled,
      metricsEnabled: monitoringConfig.metrics.enabled,
      loggingLevel: monitoringConfig.logging.level
    });

    initialized = true;
  } catch (error) {
    console.error('Failed to initialize monitoring:', error);
  }
}

// Initialize on import if monitoring is enabled
if (isMonitoringEnabled()) {
  initializeMonitoring();
}

// Export initialization status
export function isInitialized(): boolean {
  return initialized;
}