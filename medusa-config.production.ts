import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'production', process.cwd());

// SECURITY: Parse allowed origins from environment
const parseAllowedOrigins = (envVar: string | undefined, defaultOrigins: string[]): string => {
  if (!envVar) {
    return defaultOrigins.join(',');
  }
  
  // Split and validate origins
  const origins = envVar.split(',').map(origin => origin.trim()).filter(origin => {
    // Reject wildcard origins
    if (origin === '*' || origin.includes('*')) {
      console.error(`SECURITY WARNING: Wildcard CORS origin detected and rejected: ${origin}`);
      return false;
    }
    
    // Basic URL validation
    try {
      new URL(origin);
      return true;
    } catch {
      console.error(`Invalid CORS origin rejected: ${origin}`);
      return false;
    }
  });
  
  if (origins.length === 0) {
    console.error('No valid CORS origins found, using defaults');
    return defaultOrigins.join(',');
  }
  
  return origins.join(',');
};

// Production default origins - NEVER use wildcards
const defaultProductionOrigins = [
  'https://strike-shop.com',
  'https://www.strike-shop.com',
  'https://api.strike-shop.com',
  'https://admin.strike-shop.com'
];

// Parse CORS configurations
const storeCors = parseAllowedOrigins(process.env.STORE_CORS, defaultProductionOrigins);
const adminCors = parseAllowedOrigins(process.env.ADMIN_CORS, defaultProductionOrigins);
const authCors = parseAllowedOrigins(process.env.AUTH_CORS, defaultProductionOrigins);

// Validate that no wildcards are present
if (storeCors.includes('*') || adminCors.includes('*') || authCors.includes('*')) {
  throw new Error('SECURITY ERROR: CORS wildcard (*) is not allowed in production');
}

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseLogging: false,
    workerMode:
      process.env.MEDUSA_WORKER_MODE === 'worker' ? 'worker' : 'server',
    http: {
      storeCors,
      adminCors,
      authCors,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  admin: {
    disable:
      process.env.MEDUSA_WORKER_MODE === 'worker' ||
      process.env.DISABLE_MEDUSA_ADMIN === 'true',
    backendUrl:
      process.env.MEDUSA_BACKEND_URL ||
      `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`,
    path: '/app',
  },
  modules: {
    [Modules.CACHE]: {
      resolve: '@medusajs/cache-inmemory',
      options: {
        ttl: 30 * 60 * 1000, // 30 minutes
      },
    },
    [Modules.EVENT_BUS]: {
      resolve: '@medusajs/event-bus-local',
    },
    [Modules.WORKFLOW_ENGINE]: {
      resolve: '@medusajs/workflow-engine-inmemory',
    },
    [Modules.PAYMENT]: {
      resolve: '@medusajs/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/payment-stripe',
            id: 'stripe',
            options: {
              apiKey:
                process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              automatic_payment_methods: true,
              payment_description: 'Strike™ Order',
            },
          },
        ],
      },
    },
  },
});
