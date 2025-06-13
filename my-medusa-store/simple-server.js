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
  
  // If Medusa is ready and this is an admin or API request, proxy to Medusa
  if (medusaReady && (req.url.startsWith('/app') || req.url.startsWith('/admin') || req.url.startsWith('/store'))) {
    // Proxy to Medusa on port 10000
    const http = require('http');
    const proxyReq = http.request({
      hostname: 'localhost',
      port: 10000,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(502);
      res.end('Bad Gateway');
    });
    
    req.pipe(proxyReq);
    return;
  }
  
  // Default health response
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(JSON.stringify({
    status: 'ok',
    message: medusaReady ? 'Medusa backend ready' : 'Starting Medusa backend...',
    medusaReady,
    medusaError,
    adminUrl: medusaReady ? '/app' : null,
    storeUrl: medusaReady ? '/store' : null,
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
    
    const medusa = spawn('node', ['debug-start.js'], {
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
      const errorMsg = data.toString();
      console.error(`Medusa Error: ${errorMsg}`);
      medusaError = (medusaError || '') + errorMsg;
    });
    
    medusa.on('close', (code) => {
      console.log(`Medusa exited with code ${code}`);
      if (code !== 0) {
        medusaError = (medusaError || '') + `\nExited with code ${code}`;
      }
    });
    
    medusa.on('error', (err) => {
      console.error('Medusa spawn error:', err);
      medusaError = `Spawn error: ${err.message}`;
    });
  }, 2000);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});