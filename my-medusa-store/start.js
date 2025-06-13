console.log('=== MEDUSA STARTUP DEBUG ===');
console.log('PORT:', process.env.PORT);
console.log('HOST:', process.env.HOST || '0.0.0.0');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Set explicit environment variables
process.env.HOST = '0.0.0.0';
process.env.PORT = process.env.PORT || '9000';

console.log('Starting Medusa with HOST=0.0.0.0 and PORT=' + process.env.PORT);

// Import and start Medusa
const { spawn } = require('child_process');

const medusa = spawn('npx', ['medusa', 'start'], {
  stdio: 'inherit',
  env: process.env
});

medusa.on('error', (error) => {
  console.error('Failed to start Medusa:', error);
  process.exit(1);
});

medusa.on('exit', (code) => {
  console.log(`Medusa exited with code ${code}`);
  process.exit(code);
});