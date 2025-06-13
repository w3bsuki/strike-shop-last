const { loadEnv, defineConfig, Modules } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/medusa",
    http: {
      storeCors: process.env.STORE_CORS || "*",
      adminCors: process.env.ADMIN_CORS || "*",
      authCors: process.env.AUTH_CORS || "*",
      jwtSecret: process.env.JWT_SECRET || "temporary_jwt_secret",
      cookieSecret: process.env.COOKIE_SECRET || "temporary_cookie_secret",
    },
  },
  admin: {
    disable: false,
  },
  modules: {
    // Disable modules that cause Railway deployment issues
    [Modules.STOCK_LOCATION]: false,
    [Modules.INVENTORY]: false,
    [Modules.TAX]: false,
  },
})