const Sentry = require('@sentry/node');
const { StatsD } = require('node-statsd');
const promClient = require('prom-client');
const winston = require('winston');
const { Logtail } = require('@logtail/node');
const { Papertrail } = require('winston-papertrail').Papertrail;

// Monitoring Configuration
const monitoringConfig = {
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'
    ),
  },
  datadog: {
    host: process.env.DATADOG_AGENT_HOST || 'localhost',
    port: 8125,
    prefix: 'strike.shop.',
  },
  newRelic: {
    appName: process.env.NEW_RELIC_APP_NAME || 'strike-shop',
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    papertrail: {
      host: process.env.PAPERTRAIL_HOST,
      port: process.env.PAPERTRAIL_PORT,
    },
    logtail: {
      sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
    },
  },
};

class MonitoringService {
  constructor() {
    this.metrics = {};
    this.setupSentry();
    this.setupDatadog();
    this.setupPrometheus();
    this.setupLogging();
    this.setupCustomMetrics();
  }

  setupSentry() {
    if (monitoringConfig.sentry.dsn) {
      Sentry.init({
        dsn: monitoringConfig.sentry.dsn,
        environment: monitoringConfig.sentry.environment,
        tracesSampleRate: monitoringConfig.sentry.tracesSampleRate,
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: true }),
        ],
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request?.cookies) {
            delete event.request.cookies;
          }
          if (event.request?.headers?.authorization) {
            event.request.headers.authorization = '[REDACTED]';
          }
          return event;
        },
      });

      console.log('Sentry monitoring initialized');
    }
  }

  setupDatadog() {
    this.statsd = new StatsD({
      host: monitoringConfig.datadog.host,
      port: monitoringConfig.datadog.port,
      prefix: monitoringConfig.datadog.prefix,
      globalTags: {
        env: process.env.NODE_ENV,
        service: 'strike-shop',
        version: process.env.APP_VERSION || 'unknown',
      },
    });

    // Custom Datadog metrics
    this.metrics.datadog = {
      // Business metrics
      orderCreated: () => this.statsd.increment('orders.created'),
      orderCompleted: (amount) => {
        this.statsd.increment('orders.completed');
        this.statsd.gauge('orders.value', amount);
      },
      orderFailed: () => this.statsd.increment('orders.failed'),

      // Performance metrics
      apiLatency: (endpoint, duration) => {
        this.statsd.histogram(`api.latency.${endpoint}`, duration);
      },
      dbQueryTime: (query, duration) => {
        this.statsd.histogram(`db.query.time`, duration, [`query:${query}`]);
      },

      // Infrastructure metrics
      memoryUsage: () => {
        const usage = process.memoryUsage();
        this.statsd.gauge('memory.heap.used', usage.heapUsed);
        this.statsd.gauge('memory.heap.total', usage.heapTotal);
        this.statsd.gauge('memory.rss', usage.rss);
      },

      // Cache metrics
      cacheHit: (key) => this.statsd.increment('cache.hit', [`key:${key}`]),
      cacheMiss: (key) => this.statsd.increment('cache.miss', [`key:${key}`]),
    };
  }

  setupPrometheus() {
    // Create a Registry
    const register = new promClient.Registry();

    // Add default metrics
    promClient.collectDefaultMetrics({ register });

    // Custom metrics
    this.metrics.prometheus = {
      httpRequestDuration: new promClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.5, 1, 2, 5],
        registers: [register],
      }),

      activeConnections: new promClient.Gauge({
        name: 'active_connections',
        help: 'Number of active connections',
        registers: [register],
      }),

      ordersTotal: new promClient.Counter({
        name: 'orders_total',
        help: 'Total number of orders',
        labelNames: ['status'],
        registers: [register],
      }),

      revenueTotal: new promClient.Gauge({
        name: 'revenue_total',
        help: 'Total revenue in cents',
        registers: [register],
      }),

      cartAbandonment: new promClient.Counter({
        name: 'cart_abandonment_total',
        help: 'Number of abandoned carts',
        registers: [register],
      }),
    };

    this.prometheusRegister = register;
  }

  setupLogging() {
    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      }),
    ];

    // Papertrail integration
    if (monitoringConfig.logging.papertrail.host) {
      transports.push(
        new Papertrail({
          host: monitoringConfig.logging.papertrail.host,
          port: monitoringConfig.logging.papertrail.port,
          program: 'strike-shop',
          handleExceptions: true,
        })
      );
    }

    // Logtail integration
    if (monitoringConfig.logging.logtail.sourceToken) {
      const logtail = new Logtail(monitoringConfig.logging.logtail.sourceToken);
      transports.push(
        new winston.transports.Stream({
          stream: {
            write: (message) => {
              const log = JSON.parse(message);
              logtail.log(log);
            },
          },
        })
      );
    }

    this.logger = winston.createLogger({
      level: monitoringConfig.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
      exceptionHandlers: transports,
      rejectionHandlers: transports,
    });

    // Override console methods in production
    if (process.env.NODE_ENV === 'production') {
      console.log = (...args) => this.logger.info(args.join(' '));
      console.error = (...args) => this.logger.error(args.join(' '));
      console.warn = (...args) => this.logger.warn(args.join(' '));
    }
  }

  setupCustomMetrics() {
    // Application-specific metrics
    this.customMetrics = {
      // Track user behavior
      trackUserAction: (action, metadata = {}) => {
        this.statsd.increment(`user.action.${action}`, 1, metadata);
        this.logger.info('User action', { action, ...metadata });
      },

      // Track conversion funnel
      trackFunnelStep: (step, userId) => {
        this.statsd.increment(`funnel.${step}`, 1, [`user:${userId}`]);
      },

      // Track errors by type
      trackError: (error, context = {}) => {
        const errorType = error.name || 'UnknownError';
        this.statsd.increment(`errors.${errorType}`);
        Sentry.captureException(error, { extra: context });
        this.logger.error('Application error', {
          error: error.message,
          ...context,
        });
      },

      // Track feature usage
      trackFeatureUsage: (feature) => {
        this.statsd.increment(`feature.usage.${feature}`);
      },

      // Track API usage
      trackApiUsage: (endpoint, method, statusCode, duration) => {
        this.metrics.prometheus.httpRequestDuration
          .labels(method, endpoint, statusCode.toString())
          .observe(duration / 1000);

        this.metrics.datadog.apiLatency(endpoint, duration);
      },
    };
  }

  // Middleware for Express
  expressMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Track active connections
      this.metrics.prometheus.activeConnections.inc();

      // Capture response
      const originalSend = res.send;
      res.send = function (data) {
        const duration = Date.now() - startTime;
        const route = req.route?.path || req.path;

        // Track metrics
        this.customMetrics.trackApiUsage(
          route,
          req.method,
          res.statusCode,
          duration
        );

        // Decrement active connections
        this.metrics.prometheus.activeConnections.dec();

        return originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  // Health check endpoint data
  getHealthMetrics() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      metrics: {
        prometheus: `/metrics`,
        custom: this.getCustomMetricsSummary(),
      },
    };
  }

  // Prometheus metrics endpoint
  async getPrometheusMetrics() {
    return this.prometheusRegister.metrics();
  }

  getCustomMetricsSummary() {
    // Return summary of custom metrics for monitoring dashboard
    return {
      orders: {
        created: this.statsd.socket.bytesWritten, // Example
        completed: 0,
        failed: 0,
      },
      performance: {
        avgApiLatency: '0ms',
        avgDbQueryTime: '0ms',
      },
      infrastructure: {
        memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        uptime: `${Math.round(process.uptime() / 60)}m`,
      },
    };
  }

  // Alert when thresholds are exceeded
  checkThresholds() {
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const memoryLimit = parseInt(process.env.MEMORY_LIMIT || '4096');

    if (memoryUsage > memoryLimit * 0.9) {
      this.logger.error('Memory usage critical', {
        used: memoryUsage,
        limit: memoryLimit,
        percentage: (memoryUsage / memoryLimit) * 100,
      });

      // Trigger alert
      this.statsd.event(
        'Memory Usage Critical',
        `Memory usage is at ${Math.round((memoryUsage / memoryLimit) * 100)}%`,
        { alert_type: 'error' }
      );
    }
  }
}

// Business metrics tracking
class BusinessMetrics {
  constructor(monitoring) {
    this.monitoring = monitoring;
  }

  trackOrder(order) {
    // Track order metrics
    this.monitoring.metrics.datadog.orderCreated();
    this.monitoring.metrics.prometheus.ordersTotal.labels('created').inc();

    // Track revenue
    if (order.status === 'completed') {
      this.monitoring.metrics.datadog.orderCompleted(order.total);
      this.monitoring.metrics.prometheus.ordersTotal.labels('completed').inc();
      this.monitoring.metrics.prometheus.revenueTotal.inc(order.total);
    }
  }

  trackConversion(stage, userId, metadata = {}) {
    this.monitoring.customMetrics.trackFunnelStep(stage, userId);

    // Special handling for cart abandonment
    if (stage === 'cart_abandoned') {
      this.monitoring.metrics.prometheus.cartAbandonment.inc();
    }
  }

  trackProductView(productId, userId) {
    this.monitoring.customMetrics.trackUserAction('product_view', {
      product_id: productId,
      user_id: userId,
    });
  }

  trackSearchQuery(query, resultsCount) {
    this.monitoring.customMetrics.trackUserAction('search', {
      query: query.substring(0, 50), // Limit query length
      results_count: resultsCount,
    });
  }
}

// Export monitoring instance
const monitoring = new MonitoringService();
const businessMetrics = new BusinessMetrics(monitoring);

module.exports = {
  monitoring,
  businessMetrics,
  Sentry,
};
