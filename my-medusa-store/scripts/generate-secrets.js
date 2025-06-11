#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate secure secrets for production environment
 */

console.log('🔐 Generating secure secrets for production...\n');

// Generate secure random strings
const generateSecret = (length = 32) => {
  return crypto.randomBytes(length).toString('base64');
};

// Generate secrets
const secrets = {
  JWT_SECRET: generateSecret(32),
  COOKIE_SECRET: generateSecret(32),
  ADMIN_PASSWORD: generateSecret(16).replace(/[+/=]/g, ''),
  DB_PASSWORD: generateSecret(24).replace(/[+/=]/g, ''),
};

// Generate secure Stripe webhook secret format
const stripeWebhookSecret = `whsec_${generateSecret(32).replace(/[+/=]/g, '')}`;

console.log('Generated Secrets:\n');
console.log('=====================================');
console.log(`JWT_SECRET=${secrets.JWT_SECRET}`);
console.log(`COOKIE_SECRET=${secrets.COOKIE_SECRET}`);
console.log(`ADMIN_PASSWORD=${secrets.ADMIN_PASSWORD}`);
console.log(`DB_PASSWORD=${secrets.DB_PASSWORD}`);
console.log(`STRIPE_WEBHOOK_SECRET=${stripeWebhookSecret}`);
console.log('=====================================\n');

// Create .env.secrets file
const envContent = `# Generated Secrets - ${new Date().toISOString()}
# Copy these to your .env.production file

# Security Secrets
JWT_SECRET=${secrets.JWT_SECRET}
COOKIE_SECRET=${secrets.COOKIE_SECRET}

# Database Password
DB_PASSWORD=${secrets.DB_PASSWORD}

# Admin Password
ADMIN_PASSWORD=${secrets.ADMIN_PASSWORD}

# Stripe Webhook Secret (example format)
STRIPE_WEBHOOK_SECRET=${stripeWebhookSecret}

# Session Secret
SESSION_SECRET=${generateSecret(32)}

# Encryption Key (for sensitive data)
ENCRYPTION_KEY=${generateSecret(32)}
`;

const secretsPath = path.join(__dirname, '..', '.env.secrets');
fs.writeFileSync(secretsPath, envContent);

console.log(`✅ Secrets saved to: ${secretsPath}`);
console.log('\n⚠️  Important Security Notes:');
console.log('1. Never commit .env.secrets to version control');
console.log('2. Store these secrets securely (password manager, secrets vault)');
console.log('3. Use different secrets for each environment (dev, staging, prod)');
console.log('4. Rotate secrets regularly (every 90 days recommended)');
console.log('5. Use environment variables or secrets management service in production\n');

// Add to .gitignore if not already present
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignoreContent.includes('.env.secrets')) {
    fs.appendFileSync(gitignorePath, '\n# Secrets file\n.env.secrets\n');
    console.log('✅ Added .env.secrets to .gitignore');
  }
}