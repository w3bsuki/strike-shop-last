const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE || "shared",
    redisUrl: process.env.REDIS_URL,
    http: {
      host: "0.0.0.0",
      port: parseInt(process.env.PORT || "9000"),
      storeCors: process.env.STORE_CORS || "*",
      adminCors: process.env.ADMIN_CORS || "*",
      authCors: process.env.AUTH_CORS || "*",
      jwtSecret: process.env.JWT_SECRET || "supersecret_jwt_token",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret_cookie_secret",
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    path: "/app",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    ...(process.env.REDIS_URL ? [
      {
        resolve: "@medusajs/medusa/cache-redis",
        options: { 
          redisUrl: process.env.REDIS_URL 
        }
      },
      {
        resolve: "@medusajs/medusa/event-bus-redis", 
        options: { 
          redisUrl: process.env.REDIS_URL 
        }
      },
      {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: { 
          redis: { 
            url: process.env.REDIS_URL 
          } 
        }
      }
    ] : []),
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_SECRET_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    }
  ]
})