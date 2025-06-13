const { loadEnv, defineConfig, Modules } = require("@medusajs/framework/utils")

loadEnv("production", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "*",
      adminCors: process.env.ADMIN_CORS || "*",
      authCors: process.env.AUTH_CORS || "*",
      jwtSecret: process.env.JWT_SECRET || "temp_jwt_secret",
      cookieSecret: process.env.COOKIE_SECRET || "temp_cookie_secret",
    },
  },
  admin: {
    disable: process.env.DISABLE_ADMIN === "true",
  },
  modules: {
    // Explicitly disable problematic modules for Railway
    [Modules.STOCK_LOCATION]: false,
    [Modules.INVENTORY]: false,
    [Modules.TAX]: false,
    // Use local/in-memory services to avoid external dependencies
    cacheService: {
      resolve: "@medusajs/cache-inmemory",
    },
    eventBusService: {
      resolve: "@medusajs/event-bus-local",
    },
  },
})