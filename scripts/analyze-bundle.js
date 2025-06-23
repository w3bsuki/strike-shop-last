#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

/**
 * Bundle Size Analysis Script
 * Analyzes Next.js build output and reports bundle sizes
 */

const BUILD_DIR = path.join(process.cwd(), '.next');
const STATIC_DIR = path.join(BUILD_DIR, 'static');

// Performance targets
const TARGETS = {
  totalBundle: 300, // 300KB gzipped target
  largestChunk: 100, // No single chunk over 100KB
  initialLoad: 250, // Initial load under 250KB
};

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + 'KB';
}

function getGzipSize(content) {
  return gzipSync(content).length;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath);
  const size = content.length;
  const gzipSize = getGzipSize(content);

  return {
    path: path.relative(BUILD_DIR, filePath),
    size,
    gzipSize,
  };
}

function findJsFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function analyzeBundles() {
  console.log('🔍 Analyzing bundle sizes...\n');

  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  const jsFiles = findJsFiles(STATIC_DIR);
  const analyses = jsFiles.map(analyzeFile);

  // Sort by gzip size
  analyses.sort((a, b) => b.gzipSize - a.gzipSize);

  // Calculate totals
  const totalSize = analyses.reduce((sum, file) => sum + file.size, 0);
  const totalGzipSize = analyses.reduce((sum, file) => sum + file.gzipSize, 0);

  // Find chunks
  const chunks = analyses.filter((file) => file.path.includes('chunks/'));
  const pages = analyses.filter((file) => file.path.includes('pages/'));

  // Report
  console.log('📊 Bundle Analysis Report');
  console.log('========================\n');

  console.log('📦 Total Bundle Size:');
  console.log(`   Uncompressed: ${formatBytes(totalSize)}`);
  console.log(`   Gzipped: ${formatBytes(totalGzipSize)}`);
  console.log(`   Target: ${formatBytes(TARGETS.totalBundle * 1024)}`);
  console.log(
    `   Status: ${totalGzipSize < TARGETS.totalBundle * 1024 ? '✅ PASS' : '❌ FAIL'}\n`
  );

  console.log('🏃 Largest Chunks:');
  chunks.slice(0, 10).forEach((chunk, i) => {
    const status = chunk.gzipSize < TARGETS.largestChunk * 1024 ? '✅' : '❌';
    console.log(`   ${i + 1}. ${chunk.path}`);
    console.log(`      Gzipped: ${formatBytes(chunk.gzipSize)} ${status}`);
  });

  console.log('\n📄 Page Bundles:');
  pages.forEach((page) => {
    console.log(`   ${page.path}: ${formatBytes(page.gzipSize)}`);
  });

  // Check for code splitting effectiveness
  console.log('\n🔀 Code Splitting Analysis:');
  const adminChunks = chunks.filter((c) => c.path.includes('admin'));
  const studioChunks = chunks.filter((c) => c.path.includes('studio'));

  if (adminChunks.length > 0) {
    const adminSize = adminChunks.reduce((sum, c) => sum + c.gzipSize, 0);
    console.log(
      `   ✅ Admin routes split: ${formatBytes(adminSize)} in ${adminChunks.length} chunks`
    );
  } else {
    console.log('   ⚠️  No separate admin chunks found');
  }

  if (studioChunks.length > 0) {
    const studioSize = studioChunks.reduce((sum, c) => sum + c.gzipSize, 0);
    console.log(
      `   ✅ Studio routes split: ${formatBytes(studioSize)} in ${studioChunks.length} chunks`
    );
  } else {
    console.log('   ⚠️  No separate studio chunks found');
  }

  // Recommendations
  console.log('\n💡 Recommendations:');

  const largeChunks = chunks.filter(
    (c) => c.gzipSize > TARGETS.largestChunk * 1024
  );
  if (largeChunks.length > 0) {
    console.log(
      `   - ${largeChunks.length} chunks exceed ${TARGETS.largestChunk}KB limit`
    );
    console.log('   - Consider further code splitting or lazy loading');
  }

  if (totalGzipSize > TARGETS.totalBundle * 1024) {
    const reduction = totalGzipSize - TARGETS.totalBundle * 1024;
    console.log(
      `   - Need to reduce bundle by ${formatBytes(reduction)} to meet target`
    );
    console.log('   - Review dependencies and remove unused code');
  } else {
    console.log('   - Bundle size is within target! 🎉');
  }

  // Write report to file
  const report = {
    timestamp: new Date().toISOString(),
    totalSize,
    totalGzipSize,
    chunks: chunks.length,
    pages: pages.length,
    largestChunk: chunks[0] ? chunks[0].gzipSize : 0,
    meetsTarget: totalGzipSize < TARGETS.totalBundle * 1024,
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'bundle-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n📝 Full report saved to bundle-report.json');
}

// Run analysis
analyzeBundles();
