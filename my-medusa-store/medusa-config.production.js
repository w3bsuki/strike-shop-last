const { loadEnv, defineConfig, Modules } = require("@medusajs/framework/utils")

loadEnv("production", process.cwd())

// Ensure database URL is available
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_PRIVATE_URL

if (!databaseUrl) {
  console.error("ERROR: No database URL found. Please set DATABASE_URL environment variable.")
  console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('DATABASE')))
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: databaseUrl,
    http: {
      storeCors: process.env.STORE_CORS || "*",
      adminCors: process.env.ADMIN_CORS || "*",
      authCors: process.env.AUTH_CORS || "*",
      jwtSecret: process.env.JWT_SECRET || "temp_jwt_secret",
      cookieSecret: process.env.COOKIE_SECRET || "temp_cookie_secret",
    },
  },
  admin: {
    disable: true, // Disable admin for now to simplify deployment
  },
  modules: {
    // Only include essential modules
    [Modules.PRODUCT]: {
      resolve: "@medusajs/medusa/product",
    },
    [Modules.PRICING]: {
      resolve: "@medusajs/medusa/pricing",
    },
    [Modules.CART]: {
      resolve: "@medusajs/medusa/cart",
    },
    [Modules.CUSTOMER]: {
      resolve: "@medusajs/medusa/customer",
    },
    [Modules.ORDER]: {
      resolve: "@medusajs/medusa/order",
    },
    [Modules.AUTH]: {
      resolve: "@medusajs/medusa/auth",
    },
    [Modules.USER]: {
      resolve: "@medusajs/medusa/user",
    },
    [Modules.REGION]: {
      resolve: "@medusajs/medusa/region",
    },
    [Modules.STORE]: {
      resolve: "@medusajs/medusa/store",
    },
    [Modules.PAYMENT]: {
      resolve: "@medusajs/medusa/payment",
    },
    [Modules.FULFILLMENT]: {
      resolve: "@medusajs/medusa/fulfillment",
    },
    [Modules.SALES_CHANNEL]: {
      resolve: "@medusajs/medusa/sales-channel",
    },
    [Modules.API_KEY]: {
      resolve: "@medusajs/medusa/api-key",
    },
    [Modules.CURRENCY]: {
      resolve: "@medusajs/medusa/currency",
    },
    [Modules.WORKFLOW_ENGINE]: {
      resolve: "@medusajs/medusa/workflow-engine-inmemory",
    },
    // Explicitly disable problematic modules
    [Modules.STOCK_LOCATION]: false,
    [Modules.INVENTORY]: false,
    [Modules.TAX]: false,
    // Use in-memory services
    cacheService: {
      resolve: "@medusajs/cache-inmemory",
    },
    eventBusService: {
      resolve: "@medusajs/event-bus-local",
    },
  },
})