#!/usr/bin/env node

/**
 * Test Coverage Tracker
 * Monitors test coverage progress and generates reports
 */

const fs = require('fs');
const path = require('path');

// Coverage thresholds
const COVERAGE_GOALS = {
  global: 80,
  critical: 90,
  ui: 70,
  utilities: 60,
};

// Critical paths that need higher coverage
const CRITICAL_PATHS = [
  'app/api/payments',
  'components/checkout',
  'lib/cart-store',
  'lib/stripe',
  'lib/medusa-service',
];

/**
 * Read coverage summary from Jest output
 */
function readCoverageSummary() {
  try {
    const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');
    if (!fs.existsSync(coveragePath)) {
      console.error('Coverage summary not found. Run "npm run test:coverage" first.');
      return null;
    }
    return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  } catch (error) {
    console.error('Error reading coverage summary:', error.message);
    return null;
  }
}

/**
 * Calculate coverage percentage
 */
function calculatePercentage(covered, total) {
  if (total === 0) return 0;
  return ((covered / total) * 100).toFixed(2);
}

/**
 * Get coverage for a specific path
 */
function getPathCoverage(summary, searchPath) {
  const relevantFiles = Object.entries(summary)
    .filter(([filePath]) => filePath.includes(searchPath))
    .map(([filePath, data]) => ({ filePath, data }));

  if (relevantFiles.length === 0) return null;

  const totals = relevantFiles.reduce(
    (acc, { data }) => {
      acc.lines.covered += data.lines.covered;
      acc.lines.total += data.lines.total;
      acc.statements.covered += data.statements.covered;
      acc.statements.total += data.statements.total;
      acc.branches.covered += data.branches.covered;
      acc.branches.total += data.branches.total;
      acc.functions.covered += data.functions.covered;
      acc.functions.total += data.functions.total;
      return acc;
    },
    {
      lines: { covered: 0, total: 0 },
      statements: { covered: 0, total: 0 },
      branches: { covered: 0, total: 0 },
      functions: { covered: 0, total: 0 },
    }
  );

  return {
    lines: calculatePercentage(totals.lines.covered, totals.lines.total),
    statements: calculatePercentage(totals.statements.covered, totals.statements.total),
    branches: calculatePercentage(totals.branches.covered, totals.branches.total),
    functions: calculatePercentage(totals.functions.covered, totals.functions.total),
  };
}

/**
 * Generate progress bar
 */
function generateProgressBar(percentage, width = 30) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percentage}%`;
}

/**
 * Get emoji based on coverage
 */
function getCoverageEmoji(percentage, threshold) {
  if (percentage >= threshold) return '✅';
  if (percentage >= threshold * 0.8) return '🟡';
  return '🔴';
}

/**
 * Generate coverage report
 */
function generateReport(summary) {
  console.log('\n📊 STRIKE SHOP TEST COVERAGE REPORT\n');
  console.log('=' .repeat(60));

  // Global coverage
  const global = summary.total;
  const globalCoverage = calculatePercentage(global.lines.covered, global.lines.total);
  
  console.log(`\n📈 OVERALL COVERAGE: ${globalCoverage}% (Target: ${COVERAGE_GOALS.global}%)`);
  console.log(generateProgressBar(globalCoverage, 40));
  
  console.log('\nDetailed Metrics:');
  console.log(`  Lines:      ${generateProgressBar(calculatePercentage(global.lines.covered, global.lines.total))}`);
  console.log(`  Statements: ${generateProgressBar(calculatePercentage(global.statements.covered, global.statements.total))}`);
  console.log(`  Branches:   ${generateProgressBar(calculatePercentage(global.branches.covered, global.branches.total))}`);
  console.log(`  Functions:  ${generateProgressBar(calculatePercentage(global.functions.covered, global.functions.total))}`);

  // Critical paths coverage
  console.log('\n🚨 CRITICAL PATHS COVERAGE:\n');
  CRITICAL_PATHS.forEach(path => {
    const coverage = getPathCoverage(summary, path);
    if (coverage) {
      const avgCoverage = (
        parseFloat(coverage.lines) +
        parseFloat(coverage.statements) +
        parseFloat(coverage.branches) +
        parseFloat(coverage.functions)
      ) / 4;
      
      const emoji = getCoverageEmoji(avgCoverage, COVERAGE_GOALS.critical);
      console.log(`${emoji} ${path.padEnd(25)} ${generateProgressBar(avgCoverage.toFixed(2))}`);
    } else {
      console.log(`🔴 ${path.padEnd(25)} [No tests found]`);
    }
  });

  // Component categories
  console.log('\n📦 COVERAGE BY CATEGORY:\n');
  const categories = [
    { name: 'Components', path: 'components/', threshold: COVERAGE_GOALS.ui },
    { name: 'API Routes', path: 'app/api/', threshold: COVERAGE_GOALS.critical },
    { name: 'Pages', path: 'app/', threshold: COVERAGE_GOALS.ui },
    { name: 'Utilities', path: 'lib/', threshold: COVERAGE_GOALS.utilities },
    { name: 'Hooks', path: 'hooks/', threshold: COVERAGE_GOALS.ui },
  ];

  categories.forEach(({ name, path, threshold }) => {
    const coverage = getPathCoverage(summary, path);
    if (coverage) {
      const avgCoverage = parseFloat(coverage.lines);
      const emoji = getCoverageEmoji(avgCoverage, threshold);
      console.log(`${emoji} ${name.padEnd(15)} ${generateProgressBar(avgCoverage)} (Target: ${threshold}%)`);
    }
  });

  // Files with lowest coverage
  console.log('\n⚠️  FILES NEEDING ATTENTION (< 20% coverage):\n');
  const lowCoverageFiles = Object.entries(summary)
    .filter(([filePath]) => filePath !== 'total')
    .map(([filePath, data]) => ({
      filePath,
      coverage: calculatePercentage(data.lines.covered, data.lines.total),
      uncoveredLines: data.lines.total - data.lines.covered,
    }))
    .filter(({ coverage }) => parseFloat(coverage) < 20)
    .sort((a, b) => a.coverage - b.coverage)
    .slice(0, 10);

  lowCoverageFiles.forEach(({ filePath, coverage, uncoveredLines }) => {
    const shortPath = filePath.replace(process.cwd(), '').substring(1);
    console.log(`  ${coverage.padStart(6)}% - ${shortPath} (${uncoveredLines} lines to cover)`);
  });

  // Progress tracking
  const previousCoveragePath = path.join(__dirname, '../.coverage-history.json');
  let previousCoverage = {};
  
  try {
    if (fs.existsSync(previousCoveragePath)) {
      previousCoverage = JSON.parse(fs.readFileSync(previousCoveragePath, 'utf8'));
    }
  } catch (error) {
    // First run, no history
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const todaysCoverage = parseFloat(globalCoverage);
  const yesterdaysCoverage = previousCoverage[currentDate - 1] || 0;
  const coverageChange = todaysCoverage - yesterdaysCoverage;

  if (coverageChange !== 0 && yesterdaysCoverage !== 0) {
    console.log('\n📈 PROGRESS:');
    const changeEmoji = coverageChange > 0 ? '📈' : '📉';
    const changeSign = coverageChange > 0 ? '+' : '';
    console.log(`${changeEmoji} ${changeSign}${coverageChange.toFixed(2)}% from last run`);
  }

  // Save current coverage to history
  previousCoverage[currentDate] = todaysCoverage;
  fs.writeFileSync(previousCoveragePath, JSON.stringify(previousCoverage, null, 2));

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:\n');
  if (globalCoverage < 25) {
    console.log('1. Focus on critical payment and cart components first');
    console.log('2. Fix failing tests before adding new ones');
    console.log('3. Aim for 5-10% coverage increase daily');
  } else if (globalCoverage < 50) {
    console.log('1. Complete testing for all user-facing components');
    console.log('2. Add integration tests for API endpoints');
    console.log('3. Focus on high-traffic pages');
  } else if (globalCoverage < 80) {
    console.log('1. Add edge case testing');
    console.log('2. Implement visual regression tests');
    console.log('3. Complete E2E test scenarios');
  } else {
    console.log('1. Maintain coverage above 80%');
    console.log('2. Add mutation testing');
    console.log('3. Monitor test execution time');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Run "npm run test:coverage" to update this report\n');
}

// Main execution
function main() {
  const summary = readCoverageSummary();
  if (!summary) {
    process.exit(1);
  }

  generateReport(summary);

  // Check if we meet the global threshold
  const globalCoverage = calculatePercentage(
    summary.total.lines.covered,
    summary.total.lines.total
  );

  if (parseFloat(globalCoverage) < COVERAGE_GOALS.global) {
    console.log(`\n❌ Coverage ${globalCoverage}% is below target ${COVERAGE_GOALS.global}%\n`);
    process.exit(1);
  } else {
    console.log(`\n✅ Coverage ${globalCoverage}% meets target ${COVERAGE_GOALS.global}%! 🎉\n`);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { readCoverageSummary, generateReport };