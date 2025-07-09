/**
 * Sentry configuration for Edge Runtime
 * This file configures error tracking for Edge functions and middleware
 */

import * as Sentry from '@sentry/nextjs';
import { monitoringConfig } from './lib/monitoring/config';

// Only initialize if Sentry is enabled in config
if (monitoringConfig.sentry.enabled && monitoringConfig.sentry.dsn) {
  Sentry.init({
    dsn: monitoringConfig.sentry.dsn,
    environment: monitoringConfig.sentry.environment,
    release: monitoringConfig.sentry.release,
    
    // Lower sample rate for edge to reduce overhead
    tracesSampleRate: monitoringConfig.sentry.tracesSampleRate * 0.5,
    
    // Debug
    debug: false, // Always disable in edge for performance
    
    // Edge-specific configuration
    integrations: [
      // Basic integrations only for edge runtime
      Sentry.dedupeIntegration()
    ],
    
    // Minimal error filtering for edge
    ignoreErrors: [
      'EdgeRuntimeError',
      'FetchError'
    ],
    
    beforeSend(event) {
      // Add edge context
      event.contexts = {
        ...event.contexts,
        runtime: {
          name: 'edge',
          // @ts-ignore - Edge runtime global
          version: globalThis.EdgeRuntime?.version || 'unknown'
        }
      };
      
      // Keep events minimal for edge runtime
      delete event.extra;
      delete event.modules;
      
      return event;
    }
  });
}