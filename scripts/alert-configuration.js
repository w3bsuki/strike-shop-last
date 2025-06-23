const axios = require('axios');

// Alert Configuration
const alertConfig = {
  channels: {
    slack: {
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#strike-shop-alerts',
    },
    pagerDuty: {
      routingKey: process.env.PAGERDUTY_ROUTING_KEY,
      apiUrl: 'https://events.pagerduty.com/v2/enqueue',
    },
    email: {
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      recipients: {
        critical: ['ops-team@strikebrand.com', 'cto@strikebrand.com'],
        warning: ['ops-team@strikebrand.com'],
        info: ['dev-team@strikebrand.com'],
      },
    },
    sms: {
      twilioSid: process.env.TWILIO_ACCOUNT_SID,
      twilioToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_PHONE_NUMBER,
      criticalRecipients: ['+1234567890'], // CTO's phone
    },
  },

  rules: [
    // Critical Alerts
    {
      name: 'API Down',
      condition: 'api.health_check.failed > 3',
      severity: 'critical',
      channels: ['pagerDuty', 'slack', 'sms'],
      message: 'API health check has failed 3 times consecutively',
    },
    {
      name: 'Database Connection Failed',
      condition: 'database.connection.failed',
      severity: 'critical',
      channels: ['pagerDuty', 'slack', 'sms'],
      message: 'Database connection has been lost',
    },
    {
      name: 'Payment Processing Failed',
      condition: 'payment.processing.error_rate > 0.1',
      severity: 'critical',
      channels: ['pagerDuty', 'slack', 'email'],
      message: 'Payment processing error rate exceeds 10%',
    },
    {
      name: 'Order Processing Queue Backlog',
      condition: 'queue.orders.size > 1000',
      severity: 'critical',
      channels: ['pagerDuty', 'slack'],
      message: 'Order processing queue has over 1000 pending items',
    },

    // High Priority Alerts
    {
      name: 'High Memory Usage',
      condition: 'system.memory.usage > 90',
      severity: 'high',
      channels: ['slack', 'email'],
      message: 'Memory usage exceeds 90%',
    },
    {
      name: 'High CPU Usage',
      condition: 'system.cpu.usage > 85',
      severity: 'high',
      channels: ['slack', 'email'],
      message: 'CPU usage exceeds 85%',
    },
    {
      name: 'Slow API Response',
      condition: 'api.response_time.p95 > 3000',
      severity: 'high',
      channels: ['slack'],
      message: 'API p95 response time exceeds 3 seconds',
    },
    {
      name: 'High Error Rate',
      condition: 'api.error_rate > 0.05',
      severity: 'high',
      channels: ['slack', 'email'],
      message: 'API error rate exceeds 5%',
    },

    // Medium Priority Alerts
    {
      name: 'Disk Space Low',
      condition: 'system.disk.free < 20',
      severity: 'medium',
      channels: ['slack'],
      message: 'Free disk space below 20%',
    },
    {
      name: 'Cache Miss Rate High',
      condition: 'cache.miss_rate > 0.3',
      severity: 'medium',
      channels: ['slack'],
      message: 'Cache miss rate exceeds 30%',
    },
    {
      name: 'Abandoned Cart Rate High',
      condition: 'business.cart_abandonment_rate > 0.7',
      severity: 'medium',
      channels: ['slack', 'email'],
      message: 'Cart abandonment rate exceeds 70%',
    },

    // Business Alerts
    {
      name: 'Daily Revenue Target',
      condition: 'business.daily_revenue < business.daily_target * 0.8',
      severity: 'info',
      channels: ['slack', 'email'],
      message: 'Daily revenue is below 80% of target',
      schedule: '0 20 * * *', // 8 PM daily
    },
    {
      name: 'Low Inventory Alert',
      condition: 'inventory.product.quantity < 10',
      severity: 'medium',
      channels: ['slack', 'email'],
      message: 'Product inventory below 10 units',
    },
    {
      name: 'Spike in Returns',
      condition: 'business.return_rate > 0.1',
      severity: 'high',
      channels: ['slack', 'email'],
      message: 'Return rate exceeds 10%',
    },
  ],

  escalation: {
    rules: [
      {
        severity: 'critical',
        unacknowledgedAfter: 5, // minutes
        escalateTo: 'cto@strikebrand.com',
      },
      {
        severity: 'high',
        unacknowledgedAfter: 15, // minutes
        escalateTo: 'ops-lead@strikebrand.com',
      },
    ],
  },
};

class AlertManager {
  constructor() {
    this.activeAlerts = new Map();
    this.alertHistory = [];
  }

  async sendAlert(alert, data = {}) {
    const alertData = {
      ...alert,
      timestamp: new Date().toISOString(),
      data,
      id: `${alert.name}-${Date.now()}`,
    };

    // Store active alert
    this.activeAlerts.set(alertData.id, alertData);
    this.alertHistory.push(alertData);

    // Send to configured channels
    const promises = alert.channels.map((channel) =>
      this.sendToChannel(channel, alertData)
    );

    await Promise.allSettled(promises);

    // Set up escalation if needed
    if (alert.severity === 'critical' || alert.severity === 'high') {
      this.scheduleEscalation(alertData);
    }

    return alertData.id;
  }

  async sendToChannel(channel, alert) {
    switch (channel) {
      case 'slack':
        return this.sendSlackAlert(alert);
      case 'pagerDuty':
        return this.sendPagerDutyAlert(alert);
      case 'email':
        return this.sendEmailAlert(alert);
      case 'sms':
        return this.sendSMSAlert(alert);
      default:
        console.error(`Unknown alert channel: ${channel}`);
    }
  }

  async sendSlackAlert(alert) {
    if (!alertConfig.channels.slack.webhook) return;

    const color = {
      critical: '#FF0000',
      high: '#FF9900',
      medium: '#FFCC00',
      info: '#0099FF',
    }[alert.severity];

    const payload = {
      channel: alertConfig.channels.slack.channel,
      attachments: [
        {
          color,
          title: `${alert.severity.toUpperCase()}: ${alert.name}`,
          text: alert.message,
          fields: [
            {
              title: 'Time',
              value: new Date(alert.timestamp).toLocaleString(),
              short: true,
            },
            {
              title: 'Alert ID',
              value: alert.id,
              short: true,
            },
          ],
          footer: 'Strike Shop Monitoring',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    if (alert.data && Object.keys(alert.data).length > 0) {
      payload.attachments[0].fields.push({
        title: 'Additional Data',
        value: JSON.stringify(alert.data, null, 2),
        short: false,
      });
    }

    try {
      await axios.post(alertConfig.channels.slack.webhook, payload);
    } catch (error) {
      console.error('Failed to send Slack alert:', error.message);
    }
  }

  async sendPagerDutyAlert(alert) {
    if (!alertConfig.channels.pagerDuty.routingKey) return;
    if (alert.severity !== 'critical' && alert.severity !== 'high') return;

    const payload = {
      routing_key: alertConfig.channels.pagerDuty.routingKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: `${alert.name}: ${alert.message}`,
        severity: alert.severity === 'critical' ? 'critical' : 'warning',
        source: 'strike-shop-monitoring',
        timestamp: alert.timestamp,
        custom_details: alert.data,
      },
    };

    try {
      await axios.post(alertConfig.channels.pagerDuty.apiUrl, payload);
    } catch (error) {
      console.error('Failed to send PagerDuty alert:', error.message);
    }
  }

  async sendEmailAlert(alert) {
    // Implementation depends on email service
    // Using nodemailer or similar
    console.log('Email alert:', alert);
  }

  async sendSMSAlert(alert) {
    if (alert.severity !== 'critical') return;

    // Using Twilio
    const twilio = require('twilio')(
      alertConfig.channels.sms.twilioSid,
      alertConfig.channels.sms.twilioToken
    );

    const message = `CRITICAL ALERT: ${alert.name} - ${alert.message}`;

    for (const recipient of alertConfig.channels.sms.criticalRecipients) {
      try {
        await twilio.messages.create({
          body: message,
          from: alertConfig.channels.sms.fromNumber,
          to: recipient,
        });
      } catch (error) {
        console.error('Failed to send SMS alert:', error.message);
      }
    }
  }

  acknowledgeAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
    }
  }

  resolveAlert(alertId, resolution = '') {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      alert.resolution = resolution;
      this.activeAlerts.delete(alertId);
    }
  }

  scheduleEscalation(alert) {
    const escalationRule = alertConfig.escalation.rules.find(
      (rule) => rule.severity === alert.severity
    );

    if (escalationRule) {
      setTimeout(
        () => {
          if (!alert.acknowledged) {
            this.escalateAlert(alert, escalationRule);
          }
        },
        escalationRule.unacknowledgedAfter * 60 * 1000
      );
    }
  }

  async escalateAlert(alert, rule) {
    console.log(`Escalating alert ${alert.id} to ${rule.escalateTo}`);
    // Send escalation notification
    // Implementation depends on escalation method
  }

  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(-limit);
  }
}

// Alert rule evaluation
class AlertEvaluator {
  constructor(metrics, alertManager) {
    this.metrics = metrics;
    this.alertManager = alertManager;
  }

  async evaluateRules() {
    for (const rule of alertConfig.rules) {
      try {
        const shouldAlert = await this.evaluateCondition(rule.condition);
        if (shouldAlert) {
          await this.alertManager.sendAlert(rule);
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.name}:`, error);
      }
    }
  }

  async evaluateCondition(condition) {
    // Parse and evaluate condition
    // This is a simplified example - in production, use a proper expression evaluator
    const parts = condition.split(' ');
    const metric = parts[0];
    const operator = parts[1];
    const threshold = parseFloat(parts[2]);

    const value = await this.getMetricValue(metric);

    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '=':
      case '==':
        return value === threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  async getMetricValue(metric) {
    // Fetch metric value from monitoring system
    // This would integrate with your metrics backend
    return 0; // Placeholder
  }
}

module.exports = {
  AlertManager,
  AlertEvaluator,
  alertConfig,
};
