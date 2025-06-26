// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is serialized and sent to the edge, so only put values here that are okay to be public.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Environments
  environment: process.env.NODE_ENV || 'development',
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'unknown',
  
  // Session tracking
  autoSessionTracking: true,
  
  // Performance Monitoring
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      tracingOrigins: [
        'localhost',
        process.env.NEXT_PUBLIC_APP_URL,
        /^\//,
      ],
      // Capture interactions (clicks, scrolls, etc.)
      routingInstrumentation: Sentry.nextRouterInstrumentation,
    }),
    new Sentry.Replay({
      // Mask all text and inputs by default
      maskAllText: true,
      maskAllInputs: true,
      // Capture 10% of all sessions
      sessionSampleRate: 0.1,
      // Capture 100% of sessions with an error
      errorSampleRate: 1.0,
    }),
  ],
  
  // Filter out specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random plugins/extensions
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.epicplay.com',
    "Can't find variable: ZiteReader",
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'http://loading.retry.widdit.com/',
    'atomicFindClose',
    // Facebook related errors
    'fb_xd_fragment',
    // ISP optimizing proxy - `Cache-Control: no-transform` seems to reduce this
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // See http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    'Non-Error promise rejection captured',
    // Network errors
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    // Stripe errors that are handled
    'Stripe is not defined',
    // React hydration errors (handled gracefully)
    'Hydration failed',
    'There was an error while hydrating',
  ],
  
  // Configure error filtering
  beforeSend(event, hint) {
    // Filter out specific URLs
    if (event.request?.url) {
      const url = event.request.url;
      if (url.includes('chrome-extension://') || url.includes('moz-extension://')) {
        return null;
      }
    }
    
    // Filter development errors
    if (process.env.NODE_ENV !== 'production') {
      console.error('Sentry Event:', event);
      return null;
    }
    
    // Don't send events in development
    if (window.location.hostname === 'localhost') {
      return null;
    }
    
    return event;
  },
  
  // User context
  initialScope: {
    tags: {
      component: 'client',
    },
  },
});