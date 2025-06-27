/**
 * Payment Monitoring Service
 * Real-time monitoring and alerting for payment events
 */

import { kv } from '@vercel/kv';
import { logSecurityEvent } from '@/lib/security-config';

export interface PaymentEvent {
  id: string;
  type: 'payment_intent.created' | 'payment_intent.succeeded' | 'payment_intent.failed' | 
        'charge.dispute.created' | 'charge.refunded' | 'payment_method.attached' |
        'fraud_alert' | 'manual_review_required';
  timestamp: string;
  userId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  metadata?: Record<string, any>;
  riskScore?: number;
  errorMessage?: string;
}

export interface PaymentMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalAmount: number;
  averageAmount: number;
  disputes: number;
  refunds: number;
  fraudAlerts: number;
  conversionRate: number;
  failureRate: number;
}

export interface AnomalyAlert {
  id: string;
  type: 'velocity' | 'amount' | 'pattern' | 'geographic' | 'failure_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  timestamp: string;
}

export class PaymentMonitoringService {
  private static readonly MONITORING_WINDOW = 3600; // 1 hour in seconds
  private static readonly ALERT_THRESHOLDS = {
    FAILURE_RATE: 0.15, // 15% failure rate
    DISPUTE_RATE: 0.01, // 1% dispute rate
    HIGH_RISK_RATE: 0.05, // 5% high-risk transactions
    VELOCITY_SPIKE: 2.0, // 2x normal velocity
  };

  /**
   * Log a payment event
   */
  static async logEvent(event: PaymentEvent): Promise<void> {
    try {
      // Store event
      const eventKey = `payment_event:${event.id}`;
      await kv.setex(eventKey, 2592000, event); // 30 days retention

      // Update time-series data
      const hourKey = `payment_metrics:${new Date().toISOString().substring(0, 13)}`;
      const dayKey = `payment_metrics:${new Date().toISOString().substring(0, 10)}`;

      // Increment counters
      await Promise.all([
        kv.hincrby(hourKey, 'total', 1),
        kv.hincrby(dayKey, 'total', 1),
        kv.expire(hourKey, 86400), // 24 hour retention
        kv.expire(dayKey, 604800), // 7 day retention
      ]);

      // Track specific event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await Promise.all([
            kv.hincrby(hourKey, 'successful', 1),
            kv.hincrby(dayKey, 'successful', 1),
            event.amount ? kv.hincrby(hourKey, 'total_amount', event.amount) : Promise.resolve(),
            event.amount ? kv.hincrby(dayKey, 'total_amount', event.amount) : Promise.resolve(),
          ]);
          break;

        case 'payment_intent.failed':
          await Promise.all([
            kv.hincrby(hourKey, 'failed', 1),
            kv.hincrby(dayKey, 'failed', 1),
          ]);
          
          // Check for failure spike
          await this.checkFailureSpike();
          break;

        case 'charge.dispute.created':
          await Promise.all([
            kv.hincrby(hourKey, 'disputes', 1),
            kv.hincrby(dayKey, 'disputes', 1),
          ]);
          
          // Immediate alert for disputes
          await this.createAlert({
            id: `alert_${Date.now()}`,
            type: 'pattern',
            severity: 'high',
            message: `New dispute created for amount ${event.amount}`,
            details: event.metadata || {},
            timestamp: new Date().toISOString(),
          });
          break;

        case 'fraud_alert':
          await Promise.all([
            kv.hincrby(hourKey, 'fraud_alerts', 1),
            kv.hincrby(dayKey, 'fraud_alerts', 1),
          ]);
          break;
      }

      // Check for anomalies
      if (event.riskScore && event.riskScore > 70) {
        await this.checkHighRiskPattern(event);
      }

      // Log high-value transactions
      if (event.amount && event.amount > 100000) { // £1000+
        logSecurityEvent('High-value transaction', {
          eventId: event.id,
          amount: event.amount,
          userId: event.userId,
          riskScore: event.riskScore,
        });
      }
    } catch (error) {
      logSecurityEvent('Payment monitoring error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId: event.id,
      });
    }
  }

  /**
   * Get current payment metrics
   */
  static async getMetrics(timeframe: 'hour' | 'day' = 'hour'): Promise<PaymentMetrics> {
    try {
      const key = timeframe === 'hour' 
        ? `payment_metrics:${new Date().toISOString().substring(0, 13)}`
        : `payment_metrics:${new Date().toISOString().substring(0, 10)}`;

      const metrics = await kv.hgetall(key);

      const total = Number(metrics?.total || 0);
      const successful = Number(metrics?.successful || 0);
      const failed = Number(metrics?.failed || 0);
      const totalAmount = Number(metrics?.total_amount || 0);
      const disputes = Number(metrics?.disputes || 0);
      const refunds = Number(metrics?.refunds || 0);
      const fraudAlerts = Number(metrics?.fraud_alerts || 0);

      return {
        totalTransactions: total,
        successfulTransactions: successful,
        failedTransactions: failed,
        totalAmount,
        averageAmount: successful > 0 ? totalAmount / successful : 0,
        disputes,
        refunds,
        fraudAlerts,
        conversionRate: total > 0 ? successful / total : 0,
        failureRate: total > 0 ? failed / total : 0,
      };
    } catch (error) {
      logSecurityEvent('Failed to get payment metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeframe,
      });
      
      // Return empty metrics on error
      return {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        totalAmount: 0,
        averageAmount: 0,
        disputes: 0,
        refunds: 0,
        fraudAlerts: 0,
        conversionRate: 0,
        failureRate: 0,
      };
    }
  }

  /**
   * Check for failure spike
   */
  private static async checkFailureSpike(): Promise<void> {
    const metrics = await this.getMetrics('hour');
    
    if (metrics.failureRate > this.ALERT_THRESHOLDS.FAILURE_RATE) {
      await this.createAlert({
        id: `alert_failure_${Date.now()}`,
        type: 'failure_spike',
        severity: 'high',
        message: `High failure rate detected: ${(metrics.failureRate * 100).toFixed(1)}%`,
        details: {
          failureRate: metrics.failureRate,
          failedTransactions: metrics.failedTransactions,
          totalTransactions: metrics.totalTransactions,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Check for high-risk transaction patterns
   */
  private static async checkHighRiskPattern(event: PaymentEvent): Promise<void> {
    if (!event.userId) return;

    const userRiskKey = `high_risk:${event.userId}:${new Date().toISOString().substring(0, 10)}`;
    const riskCount = await kv.incr(userRiskKey);
    await kv.expire(userRiskKey, 86400);

    if (riskCount > 3) {
      await this.createAlert({
        id: `alert_risk_${Date.now()}`,
        type: 'pattern',
        severity: 'critical',
        message: `Multiple high-risk transactions from user ${event.userId}`,
        details: {
          userId: event.userId,
          riskCount,
          latestRiskScore: event.riskScore,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Create and store an alert
   */
  private static async createAlert(alert: AnomalyAlert): Promise<void> {
    try {
      // Store alert
      const alertKey = `payment_alert:${alert.id}`;
      await kv.setex(alertKey, 604800, alert); // 7 days retention

      // Add to alert queue
      const queueKey = `alert_queue:${new Date().toISOString().substring(0, 10)}`;
      await kv.lpush(queueKey, alert.id);
      await kv.expire(queueKey, 172800); // 2 days retention

      // Log critical alerts
      if (alert.severity === 'critical' || alert.severity === 'high') {
        logSecurityEvent('Payment anomaly detected', {
          alertId: alert.id,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          details: alert.details,
        });

        // In production, send notifications (email, Slack, etc.)
        // await this.sendAlertNotification(alert);
      }
    } catch (error) {
      logSecurityEvent('Failed to create alert', {
        error: error instanceof Error ? error.message : 'Unknown error',
        alert,
      });
    }
  }

  /**
   * Get recent alerts
   */
  static async getRecentAlerts(limit: number = 10): Promise<AnomalyAlert[]> {
    try {
      const queueKey = `alert_queue:${new Date().toISOString().substring(0, 10)}`;
      const alertIds = await kv.lrange(queueKey, 0, limit - 1);

      const alerts = await Promise.all(
        alertIds.map(async (id) => {
          const alert = await kv.get<AnomalyAlert>(`payment_alert:${id}`);
          return alert;
        })
      );

      return alerts.filter(Boolean) as AnomalyAlert[];
    } catch (error) {
      logSecurityEvent('Failed to get recent alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Generate payment analytics report
   */
  static async generateReport(days: number = 7): Promise<{
    summary: PaymentMetrics;
    trends: Record<string, PaymentMetrics>;
    alerts: AnomalyAlert[];
    recommendations: string[];
  }> {
    try {
      // Get metrics for each day
      const trends: Record<string, PaymentMetrics> = {};
      const endDate = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().substring(0, 10);
        
        const key = `payment_metrics:${dateKey}`;
        const dayMetrics = await kv.hgetall(key);
        
        if (dayMetrics) {
          trends[dateKey] = {
            totalTransactions: Number(dayMetrics.total || 0),
            successfulTransactions: Number(dayMetrics.successful || 0),
            failedTransactions: Number(dayMetrics.failed || 0),
            totalAmount: Number(dayMetrics.total_amount || 0),
            averageAmount: Number(dayMetrics.successful || 0) > 0 
              ? Number(dayMetrics.total_amount || 0) / Number(dayMetrics.successful || 0) 
              : 0,
            disputes: Number(dayMetrics.disputes || 0),
            refunds: Number(dayMetrics.refunds || 0),
            fraudAlerts: Number(dayMetrics.fraud_alerts || 0),
            conversionRate: Number(dayMetrics.total || 0) > 0 
              ? Number(dayMetrics.successful || 0) / Number(dayMetrics.total || 0) 
              : 0,
            failureRate: Number(dayMetrics.total || 0) > 0 
              ? Number(dayMetrics.failed || 0) / Number(dayMetrics.total || 0) 
              : 0,
          };
        }
      }

      // Calculate summary
      const summary = Object.values(trends).reduce((acc, metrics) => ({
        totalTransactions: acc.totalTransactions + metrics.totalTransactions,
        successfulTransactions: acc.successfulTransactions + metrics.successfulTransactions,
        failedTransactions: acc.failedTransactions + metrics.failedTransactions,
        totalAmount: acc.totalAmount + metrics.totalAmount,
        averageAmount: 0, // Calculate after
        disputes: acc.disputes + metrics.disputes,
        refunds: acc.refunds + metrics.refunds,
        fraudAlerts: acc.fraudAlerts + metrics.fraudAlerts,
        conversionRate: 0, // Calculate after
        failureRate: 0, // Calculate after
      }), {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        totalAmount: 0,
        averageAmount: 0,
        disputes: 0,
        refunds: 0,
        fraudAlerts: 0,
        conversionRate: 0,
        failureRate: 0,
      });

      // Calculate rates
      if (summary.successfulTransactions > 0) {
        summary.averageAmount = summary.totalAmount / summary.successfulTransactions;
      }
      if (summary.totalTransactions > 0) {
        summary.conversionRate = summary.successfulTransactions / summary.totalTransactions;
        summary.failureRate = summary.failedTransactions / summary.totalTransactions;
      }

      // Get recent alerts
      const alerts = await this.getRecentAlerts(20);

      // Generate recommendations
      const recommendations: string[] = [];

      if (summary.failureRate > 0.1) {
        recommendations.push('High failure rate detected. Review payment gateway configuration and error logs.');
      }

      if (summary.disputes > summary.totalTransactions * 0.01) {
        recommendations.push('Dispute rate exceeds 1%. Review fraud prevention measures and customer communication.');
      }

      if (summary.fraudAlerts > summary.totalTransactions * 0.05) {
        recommendations.push('High number of fraud alerts. Consider implementing additional verification steps.');
      }

      if (summary.averageAmount > 100000) {
        recommendations.push('High average transaction value. Ensure proper 3DS authentication is enabled.');
      }

      const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
      if (criticalAlerts > 0) {
        recommendations.push(`${criticalAlerts} critical alerts require immediate attention.`);
      }

      return {
        summary,
        trends,
        alerts: alerts.slice(0, 10), // Top 10 alerts
        recommendations,
      };
    } catch (error) {
      logSecurityEvent('Failed to generate payment report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        days,
      });
      
      throw error;
    }
  }

  /**
   * Monitor chargebacks
   */
  static async trackChargeback(chargebackData: {
    chargeId: string;
    amount: number;
    reason: string;
    userId?: string;
  }): Promise<void> {
    try {
      // Log chargeback event
      await this.logEvent({
        id: `chargeback_${chargebackData.chargeId}`,
        type: 'charge.dispute.created',
        timestamp: new Date().toISOString(),
        userId: chargebackData.userId,
        amount: chargebackData.amount,
        metadata: {
          reason: chargebackData.reason,
          chargeId: chargebackData.chargeId,
        },
      });

      // Track chargeback patterns
      if (chargebackData.userId) {
        const userChargebackKey = `chargebacks:${chargebackData.userId}`;
        const chargebackCount = await kv.incr(userChargebackKey);
        await kv.expire(userChargebackKey, 7776000); // 90 days

        if (chargebackCount > 2) {
          await this.createAlert({
            id: `alert_chargeback_${Date.now()}`,
            type: 'pattern',
            severity: 'critical',
            message: `Multiple chargebacks from user ${chargebackData.userId}`,
            details: {
              userId: chargebackData.userId,
              chargebackCount,
              latestAmount: chargebackData.amount,
              reason: chargebackData.reason,
            },
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      logSecurityEvent('Failed to track chargeback', {
        error: error instanceof Error ? error.message : 'Unknown error',
        chargebackData,
      });
    }
  }
}