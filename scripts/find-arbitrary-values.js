#!/usr/bin/env node

/**
 * Script to find arbitrary spacing values in the codebase
 * Helps identify components that need to be migrated to the design system
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to search for arbitrary values
const patterns = {
  arbitrarySpacing: /(?:p|m|gap|space)-\[[\d.]+(?:px|rem|em)\]/g,
  arbitraryFontSize: /text-\[[\d.]+(?:px|rem|em)\]/g,
  arbitraryWidth: /w-\[[\d.]+(?:px|rem|em|%)\]/g,
  arbitraryHeight: /h-\[[\d.]+(?:px|rem|em|%)\]/g,
  roundedCorners: /rounded-(?:sm|md|lg|xl|2xl|3xl|full)/g,
  inlineStyles: /style={{[^}]*(?:padding|margin|gap|fontSize|width|height)[^}]*}}/g,
};

// Design system replacements mapping
const replacements = {
  spacing: {
    '4px': 'space-1',
    '8px': 'space-2',
    '12px': 'space-3',
    '16px': 'space-4',
    '20px': 'space-5',
    '24px': 'space-6',
    '32px': 'space-8',
    '40px': 'space-10',
    '48px': 'space-12',
    '64px': 'space-16',
    '80px': 'space-20',
    '96px': 'space-24',
  },
  fontSize: {
    '10px': 'text-xs',
    '12px': 'text-sm',
    '14px': 'text-sm',
    '16px': 'text-base',
    '18px': 'text-lg',
    '20px': 'text-xl',
    '24px': 'text-2xl',
    '30px': 'text-3xl',
    '36px': 'text-4xl',
    '48px': 'text-5xl',
    '60px': 'text-6xl',
  },
};

// Find all component files
const componentFiles = glob.sync('**/*.{tsx,jsx,ts,js}', {
  ignore: ['node_modules/**', '.next/**', 'scripts/**', '*.config.js'],
  cwd: process.cwd(),
});

console.log(`\n🔍 Scanning ${componentFiles.length} files for arbitrary values...\n`);

let totalIssues = 0;
const results = {};

componentFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const issues = [];

  // Check each pattern
  Object.entries(patterns).forEach(([type, pattern]) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
        issues.push({
          type,
          value: match,
          line: lineNumber,
          suggestion: getSuggestion(type, match),
        });
      });
    }
  });

  if (issues.length > 0) {
    results[file] = issues;
    totalIssues += issues.length;
  }
});

// Generate report
console.log('📊 Design System Migration Report');
console.log('================================\n');

if (totalIssues === 0) {
  console.log('✅ No arbitrary values found! Your codebase is using the design system consistently.\n');
} else {
  console.log(`Found ${totalIssues} arbitrary values in ${Object.keys(results).length} files:\n`);

  // Summary by type
  const summary = {};
  Object.values(results).flat().forEach(issue => {
    summary[issue.type] = (summary[issue.type] || 0) + 1;
  });

  console.log('Summary by type:');
  Object.entries(summary).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} occurrences`);
  });
  console.log('');

  // Detailed report
  Object.entries(results).forEach(([file, issues]) => {
    console.log(`\n📄 ${file}`);
    issues.forEach(issue => {
      console.log(`  Line ${issue.line}: ${issue.value}`);
      if (issue.suggestion) {
        console.log(`    → Suggestion: ${issue.suggestion}`);
      }
    });
  });

  // Migration guide
  console.log('\n\n📚 Migration Guide');
  console.log('==================\n');
  console.log('1. Replace arbitrary spacing values with design tokens:');
  console.log('   - p-[17px] → p-4 (closest standard value)');
  console.log('   - gap-[13px] → gap-3');
  console.log('   - m-[23px] → m-6\n');
  
  console.log('2. Replace arbitrary font sizes with responsive tokens:');
  console.log('   - text-[14px] → text-sm');
  console.log('   - text-[18px] → text-lg\n');
  
  console.log('3. Remove rounded corners for sharp edges:');
  console.log('   - rounded-md → rounded-none');
  console.log('   - rounded-lg → rounded-none\n');
  
  console.log('4. Use design system utilities instead of inline styles');
  console.log('   - style={{ padding: "16px" }} → className="p-4"');
  console.log('   - style={{ fontSize: "14px" }} → className="text-sm"\n');
}

// Helper function to suggest replacements
function getSuggestion(type, value) {
  if (type === 'roundedCorners') {
    return 'rounded-none (sharp edges design)';
  }
  
  if (type === 'arbitrarySpacing') {
    const match = value.match(/\[([\d.]+)(px|rem|em)\]/);
    if (match) {
      const [, num, unit] = match;
      const px = unit === 'px' ? parseInt(num) : parseInt(num) * 16;
      
      // Find closest spacing value
      const closest = Object.entries(replacements.spacing).reduce((prev, curr) => {
        const prevDiff = Math.abs(parseInt(prev[0]) - px);
        const currDiff = Math.abs(parseInt(curr[0]) - px);
        return currDiff < prevDiff ? curr : prev;
      });
      
      return value.replace(/\[[\d.]+(?:px|rem|em)\]/, `-${closest[1].split('-')[1]}`);
    }
  }
  
  if (type === 'arbitraryFontSize') {
    const match = value.match(/\[([\d.]+)(px|rem|em)\]/);
    if (match) {
      const [, num, unit] = match;
      const px = unit === 'px' ? parseInt(num) : parseInt(num) * 16;
      
      // Find closest font size
      const closest = Object.entries(replacements.fontSize).reduce((prev, curr) => {
        const prevDiff = Math.abs(parseInt(prev[0]) - px);
        const currDiff = Math.abs(parseInt(curr[0]) - px);
        return currDiff < prevDiff ? curr : prev;
      });
      
      return closest[1];
    }
  }
  
  return null;
}

console.log('\n✨ Run this script periodically to ensure design system compliance.\n');