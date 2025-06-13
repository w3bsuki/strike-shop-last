const { spawn } = require('child_process');

console.log('Starting Medusa server...');
console.log('PORT:', process.env.PORT || 9000);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Start Medusa
const medusa = spawn('npx', ['medusa', 'start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT || '9000'
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