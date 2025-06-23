const http = require('http');
const { Pool } = require('pg');
const Redis = require('ioredis');

// Configuration
const HEALTH_CHECK_PORT = process.env.HEALTH_CHECK_PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;

// Initialize connections
let dbPool, redisClient;

if (DATABASE_URL) {
  dbPool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

if (REDIS_URL) {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
}

// Health check components
const healthChecks = {
  app: async () => {
    // Check if main app is responsive
    try {
      const response = await fetch(
        `http://localhost:${process.env.PORT || 9000}/health`
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  database: async () => {
    if (!dbPool) return true; // Skip if not configured
    try {
      const result = await dbPool.query('SELECT 1');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Database health check failed:', error.message);
      return false;
    }
  },

  redis: async () => {
    if (!redisClient) return true; // Skip if not configured
    try {
      const result = await redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error.message);
      return false;
    }
  },

  memory: () => {
    const used = process.memoryUsage();
    const limit = parseInt(process.env.MEMORY_LIMIT || '4096') * 1024 * 1024;
    return used.heapUsed < limit * 0.9; // Alert if > 90% memory usage
  },
};

// Comprehensive health check endpoint
const server = http.createServer(async (req, res) => {
  if (req.url === '/health/deep') {
    const startTime = Date.now();
    const checks = {};

    // Run all health checks in parallel
    const checkPromises = Object.entries(healthChecks).map(
      async ([name, check]) => {
        try {
          const start = Date.now();
          const result = await check();
          checks[name] = {
            status: result ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - start,
          };
        } catch (error) {
          checks[name] = {
            status: 'unhealthy',
            error: error.message,
          };
        }
      }
    );

    await Promise.all(checkPromises);

    const allHealthy = Object.values(checks).every(
      (check) => check.status === 'healthy'
    );
    const responseTime = Date.now() - startTime;

    res.writeHead(allHealthy ? 200 : 503, {
      'Content-Type': 'application/json',
    });
    res.end(
      JSON.stringify({
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        checks,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
      })
    );
  } else if (req.url === '/health') {
    // Simple health check for load balancer
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(HEALTH_CHECK_PORT, () => {
  console.log(`Health check server running on port ${HEALTH_CHECK_PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down health check server...');
  server.close();
  if (dbPool) await dbPool.end();
  if (redisClient) await redisClient.quit();
  process.exit(0);
});
