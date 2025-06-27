#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Production-grade secret generator
 * Uses cryptographically secure random bytes for all secrets
 */

// Secret specifications
const SECRET_SPECS = {
  JWT_SECRET: {
    length: 64,
    description: 'JWT signing secret for authentication tokens'
  },
  COOKIE_SECRET: {
    length: 32,
    description: 'Cookie signing secret for session management'
  },
  INTERNAL_API_SECRET: {
    length: 32,
    description: 'Internal API authentication secret'
  },
  ADMIN_API_TOKEN: {
    length: 48,
    description: 'Admin API access token'
  },
  WEBHOOK_SECRET: {
    length: 32,
    description: 'Webhook signature verification secret'
  },
  ENCRYPTION_KEY: {
    length: 32,
    description: 'Data encryption key'
  },
  SESSION_SECRET: {
    length: 32,
    description: 'Session encryption secret'
  }
};

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Number of bytes (will be hex encoded, so output is 2x length)
 * @returns {string} Hex-encoded random string
 */
function generateSecureSecret(length) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate all production secrets
 * @returns {Object} Object containing all generated secrets
 */
function generateAllSecrets() {
  const secrets = {};
  
  console.log('🔐 Generating cryptographically secure production secrets...\n');
  
  for (const [key, spec] of Object.entries(SECRET_SPECS)) {
    const secret = generateSecureSecret(spec.length);
    secrets[key] = secret;
    
    console.log(`✅ ${key}:`);
    console.log(`   Description: ${spec.description}`);
    console.log(`   Length: ${secret.length} characters (${spec.length} bytes)`);
    console.log(`   Entropy: ${spec.length * 8} bits\n`);
  }
  
  return secrets;
}

/**
 * Save secrets to environment file format
 * @param {Object} secrets - Generated secrets
 * @param {string} filename - Output filename
 */
function saveSecretsToFile(secrets, filename) {
  const timestamp = new Date().toISOString();
  let content = `# Production Secrets Generated on ${timestamp}\n`;
  content += '# CRITICAL: These are cryptographically secure secrets. NEVER commit to version control!\n';
  content += '# Store these in your secure secret management system (e.g., HashiCorp Vault, AWS Secrets Manager)\n\n';
  
  for (const [key, value] of Object.entries(secrets)) {
    content += `${key}=${value}\n`;
  }
  
  const filepath = path.join(process.cwd(), filename);
  fs.writeFileSync(filepath, content, 'utf8');
  
  console.log(`💾 Secrets saved to: ${filepath}`);
  console.log('⚠️  IMPORTANT: Move this file to a secure location immediately!');
}

/**
 * Generate Kubernetes secret manifest
 * @param {Object} secrets - Generated secrets
 */
function generateKubernetesManifest(secrets) {
  const manifest = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'strike-shop-secrets',
      namespace: 'production'
    },
    type: 'Opaque',
    data: {}
  };
  
  // Base64 encode all secrets for Kubernetes
  for (const [key, value] of Object.entries(secrets)) {
    manifest.data[key] = Buffer.from(value).toString('base64');
  }
  
  const filepath = path.join(process.cwd(), 'k8s-secrets.yaml');
  fs.writeFileSync(filepath, JSON.stringify(manifest, null, 2), 'utf8');
  
  console.log(`\n🚀 Kubernetes manifest saved to: ${filepath}`);
}

/**
 * Generate Docker Swarm secrets commands
 * @param {Object} secrets - Generated secrets
 */
function generateDockerSwarmCommands(secrets) {
  let commands = '#!/bin/bash\n';
  commands += '# Docker Swarm secret creation commands\n\n';
  
  for (const [key, value] of Object.entries(secrets)) {
    commands += `echo "${value}" | docker secret create ${key.toLowerCase()} -\n`;
  }
  
  const filepath = path.join(process.cwd(), 'create-docker-secrets.sh');
  fs.writeFileSync(filepath, commands, 'utf8');
  fs.chmodSync(filepath, '755');
  
  console.log(`🐳 Docker Swarm commands saved to: ${filepath}`);
}

/**
 * Generate HashiCorp Vault commands
 * @param {Object} secrets - Generated secrets
 */
function generateVaultCommands(secrets) {
  let commands = '#!/bin/bash\n';
  commands += '# HashiCorp Vault secret storage commands\n\n';
  commands += 'VAULT_PATH="secret/data/strike-shop/production"\n\n';
  
  const vaultData = Object.entries(secrets)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
  
  commands += `vault kv put $VAULT_PATH ${vaultData}\n`;
  
  const filepath = path.join(process.cwd(), 'vault-store-secrets.sh');
  fs.writeFileSync(filepath, commands, 'utf8');
  fs.chmodSync(filepath, '755');
  
  console.log(`🔒 Vault commands saved to: ${filepath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔐 Strike Shop Production Secret Generator');
  console.log('==========================================\n');
  
  // Generate secrets
  const secrets = generateAllSecrets();
  
  // Save in multiple formats
  saveSecretsToFile(secrets, '.env.production.secrets');
  generateKubernetesManifest(secrets);
  generateDockerSwarmCommands(secrets);
  generateVaultCommands(secrets);
  
  console.log('\n✅ Secret generation complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Move .env.production.secrets to a secure location');
  console.log('2. Delete all generated files after storing secrets securely');
  console.log('3. Update your deployment configuration with these secrets');
  console.log('4. Enable secret rotation policies');
  console.log('5. Set up monitoring for secret usage\n');
  
  console.log('🚨 SECURITY REMINDER:');
  console.log('- NEVER commit these secrets to version control');
  console.log('- Use a proper secret management system in production');
  console.log('- Rotate secrets regularly (recommended: every 90 days)');
  console.log('- Monitor for unauthorized access attempts');
  console.log('- Use different secrets for each environment\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSecureSecret,
  generateAllSecrets,
  SECRET_SPECS
};