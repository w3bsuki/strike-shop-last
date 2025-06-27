#!/usr/bin/env node

/**
 * CORS Configuration Security Validator
 * Ensures no wildcard (*) CORS origins are present in configuration
 */

const fs = require('fs');
const path = require('path');

const SECURITY_ERRORS = [];
const SECURITY_WARNINGS = [];
const VALID_CONFIGS = [];

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logError(message) {
  console.error(`${colors.red}${colors.bold}✗ ERROR: ${message}${colors.reset}`);
}

function logWarning(message) {
  console.warn(`${colors.yellow}⚠ WARNING: ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

/**
 * Validate CORS origin
 */
function validateCorsOrigin(origin, context) {
  // Check for wildcards
  if (origin === '*' || origin.includes('*')) {
    SECURITY_ERRORS.push(`${context}: Wildcard CORS origin detected: "${origin}"`);
    return false;
  }

  // Validate URL format
  try {
    const url = new URL(origin);
    
    // Check for secure protocols in production
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      SECURITY_WARNINGS.push(`${context}: Non-HTTPS origin in production: "${origin}"`);
    }
    
    // Check for localhost in production
    if (process.env.NODE_ENV === 'production' && 
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
      SECURITY_WARNINGS.push(`${context}: Localhost origin in production: "${origin}"`);
    }
    
    VALID_CONFIGS.push(`${context}: Valid origin "${origin}"`);
    return true;
  } catch (e) {
    SECURITY_ERRORS.push(`${context}: Invalid URL format: "${origin}"`);
    return false;
  }
}

/**
 * Parse CORS configuration from environment or defaults
 */
function parseCorsConfig(envVar, defaults, name) {
  const value = process.env[envVar];
  
  if (!value) {
    logInfo(`${name}: Using default origins`);
    return defaults;
  }
  
  const origins = value.split(',').map(o => o.trim()).filter(Boolean);
  
  if (origins.length === 0) {
    logWarning(`${name}: Empty configuration, using defaults`);
    return defaults;
  }
  
  return origins;
}

/**
 * Check TypeScript configuration files
 */
function checkTypeScriptConfig() {
  logInfo('Checking TypeScript configuration files...\n');
  
  const configFiles = [
    'medusa-config.production.ts',
    'medusa-config.ts'
  ];
  
  configFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      logWarning(`Configuration file not found: ${file}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for wildcard patterns - be more specific to avoid false positives
    const wildcardPatterns = [
      /storeCors:\s*process\.env\.[A-Z_]+\s*\|\|\s*['"`]\*['"`]/,
      /adminCors:\s*process\.env\.[A-Z_]+\s*\|\|\s*['"`]\*['"`]/,
      /authCors:\s*process\.env\.[A-Z_]+\s*\|\|\s*['"`]\*['"`]/,
      /storeCors:\s*['"`]\*['"`]/,
      /adminCors:\s*['"`]\*['"`]/,
      /authCors:\s*['"`]\*['"`]/,
    ];
    
    let hasWildcard = false;
    wildcardPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        hasWildcard = true;
      }
    });
    
    if (hasWildcard) {
      SECURITY_ERRORS.push(`${file}: Contains wildcard CORS pattern in configuration`);
    }
    
    // Check for proper validation
    if (!content.includes('parseAllowedOrigins') && !content.includes('validateCorsOrigin')) {
      SECURITY_WARNINGS.push(`${file}: Missing CORS validation function`);
    }
    
    logSuccess(`Checked ${file}`);
  });
}

/**
 * Check JavaScript configuration files
 */
function checkJavaScriptConfig() {
  logInfo('\nChecking JavaScript configuration files...\n');
  
  const configFiles = [
    'medusa-config.js'
  ];
  
  configFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      logWarning(`Configuration file not found: ${file}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for wildcard patterns in CORS configuration - be specific
    const wildcardPatterns = [
      /[Cc]ors:\s*['"`]\*['"`]/,
      /[Cc]ors:\s*[^,\n]*\|\|\s*['"`]\*['"`]/,
      /CORS\s*=\s*['"`]\*['"`]/,
      /allowedOrigins.*:\s*\[.*['"`]\*['"`].*\]/,
    ];
    
    let hasWildcard = false;
    wildcardPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        hasWildcard = true;
      }
    });
    
    if (hasWildcard) {
      SECURITY_ERRORS.push(`${file}: Contains wildcard CORS pattern in configuration`);
    }
    
    // Check for validation
    if (!content.includes('parseAndValidateOrigins') && !content.includes('validateCorsOrigin')) {
      SECURITY_WARNINGS.push(`${file}: Missing CORS validation function`);
    }
    
    logSuccess(`Checked ${file}`);
  });
}

/**
 * Check environment configuration
 */
function checkEnvironmentConfig() {
  logInfo('\nChecking environment configuration...\n');
  
  // Production CORS origins
  const storeCors = parseCorsConfig('STORE_CORS', [
    'https://strike-shop.com',
    'https://www.strike-shop.com'
  ], 'STORE_CORS');
  
  const adminCors = parseCorsConfig('ADMIN_CORS', [
    'https://admin.strike-shop.com',
    'https://strike-shop.com'
  ], 'ADMIN_CORS');
  
  const authCors = parseCorsConfig('AUTH_CORS', [
    'https://strike-shop.com',
    'https://www.strike-shop.com',
    'https://admin.strike-shop.com'
  ], 'AUTH_CORS');
  
  // Validate all origins
  storeCors.forEach(origin => validateCorsOrigin(origin, 'STORE_CORS'));
  adminCors.forEach(origin => validateCorsOrigin(origin, 'ADMIN_CORS'));
  authCors.forEach(origin => validateCorsOrigin(origin, 'AUTH_CORS'));
}

/**
 * Check .env.example file
 */
function checkEnvExample() {
  logInfo('\nChecking .env.example file...\n');
  
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envExamplePath)) {
    logWarning('.env.example file not found');
    return;
  }
  
  const content = fs.readFileSync(envExamplePath, 'utf8');
  
  // Check for CORS examples
  if (!content.includes('STORE_CORS=') && !content.includes('ALLOWED_ORIGINS=')) {
    SECURITY_WARNINGS.push('.env.example: Missing CORS configuration examples');
  }
  
  // Check for wildcard examples
  if (content.match(/CORS=\*/) || content.match(/_CORS=\*/)) {
    SECURITY_ERRORS.push('.env.example: Contains wildcard CORS example');
  }
  
  logSuccess('Checked .env.example');
}

/**
 * Main verification function
 */
function main() {
  console.log(`\n${colors.bold}=== CORS Configuration Security Validator ===${colors.reset}\n`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
  
  // Run all checks
  checkTypeScriptConfig();
  checkJavaScriptConfig();
  checkEnvironmentConfig();
  checkEnvExample();
  
  // Summary
  console.log(`\n${colors.bold}=== Validation Summary ===${colors.reset}\n`);
  
  if (SECURITY_ERRORS.length > 0) {
    console.log(`${colors.red}${colors.bold}Security Errors (${SECURITY_ERRORS.length}):${colors.reset}`);
    SECURITY_ERRORS.forEach(error => logError(error));
    console.log();
  }
  
  if (SECURITY_WARNINGS.length > 0) {
    console.log(`${colors.yellow}${colors.bold}Security Warnings (${SECURITY_WARNINGS.length}):${colors.reset}`);
    SECURITY_WARNINGS.forEach(warning => logWarning(warning));
    console.log();
  }
  
  if (VALID_CONFIGS.length > 0) {
    console.log(`${colors.green}${colors.bold}Valid Configurations (${VALID_CONFIGS.length}):${colors.reset}`);
    VALID_CONFIGS.forEach(config => logSuccess(config));
    console.log();
  }
  
  // Exit with error if security errors found
  if (SECURITY_ERRORS.length > 0) {
    console.error(`\n${colors.red}${colors.bold}✗ CORS validation failed with ${SECURITY_ERRORS.length} security error(s)${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}✓ CORS configuration is secure${colors.reset}\n`);
    process.exit(0);
  }
}

// Run verification
if (require.main === module) {
  main();
}

module.exports = { validateCorsOrigin, parseCorsConfig };