/**
 * Webhook-specific logging and monitoring utilities
 * Tracks webhook events, success rates, and processing times
 */

import { logger } from './logger';
import { metrics } from '../telemetry';
import { addBreadcrumb, captureException } from './sentry';
import type { ShopifyWebhookTopic } from '../shopify/types/webhooks';

interface WebhookEvent {
  id: string;
  topic: string;
  shop: string;
  timestamp: string;
  status: 'received' | 'processing' | 'completed' | 'failed' | 'retried';
  duration?: number;
  attempt?: number;
  error?: string;
  payload?: Record<string, any>;
}

interface WebhookMetrics {
  totalReceived: number;
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  successRate: number;
  byTopic: Record<string, {
    received: number;
    processed: number;
    failed: number;
    avgDuration: number;
  }>;
}

class WebhookLogger {
  private events: Map<string, WebhookEvent> = new Map();
  private metrics: WebhookMetrics = {
    totalReceived: 0,
    totalProcessed: 0,
    totalFailed: 0,
    averageProcessingTime: 0,
    successRate: 0,
    byTopic: {}
  };

  /**
   * Log webhook received
   */
  received(webhookId: string, topic: string, shop: string, payload?: Record<string, any>) {
    const event: WebhookEvent = {
      id: webhookId,
      topic,
      shop,
      timestamp: new Date().toISOString(),
      status: 'received',
      payload
    };

    this.events.set(webhookId, event);
    this.metrics.totalReceived++;

    // Initialize topic metrics if needed
    if (!this.metrics.byTopic[topic]) {
      this.metrics.byTopic[topic] = {
        received: 0,
        processed: 0,
        failed: 0,
        avgDuration: 0
      };
    }
    this.metrics.byTopic[topic].received++;

    // Log the event
    logger.info(`Webhook received: ${topic}`, {
      webhook: {
        id: webhookId,
        topic,
        shop,
        status: 'received'
      }
    });

    // Add breadcrumb for Sentry
    addBreadcrumb({
      message: `Webhook received: ${topic}`,
      category: 'webhook',
      data: { webhookId, shop },
      level: 'info'
    });

    // Track metric
    metrics.increment('webhook_received', { topic, shop });
  }

  /**
   * Log webhook processing start
   */
  processing(webhookId: string) {
    const event = this.events.get(webhookId);
    if (!event) return;

    event.status = 'processing';
    
    logger.debug(`Webhook processing: ${event.topic}`, {
      webhook: {
        id: webhookId,
        topic: event.topic,
        status: 'processing'
      }
    });
  }

  /**
   * Log webhook completed successfully
   */
  completed(webhookId: string, duration: number, result?: any) {
    const event = this.events.get(webhookId);
    if (!event) return;

    event.status = 'completed';
    event.duration = duration;
    
    this.metrics.totalProcessed++;
    const topicMetrics = this.metrics.byTopic[event.topic];
    if (topicMetrics) {
      topicMetrics.processed++;
    }
    
    // Update average processing time
    this.updateAverageProcessingTime(event.topic, duration);
    
    // Update success rate
    this.updateSuccessRate();

    // Log the completion
    logger.info(`Webhook completed: ${event.topic}`, {
      webhook: {
        id: webhookId,
        topic: event.topic,
        shop: event.shop,
        status: 'completed',
        duration,
        result: result ? JSON.stringify(result).substring(0, 200) : undefined
      }
    });

    // Track metrics
    metrics.timing('webhook_processing_time', duration, {
      topic: event.topic,
      shop: event.shop,
      status: 'success'
    });
    
    metrics.increment('webhook_completed', {
      topic: event.topic,
      shop: event.shop
    });

    // Clean up old event after 5 minutes
    setTimeout(() => this.events.delete(webhookId), 5 * 60 * 1000);
  }

  /**
   * Log webhook failure
   */
  failed(webhookId: string, error: Error | string, duration?: number) {
    const event = this.events.get(webhookId);
    if (!event) return;

    event.status = 'failed';
    event.error = error instanceof Error ? error.message : error;
    event.duration = duration;
    
    this.metrics.totalFailed++;
    const topicMetrics = this.metrics.byTopic[event.topic];
    if (topicMetrics) {
      topicMetrics.failed++;
    }
    
    // Update success rate
    this.updateSuccessRate();

    // Log the failure
    logger.error(`Webhook failed: ${event.topic}`, {
      webhook: {
        id: webhookId,
        topic: event.topic,
        shop: event.shop,
        status: 'failed',
        error: event.error,
        duration
      }
    });

    // Capture in Sentry
    if (error instanceof Error) {
      captureException(error, {
        topic: event.topic,
        payload: event.payload,
        type: 'webhook_error'
      });
    }

    // Track metrics
    metrics.increment('webhook_failed', {
      topic: event.topic,
      shop: event.shop,
      error: error instanceof Error ? error.name : 'unknown'
    });

    if (duration) {
      metrics.timing('webhook_processing_time', duration, {
        topic: event.topic,
        shop: event.shop,
        status: 'failed'
      });
    }
  }

  /**
   * Log webhook retry
   */
  retried(webhookId: string, attempt: number) {
    const event = this.events.get(webhookId);
    if (!event) return;

    event.status = 'retried';
    event.attempt = attempt;

    logger.warn(`Webhook retry: ${event.topic}`, {
      webhook: {
        id: webhookId,
        topic: event.topic,
        shop: event.shop,
        status: 'retried',
        attempt
      }
    });

    metrics.increment('webhook_retry', {
      topic: event.topic,
      shop: event.shop,
      attempt: attempt.toString()
    });
  }

  /**
   * Get webhook metrics
   */
  getMetrics(): WebhookMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent webhook events
   */
  getRecentEvents(limit: number = 100): WebhookEvent[] {
    const events = Array.from(this.events.values())
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
    
    return events;
  }

  /**
   * Get events by topic
   */
  getEventsByTopic(topic: string, limit: number = 50): WebhookEvent[] {
    return Array.from(this.events.values())
      .filter(event => event.topic === topic)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Clear old events (cleanup)
   */
  cleanup(olderThanHours: number = 24) {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    for (const [id, event] of this.events) {
      if (new Date(event.timestamp).getTime() < cutoff) {
        this.events.delete(id);
      }
    }
    
    logger.info('Webhook logger cleanup completed', {
      removedEvents: this.events.size
    });
  }

  /**
   * Export metrics for monitoring dashboard
   */
  exportMetrics() {
    const topicMetrics = Object.entries(this.metrics.byTopic).map(([topic, stats]) => ({
      topic,
      ...stats,
      successRate: stats.received > 0 
        ? ((stats.processed / stats.received) * 100).toFixed(2) + '%'
        : '0%'
    }));

    return {
      summary: {
        totalReceived: this.metrics.totalReceived,
        totalProcessed: this.metrics.totalProcessed,
        totalFailed: this.metrics.totalFailed,
        successRate: this.metrics.successRate.toFixed(2) + '%',
        averageProcessingTime: this.metrics.averageProcessingTime.toFixed(2) + 'ms'
      },
      byTopic: topicMetrics,
      recentEvents: this.getRecentEvents(20)
    };
  }

  private updateAverageProcessingTime(topic: string, duration: number) {
    const topicMetrics = this.metrics.byTopic[topic];
    if (!topicMetrics) return;
    
    const totalProcessed = topicMetrics.processed;
    
    // Calculate new average
    topicMetrics.avgDuration = 
      (topicMetrics.avgDuration * (totalProcessed - 1) + duration) / totalProcessed;
    
    // Update overall average
    const allDurations = Object.values(this.metrics.byTopic)
      .map(m => m.avgDuration * m.processed)
      .reduce((sum, val) => sum + val, 0);
    
    const totalEvents = Object.values(this.metrics.byTopic)
      .reduce((sum, m) => sum + m.processed, 0);
    
    this.metrics.averageProcessingTime = totalEvents > 0 
      ? allDurations / totalEvents 
      : 0;
  }

  private updateSuccessRate() {
    if (this.metrics.totalReceived === 0) {
      this.metrics.successRate = 0;
      return;
    }
    
    this.metrics.successRate = 
      (this.metrics.totalProcessed / this.metrics.totalReceived) * 100;
  }
}

// Export singleton instance
export const webhookLogger = new WebhookLogger();

// Convenience functions
export const logWebhookReceived = (webhookId: string, topic: string, shop: string, payload?: any) =>
  webhookLogger.received(webhookId, topic, shop, payload);

export const logWebhookProcessing = (webhookId: string) =>
  webhookLogger.processing(webhookId);

export const logWebhookCompleted = (webhookId: string, duration: number, result?: any) =>
  webhookLogger.completed(webhookId, duration, result);

export const logWebhookFailed = (webhookId: string, error: Error | string, duration?: number) =>
  webhookLogger.failed(webhookId, error, duration);

export const logWebhookRetry = (webhookId: string, attempt: number) =>
  webhookLogger.retried(webhookId, attempt);

// Scheduled cleanup (run every 6 hours)
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  setInterval(() => {
    webhookLogger.cleanup(48); // Keep 48 hours of events
  }, 6 * 60 * 60 * 1000);
}