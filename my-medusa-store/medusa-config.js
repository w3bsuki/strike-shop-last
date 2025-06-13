const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: "*",
      adminCors: "*",
      authCors: "*",
      jwtSecret: process.env.JWT_SECRET || "temporary_jwt_secret",
      cookieSecret: process.env.COOKIE_SECRET || "temporary_cookie_secret",
    },
  },
  admin: {
    disable: false,
  },
  modules: {
    // Core modules with resolve paths
    cacheService: {
      resolve: "@medusajs/cache-inmemory",
    },
    eventBusService: {
      resolve: "@medusajs/event-bus-local",
    },
    workflowEngineService: {
      resolve: "@medusajs/workflow-engine-inmemory",
    },
    // Payment provider
    paymentProviders: [
      {
        resolve: "@medusajs/payment-stripe",
        options: {
          apiKey: process.env.STRIPE_API_KEY || "sk_test_placeholder",
        },
      },
    ],
  },
})