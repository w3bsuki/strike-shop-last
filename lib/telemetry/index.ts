/**
 * Telemetry Module - Production-Ready Monitoring
 * Exports all telemetry functionality for the application
 */

// Initialize telemetry configuration
import './config';

// Export metrics functionality
export {
  productionMetrics as metrics,
  trackEvent,
  trackPageView,
  trackApiCall,
  trackShopifyOperation,
  trackCartAction,
  trackCheckout,
  type MetricAttributes,
} from './metrics';

// Export telemetry configuration
export { initializeTelemetry } from './config';