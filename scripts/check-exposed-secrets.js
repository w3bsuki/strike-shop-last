#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script to check for exposed secrets in git history
 * This helps identify any secrets that may have been accidentally committed
 */

// Patterns to search for potential secrets
const SECRET_PATTERNS = [
  // API Keys
  { pattern: 'sk_live_[0-9a-zA-Z]{24,}', name: 'Stripe Live Secret Key' },
  { pattern: 'sk_test_[0-9a-zA-Z]{24,}', name: 'Stripe Test Secret Key' },
  { pattern: 'pk_live_[0-9a-zA-Z]{24,}', name: 'Stripe Live Publishable Key' },
  { pattern: 'pk_test_[0-9a-zA-Z]{24,}', name: 'Stripe Test Publishable Key' },
  { pattern: 'whsec_[0-9a-zA-Z]{24,}', name: 'Stripe Webhook Secret' },
  
  // Clerk
  { pattern: 'sk_test_[A-Za-z0-9]{40,}', name: 'Clerk Secret Key' },
  { pattern: 'pk_test_[A-Za-z0-9.]+', name: 'Clerk Publishable Key' },
  
  // Generic patterns
  { pattern: 'api[_-]?key[_-]?["\']?[:=][\\s]*["\']?[0-9a-zA-Z]{32,}', name: 'Generic API Key' },
  { pattern: 'secret[_-]?key[_-]?["\']?[:=][\\s]*["\']?[0-9a-zA-Z]{32,}', name: 'Generic Secret Key' },
  { pattern: 'password["\']?[:=][\\s]*["\'][^"\']{8,}["\']', name: 'Hardcoded Password' },
  
  // JWT/Cookie secrets
  { pattern: 'JWT_SECRET["\']?[:=][\\s]*["\'][^"\']{32,}["\']', name: 'JWT Secret' },
  { pattern: 'COOKIE_SECRET["\']?[:=][\\s]*["\'][^"\']{32,}["\']', name: 'Cookie Secret' },
  
  // Database URLs
  { pattern: 'postgres(ql)?://[^\\s]+:[^\\s]+@[^\\s]+', name: 'PostgreSQL Connection String' },
  { pattern: 'mongodb(\\+srv)?://[^\\s]+:[^\\s]+@[^\\s]+', name: 'MongoDB Connection String' },
  { pattern: 'redis://[^\\s]+:[^\\s]+@[^\\s]+', name: 'Redis Connection String' },
  
  // AWS
  { pattern: 'AKIA[0-9A-Z]{16}', name: 'AWS Access Key ID' },
  { pattern: 'aws[_-]?secret[_-]?access[_-]?key["\']?[:=][\\s]*["\']?[0-9a-zA-Z/+=]{40}', name: 'AWS Secret Access Key' },
  
  // Other services
  { pattern: 're_[0-9a-zA-Z]{34}', name: 'Resend API Key' },
  { pattern: 'xoxb-[0-9]{11}-[0-9]{11}-[0-9a-zA-Z]{24}', name: 'Slack Bot Token' },
];

// Files to exclude from search
const EXCLUDE_PATTERNS = [
  'node_modules/',
  '.git/',
  'coverage/',
  'dist/',
  'build/',
  '.next/',
  '*.min.js',
  '*.map',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

/**
 * Check current working directory files
 */
function checkWorkingDirectory() {
  console.log('🔍 Checking current working directory for exposed secrets...\n');
  
  let foundSecrets = false;
  
  SECRET_PATTERNS.forEach(({ pattern, name }) => {
    try {
      // Build grep command with exclusions
      const excludeArgs = EXCLUDE_PATTERNS.map(p => `--exclude-dir="${p}" --exclude="${p}"`).join(' ');
      const command = `grep -r -E "${pattern}" . ${excludeArgs} 2>/dev/null || true`;
      
      const result = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
      
      if (result.trim()) {
        foundSecrets = true;
        console.log(`❌ Found potential ${name}:`);
        const lines = result.trim().split('\n').slice(0, 5); // Show first 5 matches
        lines.forEach(line => {
          // Truncate long lines and mask the secret
          const [file, ...content] = line.split(':');
          const maskedContent = content.join(':').substring(0, 100).replace(/[0-9a-zA-Z]{16,}/g, (match) => {
            return match.substring(0, 4) + '***' + match.substring(match.length - 4);
          });
          console.log(`   ${file}: ${maskedContent}`);
        });
        if (result.trim().split('\n').length > 5) {
          console.log(`   ... and ${result.trim().split('\n').length - 5} more matches`);
        }
        console.log('');
      }
    } catch (error) {
      // Ignore errors (usually means no matches found)
    }
  });
  
  return foundSecrets;
}

/**
 * Check git history for secrets
 */
function checkGitHistory() {
  console.log('🔍 Checking git history for exposed secrets...\n');
  
  let foundSecrets = false;
  
  // Get list of all files ever committed
  let allFiles;
  try {
    allFiles = execSync('git log --pretty=format: --name-only --diff-filter=A | sort -u', { encoding: 'utf8' })
      .split('\n')
      .filter(file => file && !EXCLUDE_PATTERNS.some(pattern => file.includes(pattern)));
  } catch (error) {
    console.log('⚠️  Not a git repository or no commits yet.\n');
    return false;
  }
  
  SECRET_PATTERNS.forEach(({ pattern, name }) => {
    try {
      // Search through git history
      const command = `git grep -E "${pattern}" $(git rev-list --all) 2>/dev/null || true`;
      const result = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
      
      if (result.trim()) {
        foundSecrets = true;
        console.log(`❌ Found ${name} in git history:`);
        const lines = result.trim().split('\n').slice(0, 3); // Show first 3 matches
        lines.forEach(line => {
          const [commit, rest] = line.split(':');
          const [file, ...content] = rest.split(':');
          const maskedContent = content.join(':').substring(0, 80).replace(/[0-9a-zA-Z]{16,}/g, (match) => {
            return match.substring(0, 4) + '***' + match.substring(match.length - 4);
          });
          console.log(`   Commit ${commit.substring(0, 7)} - ${file}: ${maskedContent}`);
        });
        console.log('');
      }
    } catch (error) {
      // Ignore errors
    }
  });
  
  return foundSecrets;
}

/**
 * Check specific files that commonly contain secrets
 */
function checkSensitiveFiles() {
  console.log('🔍 Checking sensitive files...\n');
  
  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',
    '.env.staging',
    'config.json',
    'secrets.json',
    'credentials.json',
  ];
  
  let foundIssues = false;
  
  sensitiveFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      // Check if file is in gitignore
      try {
        execSync(`git check-ignore ${file}`, { encoding: 'utf8' });
        console.log(`✅ ${file} exists but is properly ignored by git`);
      } catch (error) {
        console.log(`❌ ${file} exists and is NOT in .gitignore!`);
        foundIssues = true;
      }
    }
  });
  
  console.log('');
  return foundIssues;
}

/**
 * Generate report and recommendations
 */
function generateReport(workingDirSecrets, gitHistorySecrets, sensitiveFileIssues) {
  console.log('📋 Security Scan Summary');
  console.log('========================\n');
  
  if (!workingDirSecrets && !gitHistorySecrets && !sensitiveFileIssues) {
    console.log('✅ No exposed secrets found!');
    console.log('\nYour codebase appears to be clean of exposed secrets.');
  } else {
    console.log('🚨 SECURITY ISSUES FOUND!\n');
    
    if (workingDirSecrets) {
      console.log('❌ Exposed secrets found in current working directory');
    }
    if (gitHistorySecrets) {
      console.log('❌ Exposed secrets found in git history');
    }
    if (sensitiveFileIssues) {
      console.log('❌ Sensitive files not properly gitignored');
    }
    
    console.log('\n📝 Recommended Actions:');
    console.log('1. Rotate all exposed secrets immediately');
    console.log('2. Remove secrets from working directory');
    console.log('3. Add sensitive files to .gitignore');
    
    if (gitHistorySecrets) {
      console.log('4. Clean git history using:');
      console.log('   git filter-branch --force --index-filter \\');
      console.log('     "git rm --cached --ignore-unmatch PATH_TO_FILE" \\');
      console.log('     --prune-empty --tag-name-filter cat -- --all');
      console.log('   OR use BFG Repo-Cleaner for easier cleanup');
    }
    
    console.log('\n5. Install pre-commit hooks to prevent future exposures');
    console.log('6. Enable GitHub secret scanning');
    console.log('7. Use environment variables or secret management tools');
  }
  
  console.log('\n📚 Additional Resources:');
  console.log('- GitHub Secret Scanning: https://docs.github.com/en/code-security/secret-scanning');
  console.log('- BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/');
  console.log('- Git Filter-Branch: https://git-scm.com/docs/git-filter-branch');
}

/**
 * Main execution
 */
function main() {
  console.log('🔐 Strike Shop Secret Scanner');
  console.log('=============================\n');
  
  const workingDirSecrets = checkWorkingDirectory();
  const gitHistorySecrets = checkGitHistory();
  const sensitiveFileIssues = checkSensitiveFiles();
  
  generateReport(workingDirSecrets, gitHistorySecrets, sensitiveFileIssues);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkWorkingDirectory,
  checkGitHistory,
  checkSensitiveFiles
};