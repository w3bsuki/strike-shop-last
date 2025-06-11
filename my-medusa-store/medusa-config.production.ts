import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'production', process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
    redisUrl: process.env.REDIS_URL,
    workerMode: process.env.WORKER_MODE as "worker" | "server" | "shared",
  },
  admin: {
    disable: process.env.DISABLE_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: {
    // Cache module with Redis
    [Modules.CACHE]: {
      resolve: "@medusajs/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
        ttl: 60 * 60 * 1000, // 1 hour
      },
    },
    // Event bus with Redis
    [Modules.EVENT_BUS]: {
      resolve: "@medusajs/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    // Workflow engine with Redis
    [Modules.WORKFLOW_ENGINE]: {
      resolve: "@medusajs/workflow-engine-redis",
      options: {
        redis: {
          url: process.env.REDIS_URL,
        },
      },
    },
    // File storage (S3-compatible)
    [Modules.FILE]: {
      resolve: "@medusajs/file-s3",
      options: {
        access_key_id: process.env.S3_ACCESS_KEY_ID,
        secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_REGION,
        bucket: process.env.S3_BUCKET_NAME,
        endpoint: process.env.S3_ENDPOINT,
      },
    },
    // Notification service
    [Modules.NOTIFICATION]: {
      resolve: "@medusajs/notification-sendgrid",
      options: {
        api_key: process.env.SENDGRID_API_KEY,
        from: process.env.SENDGRID_FROM,
      },
    },
    // Payment providers
    [Modules.PAYMENT]: [
      {
        resolve: "@medusajs/payment-stripe",
        options: {
          api_key: process.env.STRIPE_API_KEY,
          webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
          automatic_payment_methods: true,
          payment_method_types: ["card"],
        },
      },
    ],
    // Fulfillment providers
    [Modules.FULFILLMENT]: [
      {
        resolve: "@medusajs/fulfillment-manual",
        options: {},
      },
    ],
  },
  plugins: [
    // Security middleware
    {
      resolve: "./src/plugins/security",
      options: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            frameSrc: ["https://js.stripe.com"],
          },
        },
        rateLimiting: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100, // Limit each IP to 100 requests per windowMs
        },
      },
    },
    // Analytics
    {
      resolve: "@medusajs/plugin-segment",
      options: {
        write_key: process.env.SEGMENT_WRITE_KEY,
      },
    },
    // Search functionality
    {
      resolve: "@medusajs/plugin-meilisearch",
      options: {
        host: process.env.MEILISEARCH_HOST,
        apiKey: process.env.MEILISEARCH_API_KEY,
      },
    },
  ],
})