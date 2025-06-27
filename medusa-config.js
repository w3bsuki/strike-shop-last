const { loadEnv, defineConfig, Modules } = require('@medusajs/framework/utils');

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

// Log configuration for debugging
console.log('Medusa Configuration Loading...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('PORT:', process.env.PORT || 9000);
console.log('HOST:', process.env.HOST || '0.0.0.0');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// SECURITY: Define allowed origins based on environment
const parseAndValidateOrigins = (envVar, defaultOrigins) => {
  if (!envVar) {
    return defaultOrigins;
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
    } catch (e) {
      console.error(`Invalid CORS origin rejected: ${origin}`);
      return false;
    }
  });
  
  if (origins.length === 0) {
    console.error('No valid CORS origins found, using defaults');
    return defaultOrigins;
  }
  
  return origins;
};

const allowedOrigins = {
  development: [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:9000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4000',
    'http://127.0.0.1:9000'
  ],
  production: parseAndValidateOrigins(
    process.env.ALLOWED_ORIGINS,
    [
      'https://strike-shop.com',
      'https://www.strike-shop.com',
      'https://api.strike-shop.com',
      'https://admin.strike-shop.com'
    ]
  )
};

const currentOrigins = allowedOrigins[process.env.NODE_ENV] || allowedOrigins.production;

// Validate no wildcards in final configuration
if (currentOrigins.some(origin => origin.includes('*'))) {
  throw new Error('SECURITY ERROR: CORS wildcard (*) is not allowed');
}

console.log('CORS Origins:', currentOrigins);

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      port: parseInt(process.env.PORT || '9000'),
      host: process.env.HOST || '0.0.0.0',
      storeCors: currentOrigins.join(','),
      adminCors: currentOrigins.join(','),
      authCors: currentOrigins.join(','),
      jwtSecret:
        process.env.JWT_SECRET || 'temporary_jwt_secret_replace_in_production',
      cookieSecret:
        process.env.COOKIE_SECRET ||
        'temporary_cookie_secret_replace_in_production',
    },
  },
  admin: {
    disable: false,
    autoRebuild: false,
  },
  modules: {
    // EXPLICITLY DISABLE TAX MODULE
    [Modules.TAX]: false,

    // Core modules
    [Modules.CACHE]: {
      resolve: '@medusajs/cache-inmemory',
    },
    [Modules.EVENT_BUS]: {
      resolve: '@medusajs/event-bus-local',
    },
    [Modules.WORKFLOW_ENGINE]: {
      resolve: '@medusajs/workflow-engine-inmemory',
    },
  },
});
