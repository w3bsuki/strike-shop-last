console.log('=== DEBUG MEDUSA START ===');
console.log('CWD:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);
console.log('HOST:', process.env.HOST);

const fs = require('fs');

// Check if admin build exists
console.log('Admin build check:');
try {
  const adminPath = '.medusa/admin';
  const adminExists = fs.existsSync(adminPath);
  console.log(`Admin dir exists: ${adminExists}`);
  
  if (adminExists) {
    const files = fs.readdirSync(adminPath);
    console.log(`Admin files: ${files.join(', ')}`);
  }
} catch (err) {
  console.error('Admin check error:', err.message);
}

// Check if build exists
console.log('Build check:');
try {
  const buildPath = '.medusa';
  const buildExists = fs.existsSync(buildPath);
  console.log(`Build dir exists: ${buildExists}`);
  
  if (buildExists) {
    const files = fs.readdirSync(buildPath);
    console.log(`Build files: ${files.join(', ')}`);
  }
} catch (err) {
  console.error('Build check error:', err.message);
}

// Try to run migrations first
console.log('Running migrations...');
const { spawn } = require('child_process');

const migrate = spawn('npx', ['medusa', 'db:migrate'], {
  stdio: 'inherit',
  env: process.env
});

migrate.on('exit', (code) => {
  console.log(`Migration exit code: ${code}`);
  
  // Now try to start medusa without admin
  console.log('Starting medusa with admin disabled...');
  
  // Set admin ENABLED and force rebuild
  const env = {
    ...process.env,
    DISABLE_MEDUSA_ADMIN: 'false'
  };
  
  const medusa = spawn('npx', ['medusa', 'start'], {
    stdio: 'inherit',
    env: env
  });

  medusa.on('error', (err) => {
    console.error('Medusa spawn error:', err);
  });

  medusa.on('exit', (code) => {
    console.log(`Medusa exit code: ${code}`);
  });
});