/**
 * Sentry configuration for client-side (browser)
 * This file configures error and performance tracking for the frontend
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
    
    // Session Replay
    replaysSessionSampleRate: monitoringConfig.sentry.replaysSessionSampleRate,
    replaysOnErrorSampleRate: monitoringConfig.sentry.replaysOnErrorSampleRate,
    
    // Debug
    debug: monitoringConfig.sentry.debug,
    
    // Integrations
    integrations: [
      // Browser specific integrations
      Sentry.browserTracingIntegration({
        // Capture interactions like clicks
        enableInp: true,
        // Capture long tasks
        enableLongTask: true,
        // Trace navigations
        routingInstrumentation: Sentry.nextRouterInstrumentation
      }),
      
      // Session replay
      Sentry.replayIntegration({
        // Mask all text by default for privacy
        maskAllText: true,
        // Block all media to reduce payload size
        blockAllMedia: true,
        // Sample errors for replay
        errorSampleRate: 1.0
      })
    ],
    
    // Client-specific error filtering
    ignoreErrors: [
      // Browser errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      // Network errors that are user-caused
      'NetworkError when attempting to fetch resource',
      'Load failed',
      // Extension errors
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      /^safari-extension:\/\//,
      // Facebook errors
      'fb_xd_fragment',
      // Google Analytics errors
      /^Script error\.?$/,
      // Other common browser errors
      'Network request failed',
      'TypeError: Failed to fetch',
      'TypeError: NetworkError',
      'TypeError: cancelled'
    ],
    
    // Filter out noisy transactions
    ignoreTransactions: [
      '/api/health',
      '/_next/static',
      '/favicon.ico'
    ],
    
    beforeSend(event, hint) {
      // Filter out errors from browser extensions
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('extension://')
      )) {
        return null;
      }
      
      // Add user context if available
      const user = typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('user')
        : null;
        
      if (user) {
        try {
          const userData = JSON.parse(user);
          event.user = {
            id: userData.id,
            email: userData.email,
            username: userData.username
          };
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // Add additional browser context
      event.contexts = {
        ...event.contexts,
        browser: {
          ...event.contexts?.browser,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      };
      
      return event;
    },
    
    // Transport options
    transportOptions: {
      // Retry failed requests
      fetchOptions: {
        keepalive: true
      }
    }
  });
  
  // Track initial page load performance
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: 'Page Load Metrics',
          level: 'info',
          data: {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            domInteractive: navigation.domInteractive - navigation.fetchStart,
            firstByte: navigation.responseStart - navigation.requestStart
          }
        });
      }
    });
  }
}