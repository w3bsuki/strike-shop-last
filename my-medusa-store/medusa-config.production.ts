import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv('production', process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: "*",
      adminCors: "*", 
      authCors: "*",
      jwtSecret: process.env.JWT_SECRET || "temp_jwt_secret_" + Math.random(),
      cookieSecret: process.env.COOKIE_SECRET || "temp_cookie_secret_" + Math.random(),
    },
  },
  admin: {
    disable: false,
    backendUrl: `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`,
  },
})