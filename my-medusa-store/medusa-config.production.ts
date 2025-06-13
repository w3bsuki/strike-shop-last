import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'production', process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseLogging: false,
    workerMode: process.env.MEDUSA_WORKER_MODE === 'worker' ? 'worker' : 'server',
    http: {
      storeCors: process.env.STORE_CORS || '*',
      adminCors: process.env.ADMIN_CORS || '*',
      authCors: process.env.AUTH_CORS || '*',
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  admin: {
    disable: process.env.MEDUSA_WORKER_MODE === 'worker' || process.env.DISABLE_MEDUSA_ADMIN === 'true',
    backendUrl: process.env.MEDUSA_BACKEND_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`,
    path: "/app"
  },
  modules: {
    [Modules.CACHE]: {
      resolve: "@medusajs/cache-inmemory",
      options: {
        ttl: 30 * 60 * 1000, // 30 minutes
      },
    },
    [Modules.EVENT_BUS]: {
      resolve: "@medusajs/event-bus-local",
    },
    [Modules.WORKFLOW_ENGINE]: {
      resolve: "@medusajs/workflow-engine-inmemory",
    },
    [Modules.PAYMENT]: {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              automatic_payment_methods: true,
              payment_description: "Strike™ Order",
            },
          },
        ],
      },
    },
  },
})