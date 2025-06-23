import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  admin: {
    disable: false,
    backendUrl: process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000',
    // Force the admin to use the correct backend URL
    path: '/app',
  },
  modules: {
    [Modules.PAYMENT]: {
      resolve: '@medusajs/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/payment-stripe',
            id: 'stripe',
            options: {
              apiKey:
                process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              // This will work for local development without webhooks
              automatic_payment_methods: true,
              payment_description: 'Strike™ Order',
            },
          },
        ],
      },
    },
  },
});
