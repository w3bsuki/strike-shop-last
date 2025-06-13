import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

export default defineConfig({
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
})