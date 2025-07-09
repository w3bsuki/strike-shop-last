/**
 * Sentry configuration for server-side (Node.js)
 * This file configures error and performance tracking for API routes and server components
 */

import * as Sentry from '@sentry/nextjs';
import { monitoringConfig } from './lib/monitoring/config';

// Only initialize if Sentry is enabled in config
if (monitoringConfig.sentry.enabled && monitoringConfig.sentry.dsn) {
  Sentry.init({
    dsn: monitoringConfig.sentry.dsn,
    environment: monitoringConfig.sentry.environment,
    release: monitoringConfig.sentry.release,
    
    // Performance Monitoring
    tracesSampleRate: monitoringConfig.sentry.tracesSampleRate,
    
    // Debug
    debug: monitoringConfig.sentry.debug,
    
    // Integrations
    integrations: [
      // HTTP integration for automatic tracing
      Sentry.httpIntegration({
        tracing: true,
        breadcrumbs: true
      }),
      
      // Capture console errors
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn']
      }),
      
      // Node specific integrations
      Sentry.nativeNodeFetchIntegration(),
      
      // Dedupe similar errors
      Sentry.dedupeIntegration()
    ],
    
    // Server-specific error filtering
    ignoreErrors: [
      // Common server errors to ignore
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'EPIPE',
      'ERR_STREAM_DESTROYED',
      // Ignore client disconnections
      'Client network socket disconnected',
      'Request aborted',
      // Ignore health check errors
      'Health check failed'
    ],
    
    // Skip transactions for health checks and static assets
    ignoreTransactions: [
      '/api/health',
      '/api/monitoring/metrics',
      '/_next',
      '/favicon.ico',
      '/robots.txt'
    ],
    
    beforeSend(event, hint) {
      // Add server context
      event.contexts = {
        ...event.contexts,
        runtime: {
          name: 'node',
          version: process.version
        },
        server: {
          memory_usage: process.memoryUsage(),
          uptime: process.uptime()
        }
      };
      
      // Filter out sensitive headers
      if (event.request?.headers) {
        const sensitiveHeaders = [
          'authorization',
          'cookie',
          'x-shopify-access-token',
          'x-shopify-storefront-access-token',
          'stripe-signature',
          'x-stripe-signature'
        ];
        
        sensitiveHeaders.forEach(header => {
          if (event.request!.headers![header]) {
            event.request!.headers![header] = '[REDACTED]';
          }
        });
      }
      
      // Filter out sensitive environment variables
      if (event.extra?.env) {
        const sensitiveEnvVars = Object.keys(event.extra.env).filter(
          key => key.includes('SECRET') || 
                 key.includes('TOKEN') || 
                 key.includes('KEY') ||
                 key.includes('PASSWORD')
        );
        
        sensitiveEnvVars.forEach(key => {
          event.extra!.env[key] = '[REDACTED]';
        });
      }
      
      return event;
    },
    
    // Profiling (requires additional setup)
    profilesSampleRate: monitoringConfig.sentry.tracesSampleRate,
    
    // Transport options
    transportOptions: {
      // Increase timeout for server environments
      requestTimeout: 10000
    }
  });
  
  // Capture unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    Sentry.captureException(reason, {
      extra: {
        promiseInfo: promise,
        unhandled: true
      }
    });
  });
  
  // Capture uncaught exceptions
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error, {
      extra: {
        uncaught: true
      }
    });
    
    // Exit after capturing
    process.exit(1);
  });
}