const { spawn } = require('child_process');

console.log('Starting Medusa with environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Run migrations first if DATABASE_URL is set
if (process.env.DATABASE_URL) {
  console.log('Running migrations...');
  const migrate = spawn('npx', ['medusa', 'migrations', 'run'], {
    stdio: 'inherit',
    env: process.env
  });

  migrate.on('close', (code) => {
    if (code !== 0) {
      console.log('Migrations failed, but continuing...');
    }
    
    // Start Medusa
    console.log('Starting Medusa server...');
    const medusa = spawn('npx', ['medusa', 'start'], {
      stdio: 'inherit',
      env: process.env
    });

    medusa.on('error', (err) => {
      console.error('Failed to start Medusa:', err);
      process.exit(1);
    });
  });
} else {
  console.error('DATABASE_URL not set!');
  process.exit(1);
}