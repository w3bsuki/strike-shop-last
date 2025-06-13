const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv("production", process.cwd())

// Get database URL from any possible source
const databaseUrl = 
  process.env.DATABASE_URL || 
  process.env.DATABASE_PUBLIC_URL || 
  process.env.DATABASE_PRIVATE_URL ||
  process.env.RAILWAY_DATABASE_URL ||
  process.env.POSTGRES_URL

console.log("=== Medusa Minimal Config ===")
console.log("Database URL found:", !!databaseUrl)
console.log("NODE_ENV:", process.env.NODE_ENV)
console.log("PORT:", process.env.PORT)

if (!databaseUrl) {
  console.error("FATAL: No database URL found!")
  console.error("Please ensure PostgreSQL is added to your Railway project")
  process.exit(1)
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl,
    http: {
      storeCors: "*",
      adminCors: "*",
      authCors: "*",
      jwtSecret: process.env.JWT_SECRET || "temp_jwt_" + Date.now(),
      cookieSecret: process.env.COOKIE_SECRET || "temp_cookie_" + Date.now(),
    },
  },
  admin: {
    disable: true,
  },
  // Minimal modules - let Medusa handle defaults
  modules: {},
})