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

// Try to start medusa
console.log('Starting medusa...');
const { spawn } = require('child_process');

const medusa = spawn('npx', ['medusa', 'start'], {
  stdio: 'inherit',
  env: process.env
});

medusa.on('error', (err) => {
  console.error('Spawn error:', err);
});

medusa.on('exit', (code) => {
  console.log(`Process exited with code: ${code}`);
});