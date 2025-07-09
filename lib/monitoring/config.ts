/**
 * Monitoring configuration
 * Centralized configuration for all monitoring services
 */

import { LogLevel } from './types';

// Environment detection
const ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = ENV === 'production';
const IS_STAGING = process.env.VERCEL_ENV === 'preview' || process.env.APP_ENV === 'staging';
const IS_DEVELOPMENT = ENV === 'development';

// Monitoring configuration
export const monitoringConfig = {
  // Logging configuration
  logging: {
    level: (process.env.LOG_LEVEL || (IS_PRODUCTION ? 'info' : 'debug')) as LogLevel,
    console: {
      enabled: true,
      format: IS_PRODUCTION ? 'json' : 'pretty'
    },
    file: {
      enabled: IS_PRODUCTION || IS_STAGING,
      directory: process.env.LOG_DIR || 'logs',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      compress: true
    },
    remote: {
      enabled: IS_PRODUCTION,
      endpoint: process.env.LOG_REMOTE_ENDPOINT,
      apiKey: process.env.LOG_REMOTE_API_KEY
    }
  },

  // Sentry configuration
  sentry: {
    enabled: !!(process.env.NEXT_PUBLIC_SENTRY_DSN && (IS_PRODUCTION || IS_STAGING)),
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 0,
    replaysOnErrorSampleRate: IS_PRODUCTION ? 1.0 : 0,
    debug: IS_DEVELOPMENT,
    attachStacktrace: true,
    autoSessionTracking: true,
    normalizeDepth: 5
  },

  // Performance thresholds (in milliseconds)
  performance: {
    thresholds: {
      api: parseInt(process.env.PERF_THRESHOLD_API || '1000', 10),
      db: parseInt(process.env.PERF_THRESHOLD_DB || '100', 10),
      cache: parseInt(process.env.PERF_THRESHOLD_CACHE || '50', 10),
      external: parseInt(process.env.PERF_THRESHOLD_EXTERNAL || '2000', 10),
      render: parseInt(process.env.PERF_THRESHOLD_RENDER || '100', 10),
      custom: parseInt(process.env.PERF_THRESHOLD_CUSTOM || '500', 10)
    },
    sampling: {
      enabled: IS_PRODUCTION,
      rate: parseFloat(process.env.PERF_SAMPLING_RATE || '0.1')
    }
  },

  // Metrics configuration
  metrics: {
    enabled: IS_PRODUCTION || IS_STAGING,
    flushInterval: parseInt(process.env.METRICS_FLUSH_INTERVAL || '60000', 10), // 1 minute
    batchSize: parseInt(process.env.METRICS_BATCH_SIZE || '100', 10),
    endpoint: process.env.METRICS_ENDPOINT,
    apiKey: process.env.METRICS_API_KEY
  },

  // Alert configuration
  alerts: {
    enabled: IS_PRODUCTION,
    channels: {
      email: {
        enabled: !!process.env.ALERT_EMAIL_ENABLED,
        recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
        from: process.env.ALERT_EMAIL_FROM || 'alerts@strike-shop.com'
      },
      slack: {
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_ALERT_CHANNEL || '#alerts'
      },
      pagerduty: {
        enabled: !!process.env.PAGERDUTY_INTEGRATION_KEY,
        integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY
      }
    },
    rules: [
      {
        name: 'High Error Rate',
        condition: 'error_rate > 0.05', // 5% error rate
        severity: 'critical',
        channels: ['slack', 'pagerduty']
      },
      {
        name: 'Slow API Response',
        condition: 'api_p95_duration > 5000', // 5 seconds
        severity: 'warning',
        channels: ['slack']
      },
      {
        name: 'Webhook Failures',
        condition: 'webhook_failure_rate > 0.1', // 10% failure rate
        severity: 'high',
        channels: ['slack', 'email']
      },
      {
        name: 'Memory Usage High',
        condition: 'memory_usage_percent > 90',
        severity: 'critical',
        channels: ['pagerduty']
      }
    ]
  },

  // Retention policies
  retention: {
    logs: {
      development: 1, // 1 day
      staging: 7,     // 7 days
      production: 30  // 30 days
    },
    metrics: {
      raw: 7,         // 7 days
      aggregated: 90  // 90 days
    },
    events: {
      webhook: 2,     // 2 days
      performance: 1  // 1 day
    }
  },

  // Security settings
  security: {
    // Fields to always redact from logs
    redactedFields: [
      'password',
      'token',
      'secret',
      'apiKey',
      'api_key',
      'authorization',
      'cookie',
      'session',
      'creditCard',
      'credit_card',
      'cvv',
      'ssn',
      'x-shopify-access-token',
      'x-shopify-storefront-access-token',
      'stripe-signature',
      'x-stripe-signature'
    ],
    // Patterns to redact
    redactPatterns: [
      /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g,
      /sk_[a-zA-Z0-9]{24,}/g, // Stripe secret keys
      /pk_[a-zA-Z0-9]{24,}/g, // Stripe public keys
      /shpat_[a-zA-Z0-9]{32}/g, // Shopify access tokens
      /shpss_[a-zA-Z0-9]{32}/g, // Shopify storefront tokens
    ],
    // IP anonymization
    anonymizeIp: IS_PRODUCTION
  },

  // Integration settings
  integrations: {
    shopify: {
      logQueries: !IS_PRODUCTION,
      logVariables: !IS_PRODUCTION,
      slowQueryThreshold: 1000 // 1 second
    },
    stripe: {
      logRequests: !IS_PRODUCTION,
      logWebhooks: true
    }
  }
};

// Export helper to check if monitoring is enabled
export const isMonitoringEnabled = () => {
  return IS_PRODUCTION || IS_STAGING || process.env.FORCE_MONITORING === 'true';
};

// Export environment helpers
export const environment = {
  isProduction: IS_PRODUCTION,
  isStaging: IS_STAGING,
  isDevelopment: IS_DEVELOPMENT,
  current: ENV
};