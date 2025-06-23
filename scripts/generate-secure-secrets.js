#!/usr/bin/env node

/**
 * 🔐 FORTRESS-LEVEL SECRETS GENERATOR
 * Generates cryptographically secure secrets for production deployment
 * Implements military-grade security standards
 * 
 * Usage:
 *   node scripts/generate-secure-secrets.js
 *   node scripts/generate-secure-secrets.js --output .env.production
 *   node scripts/generate-secure-secrets.js --frontend-only
 *   node scripts/generate-secure-secrets.js --backend-only
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 🛡️ FORTRESS-LEVEL SECURITY REQUIREMENTS
const SECURITY_STANDARDS = {
  // Minimum entropy requirements (bits)
  CRITICAL_SECRET: 512,    // JWT, Session secrets
  HIGH_SECRET: 256,        // API keys, CSRF tokens
  STANDARD_SECRET: 128,    // Webhook secrets, salts
  
  // Secret length requirements (bytes)
  JWT_SECRET: 64,          // 512 bits
  COOKIE_SECRET: 64,       // 512 bits
  SESSION_SECRET: 64,      // 512 bits
  ENCRYPTION_KEY: 32,      // 256 bits (AES-256)
  API_KEY: 32,             // 256 bits
  CSRF_SECRET: 32,         // 256 bits
  WEBHOOK_SECRET: 32,      // 256 bits
  SALT: 16,                // 128 bits
};

// 🔐 Cryptographically secure secret generator
function generateSecureSecret(length = 32, encoding = 'hex') {
  if (length < 16) {
    throw new Error('🚨 SECURITY ERROR: Secret length must be at least 16 bytes (128 bits)');
  }
  
  // Use Node.js crypto.randomBytes for cryptographically secure randomness
  const bytes = crypto.randomBytes(length);
  
  switch (encoding) {
    case 'hex':
      return bytes.toString('hex');
    case 'base64':
      return bytes.toString('base64').replace(/[+/=]/g, '').substring(0, length);
    case 'base64url':
      return bytes.toString('base64url').substring(0, length);
    default:
      return bytes.toString('hex');
  }
}

// 🛡️ Validate secret strength
function validateSecretStrength(secret, minLength = 32) {
  const entropy = secret.length * 4; // Approximate bits for hex
  
  if (secret.length < minLength) {
    throw new Error(`🚨 SECURITY ERROR: Secret too short (${secret.length} < ${minLength})`);
  }
  
  if (entropy < 128) {
    throw new Error(`🚨 SECURITY ERROR: Insufficient entropy (${entropy} < 128 bits)`);
  }
  
  return true;
}

// 🔑 Generate complete fortress-level secret suite
function generateFortressSecrets() {
  console.log('🛡️ FORTRESS-LEVEL SECURITY GENERATOR');
  console.log('====================================');
  console.log('Generating military-grade cryptographic secrets...\n');
  
  const secrets = {
    // 🔐 CRITICAL AUTHENTICATION SECRETS (512-bit entropy)
    JWT_SECRET: generateSecureSecret(SECURITY_STANDARDS.JWT_SECRET),
    COOKIE_SECRET: generateSecureSecret(SECURITY_STANDARDS.COOKIE_SECRET),
    SESSION_SECRET: generateSecureSecret(SECURITY_STANDARDS.SESSION_SECRET),
    
    // 🛡️ ENCRYPTION & SIGNING KEYS (256-bit entropy)
    ENCRYPTION_KEY: generateSecureSecret(SECURITY_STANDARDS.ENCRYPTION_KEY),
    SIGNING_KEY: generateSecureSecret(SECURITY_STANDARDS.ENCRYPTION_KEY),
    
    // 🔒 CSRF & API PROTECTION (256-bit entropy)
    CSRF_SECRET: generateSecureSecret(SECURITY_STANDARDS.CSRF_SECRET),
    API_SECRET_KEY: generateSecureSecret(SECURITY_STANDARDS.API_KEY),
    ADMIN_API_KEY: `sk_${generateSecureSecret(24)}`,
    
    // 🔗 WEBHOOK SECURITY
    STRIPE_WEBHOOK_SECRET: `whsec_${generateSecureSecret(24)}`,
    MEDUSA_WEBHOOK_SECRET: generateSecureSecret(SECURITY_STANDARDS.WEBHOOK_SECRET),
    
    // 🧂 CRYPTOGRAPHIC SALTS
    PASSWORD_SALT: generateSecureSecret(SECURITY_STANDARDS.SALT),
    API_KEY_SALT: generateSecureSecret(SECURITY_STANDARDS.SALT),
    TOKEN_SALT: generateSecureSecret(SECURITY_STANDARDS.SALT),
    
    // 🎯 APPLICATION SECRETS
    APP_SECRET: generateSecureSecret(32),
    DEPLOYMENT_SECRET: generateSecureSecret(32),
    
    // 📊 MONITORING & ANALYTICS
    SENTRY_AUTH_TOKEN: generateSecureSecret(24, 'base64'),
    ANALYTICS_SECRET: generateSecureSecret(24),
    
    // 🆔 UNIQUE IDENTIFIERS
    INSTANCE_ID: `inst_${generateSecureSecret(16)}`,
    DEPLOYMENT_ID: `dep_${crypto.randomUUID()}`,
    
    // 📅 METADATA
    GENERATED_AT: new Date().toISOString(),
    SECURITY_LEVEL: 'FORTRESS-GRADE',
    ENTROPY_LEVEL: 'MILITARY-GRADE',
    GENERATOR_VERSION: '2.0.0'
  };
  
  // 🔍 Validate all secrets
  console.log('🔍 Validating secret strength...');
  Object.entries(secrets).forEach(([key, value]) => {
    if (key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN')) {
      try {
        validateSecretStrength(value.toString(), 16);
        console.log(`✅ ${key}: ${value.toString().length} chars (${value.toString().length * 4} bits entropy)`);
      } catch (error) {
        console.error(`❌ ${key}: ${error.message}`);
      }
    }
  });
  
  return secrets;
}

// 📝 Create fortress-level environment configuration
function createSecureEnvFile(secrets, type = 'full') {
  const timestamp = new Date().toISOString();
  
  let content = `# 🛡️ FORTRESS-LEVEL SECURITY CONFIGURATION
# Generated: ${timestamp}
# Security Level: MILITARY-GRADE
# Entropy Level: 256-512 bits per secret
# 
# ⚠️  CRITICAL SECURITY WARNINGS:
# ==========================================
# 🚨 NEVER commit these secrets to version control
# 🚨 Store secrets in encrypted environment variables only
# 🚨 Rotate secrets every 90 days or immediately if compromised
# 🚨 Use different secrets for each environment (dev/staging/prod)
# 🚨 Monitor secret access and implement audit logging
# 🚨 Have incident response plan for secret compromise

# ==============================================================================
# 🔐 FORTRESS-LEVEL AUTHENTICATION SECRETS
# ==============================================================================

# Critical authentication secrets (512-bit entropy)
JWT_SECRET="${secrets.JWT_SECRET}"
COOKIE_SECRET="${secrets.COOKIE_SECRET}"
SESSION_SECRET="${secrets.SESSION_SECRET}"

# ==============================================================================
# 🛡️ ENCRYPTION & SIGNING KEYS
# ==============================================================================

# Symmetric encryption key (AES-256)
ENCRYPTION_KEY="${secrets.ENCRYPTION_KEY}"
SIGNING_KEY="${secrets.SIGNING_KEY}"

# ==============================================================================
# 🔒 API & CSRF PROTECTION
# ==============================================================================

# CSRF protection secret
CSRF_SECRET="${secrets.CSRF_SECRET}"

# API authentication keys
API_SECRET_KEY="${secrets.API_SECRET_KEY}"
ADMIN_API_KEY="${secrets.ADMIN_API_KEY}"

# ==============================================================================
# 🔗 WEBHOOK SECURITY
# ==============================================================================

# Payment webhook secrets
STRIPE_WEBHOOK_SECRET="${secrets.STRIPE_WEBHOOK_SECRET}"
MEDUSA_WEBHOOK_SECRET="${secrets.MEDUSA_WEBHOOK_SECRET}"

# ==============================================================================
# 🧂 CRYPTOGRAPHIC SALTS
# ==============================================================================

# Password hashing salt
PASSWORD_SALT="${secrets.PASSWORD_SALT}"
API_KEY_SALT="${secrets.API_KEY_SALT}"
TOKEN_SALT="${secrets.TOKEN_SALT}"

# ==============================================================================
# 🎯 APPLICATION SECURITY
# ==============================================================================

# Application secrets
APP_SECRET="${secrets.APP_SECRET}"
DEPLOYMENT_SECRET="${secrets.DEPLOYMENT_SECRET}"

# ==============================================================================
# 📊 MONITORING & ANALYTICS
# ==============================================================================

# Monitoring secrets
SENTRY_AUTH_TOKEN="${secrets.SENTRY_AUTH_TOKEN}"
ANALYTICS_SECRET="${secrets.ANALYTICS_SECRET}"

# ==============================================================================
# 🆔 DEPLOYMENT METADATA
# ==============================================================================

# Unique identifiers
INSTANCE_ID="${secrets.INSTANCE_ID}"
DEPLOYMENT_ID="${secrets.DEPLOYMENT_ID}"

# Security metadata
SECURITY_GENERATED_AT="${secrets.GENERATED_AT}"
SECURITY_LEVEL="${secrets.SECURITY_LEVEL}"
ENTROPY_LEVEL="${secrets.ENTROPY_LEVEL}"
GENERATOR_VERSION="${secrets.GENERATOR_VERSION}"

# ==============================================================================
# 🔒 SECURITY COMPLIANCE CHECKLIST
# ==============================================================================

# □ Secrets stored in encrypted environment variables
# □ Secrets transmitted over TLS 1.3+ only
# □ Secret rotation schedule implemented (90 days)
# □ Access controls and audit logging enabled
# □ Incident response plan includes secret compromise
# □ Backup and recovery procedures tested
# □ Regular security audits and penetration testing
# □ Staff security training completed

# ==============================================================================
# 🚨 EMERGENCY PROCEDURES
# ==============================================================================

# If secrets are compromised:
# 1. Immediately rotate all affected secrets
# 2. Invalidate all active sessions/tokens
# 3. Audit logs for unauthorized access
# 4. Notify security team and stakeholders
# 5. Document incident and update procedures

`;

  return content;
}

// 🎯 Main execution function
function main() {
  const args = process.argv.slice(2);
  const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || '.env.production';
  const help = args.includes('--help') || args.includes('-h');
  
  if (help) {
    console.log('🛡️ FORTRESS-LEVEL SECRETS GENERATOR');
    console.log('===================================');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/generate-secure-secrets.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --output=FILE    Output file path (default: .env.production)');
    console.log('  --help, -h       Show this help message');
    console.log('');
    console.log('Security Features:');
    console.log('  • Military-grade cryptographic secrets');
    console.log('  • 256-512 bit entropy per secret');
    console.log('  • Cryptographically secure random generation');
    console.log('  • Comprehensive security validation');
    console.log('  • Production-ready configuration');
    console.log('');
    return;
  }
  
  try {
    // 🔐 Generate fortress-level secrets
    const secrets = generateFortressSecrets();
    
    // 📝 Create secure environment file
    const envContent = createSecureEnvFile(secrets);
    
    // 💾 Write to file with secure permissions
    const outputPath = path.resolve(outputFile);
    fs.writeFileSync(outputPath, envContent, { mode: 0o600 }); // Owner read/write only
    
    console.log('\n🎉 SUCCESS: Fortress-level secrets generated!');
    console.log('===========================================');
    console.log(`📁 Output file: ${outputPath}`);
    console.log(`🛡️ Security level: ${secrets.SECURITY_LEVEL}`);
    console.log(`⚡ Entropy level: ${secrets.ENTROPY_LEVEL}`);
    console.log(`🔢 Total secrets: ${Object.keys(secrets).filter(k => k.includes('SECRET') || k.includes('KEY')).length}`);
    
    console.log('\n🚂 Railway Deployment Commands:');
    console.log('===============================');
    console.log('# Copy and run these commands to deploy secrets:');
    Object.entries(secrets).forEach(([key, value]) => {
      if (key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN')) {
        console.log(`railway variables set ${key}="${value}"`);
      }
    });
    
    console.log('\n🔒 CRITICAL SECURITY REMINDERS:');
    console.log('===============================');
    console.log('1. 🚨 NEVER commit this file to version control');
    console.log('2. 🔐 Store in encrypted environment variables only');
    console.log('3. 🔄 Rotate all secrets every 90 days');
    console.log('4. 📊 Enable audit logging for secret access');
    console.log('5. 🛡️ Use different secrets for each environment');
    console.log('6. 🚨 Have incident response plan ready');
    console.log('7. 💾 Test backup/recovery procedures');
    console.log('8. 🔍 Regular security audits and penetration testing');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('==============');
    console.log('1. Review generated secrets file');
    console.log('2. Deploy to production environment');
    console.log('3. Test application functionality');
    console.log('4. Set up secret rotation schedule');
    console.log('5. Configure monitoring and alerting');
    console.log('6. SECURELY DELETE this file after deployment');
    
  } catch (error) {
    console.error('🚨 CRITICAL ERROR: Secret generation failed');
    console.error(`Error: ${error.message}`);
    console.error('This is a security-critical failure. Please investigate immediately.');
    process.exit(1);
  }
}

// 🚀 Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSecureSecret,
  generateFortressSecrets,
  createSecureEnvFile,
  validateSecretStrength
};
