import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'production', process.cwd())

// Generate secure secrets if not provided
const generateSecret = (name: string) => {
  if (!process.env[name]) {
    console.warn(`${name} not set, using generated value`)
    return Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString(36)).toString('base64')
  }
  return process.env[name]
}

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || "postgresql://postgres:postgres@localhost:5432/medusa",
    http: {
      storeCors: "*",
      adminCors: "*", 
      authCors: "*",
      jwtSecret: generateSecret('JWT_SECRET'),
      cookieSecret: generateSecret('COOKIE_SECRET'),
    },
  },
  admin: {
    disable: false,
    backendUrl: process.env.MEDUSA_BACKEND_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "http://localhost:8000"),
  },
  modules: {
    // Disable tax module to avoid initialization errors
    tax: false,
  },
})