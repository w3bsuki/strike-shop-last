#!/usr/bin/env node

/**
 * Test Coverage Analysis Script
 * Runs all test suites and generates comprehensive coverage reports
 * Enforces 90%+ coverage thresholds
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COVERAGE_THRESHOLD = 90;
const COVERAGE_DIR = './coverage';
const REPORTS_DIR = './test-reports';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSubsection(title) {
  log(`\n📋 ${title}`, 'blue');
  log('-'.repeat(40), 'blue');
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function runCommand(command, description) {
  log(`\n🔄 ${description}...`, 'yellow');
  try {
    const output = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: process.cwd()
    });
    log(`✅ ${description} completed`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} failed:`, 'red');
    log(error.stdout || error.message, 'red');
    return { success: false, error: error.message, output: error.stdout };
  }
}

function parseJestCoverage(coverageFile) {
  try {
    const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    const total = coverage.total;
    
    return {
      statements: total.statements.pct,
      branches: total.branches.pct,
      functions: total.functions.pct,
      lines: total.lines.pct,
    };
  } catch (error) {
    log(`Warning: Could not parse coverage file ${coverageFile}`, 'yellow');
    return null;
  }
}

function generateCoverageReport(testResults) {
  logSection('📊 COVERAGE ANALYSIS');
  
  const coverageData = {
    domain: null,
    unit: null,
    component: null,
    integration: null,
    overall: { statements: 0, branches: 0, functions: 0, lines: 0 },
  };

  // Parse coverage from each test suite
  const coverageFiles = [
    { name: 'domain', file: `${COVERAGE_DIR}/domain/coverage-summary.json` },
    { name: 'unit', file: `${COVERAGE_DIR}/unit/coverage-summary.json` },
    { name: 'component', file: `${COVERAGE_DIR}/component/coverage-summary.json` },
    { name: 'integration', file: `${COVERAGE_DIR}/integration/coverage-summary.json` },
  ];

  let totalWeight = 0;
  let weightedCoverage = { statements: 0, branches: 0, functions: 0, lines: 0 };

  coverageFiles.forEach(({ name, file }) => {
    const coverage = parseJestCoverage(file);
    if (coverage) {
      coverageData[name] = coverage;
      
      // Weight: Domain (40%), Unit (30%), Component (20%), Integration (10%)
      const weight = name === 'domain' ? 0.4 : name === 'unit' ? 0.3 : name === 'component' ? 0.2 : 0.1;
      totalWeight += weight;
      
      Object.keys(coverage).forEach(metric => {
        weightedCoverage[metric] += coverage[metric] * weight;
      });
    }
  });

  // Calculate overall coverage
  if (totalWeight > 0) {
    Object.keys(weightedCoverage).forEach(metric => {
      coverageData.overall[metric] = Math.round(weightedCoverage[metric] / totalWeight * 100) / 100;
    });
  }

  // Display coverage table
  logSubsection('Coverage by Test Suite');
  console.table(coverageData);

  // Check thresholds
  logSubsection('Coverage Threshold Analysis');
  const overallCoverage = coverageData.overall;
  let passedThresholds = 0;
  let totalThresholds = 0;

  Object.entries(overallCoverage).forEach(([metric, value]) => {
    totalThresholds++;
    const passed = value >= COVERAGE_THRESHOLD;
    if (passed) passedThresholds++;
    
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${status} ${metric}: ${value.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLD}%)`, color);
  });

  const overallPass = passedThresholds === totalThresholds;
  const overallAverage = Object.values(overallCoverage).reduce((a, b) => a + b, 0) / 4;

  log(`\n🎯 Overall Coverage: ${overallAverage.toFixed(2)}%`, overallPass ? 'green' : 'red');
  log(`📈 Thresholds Passed: ${passedThresholds}/${totalThresholds}`, overallPass ? 'green' : 'red');

  return {
    coverage: coverageData,
    passedThresholds: overallPass,
    overallCoverage: overallAverage,
  };
}

function generateTestReport(testResults, coverageAnalysis) {
  logSection('📋 GENERATING TEST REPORT');

  ensureDirectory(REPORTS_DIR);

  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSuites: Object.keys(testResults).length,
      passedSuites: Object.values(testResults).filter(r => r.success).length,
      failedSuites: Object.values(testResults).filter(r => !r.success).length,
      overallCoverage: coverageAnalysis.overallCoverage,
      coverageThresholdMet: coverageAnalysis.passedThresholds,
    },
    testResults,
    coverage: coverageAnalysis.coverage,
    recommendations: [],
  };

  // Generate recommendations
  if (!coverageAnalysis.passedThresholds) {
    reportData.recommendations.push('Increase test coverage to meet 90% threshold');
  }

  Object.entries(testResults).forEach(([suite, result]) => {
    if (!result.success) {
      reportData.recommendations.push(`Fix failing tests in ${suite} test suite`);
    }
  });

  // Write JSON report
  const jsonReport = path.join(REPORTS_DIR, 'test-report.json');
  fs.writeFileSync(jsonReport, JSON.stringify(reportData, null, 2));
  log(`📄 JSON report: ${jsonReport}`, 'green');

  // Write HTML summary
  const htmlReport = generateHtmlReport(reportData);
  const htmlFile = path.join(REPORTS_DIR, 'test-report.html');
  fs.writeFileSync(htmlFile, htmlReport);
  log(`🌐 HTML report: ${htmlFile}`, 'green');

  return reportData;
}

function generateHtmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Strike Shop - Test Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
        .success { border-left: 4px solid #28a745; }
        .failure { border-left: 4px solid #dc3545; }
        .warning { border-left: 4px solid #ffc107; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .coverage-high { background-color: #d4edda; }
        .coverage-medium { background-color: #fff3cd; }
        .coverage-low { background-color: #f8d7da; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Strike Shop - Test Coverage Report</h1>
        <p>Generated: ${data.timestamp}</p>
        <p>Overall Coverage: <strong>${data.summary.overallCoverage.toFixed(2)}%</strong></p>
    </div>

    <div class="summary">
        <div class="card ${data.summary.passedSuites === data.summary.totalSuites ? 'success' : 'failure'}">
            <h3>Test Suites</h3>
            <p>${data.summary.passedSuites}/${data.summary.totalSuites} Passed</p>
        </div>
        <div class="card ${data.summary.coverageThresholdMet ? 'success' : 'failure'}">
            <h3>Coverage Threshold</h3>
            <p>${data.summary.coverageThresholdMet ? 'Met' : 'Not Met'} (90%)</p>
        </div>
    </div>

    <h2>Coverage by Test Suite</h2>
    <table>
        <tr>
            <th>Suite</th>
            <th>Statements</th>
            <th>Branches</th>
            <th>Functions</th>
            <th>Lines</th>
        </tr>
        ${Object.entries(data.coverage).map(([suite, cov]) => {
          if (!cov || suite === 'overall') return '';
          const avgCoverage = (cov.statements + cov.branches + cov.functions + cov.lines) / 4;
          const cssClass = avgCoverage >= 90 ? 'coverage-high' : avgCoverage >= 70 ? 'coverage-medium' : 'coverage-low';
          return `
            <tr class="${cssClass}">
                <td>${suite}</td>
                <td>${cov.statements.toFixed(1)}%</td>
                <td>${cov.branches.toFixed(1)}%</td>
                <td>${cov.functions.toFixed(1)}%</td>
                <td>${cov.lines.toFixed(1)}%</td>
            </tr>
          `;
        }).join('')}
    </table>

    <h2>Test Results</h2>
    <table>
        <tr>
            <th>Suite</th>
            <th>Status</th>
            <th>Description</th>
        </tr>
        ${Object.entries(data.testResults).map(([suite, result]) => `
            <tr class="${result.success ? 'coverage-high' : 'coverage-low'}">
                <td>${suite}</td>
                <td>${result.success ? '✅ Passed' : '❌ Failed'}</td>
                <td>${result.success ? 'All tests passed' : 'Some tests failed'}</td>
            </tr>
        `).join('')}
    </table>

    ${data.recommendations.length > 0 ? `
    <h2>Recommendations</h2>
    <ul>
        ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
    ` : ''}
</body>
</html>
  `;
}

async function main() {
  logSection('🚀 STRIKE SHOP - COMPREHENSIVE TEST RUNNER');
  log('Targeting 90%+ code coverage with enterprise-grade quality assurance', 'bright');

  // Ensure directories exist
  ensureDirectory(COVERAGE_DIR);
  ensureDirectory(REPORTS_DIR);

  // Test suite configuration
  const testSuites = [
    {
      name: 'domain',
      command: 'npm run test:domain -- --coverage --coverageDirectory=coverage/domain',
      description: 'Domain Entity & Value Object Tests (70% of test pyramid)',
      weight: 0.4,
    },
    {
      name: 'unit',
      command: 'npm run test:unit -- --coverage --coverageDirectory=coverage/unit',
      description: 'Unit Tests (Utilities & Helpers)',
      weight: 0.3,
    },
    {
      name: 'component',
      command: 'npm run test:component -- --coverage --coverageDirectory=coverage/component',
      description: 'React Component Tests (20% of test pyramid)',
      weight: 0.2,
    },
    {
      name: 'integration',
      command: 'npm run test:integration -- --coverage --coverageDirectory=coverage/integration',
      description: 'API Integration Tests (20% of test pyramid)',
      weight: 0.1,
    },
  ];

  const testResults = {};

  // Run Jest test suites
  logSection('🧪 RUNNING JEST TEST SUITES');
  for (const suite of testSuites) {
    logSubsection(`${suite.name.toUpperCase()} Tests`);
    log(`Weight: ${(suite.weight * 100)}% of total coverage`, 'cyan');
    
    const result = runCommand(suite.command, suite.description);
    testResults[suite.name] = result;

    if (!result.success) {
      log(`⚠️  ${suite.name} tests failed but continuing with other suites...`, 'yellow');
    }
  }

  // Run E2E tests
  logSection('🎭 RUNNING E2E TESTS');
  logSubsection('E2E Critical Journeys (10% of test pyramid)');
  
  const e2eResult = runCommand(
    'npm run test:e2e -- --reporter=html --output-folder=test-reports/e2e',
    'End-to-End Critical User Journey Tests'
  );
  testResults.e2e = e2eResult;

  // Run accessibility tests
  logSubsection('Accessibility Compliance Tests');
  const a11yResult = runCommand(
    'npm run test:accessibility',
    'WCAG 2.1 AA Accessibility Tests'
  );
  testResults.accessibility = a11yResult;

  // Run performance tests
  logSubsection('Performance & Core Web Vitals Tests');
  const perfResult = runCommand(
    'npm run test:performance',
    'Core Web Vitals Performance Tests'
  );
  testResults.performance = perfResult;

  // Run visual regression tests
  logSubsection('Visual Regression Tests');
  const visualResult = runCommand(
    'npm run test:visual',
    'UI Consistency & Visual Regression Tests'
  );
  testResults.visual = visualResult;

  // Analyze coverage
  const coverageAnalysis = generateCoverageReport(testResults);

  // Generate comprehensive report
  const report = generateTestReport(testResults, coverageAnalysis);

  // Final summary
  logSection('📊 FINAL SUMMARY');
  
  const totalSuites = Object.keys(testResults).length;
  const passedSuites = Object.values(testResults).filter(r => r.success).length;
  const failedSuites = totalSuites - passedSuites;

  log(`📋 Test Suites: ${passedSuites}/${totalSuites} passed`, passedSuites === totalSuites ? 'green' : 'red');
  log(`📈 Overall Coverage: ${coverageAnalysis.overallCoverage.toFixed(2)}%`, coverageAnalysis.overallCoverage >= COVERAGE_THRESHOLD ? 'green' : 'red');
  log(`🎯 Coverage Threshold: ${coverageAnalysis.passedThresholds ? 'MET' : 'NOT MET'} (90%)`, coverageAnalysis.passedThresholds ? 'green' : 'red');

  if (report.recommendations.length > 0) {
    log('\n📝 Recommendations:', 'yellow');
    report.recommendations.forEach(rec => log(`  • ${rec}`, 'yellow'));
  }

  // Exit with appropriate code
  const success = passedSuites === totalSuites && coverageAnalysis.passedThresholds;
  if (success) {
    log('\n🎉 ALL TESTS PASSED WITH EXCELLENT COVERAGE!', 'green');
    log('✨ Your codebase meets enterprise-grade quality standards', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  QUALITY GATES NOT MET', 'red');
    log('🔧 Please address the failing tests and coverage gaps', 'red');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  log(`\n💥 Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

// Run the script
main().catch((error) => {
  log(`\n💥 Script failed: ${error.message}`, 'red');
  process.exit(1);
});