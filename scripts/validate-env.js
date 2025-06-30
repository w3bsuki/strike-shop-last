#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Environment validation script
 * Validates that all required environment variables are set and meet security requirements
 */

// Required environment variables by environment
const REQUIRED_VARS = {
  common: [
    'NODE_ENV',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
  ],
  production: [
    'JWT_SECRET',
    'COOKIE_SECRET',
    'INTERNAL_API_SECRET',
    'SESSION_SECRET',
    'DATABASE_URL',
    'STRIPE_WEBHOOK_SECRET',
    'ENABLE_SECURITY_HEADERS',
    'ENABLE_RATE_LIMITING',
  ],
  development: [],
};

// Validation rules
const VALIDATION_RULES = {
  JWT_SECRET: { minLength: 64, type: 'secret' },
  COOKIE_SECRET: { minLength: 32, type: 'secret' },
  INTERNAL_API_SECRET: { minLength: 32, type: 'secret' },
  SESSION_SECRET: { minLength: 32, type: 'secret' },
  ENCRYPTION_KEY: { minLength: 32, type: 'secret' },
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: { prefix: 'pk_', type: 'public_key' },
  STRIPE_SECRET_KEY: { prefix: 'sk_', type: 'secret_key' },
  STRIPE_WEBHOOK_SECRET: { prefix: 'whsec_', type: 'webhook_secret' },
  DATABASE_URL: { pattern: /^postgres(ql)?:\/\//, type: 'database_url' },
  REDIS_URL: { pattern: /^redis:\/\//, type: 'redis_url' },
  RESEND_API_KEY: { prefix: 're_', type: 'api_key' },
};

/**
 * Load environment variables from .env file
 */
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;
    
    const [key, ...valueParts] = line.split('=');
    if (key) {
      // Handle values with = signs
      let value = valueParts.join('=').trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key.trim()] = value;
    }
  });
  
  return env;
}

/**
 * Check if a value meets entropy requirements
 */
function checkEntropy(value, minLength) {
  if (value.length < minLength) {
    return { valid: false, message: `Too short (${value.length} chars, min ${minLength})` };
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /^[a-z]+$/i,  // Only letters
    /^[0-9]+$/,   // Only numbers
    /^(.)\1+$/,   // Repeated character
    /^(12345|password|secret|admin|test)/i,
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(value)) {
      return { valid: false, message: 'Weak secret detected (low entropy)' };
    }
  }
  
  // Calculate character diversity
  const uniqueChars = new Set(value.split('')).size;
  const diversity = uniqueChars / value.length;
  
  if (diversity < 0.3) {
    return { valid: false, message: 'Low character diversity' };
  }
  
  return { valid: true };
}

/**
 * Validate a single environment variable
 */
function validateVariable(key, value, rule) {
  const errors = [];
  
  if (!value) {
    errors.push('Not set');
    return errors;
  }
  
  // Check prefix
  if (rule.prefix && !value.startsWith(rule.prefix)) {
    errors.push(`Should start with '${rule.prefix}'`);
  }
  
  // Check pattern
  if (rule.pattern && !rule.pattern.test(value)) {
    errors.push('Invalid format');
  }
  
  // Check minimum length for secrets
  if (rule.minLength) {
    const entropyCheck = checkEntropy(value, rule.minLength);
    if (!entropyCheck.valid) {
      errors.push(entropyCheck.message);
    }
  }
  
  // Check for exposed test keys in production
  if (process.env.NODE_ENV === 'production' || key.includes('production')) {
    if (value.includes('test') && rule.type !== 'public_key') {
      errors.push('Test key detected in production environment');
    }
  }
  
  return errors;
}

/**
 * Validate all environment variables
 */
function validateEnvironment(envVars, environment) {
  console.log(`🔍 Validating environment: ${environment}\n`);
  
  const requiredVars = [
    ...REQUIRED_VARS.common,
    ...(REQUIRED_VARS[environment] || [])
  ];
  
  let hasErrors = false;
  const results = {
    missing: [],
    invalid: {},
    warnings: [],
  };
  
  // Check required variables
  requiredVars.forEach(varName => {
    if (!envVars[varName]) {
      results.missing.push(varName);
      hasErrors = true;
    }
  });
  
  // Validate variables with rules
  Object.entries(VALIDATION_RULES).forEach(([varName, rule]) => {
    const value = envVars[varName];
    if (value || requiredVars.includes(varName)) {
      const errors = validateVariable(varName, value, rule);
      if (errors.length > 0) {
        results.invalid[varName] = errors;
        hasErrors = true;
      }
    }
  });
  
  // Check for common security issues
  Object.entries(envVars).forEach(([key, value]) => {
    // Check for hardcoded localhost in production
    if (environment === 'production' && value.includes('localhost')) {
      results.warnings.push(`${key} contains 'localhost' in production`);
    }
    
    // Check for exposed secrets in public vars
    if (key.startsWith('NEXT_PUBLIC_') && 
        (value.includes('secret') || value.includes('private') || key.includes('SECRET'))) {
      results.warnings.push(`${key} might contain sensitive data but is public`);
    }
  });
  
  return { hasErrors, results };
}

/**
 * Generate secure example values
 */
function generateSecureExample(rule) {
  if (rule.type === 'secret' && rule.minLength) {
    return crypto.randomBytes(rule.minLength).toString('hex');
  }
  return 'your_value_here';
}

/**
 * Print validation results
 */
function printResults(results, envVars) {
  if (results.missing.length > 0) {
    console.log('❌ Missing required variables:');
    results.missing.forEach(varName => {
      const rule = VALIDATION_RULES[varName];
      const example = rule ? generateSecureExample(rule) : 'your_value_here';
      console.log(`   ${varName}=${example}`);
    });
    console.log('');
  }
  
  if (Object.keys(results.invalid).length > 0) {
    console.log('❌ Invalid variables:');
    Object.entries(results.invalid).forEach(([varName, errors]) => {
      console.log(`   ${varName}:`);
      errors.forEach(error => console.log(`     - ${error}`));
    });
    console.log('');
  }
  
  if (results.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }
  
  // Print summary
  const totalVars = Object.keys(envVars).length;
  const validVars = totalVars - results.missing.length - Object.keys(results.invalid).length;
  
  console.log('📊 Summary:');
  console.log(`   Total variables: ${totalVars}`);
  console.log(`   Valid: ${validVars}`);
  console.log(`   Missing: ${results.missing.length}`);
  console.log(`   Invalid: ${Object.keys(results.invalid).length}`);
  console.log(`   Warnings: ${results.warnings.length}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔐 Strike Shop Environment Validator');
  console.log('===================================\n');
  
  // Determine which .env file to check
  const envFile = process.argv[2] || '.env.local';
  const envPath = path.join(process.cwd(), envFile);
  
  console.log(`📄 Checking: ${envFile}`);
  
  if (!fs.existsSync(envPath)) {
    console.error(`\n❌ File not found: ${envPath}`);
    console.log('\nUsage: node scripts/validate-env.js [.env.file]');
    console.log('Example: node scripts/validate-env.js .env.production');
    process.exit(1);
  }
  
  // Load environment variables
  const envVars = { ...loadEnvFile(envPath), ...process.env };
  const environment = envVars.NODE_ENV || 'development';
  
  // Validate
  const { hasErrors, results } = validateEnvironment(envVars, environment);
  
  // Print results
  printResults(results, envVars);
  
  if (hasErrors) {
    console.log('\n❌ Validation failed! Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✅ Environment validation passed!');
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️  Please review the warnings above.');
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironment,
  loadEnvFile,
  REQUIRED_VARS,
  VALIDATION_RULES
};