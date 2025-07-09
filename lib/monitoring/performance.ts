/**
 * Performance monitoring utilities
 * Tracks API performance, database queries, and critical operations
 */

import { logger } from './logger';
import { metrics } from '../telemetry';
import { startTransaction, measureAsync } from './sentry';

interface PerformanceEntry {
  name: string;
  type: 'api' | 'db' | 'cache' | 'external' | 'render' | 'custom';
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  api: number;
  db: number;
  cache: number;
  external: number;
  render: number;
  custom: number;
}

interface PerformanceReport {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  slowestOperations: PerformanceEntry[];
  byType: Record<string, {
    count: number;
    avgDuration: number;
    p95Duration: number;
    p99Duration: number;
  }>;
}

class PerformanceMonitor {
  private entries: Map<string, PerformanceEntry> = new Map();
  private completedEntries: PerformanceEntry[] = [];
  private thresholds: PerformanceThresholds = {
    api: 1000,      // 1 second
    db: 100,        // 100ms
    cache: 50,      // 50ms
    external: 2000, // 2 seconds
    render: 100,    // 100ms
    custom: 500     // 500ms
  };

  /**
   * Start monitoring a performance entry
   */
  start(name: string, type: PerformanceEntry['type'], metadata?: Record<string, any>): string {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const entry: PerformanceEntry = {
      name,
      type,
      startTime: performance.now(),
      status: 'pending',
      metadata
    };

    this.entries.set(id, entry);

    logger.debug(`Performance monitoring started: ${name}`, {
      performance: {
        id,
        name,
        type,
        metadata
      }
    });

    return id;
  }

  /**
   * End monitoring and record the duration
   */
  end(id: string, status: 'success' | 'error' = 'success', metadata?: Record<string, any>) {
    const entry = this.entries.get(id);
    if (!entry) {
      logger.warn(`Performance entry not found: ${id}`);
      return;
    }

    entry.endTime = performance.now();
    entry.duration = entry.endTime - entry.startTime;
    entry.status = status;
    
    if (metadata) {
      entry.metadata = { ...entry.metadata, ...metadata };
    }

    // Move to completed entries
    this.entries.delete(id);
    this.completedEntries.push(entry);

    // Check if operation exceeded threshold
    const threshold = this.thresholds[entry.type];
    const isSlowOperation = entry.duration > threshold;

    // Log the performance
    const logLevel = isSlowOperation ? 'warn' : 'debug';
    logger[logLevel](`Performance: ${entry.name}`, {
      performance: {
        id,
        name: entry.name,
        type: entry.type,
        duration: Math.round(entry.duration * 100) / 100,
        status: entry.status,
        slow: isSlowOperation,
        threshold,
        metadata: entry.metadata
      }
    });

    // Track metrics
    metrics.timing(`performance_${entry.type}`, entry.duration, {
      name: entry.name,
      status: entry.status,
      slow: isSlowOperation.toString()
    });

    // Clean up old entries (keep last 1000)
    if (this.completedEntries.length > 1000) {
      this.completedEntries = this.completedEntries.slice(-1000);
    }
  }

  /**
   * Monitor an async operation
   */
  async monitor<T>(
    name: string,
    type: PerformanceEntry['type'],
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.start(name, type, metadata);

    try {
      const result = await operation();
      this.end(id, 'success');
      return result;
    } catch (error) {
      this.end(id, 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Monitor with Sentry integration
   */
  async monitorWithSentry<T>(
    name: string,
    type: PerformanceEntry['type'],
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return measureAsync(name, async () => {
      return this.monitor(name, type, operation, metadata);
    }, { op: type });
  }

  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
    
    logger.info('Performance thresholds updated', {
      thresholds: this.thresholds
    });
  }

  /**
   * Get performance report
   */
  getReport(lastMinutes: number = 5): PerformanceReport {
    const cutoff = Date.now() - (lastMinutes * 60 * 1000);
    const recentEntries = this.completedEntries.filter(
      entry => entry.startTime > cutoff
    );

    const successfulOps = recentEntries.filter(e => e.status === 'success');
    const failedOps = recentEntries.filter(e => e.status === 'error');

    // Calculate metrics by type
    const byType: Record<string, any> = {};
    const types = ['api', 'db', 'cache', 'external', 'render', 'custom'] as const;

    for (const type of types) {
      const typeEntries = successfulOps.filter(e => e.type === type);
      if (typeEntries.length === 0) continue;

      const durations = typeEntries
        .map(e => e.duration!)
        .sort((a, b) => a - b);

      byType[type] = {
        count: typeEntries.length,
        avgDuration: Math.round(
          durations.reduce((sum, d) => sum + d, 0) / durations.length
        ),
        p95Duration: Math.round(durations[Math.floor(durations.length * 0.95)] || 0),
        p99Duration: Math.round(durations[Math.floor(durations.length * 0.99)] || 0)
      };
    }

    // Get slowest operations
    const slowestOperations = [...recentEntries]
      .filter(e => e.duration !== undefined)
      .sort((a, b) => b.duration! - a.duration!)
      .slice(0, 10);

    return {
      totalOperations: recentEntries.length,
      successfulOperations: successfulOps.length,
      failedOperations: failedOps.length,
      averageDuration: successfulOps.length > 0
        ? Math.round(
            successfulOps.reduce((sum, e) => sum + e.duration!, 0) / successfulOps.length
          )
        : 0,
      slowestOperations,
      byType
    };
  }

  /**
   * Get operations exceeding thresholds
   */
  getSlowOperations(limit: number = 20): PerformanceEntry[] {
    return this.completedEntries
      .filter(entry => {
        if (!entry.duration) return false;
        return entry.duration > this.thresholds[entry.type];
      })
      .sort((a, b) => b.duration! - a.duration!)
      .slice(0, limit);
  }

  /**
   * Clear old entries
   */
  cleanup(olderThanMinutes: number = 60) {
    const cutoff = Date.now() - (olderThanMinutes * 60 * 1000);
    
    this.completedEntries = this.completedEntries.filter(
      entry => entry.startTime > cutoff
    );

    logger.info('Performance monitor cleanup completed', {
      remainingEntries: this.completedEntries.length
    });
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions for common operations
export const monitorApi = async <T>(
  endpoint: string,
  operation: () => Promise<T>,
  method?: string
): Promise<T> => {
  return performanceMonitor.monitor(
    `API: ${method || 'GET'} ${endpoint}`,
    'api',
    operation,
    { endpoint, method }
  );
};

export const monitorDb = async <T>(
  query: string,
  operation: () => Promise<T>
): Promise<T> => {
  return performanceMonitor.monitor(
    `DB: ${query}`,
    'db',
    operation,
    { query }
  );
};

export const monitorCache = async <T>(
  key: string,
  operation: () => Promise<T>,
  action: 'get' | 'set' | 'delete' = 'get'
): Promise<T> => {
  return performanceMonitor.monitor(
    `Cache: ${action} ${key}`,
    'cache',
    operation,
    { key, action }
  );
};

export const monitorExternal = async <T>(
  service: string,
  operation: () => Promise<T>,
  details?: Record<string, any>
): Promise<T> => {
  return performanceMonitor.monitor(
    `External: ${service}`,
    'external',
    operation,
    { service, ...details }
  );
};

export const monitorRender = async <T>(
  component: string,
  operation: () => Promise<T>
): Promise<T> => {
  return performanceMonitor.monitor(
    `Render: ${component}`,
    'render',
    operation,
    { component }
  );
};

// React component performance tracking
export function measureComponentPerformance(componentName: string) {
  const id = performanceMonitor.start(`Component: ${componentName}`, 'render');
  
  return () => {
    performanceMonitor.end(id);
  };
}

// Next.js API route wrapper
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  handler: T,
  name?: string
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as Request;
    const url = new URL(request.url);
    const operationName = name || `${request.method} ${url.pathname}`;
    
    return performanceMonitor.monitorWithSentry(
      operationName,
      'api',
      () => handler(...args),
      {
        method: request.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams)
      }
    );
  }) as T;
}

// Scheduled cleanup
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  setInterval(() => {
    performanceMonitor.cleanup(120); // Keep 2 hours of data
  }, 30 * 60 * 1000); // Run every 30 minutes
}