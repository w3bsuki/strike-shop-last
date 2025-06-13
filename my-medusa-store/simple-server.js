const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 9000;
const HOST = '0.0.0.0';

console.log(`Starting server on ${HOST}:${PORT}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);

let medusaReady = false;
let medusaError = null;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(JSON.stringify({
    status: 'ok',
    message: medusaReady ? 'Medusa backend ready' : 'Starting Medusa backend...',
    medusaReady,
    medusaError,
    timestamp: new Date().toISOString(),
    url: req.url,
    port: PORT
  }));
});

server.listen(PORT, HOST, () => {
  console.log(`✓ Health server started on http://${HOST}:${PORT}`);
  
  // Start Medusa after health server is ready
  setTimeout(() => {
    console.log('🚀 Starting Medusa backend...');
    
    const medusa = spawn('npx', ['medusa', 'start'], {
      env: {
        ...process.env,
        PORT: String(Number(PORT) + 1000), // Run Medusa on different port
        HOST: HOST
      }
    });
    
    medusa.stdout.on('data', (data) => {
      console.log(`Medusa: ${data}`);
      if (data.toString().includes('Server is ready')) {
        medusaReady = true;
        console.log('✅ Medusa is ready!');
      }
    });
    
    medusa.stderr.on('data', (data) => {
      console.error(`Medusa Error: ${data}`);
      medusaError = data.toString();
    });
    
    medusa.on('close', (code) => {
      console.log(`Medusa exited with code ${code}`);
      if (code !== 0) {
        medusaError = `Exited with code ${code}`;
      }
    });
  }, 2000);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});