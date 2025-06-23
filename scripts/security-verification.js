#!/usr/bin/env node

/**
 * Security Verification Script for Strike Shop
 * Performs basic security checks and validates configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Strike Shop Security Verification\n');

// Check 1: Environment file security
console.log('1. Checking environment file security...');
const envPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Check for exposed keys
  const exposedPatterns = [
    /pk_test_[a-zA-Z0-9]{99}/g,
    /sk_test_[a-zA-Z0-9]{99}/g,
    /pk_live_[a-zA-Z0-9]{99}/g,
    /sk_live_[a-zA-Z0-9]{99}/g,
  ];

  let hasExposedKeys = false;
  exposedPatterns.forEach((pattern) => {
    if (pattern.test(envContent)) {
      hasExposedKeys = true;
    }
  });

  if (hasExposedKeys) {
    console.log('   ⚠️  WARNING: API keys detected in .env.local');
    console.log('   🔥 ACTION REQUIRED: Rotate all API keys immediately');
  } else {
    console.log('   ✅ No obvious API key patterns detected');
  }
} else {
  console.log('   ⚠️  No .env.local file found');
}

// Check 2: Security files existence
console.log('\n2. Checking security implementation files...');
const securityFiles = [
  'middleware.ts',
  'lib/security-config.ts',
  'lib/csrf-protection.ts',
  'app/api/csrf-token/route.ts',
  'SECURITY_AUDIT_REPORT.md',
];

securityFiles.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} - Present`);
  } else {
    console.log(`   ❌ ${file} - Missing`);
  }
});

// Check 3: Middleware configuration
console.log('\n3. Checking middleware configuration...');
const middlewarePath = path.join(process.cwd(), 'middleware.ts');

if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

  const securityFeatures = [
    { name: 'Content-Security-Policy', pattern: /Content-Security-Policy/i },
    { name: 'HSTS', pattern: /Strict-Transport-Security/i },
    { name: 'Rate Limiting', pattern: /rateLimit|rate.?limit/i },
    { name: 'CSRF Protection', pattern: /csrf|xsrf/i },
    {
      name: 'Security Headers',
      pattern: /X-Content-Type-Options|X-Frame-Options/i,
    },
  ];

  securityFeatures.forEach((feature) => {
    if (feature.pattern.test(middlewareContent)) {
      console.log(`   ✅ ${feature.name} - Implemented`);
    } else {
      console.log(`   ⚠️  ${feature.name} - Not detected`);
    }
  });
} else {
  console.log('   ❌ middleware.ts not found');
}

// Check 4: API route security
console.log('\n4. Checking API route security...');
const apiPaths = [
  'app/api/payments/create-intent/route.ts',
  'app/api/webhooks/stripe/route.ts',
];

apiPaths.forEach((apiPath) => {
  const fullPath = path.join(process.cwd(), apiPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasValidation = /validateCSRF|security|rate.?limit/i.test(content);
    const hasLogging = /logSecurityEvent|console\.(log|warn|error)/i.test(
      content
    );

    console.log(`   📁 ${apiPath}:`);
    console.log(
      `      ${hasValidation ? '✅' : '⚠️ '} Security validation: ${hasValidation ? 'Present' : 'Missing'}`
    );
    console.log(
      `      ${hasLogging ? '✅' : '⚠️ '} Security logging: ${hasLogging ? 'Present' : 'Missing'}`
    );
  } else {
    console.log(`   ❌ ${apiPath} - Not found`);
  }
});

// Check 5: Package.json dependencies
console.log('\n5. Checking security-related dependencies...');
const packagePath = path.join(process.cwd(), 'package.json');

if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = {
    ...packageContent.dependencies,
    ...packageContent.devDependencies,
  };

  const securityDeps = [
    { name: '@clerk/nextjs', purpose: 'Authentication' },
    { name: 'stripe', purpose: 'Payment processing' },
    { name: '@sanity/client', purpose: 'CMS connection' },
  ];

  securityDeps.forEach((dep) => {
    if (deps[dep.name]) {
      console.log(`   ✅ ${dep.name} (${dep.purpose}) - v${deps[dep.name]}`);
    } else {
      console.log(`   ⚠️  ${dep.name} (${dep.purpose}) - Not found`);
    }
  });
} else {
  console.log('   ❌ package.json not found');
}

// Security recommendations
console.log('\n🎯 Security Recommendations:');
console.log('   1. 🔥 Rotate all exposed API keys immediately');
console.log('   2. 🛡️  Enable HTTPS in production');
console.log('   3. 📊 Set up security monitoring');
console.log('   4. 🔒 Configure proper CORS origins');
console.log('   5. 📝 Regular security audits');

console.log('\n🚨 CRITICAL: Before production deployment:');
console.log('   • Generate new API keys from all service providers');
console.log('   • Update production environment variables');
console.log('   • Test all security features');
console.log('   • Verify HTTPS configuration');

console.log('\n✅ Security verification complete!');
console.log('📋 Review SECURITY_AUDIT_REPORT.md for detailed findings\n');
