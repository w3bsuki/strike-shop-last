const { loadEnv, defineConfig, Modules } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE || "shared",
    redisUrl: process.env.REDIS_URL,
    // Add SSL support for Supabase
    databaseDriverOptions: process.env.NODE_ENV === "production" || process.env.DATABASE_URL?.includes("supabase") ? {
      connection: {
        ssl: { rejectUnauthorized: false }
      }
    } : {},
    http: {
      host: "0.0.0.0",
      port: parseInt(process.env.PORT || "9000"),
      // SECURITY FIX: Don't use wildcard CORS in production
      storeCors: process.env.STORE_CORS || "http://localhost:3000,http://localhost:3001",
      adminCors: process.env.ADMIN_CORS || "http://localhost:3000,http://localhost:3001",
      authCors: process.env.AUTH_CORS || "http://localhost:3000,http://localhost:3001",
      jwtSecret: process.env.JWT_SECRET || "supersecret_jwt_token",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret_cookie_secret",
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true" || process.env.NODE_ENV === "production",
    path: "/app",
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules: {
    // Core e-commerce modules (CRITICAL FIX: These were missing)
    [Modules.PRODUCT]: {
      resolve: "@medusajs/medusa/product",
    },
    [Modules.PRICING]: {
      resolve: "@medusajs/medusa/pricing",
    },
    [Modules.INVENTORY]: {
      resolve: "@medusajs/medusa/inventory",
    },
    [Modules.STOCK_LOCATION]: {
      resolve: "@medusajs/medusa/stock-location",
    },
    [Modules.CART]: {
      resolve: "@medusajs/medusa/cart",
    },
    [Modules.ORDER]: {
      resolve: "@medusajs/medusa/order",
    },
    [Modules.CUSTOMER]: {
      resolve: "@medusajs/medusa/customer",
    },
    [Modules.REGION]: {
      resolve: "@medusajs/medusa/region",
    },
    [Modules.STORE]: {
      resolve: "@medusajs/medusa/store",
    },
    [Modules.PAYMENT]: {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_SECRET_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
    // Infrastructure modules
    [Modules.CACHE]: process.env.REDIS_URL ? {
      resolve: "@medusajs/cache-redis",
      options: { redisUrl: process.env.REDIS_URL }
    } : {
      resolve: "@medusajs/cache-inmemory"
    },
    [Modules.EVENT_BUS]: process.env.REDIS_URL ? {
      resolve: "@medusajs/event-bus-redis",
      options: { redisUrl: process.env.REDIS_URL }
    } : {
      resolve: "@medusajs/event-bus-local"
    },
    [Modules.WORKFLOW_ENGINE]: process.env.REDIS_URL ? {
      resolve: "@medusajs/workflow-engine-redis",
      options: { redis: { url: process.env.REDIS_URL } }
    } : {
      resolve: "@medusajs/workflow-engine-inmemory"
    },
  }
})