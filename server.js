const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9000;
const HOST = process.env.HOST || '0.0.0.0';

let medusaStarted = false;
let medusaError = null;

// Health check endpoint - always returns 200
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    medusaStarted,
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Medusa backend is starting...',
    status: medusaStarted ? 'running' : 'starting',
    error: medusaError,
  });
});

// Start Express server immediately for health checks
const server = app.listen(PORT, HOST, () => {
  console.log(`Health check server running on ${HOST}:${PORT}`);

  // Start Medusa after a short delay
  setTimeout(() => {
    console.log('Starting Medusa backend...');

    // Set environment variables
    const env = {
      ...process.env,
      PORT: String(Number(PORT) + 1000), // Run Medusa on different port
      HOST: HOST,
    };

    // First run database initialization
    const dbInit = spawn('node', ['scripts/init-database.js'], { env });

    dbInit.on('close', (code) => {
      console.log(`Database init exited with code ${code}`);

      // Now start Medusa
      const medusa = spawn('npx', ['medusa', 'start'], { env });

      medusa.stdout.on('data', (data) => {
        console.log(`Medusa: ${data}`);
        if (data.toString().includes('Server is ready')) {
          medusaStarted = true;
        }
      });

      medusa.stderr.on('data', (data) => {
        console.error(`Medusa Error: ${data}`);
        medusaError = data.toString();
      });

      medusa.on('close', (code) => {
        console.log(`Medusa process exited with code ${code}`);
        if (code !== 0) {
          medusaError = `Medusa exited with code ${code}`;
        }
      });
    });
  }, 5000); // 5 second delay to ensure health endpoint is ready
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});
