const { loadEnv, defineConfig, Modules } = require('@medusajs/framework/utils');

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

// Log configuration for debugging
console.log('Medusa Configuration Loading...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('PORT:', process.env.PORT || 9000);
console.log('HOST:', process.env.HOST || '0.0.0.0');

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      port: parseInt(process.env.PORT || '9000'),
      host: process.env.HOST || '0.0.0.0',
      storeCors: '*',
      adminCors: '*',
      authCors: '*',
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
