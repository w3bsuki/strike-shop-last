const express = require('express');
const { monitoring, businessMetrics } = require('./monitoring-setup');
const DisasterRecoveryManager = require('./disaster-recovery');
const { AlertManager } = require('./alert-configuration');

// Post-Launch Monitoring Dashboard
class PostLaunchMonitor {
  constructor() {
    this.app = express();
    this.alertManager = new AlertManager();
    this.drManager = new DisasterRecoveryManager();
    this.metrics = {
      launch: {
        startTime: new Date(),
        phase: 'soft-launch', // soft-launch, gradual-rollout, full-launch
        trafficPercentage: 10,
      },
      performance: {
        responseTime: [],
        errorRate: [],
        throughput: [],
      },
      business: {
        orders: 0,
        revenue: 0,
        conversionRate: 0,
        cartAbandonment: 0,
      },
      incidents: [],
    };

    this.setupEndpoints();
    this.startMonitoring();
  }

  setupEndpoints() {
    // Real-time dashboard endpoint
    this.app.get('/dashboard', (req, res) => {
      res.json({
        status: 'operational',
        launch: this.metrics.launch,
        performance: this.getPerformanceSummary(),
        business: this.metrics.business,
        alerts: this.alertManager.getActiveAlerts(),
        incidents: this.metrics.incidents,
        recommendations: this.getRecommendations(),
      });
    });

    // Launch phase control
    this.app.post('/launch/phase', express.json(), (req, res) => {
      const { phase, trafficPercentage } = req.body;
      this.updateLaunchPhase(phase, trafficPercentage);
      res.json({ success: true, phase, trafficPercentage });
    });

    // Emergency controls
    this.app.post('/emergency/maintenance', (req, res) => {
      this.enableMaintenanceMode();
      res.json({ success: true, message: 'Maintenance mode enabled' });
    });

    this.app.post('/emergency/rollback', (req, res) => {
      this.initiateRollback();
      res.json({ success: true, message: 'Rollback initiated' });
    });
  }

  startMonitoring() {
    // Monitor every 30 seconds
    setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
      this.updateDashboard();
    }, 30000);

    // Business metrics every minute
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 60000);

    // Start the dashboard server
    const port = process.env.MONITOR_PORT || 3002;
    this.app.listen(port, () => {
      console.log(`Post-launch monitor running on port ${port}`);
    });
  }

  async collectMetrics() {
    try {
      // Collect performance metrics
      const healthCheck = await this.checkSystemHealth();

      this.metrics.performance.responseTime.push({
        timestamp: new Date(),
        value: healthCheck.responseTime,
      });

      this.metrics.performance.errorRate.push({
        timestamp: new Date(),
        value: healthCheck.errorRate,
      });

      this.metrics.performance.throughput.push({
        timestamp: new Date(),
        value: healthCheck.throughput,
      });

      // Keep only last hour of data
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      ['responseTime', 'errorRate', 'throughput'].forEach((metric) => {
        this.metrics.performance[metric] = this.metrics.performance[
          metric
        ].filter((m) => m.timestamp > oneHourAgo);
      });
    } catch (error) {
      console.error('Error collecting metrics:', error);
      this.recordIncident('metric-collection-failed', error.message);
    }
  }

  async checkSystemHealth() {
    // Simulate health check - replace with actual API calls
    return {
      responseTime: Math.random() * 200 + 50, // 50-250ms
      errorRate: Math.random() * 0.02, // 0-2%
      throughput: Math.random() * 1000 + 500, // 500-1500 req/s
    };
  }

  async collectBusinessMetrics() {
    // Collect real business metrics from your systems
    // This is simulated data - replace with actual queries
    this.metrics.business = {
      orders: this.metrics.business.orders + Math.floor(Math.random() * 10),
      revenue: this.metrics.business.revenue + Math.random() * 1000,
      conversionRate: 2.5 + Math.random() * 0.5,
      cartAbandonment: 65 + Math.random() * 10,
    };
  }

  checkThresholds() {
    const latest = {
      responseTime: this.getLatestMetric('responseTime'),
      errorRate: this.getLatestMetric('errorRate'),
      throughput: this.getLatestMetric('throughput'),
    };

    // Launch-specific thresholds (more sensitive during launch)
    const thresholds = {
      'soft-launch': {
        responseTime: 300,
        errorRate: 0.01,
        throughput: 100,
      },
      'gradual-rollout': {
        responseTime: 500,
        errorRate: 0.02,
        throughput: 500,
      },
      'full-launch': {
        responseTime: 1000,
        errorRate: 0.05,
        throughput: 1000,
      },
    };

    const currentThresholds = thresholds[this.metrics.launch.phase];

    // Check response time
    if (latest.responseTime > currentThresholds.responseTime) {
      this.alertManager.sendAlert({
        name: 'High Response Time During Launch',
        severity: 'high',
        message: `Response time ${latest.responseTime}ms exceeds threshold`,
        channels: ['slack', 'pagerDuty'],
      });
    }

    // Check error rate
    if (latest.errorRate > currentThresholds.errorRate) {
      this.alertManager.sendAlert({
        name: 'High Error Rate During Launch',
        severity: 'critical',
        message: `Error rate ${(latest.errorRate * 100).toFixed(2)}% exceeds threshold`,
        channels: ['slack', 'pagerDuty', 'sms'],
      });

      // Auto-rollback if error rate is too high
      if (latest.errorRate > 0.1) {
        console.error(
          'CRITICAL: Error rate exceeds 10%, initiating auto-rollback'
        );
        this.initiateRollback();
      }
    }

    // Check throughput
    if (
      latest.throughput < currentThresholds.throughput &&
      this.metrics.launch.phase === 'full-launch'
    ) {
      this.alertManager.sendAlert({
        name: 'Low Throughput',
        severity: 'medium',
        message: `Throughput ${latest.throughput} req/s below expected`,
        channels: ['slack'],
      });
    }
  }

  getLatestMetric(metricName) {
    const metric = this.metrics.performance[metricName];
    return metric.length > 0 ? metric[metric.length - 1].value : 0;
  }

  getPerformanceSummary() {
    const summary = {};

    ['responseTime', 'errorRate', 'throughput'].forEach((metric) => {
      const values = this.metrics.performance[metric].map((m) => m.value);
      if (values.length > 0) {
        summary[metric] = {
          current: values[values.length - 1],
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          max: Math.max(...values),
          min: Math.min(...values),
        };
      }
    });

    return summary;
  }

  getRecommendations() {
    const recommendations = [];
    const performance = this.getPerformanceSummary();

    // Response time recommendations
    if (performance.responseTime && performance.responseTime.avg > 500) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        action: 'Scale up application instances',
        reason: `Average response time ${performance.responseTime.avg.toFixed(0)}ms is high`,
      });
    }

    // Error rate recommendations
    if (performance.errorRate && performance.errorRate.current > 0.02) {
      recommendations.push({
        type: 'stability',
        priority: 'critical',
        action: 'Investigate error sources immediately',
        reason: `Current error rate ${(performance.errorRate.current * 100).toFixed(2)}% is concerning`,
      });
    }

    // Business recommendations
    if (this.metrics.business.conversionRate < 2) {
      recommendations.push({
        type: 'business',
        priority: 'medium',
        action: 'Review checkout flow for issues',
        reason: 'Conversion rate below target',
      });
    }

    // Launch phase recommendations
    if (
      this.metrics.launch.phase === 'soft-launch' &&
      this.getTimeSinceLaunch() > 2 * 60 * 60 * 1000
    ) {
      // 2 hours
      recommendations.push({
        type: 'launch',
        priority: 'info',
        action: 'Consider moving to gradual rollout phase',
        reason: 'Soft launch has been stable for 2 hours',
      });
    }

    return recommendations;
  }

  updateLaunchPhase(phase, trafficPercentage) {
    this.metrics.launch.phase = phase;
    this.metrics.launch.trafficPercentage = trafficPercentage;

    console.log(
      `Launch phase updated: ${phase} (${trafficPercentage}% traffic)`
    );

    // Update load balancer configuration
    // This would integrate with your actual load balancer
  }

  getTimeSinceLaunch() {
    return Date.now() - this.metrics.launch.startTime.getTime();
  }

  recordIncident(type, details) {
    const incident = {
      id: `INC-${Date.now()}`,
      type,
      details,
      timestamp: new Date(),
      resolved: false,
    };

    this.metrics.incidents.push(incident);

    // Keep only last 100 incidents
    if (this.metrics.incidents.length > 100) {
      this.metrics.incidents = this.metrics.incidents.slice(-100);
    }
  }

  enableMaintenanceMode() {
    console.log('Enabling maintenance mode...');
    // Implementation would update load balancer/CDN to serve maintenance page
    this.recordIncident('maintenance-mode', 'Maintenance mode enabled');
  }

  initiateRollback() {
    console.log('Initiating emergency rollback...');
    // Implementation would trigger actual rollback procedures
    this.recordIncident('rollback', 'Emergency rollback initiated');
  }

  updateDashboard() {
    // In a real implementation, this would push updates to connected clients
    // via WebSocket or Server-Sent Events
  }
}

// Launch the monitor
if (require.main === module) {
  const monitor = new PostLaunchMonitor();

  console.log('Post-Launch Monitor Started');
  console.log('Dashboard: http://localhost:3002/dashboard');
  console.log('');
  console.log('Commands:');
  console.log('- Update phase: POST /launch/phase');
  console.log('- Enable maintenance: POST /emergency/maintenance');
  console.log('- Initiate rollback: POST /emergency/rollback');
}

module.exports = PostLaunchMonitor;
