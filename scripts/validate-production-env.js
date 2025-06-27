#!/usr/bin/env node

/**
 * Production Environment Validator
 * Ensures all critical security configurations are properly set for production
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const CRITICAL_ERRORS = [];
const WARNINGS = [];
const VALIDATIONS_PASSED = [];

function logError(message) {
  console.error(`${colors.red}${colors.bold}✗ CRITICAL: ${message}${colors.reset}`);
  CRITICAL_ERRORS.push(message);
}

function logWarning(message) {
  console.warn(`${colors.yellow}⚠ WARNING: ${message}${colors.reset}`);
  WARNINGS.push(message);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
  VALIDATIONS_PASSED.push(message);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

/**
 * Validate CORS configuration
 */
function validateCorsConfig() {
  logInfo('\nValidating CORS Configuration...');
  
  const corsVars = ['STORE_CORS', 'ADMIN_CORS', 'AUTH_CORS', 'ALLOWED_ORIGINS'];
  let hasValidCors = false;
  
  corsVars.forEach(varName => {
    const value = process.env[varName];
    
    if (value) {
      // Check for wildcards
      if (value.includes('*')) {
        logError(`${varName} contains wildcard (*) - this is a critical security vulnerability!`);
        return;
      }
      
      // Validate each origin
      const origins = value.split(',').map(o => o.trim());
      origins.forEach(origin => {
        try {
          const url = new URL(origin);
          
          // Check for HTTPS in production
          if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
            logError(`${varName}: Non-HTTPS origin in production: ${origin}`);
          }
          
          // Check for localhost
          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            if (process.env.BLOCK_LOCALHOST_IN_PRODUCTION === 'true') {
              logError(`${varName}: Localhost origin not allowed in production: ${origin}`);
            } else {
              logWarning(`${varName}: Localhost origin in production: ${origin}`);
            }
          }
          
          hasValidCors = true;
        } catch (e) {
          logError(`${varName}: Invalid URL format: ${origin}`);
        }
      });
    }
  });
  
  if (!hasValidCors) {
    logError('No valid CORS configuration found - application will be vulnerable!');
  } else {
    logSuccess('CORS configuration validated');
  }
}

/**
 * Validate security secrets
 */
function validateSecrets() {
  logInfo('\nValidating Security Secrets...');
  
  const requiredSecrets = [
    { name: 'JWT_SECRET', minLength: 64 },
    { name: 'COOKIE_SECRET', minLength: 32 },
    { name: 'INTERNAL_API_SECRET', minLength: 32 },
    { name: 'SESSION_SECRET', minLength: 32 },
    { name: 'ENCRYPTION_KEY', minLength: 32 }
  ];
  
  requiredSecrets.forEach(({ name, minLength }) => {
    const value = process.env[name];
    
    if (!value) {
      logError(`${name} is not set - this is required for production!`);
      return;
    }
    
    if (value.length < minLength) {
      logError(`${name} is too short (${value.length} chars) - minimum ${minLength} characters required!`);
      return;
    }
    
    // Check for default/weak values
    const weakValues = [
      'supersecret',
      'temporary',
      'changeme',
      'default',
      'secret',
      'password',
      '12345'
    ];
    
    if (weakValues.some(weak => value.toLowerCase().includes(weak))) {
      logError(`${name} contains weak/default value - generate a secure random value!`);
      return;
    }
    
    // Check entropy (simple check)
    const uniqueChars = new Set(value).size;
    if (uniqueChars < 10) {
      logWarning(`${name} has low entropy (only ${uniqueChars} unique characters)`);
    } else {
      logSuccess(`${name} is properly configured`);
    }
  });
}

/**
 * Validate API keys and external services
 */
function validateApiKeys() {
  logInfo('\nValidating API Keys and External Services...');
  
  const requiredKeys = [
    { name: 'DATABASE_URL', pattern: /^postgres(ql)?:\/\// },
    { name: 'STRIPE_SECRET_KEY', pattern: /^sk_(test_|live_)/ },
    { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', pattern: /^pk_(test_|live_)/ }
  ];
  
  requiredKeys.forEach(({ name, pattern }) => {
    const value = process.env[name];
    
    if (!value) {
      logError(`${name} is not set - required for production!`);
      return;
    }
    
    if (pattern && !pattern.test(value)) {
      logError(`${name} has invalid format!`);
      return;
    }
    
    // Check for test keys in production
    if (process.env.NODE_ENV === 'production' && value.includes('test_')) {
      logWarning(`${name} appears to be a test key in production environment`);
    } else {
      logSuccess(`${name} is configured`);
    }
  });
}

/**
 * Validate security headers configuration
 */
function validateSecurityConfig() {
  logInfo('\nValidating Security Configuration...');
  
  const securityFlags = [
    'ENABLE_SECURITY_HEADERS',
    'ENABLE_RATE_LIMITING',
    'ENABLE_CSRF_PROTECTION'
  ];
  
  securityFlags.forEach(flag => {
    const value = process.env[flag];
    
    if (value !== 'true') {
      logError(`${flag} is not enabled - this is critical for production security!`);
    } else {
      logSuccess(`${flag} is enabled`);
    }
  });
  
  // Check rate limiting configuration
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '0');
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '0');
  
  if (maxRequests < 10 || maxRequests > 1000) {
    logWarning(`RATE_LIMIT_MAX_REQUESTS (${maxRequests}) seems unusual`);
  }
  
  if (windowMs < 1000 || windowMs > 3600000) {
    logWarning(`RATE_LIMIT_WINDOW_MS (${windowMs}) seems unusual`);
  }
}

/**
 * Check for production readiness
 */
function checkProductionReadiness() {
  logInfo('\nChecking Production Readiness...');
  
  // Check NODE_ENV
  if (process.env.NODE_ENV !== 'production') {
    logWarning(`NODE_ENV is "${process.env.NODE_ENV}" - should be "production" for production deployment`);
  }
  
  // Check URLs
  const urls = [
    'NEXT_PUBLIC_MEDUSA_BACKEND_URL',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  urls.forEach(urlVar => {
    const value = process.env[urlVar];
    
    if (!value) {
      logError(`${urlVar} is not set`);
      return;
    }
    
    try {
      const url = new URL(value);
      
      if (process.env.REQUIRE_HTTPS_IN_PRODUCTION === 'true' && url.protocol !== 'https:') {
        logError(`${urlVar} must use HTTPS in production: ${value}`);
      }
      
      if (url.hostname === 'localhost' || url.hostname.includes('example')) {
        logError(`${urlVar} contains development/example URL: ${value}`);
      }
    } catch (e) {
      logError(`${urlVar} has invalid URL format: ${value}`);
    }
  });
}

/**
 * Generate environment validation report
 */
function generateReport() {
  const reportPath = path.join(process.cwd(), 'production-env-validation.log');
  const timestamp = new Date().toISOString();
  
  let report = `Production Environment Validation Report
Generated: ${timestamp}
Environment: ${process.env.NODE_ENV || 'not set'}

`;
  
  if (CRITICAL_ERRORS.length > 0) {
    report += `CRITICAL ERRORS (${CRITICAL_ERRORS.length}):\n`;
    CRITICAL_ERRORS.forEach(error => {
      report += `  ✗ ${error}\n`;
    });
    report += '\n';
  }
  
  if (WARNINGS.length > 0) {
    report += `WARNINGS (${WARNINGS.length}):\n`;
    WARNINGS.forEach(warning => {
      report += `  ⚠ ${warning}\n`;
    });
    report += '\n';
  }
  
  if (VALIDATIONS_PASSED.length > 0) {
    report += `VALIDATIONS PASSED (${VALIDATIONS_PASSED.length}):\n`;
    VALIDATIONS_PASSED.forEach(validation => {
      report += `  ✓ ${validation}\n`;
    });
    report += '\n';
  }
  
  report += `\nSummary: ${CRITICAL_ERRORS.length === 0 ? 'READY FOR PRODUCTION' : 'NOT READY FOR PRODUCTION'}\n`;
  
  fs.writeFileSync(reportPath, report);
  logInfo(`\nValidation report saved to: ${reportPath}`);
}

/**
 * Main validation function
 */
function main() {
  console.log(`\n${colors.bold}=== Production Environment Validator ===${colors.reset}\n`);
  
  // Load .env file if it exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
  
  // Run all validations
  validateCorsConfig();
  validateSecrets();
  validateApiKeys();
  validateSecurityConfig();
  checkProductionReadiness();
  
  // Generate report
  generateReport();
  
  // Summary
  console.log(`\n${colors.bold}=== Validation Summary ===${colors.reset}\n`);
  
  if (CRITICAL_ERRORS.length > 0) {
    console.log(`${colors.red}${colors.bold}Critical Errors: ${CRITICAL_ERRORS.length}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${WARNINGS.length}${colors.reset}`);
    console.log(`${colors.green}Passed: ${VALIDATIONS_PASSED.length}${colors.reset}`);
    console.error(`\n${colors.red}${colors.bold}✗ PRODUCTION VALIDATION FAILED${colors.reset}`);
    console.error(`${colors.red}Fix all critical errors before deploying to production!${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}Critical Errors: 0${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${WARNINGS.length}${colors.reset}`);
    console.log(`${colors.green}${colors.bold}Passed: ${VALIDATIONS_PASSED.length}${colors.reset}`);
    console.log(`\n${colors.green}${colors.bold}✓ READY FOR PRODUCTION${colors.reset}`);
    
    if (WARNINGS.length > 0) {
      console.log(`${colors.yellow}Note: Review warnings for potential improvements${colors.reset}\n`);
    }
    
    process.exit(0);
  }
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = { validateCorsConfig, validateSecrets };