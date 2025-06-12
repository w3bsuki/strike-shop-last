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
    databaseUrl: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
    http: {
      port: parseInt(process.env.PORT || "8000"),
      storeCors: "*",
      adminCors: "*", 
      authCors: "*",
      jwtSecret: generateSecret('JWT_SECRET'),
      cookieSecret: generateSecret('COOKIE_SECRET'),
    },
  },
  admin: {
    disable: false,
  },
})