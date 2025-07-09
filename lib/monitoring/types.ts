/**
 * TypeScript types for monitoring system
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  customerId?: string;
  orderId?: string;
  webhookId?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    duration?: number;
    memory?: number;
  };
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  type?: 'counter' | 'gauge' | 'histogram' | 'timing';
}

export interface AlertRule {
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  cooldown?: number; // Minutes before re-alerting
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  refreshInterval?: number; // Seconds
  timeRange?: '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d';
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'log' | 'chart' | 'table' | 'alert';
  title: string;
  query?: string;
  config?: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WebhookLog {
  id: string;
  topic: string;
  shop: string;
  timestamp: string;
  status: 'received' | 'processing' | 'completed' | 'failed' | 'retried';
  duration?: number;
  attempt?: number;
  error?: string;
  payload?: Record<string, any>;
  response?: Record<string, any>;
}

export interface PerformanceTrace {
  id: string;
  name: string;
  type: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  metadata?: Record<string, any>;
  spans?: PerformanceSpan[];
}

export interface PerformanceSpan {
  id: string;
  parentId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags?: Record<string, any>;
}