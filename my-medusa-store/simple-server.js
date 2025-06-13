const http = require('http');

const PORT = process.env.PORT || 9000;
const HOST = '0.0.0.0';

console.log(`Starting server on ${HOST}:${PORT}`);

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(JSON.stringify({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    url: req.url,
    port: PORT
  }));
});

server.listen(PORT, HOST, () => {
  console.log(`✓ Server successfully started on http://${HOST}:${PORT}`);
  console.log(`✓ Health check: http://${HOST}:${PORT}/health`);
  console.log(`✓ Railway should be able to reach this`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});