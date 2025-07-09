#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Creates an encrypted vault for storing production secrets
 * Uses AES-256-GCM encryption with PBKDF2 key derivation
 */

const VAULT_VERSION = '1.0';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

class SecretVault {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(data, password) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Combine all components
    const vault = {
      version: VAULT_VERSION,
      algorithm: 'aes-256-gcm',
      iterations: ITERATIONS,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      data: encrypted.toString('base64'),
      created: new Date().toISOString()
    };
    
    return vault;
  }

  /**
   * Decrypt vault data
   */
  decrypt(vault, password) {
    if (vault.version !== VAULT_VERSION) {
      throw new Error(`Unsupported vault version: ${vault.version}`);
    }
    
    const salt = Buffer.from(vault.salt, 'base64');
    const key = this.deriveKey(password, salt);
    const iv = Buffer.from(vault.iv, 'base64');
    const tag = Buffer.from(vault.tag, 'base64');
    const encrypted = Buffer.from(vault.data, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Get password from user (hidden input)
   */
  async getPassword(prompt) {
    return new Promise((resolve) => {
      // Hide input
      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;
      
      this.rl.question(prompt, (password) => {
        console.log(''); // New line after password
        resolve(password);
      });
      
      // Mask password input
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      
      let password = '';
      stdin.on('data', (char) => {
        char = char.toString();
        
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            stdin.setRawMode(wasRaw);
            stdin.pause();
            stdin.removeAllListeners('data');
            console.log('');
            this.rl.close();
            resolve(password);
            break;
          case '\u0003':
            process.exit();
            break;
          case '\u007f':
          case '\b':
            password = password.slice(0, -1);
            process.stdout.clearLine();
            process.stdout.cursorTo(prompt.length);
            process.stdout.write('*'.repeat(password.length));
            break;
          default:
            password += char;
            process.stdout.write('*');
            break;
        }
      });
    });
  }

  /**
   * Load environment file and prepare for encryption
   */
  loadSecrets(envPath) {
    if (!fs.existsSync(envPath)) {
      throw new Error(`File not found: ${envPath}`);
    }
    
    const content = fs.readFileSync(envPath, 'utf8');
    
    // Parse and filter sensitive variables
    const lines = content.split('\n');
    const secrets = [];
    const sensitiveKeys = [
      'SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'API_KEY',
      'DATABASE_URL', 'REDIS_URL', 'JWT', 'COOKIE',
      'STRIPE', 'CLERK', 'SANITY', 'RESEND', 'AWS'
    ];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      
      const [key] = line.split('=');
      if (key && sensitiveKeys.some(sk => key.includes(sk))) {
        secrets.push(line);
      }
    });
    
    return secrets.join('\n');
  }

  /**
   * Create encrypted vault file
   */
  async createVault(inputPath, outputPath) {
    try {
      console.log('🔐 Creating encrypted secrets vault...\n');
      
      // Load secrets
      const secrets = this.loadSecrets(inputPath);
      console.log(`📄 Loaded ${secrets.split('\n').length} secrets from ${inputPath}`);
      
      // Get encryption password
      const password = await this.getPassword('Enter vault password: ');
      const confirmPassword = await this.getPassword('Confirm vault password: ');
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match!');
      }
      
      if (password.length < 16) {
        throw new Error('Password must be at least 16 characters long');
      }
      
      // Encrypt secrets
      console.log('\n🔒 Encrypting secrets...');
      const vault = this.encrypt(secrets, password);
      
      // Save vault
      fs.writeFileSync(outputPath, JSON.stringify(vault, null, 2));
      console.log(`✅ Vault created: ${outputPath}`);
      
      // Generate decryption script
      this.generateDecryptionScript(outputPath);
      
      console.log('\n📋 Next steps:');
      console.log('1. Store the vault password in a secure password manager');
      console.log('2. Delete the original .env file');
      console.log('3. Add .env.vault to version control (it\'s encrypted)');
      console.log('4. Use decrypt-vault.js to decrypt when needed');
      
    } catch (error) {
      console.error('\n❌ Error creating vault:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Generate decryption script
   */
  generateDecryptionScript(vaultPath) {
    const scriptContent = `#!/usr/bin/env node

// Vault decryption script
// Usage: node decrypt-vault.js [output-file]

const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

const VAULT_PATH = '${path.basename(vaultPath)}';

// ... (include decrypt method and helpers)

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });
  
  try {
    const vault = JSON.parse(fs.readFileSync(VAULT_PATH, 'utf8'));
    const password = await getPassword('Enter vault password: ');
    
    const decrypted = decrypt(vault, password);
    
    const outputPath = process.argv[2] || '.env.decrypted';
    fs.writeFileSync(outputPath, decrypted);
    
    console.log(\`✅ Vault decrypted to: \${outputPath}\`);
    console.log('⚠️  Remember to delete this file after use!');
  } catch (error) {
    console.error('❌ Decryption failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
`;

    const scriptPath = path.join(path.dirname(vaultPath), 'decrypt-vault.js');
    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755');
    console.log(`📜 Decryption script created: ${scriptPath}`);
  }

  /**
   * Verify vault integrity
   */
  async verifyVault(vaultPath) {
    try {
      console.log('🔍 Verifying vault integrity...\n');
      
      const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
      console.log(`📄 Vault version: ${vault.version}`);
      console.log(`🔒 Algorithm: ${vault.algorithm}`);
      console.log(`📅 Created: ${vault.created}`);
      
      const password = await this.getPassword('\nEnter vault password to verify: ');
      
      try {
        const decrypted = this.decrypt(vault, password);
        const secretCount = decrypted.split('\n').filter(line => line.trim()).length;
        console.log(`\n✅ Vault verified! Contains ${secretCount} secrets.`);
      } catch (error) {
        console.log('\n❌ Verification failed! Invalid password or corrupted vault.');
      }
      
    } catch (error) {
      console.error('\n❌ Error verifying vault:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  const vault = new SecretVault();
  const command = process.argv[2];
  
  console.log('🔐 Strike Shop Secret Vault Manager');
  console.log('==================================\n');
  
  switch (command) {
    case 'create':
      const inputPath = process.argv[3] || '.env.production';
      const outputPath = process.argv[4] || '.env.vault';
      await vault.createVault(inputPath, outputPath);
      break;
      
    case 'verify':
      const vaultPath = process.argv[3] || '.env.vault';
      await vault.verifyVault(vaultPath);
      break;
      
    default:
      console.log('Usage:');
      console.log('  Create vault: node create-encrypted-vault.js create [input] [output]');
      console.log('  Verify vault: node create-encrypted-vault.js verify [vault-path]');
      console.log('\nExamples:');
      console.log('  node create-encrypted-vault.js create .env.production .env.vault');
      console.log('  node create-encrypted-vault.js verify .env.vault');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SecretVault;