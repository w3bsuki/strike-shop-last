const { spawn } = require('child_process');

console.log('Starting Medusa server...');
console.log('PORT:', process.env.PORT || 9000);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL ? 'Set' : 'Not set');
console.log('DATABASE_PRIVATE_URL:', process.env.DATABASE_PRIVATE_URL ? 'Set' : 'Not set');

// Check for Railway-specific database URL patterns
const possibleDbUrls = [
  'DATABASE_URL',
  'DATABASE_PUBLIC_URL', 
  'DATABASE_PRIVATE_URL',
  'RAILWAY_DATABASE_URL',
  'POSTGRES_URL'
];

let foundDbUrl = false;
for (const key of possibleDbUrls) {
  if (process.env[key]) {
    console.log(`Found database URL in ${key}`);
    foundDbUrl = true;
    // Ensure DATABASE_URL is set for Medusa
    if (key !== 'DATABASE_URL') {
      process.env.DATABASE_URL = process.env[key];
    }
    break;
  }
}

if (!foundDbUrl) {
  console.error('ERROR: No database URL found in any of:', possibleDbUrls);
  console.error('Available environment variables:', Object.keys(process.env).sort());
}

// Start Medusa
const medusa = spawn('npx', ['medusa', 'start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT || '9000',
    MEDUSA_CONFIG_FILE: process.env.MEDUSA_CONFIG_FILE || 'medusa-config.minimal.js'
  }
});

medusa.on('error', (error) => {
  console.error('Failed to start Medusa:', error);
  process.exit(1);
});

medusa.on('exit', (code) => {
  console.log(`Medusa exited with code ${code}`);
  process.exit(code);
});