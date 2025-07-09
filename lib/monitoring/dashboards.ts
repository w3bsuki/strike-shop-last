/**
 * Monitoring dashboard configurations
 * Pre-configured dashboards for different monitoring scenarios
 */

import { MonitoringDashboard } from './types';

export const dashboards: Record<string, MonitoringDashboard> = {
  // Main system overview dashboard
  overview: {
    id: 'overview',
    name: 'System Overview',
    description: 'High-level overview of system health and performance',
    refreshInterval: 30,
    timeRange: '1h',
    widgets: [
      {
        id: 'error-rate',
        type: 'metric',
        title: 'Error Rate',
        query: 'rate(errors_total[5m])',
        config: {
          format: 'percentage',
          thresholds: [
            { value: 0.01, color: 'green' },
            { value: 0.05, color: 'yellow' },
            { value: 0.1, color: 'red' }
          ]
        },
        position: { x: 0, y: 0, width: 3, height: 2 }
      },
      {
        id: 'api-latency',
        type: 'chart',
        title: 'API Response Time',
        query: 'histogram_quantile(0.95, api_duration_seconds_bucket[5m])',
        config: {
          chartType: 'line',
          unit: 'ms',
          showLegend: true
        },
        position: { x: 3, y: 0, width: 6, height: 3 }
      },
      {
        id: 'active-users',
        type: 'metric',
        title: 'Active Users',
        query: 'count(distinct(user_id))',
        config: {
          format: 'number',
          sparkline: true
        },
        position: { x: 9, y: 0, width: 3, height: 2 }
      },
      {
        id: 'recent-errors',
        type: 'log',
        title: 'Recent Errors',
        query: 'level:error',
        config: {
          limit: 10,
          showTimestamp: true,
          showLevel: true
        },
        position: { x: 0, y: 3, width: 12, height: 4 }
      }
    ]
  },

  // Shopify integration dashboard
  shopify: {
    id: 'shopify',
    name: 'Shopify Integration',
    description: 'Monitor Shopify API calls and webhook processing',
    refreshInterval: 60,
    timeRange: '6h',
    widgets: [
      {
        id: 'webhook-success-rate',
        type: 'metric',
        title: 'Webhook Success Rate',
        query: 'webhook_success_rate',
        config: {
          format: 'percentage',
          thresholds: [
            { value: 0.95, color: 'green' },
            { value: 0.9, color: 'yellow' },
            { value: 0.8, color: 'red' }
          ]
        },
        position: { x: 0, y: 0, width: 4, height: 2 }
      },
      {
        id: 'webhook-processing-time',
        type: 'chart',
        title: 'Webhook Processing Time by Topic',
        query: 'webhook_processing_time_by_topic',
        config: {
          chartType: 'bar',
          unit: 'ms',
          groupBy: 'topic'
        },
        position: { x: 4, y: 0, width: 8, height: 3 }
      },
      {
        id: 'api-rate-limit',
        type: 'metric',
        title: 'API Rate Limit Usage',
        query: 'shopify_api_rate_limit_usage',
        config: {
          format: 'percentage',
          thresholds: [
            { value: 0.5, color: 'green' },
            { value: 0.8, color: 'yellow' },
            { value: 0.95, color: 'red' }
          ]
        },
        position: { x: 0, y: 2, width: 4, height: 2 }
      },
      {
        id: 'recent-webhooks',
        type: 'table',
        title: 'Recent Webhooks',
        query: 'recent_webhooks',
        config: {
          columns: ['timestamp', 'topic', 'shop', 'status', 'duration'],
          limit: 20,
          sortBy: 'timestamp',
          sortOrder: 'desc'
        },
        position: { x: 0, y: 4, width: 12, height: 4 }
      }
    ]
  },

  // Performance monitoring dashboard
  performance: {
    id: 'performance',
    name: 'Performance Monitoring',
    description: 'Detailed performance metrics and slow operations',
    refreshInterval: 30,
    timeRange: '1h',
    widgets: [
      {
        id: 'web-vitals',
        type: 'chart',
        title: 'Core Web Vitals',
        query: 'web_vitals',
        config: {
          chartType: 'multi-line',
          metrics: ['lcp', 'fid', 'cls'],
          showThresholds: true
        },
        position: { x: 0, y: 0, width: 6, height: 3 }
      },
      {
        id: 'slow-operations',
        type: 'table',
        title: 'Slowest Operations',
        query: 'slow_operations',
        config: {
          columns: ['timestamp', 'name', 'type', 'duration', 'status'],
          limit: 15,
          highlightSlow: true
        },
        position: { x: 6, y: 0, width: 6, height: 3 }
      },
      {
        id: 'db-performance',
        type: 'chart',
        title: 'Database Query Performance',
        query: 'db_query_duration',
        config: {
          chartType: 'heatmap',
          unit: 'ms',
          buckets: [10, 50, 100, 250, 500, 1000]
        },
        position: { x: 0, y: 3, width: 12, height: 3 }
      },
      {
        id: 'cache-hit-rate',
        type: 'metric',
        title: 'Cache Hit Rate',
        query: 'cache_hit_rate',
        config: {
          format: 'percentage',
          sparkline: true,
          thresholds: [
            { value: 0.9, color: 'green' },
            { value: 0.7, color: 'yellow' },
            { value: 0.5, color: 'red' }
          ]
        },
        position: { x: 0, y: 6, width: 3, height: 2 }
      }
    ]
  },

  // E-commerce metrics dashboard
  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce Metrics',
    description: 'Business metrics for the online store',
    refreshInterval: 300, // 5 minutes
    timeRange: '24h',
    widgets: [
      {
        id: 'order-volume',
        type: 'chart',
        title: 'Order Volume',
        query: 'orders_created',
        config: {
          chartType: 'area',
          interval: '1h',
          showTotal: true
        },
        position: { x: 0, y: 0, width: 6, height: 3 }
      },
      {
        id: 'conversion-rate',
        type: 'metric',
        title: 'Conversion Rate',
        query: 'conversion_rate',
        config: {
          format: 'percentage',
          comparison: 'previousPeriod',
          sparkline: true
        },
        position: { x: 6, y: 0, width: 3, height: 2 }
      },
      {
        id: 'average-order-value',
        type: 'metric',
        title: 'Average Order Value',
        query: 'average_order_value',
        config: {
          format: 'currency',
          currency: 'GBP',
          comparison: 'previousPeriod'
        },
        position: { x: 9, y: 0, width: 3, height: 2 }
      },
      {
        id: 'cart-abandonment',
        type: 'metric',
        title: 'Cart Abandonment Rate',
        query: 'cart_abandonment_rate',
        config: {
          format: 'percentage',
          thresholds: [
            { value: 0.6, color: 'green' },
            { value: 0.7, color: 'yellow' },
            { value: 0.8, color: 'red' }
          ]
        },
        position: { x: 6, y: 2, width: 3, height: 2 }
      },
      {
        id: 'popular-products',
        type: 'table',
        title: 'Top Products',
        query: 'top_products',
        config: {
          columns: ['product_name', 'views', 'add_to_cart', 'purchases', 'revenue'],
          limit: 10,
          sortBy: 'revenue',
          sortOrder: 'desc'
        },
        position: { x: 0, y: 3, width: 12, height: 4 }
      }
    ]
  },

  // Security monitoring dashboard
  security: {
    id: 'security',
    name: 'Security Monitoring',
    description: 'Security events and threat detection',
    refreshInterval: 60,
    timeRange: '6h',
    widgets: [
      {
        id: 'failed-logins',
        type: 'metric',
        title: 'Failed Login Attempts',
        query: 'failed_login_attempts',
        config: {
          format: 'number',
          thresholds: [
            { value: 10, color: 'green' },
            { value: 50, color: 'yellow' },
            { value: 100, color: 'red' }
          ]
        },
        position: { x: 0, y: 0, width: 3, height: 2 }
      },
      {
        id: 'suspicious-activity',
        type: 'alert',
        title: 'Security Alerts',
        query: 'security_alerts',
        config: {
          severity: ['high', 'critical'],
          showResolved: false
        },
        position: { x: 3, y: 0, width: 9, height: 2 }
      },
      {
        id: 'rate-limit-violations',
        type: 'chart',
        title: 'Rate Limit Violations',
        query: 'rate_limit_violations',
        config: {
          chartType: 'stacked-bar',
          groupBy: 'endpoint',
          interval: '15m'
        },
        position: { x: 0, y: 2, width: 12, height: 3 }
      },
      {
        id: 'blocked-ips',
        type: 'table',
        title: 'Blocked IP Addresses',
        query: 'blocked_ips',
        config: {
          columns: ['ip', 'reason', 'timestamp', 'country', 'requests'],
          limit: 20,
          refreshInterval: 300
        },
        position: { x: 0, y: 5, width: 12, height: 3 }
      }
    ]
  }
};

// Helper function to get dashboard by ID
export function getDashboard(id: string): MonitoringDashboard | undefined {
  return dashboards[id];
}

// Helper function to list all dashboards
export function listDashboards(): Array<{ id: string; name: string; description?: string }> {
  return Object.entries(dashboards).map(([id, dashboard]) => ({
    id,
    name: dashboard.name,
    description: dashboard.description
  }));
}