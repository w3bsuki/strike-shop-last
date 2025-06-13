const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      host: "0.0.0.0",
      port: parseInt(process.env.PORT || "9000"),
      storeCors: "*",
      adminCors: "*",
      authCors: "*",
      jwtSecret: process.env.JWT_SECRET || "temporary_jwt_secret",
      cookieSecret: process.env.COOKIE_SECRET || "temporary_cookie_secret",
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
    path: "/app",
  },
})