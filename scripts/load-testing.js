const autocannon = require('autocannon');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

// Load Testing Configuration
const loadTestConfig = {
  baseUrl: process.env.LOAD_TEST_URL || 'https://api.strikebrand.com',
  scenarios: {
    // Normal traffic pattern
    normal: {
      duration: '5m',
      connections: 100,
      pipelining: 10,
      scenarios: [
        { path: '/store/products', weight: 40 },
        { path: '/store/products/:id', weight: 30 },
        { path: '/store/cart', weight: 20 },
        { path: '/store/checkout', weight: 10 },
      ],
    },

    // Black Friday simulation
    blackFriday: {
      duration: '10m',
      connections: 1000,
      pipelining: 50,
      scenarios: [
        { path: '/store/products', weight: 30 },
        { path: '/store/products/:id', weight: 25 },
        { path: '/store/cart', weight: 25 },
        { path: '/store/checkout', weight: 20 },
      ],
    },

    // Flash sale spike
    flashSale: {
      duration: '2m',
      connections: 2000,
      pipelining: 100,
      scenarios: [
        { path: '/store/products/flash-sale-item', weight: 60 },
        { path: '/store/cart', weight: 30 },
        { path: '/store/checkout', weight: 10 },
      ],
    },

    // Sustained high load
    sustained: {
      duration: '30m',
      connections: 500,
      pipelining: 25,
      scenarios: [
        { path: '/store/products', weight: 35 },
        { path: '/store/products/:id', weight: 30 },
        { path: '/store/cart', weight: 20 },
        { path: '/store/checkout', weight: 15 },
      ],
    },
  },

  thresholds: {
    latency: {
      p50: 200, // 50th percentile should be under 200ms
      p95: 1000, // 95th percentile should be under 1s
      p99: 3000, // 99th percentile should be under 3s
    },
    errorRate: 0.01, // Less than 1% errors
    throughput: 1000, // At least 1000 req/s
  },
};

class LoadTester {
  constructor() {
    this.results = [];
    this.testId = Date.now().toString();
  }

  async runScenario(scenarioName) {
    const scenario = loadTestConfig.scenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }

    console.log(`Starting load test scenario: ${scenarioName}`);
    console.log(
      `Duration: ${scenario.duration}, Connections: ${scenario.connections}`
    );

    const results = await this.executeTest(scenario);
    await this.analyzeResults(results, scenarioName);

    return results;
  }

  async executeTest(scenario) {
    const startTime = performance.now();
    const results = [];

    for (const endpoint of scenario.scenarios) {
      const weight = endpoint.weight;
      const requests = Math.floor((scenario.connections * weight) / 100);

      console.log(`Testing ${endpoint.path} with ${requests} connections...`);

      const instance = autocannon({
        url: loadTestConfig.baseUrl + this.generatePath(endpoint.path),
        connections: requests,
        pipelining: scenario.pipelining,
        duration: scenario.duration,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const result = await this.runAutocannon(instance);
      results.push({
        endpoint: endpoint.path,
        weight: endpoint.weight,
        result,
      });
    }

    const totalTime = performance.now() - startTime;

    return {
      scenario: scenario,
      results,
      totalTime,
      timestamp: new Date().toISOString(),
    };
  }

  runAutocannon(instance) {
    return new Promise((resolve) => {
      autocannon.track(instance, { renderProgressBar: true });

      instance.on('done', (result) => {
        resolve(result);
      });
    });
  }

  generatePath(pathTemplate) {
    // Replace path parameters with sample values
    return pathTemplate
      .replace(':id', 'prod_sample_001')
      .replace(':userId', 'user_sample_001');
  }

  async analyzeResults(testResults, scenarioName) {
    console.log('\n=== Load Test Analysis ===\n');

    const analysis = {
      scenario: scenarioName,
      timestamp: testResults.timestamp,
      duration: testResults.totalTime,
      endpoints: [],
      overall: {
        totalRequests: 0,
        totalErrors: 0,
        avgLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        throughput: 0,
      },
      passed: true,
      failures: [],
    };

    for (const endpoint of testResults.results) {
      const result = endpoint.result;

      analysis.endpoints.push({
        path: endpoint.endpoint,
        requests: result.requests.total,
        errors: result.errors,
        latency: {
          mean: result.latency.mean,
          p50: result.latency.p50,
          p95: result.latency.p95,
          p99: result.latency.p99,
        },
        throughput: result.throughput.mean,
      });

      // Aggregate overall stats
      analysis.overall.totalRequests += result.requests.total;
      analysis.overall.totalErrors += result.errors;
      analysis.overall.avgLatency +=
        (result.latency.mean * endpoint.weight) / 100;
      analysis.overall.p95Latency = Math.max(
        analysis.overall.p95Latency,
        result.latency.p95
      );
      analysis.overall.p99Latency = Math.max(
        analysis.overall.p99Latency,
        result.latency.p99
      );
      analysis.overall.throughput += result.throughput.mean;

      // Check thresholds
      if (result.latency.p95 > loadTestConfig.thresholds.latency.p95) {
        analysis.passed = false;
        analysis.failures.push(
          `${endpoint.endpoint}: p95 latency ${result.latency.p95}ms exceeds threshold`
        );
      }

      if (result.latency.p99 > loadTestConfig.thresholds.latency.p99) {
        analysis.passed = false;
        analysis.failures.push(
          `${endpoint.endpoint}: p99 latency ${result.latency.p99}ms exceeds threshold`
        );
      }
    }

    // Calculate error rate
    const errorRate =
      analysis.overall.totalErrors / analysis.overall.totalRequests;
    if (errorRate > loadTestConfig.thresholds.errorRate) {
      analysis.passed = false;
      analysis.failures.push(
        `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold`
      );
    }

    // Check throughput
    if (analysis.overall.throughput < loadTestConfig.thresholds.throughput) {
      analysis.passed = false;
      analysis.failures.push(
        `Throughput ${analysis.overall.throughput.toFixed(0)} req/s below threshold`
      );
    }

    // Print summary
    console.log(`Scenario: ${scenarioName}`);
    console.log(`Total Requests: ${analysis.overall.totalRequests}`);
    console.log(
      `Total Errors: ${analysis.overall.totalErrors} (${(errorRate * 100).toFixed(2)}%)`
    );
    console.log(`Average Latency: ${analysis.overall.avgLatency.toFixed(0)}ms`);
    console.log(`P95 Latency: ${analysis.overall.p95Latency}ms`);
    console.log(`P99 Latency: ${analysis.overall.p99Latency}ms`);
    console.log(`Throughput: ${analysis.overall.throughput.toFixed(0)} req/s`);
    console.log(`Test Result: ${analysis.passed ? 'PASSED' : 'FAILED'}`);

    if (!analysis.passed) {
      console.log('\nFailures:');
      analysis.failures.forEach((failure) => console.log(`- ${failure}`));
    }

    // Save detailed report
    await this.saveReport(analysis);

    return analysis;
  }

  async saveReport(analysis) {
    const reportDir = path.join(__dirname, '..', 'load-test-reports');
    await fs.mkdir(reportDir, { recursive: true });

    const filename = `load-test-${analysis.scenario}-${this.testId}.json`;
    const filepath = path.join(reportDir, filename);

    await fs.writeFile(filepath, JSON.stringify(analysis, null, 2));
    console.log(`\nDetailed report saved to: ${filename}`);
  }

  async runCapacityPlanning() {
    console.log('=== Capacity Planning Test Suite ===\n');

    const capacityTests = [
      { connections: 100, name: 'Light Load' },
      { connections: 500, name: 'Medium Load' },
      { connections: 1000, name: 'Heavy Load' },
      { connections: 2000, name: 'Peak Load' },
      { connections: 5000, name: 'Stress Test' },
    ];

    const results = [];

    for (const test of capacityTests) {
      console.log(
        `\nTesting with ${test.connections} connections (${test.name})...`
      );

      const instance = autocannon({
        url: loadTestConfig.baseUrl + '/store/products',
        connections: test.connections,
        pipelining: 10,
        duration: '1m',
      });

      const result = await this.runAutocannon(instance);

      results.push({
        name: test.name,
        connections: test.connections,
        throughput: result.throughput.mean,
        latency: {
          mean: result.latency.mean,
          p95: result.latency.p95,
          p99: result.latency.p99,
        },
        errors: result.errors,
        errorRate: (result.errors / result.requests.total) * 100,
      });
    }

    // Find breaking point
    const breakingPoint = results.find(
      (r) =>
        r.latency.p95 > loadTestConfig.thresholds.latency.p95 ||
        r.errorRate > loadTestConfig.thresholds.errorRate * 100
    );

    console.log('\n=== Capacity Planning Results ===');
    console.log('\nLoad Test Summary:');
    results.forEach((r) => {
      console.log(`\n${r.name} (${r.connections} connections):`);
      console.log(`  Throughput: ${r.throughput.toFixed(0)} req/s`);
      console.log(`  Latency (p95): ${r.latency.p95}ms`);
      console.log(`  Error Rate: ${r.errorRate.toFixed(2)}%`);
    });

    if (breakingPoint) {
      console.log(
        `\nBreaking point detected at ${breakingPoint.connections} connections`
      );
      console.log(
        `Recommended max capacity: ${breakingPoint.connections * 0.8} connections`
      );
    } else {
      console.log('\nSystem handled all test loads successfully');
      console.log('Consider testing with higher loads to find breaking point');
    }

    return results;
  }

  async generateRecommendations(capacityResults) {
    const recommendations = {
      scaling: [],
      optimization: [],
      infrastructure: [],
    };

    // Analyze results and generate recommendations
    const maxThroughput = Math.max(...capacityResults.map((r) => r.throughput));
    const breakingPoint = capacityResults.find((r) => r.errorRate > 1);

    // Scaling recommendations
    if (maxThroughput < 5000) {
      recommendations.scaling.push({
        priority: 'HIGH',
        action: 'Increase instance count',
        reason: 'Current throughput below target for peak traffic',
        details: `Current max: ${maxThroughput.toFixed(0)} req/s, Target: 5000 req/s`,
      });
    }

    if (breakingPoint && breakingPoint.connections < 2000) {
      recommendations.scaling.push({
        priority: 'CRITICAL',
        action: 'Upgrade instance size',
        reason: 'System breaks before reaching expected peak load',
        details: `Breaking point: ${breakingPoint.connections} connections`,
      });
    }

    // Optimization recommendations
    const highLatencyEndpoint = capacityResults.find(
      (r) => r.latency.p95 > 500
    );
    if (highLatencyEndpoint) {
      recommendations.optimization.push({
        priority: 'HIGH',
        action: 'Optimize slow endpoints',
        reason: 'High latency detected under load',
        details: `P95 latency: ${highLatencyEndpoint.latency.p95}ms`,
      });
    }

    // Infrastructure recommendations
    recommendations.infrastructure.push({
      priority: 'MEDIUM',
      action: 'Implement CDN for static assets',
      reason: 'Reduce server load and improve global performance',
    });

    recommendations.infrastructure.push({
      priority: 'HIGH',
      action: 'Add Redis cluster for session storage',
      reason: 'Improve session management under high load',
    });

    return recommendations;
  }
}

// CLI interface
if (require.main === module) {
  const tester = new LoadTester();
  const scenario = process.argv[2] || 'normal';

  if (scenario === 'capacity') {
    tester
      .runCapacityPlanning()
      .then((results) => tester.generateRecommendations(results))
      .then((recommendations) => {
        console.log('\n=== Recommendations ===');
        console.log(JSON.stringify(recommendations, null, 2));
      })
      .catch(console.error);
  } else {
    tester.runScenario(scenario).catch(console.error);
  }
}

module.exports = LoadTester;
