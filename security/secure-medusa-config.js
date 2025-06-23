const { loadEnv, defineConfig, Modules } = require('@medusajs/framework/utils');
const crypto = require('crypto');

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

// Generate secure secrets if not provided
const generateSecureSecret = (name) => {
  if (process.env[name] && process.env[name].length >= 32) {
    return process.env[name];
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `SECURITY ERROR: ${name} must be set in production environment and be at least 32 characters long`
    );
  }

  // Only generate for development - never use in production
  const generated = crypto.randomBytes(32).toString('hex');
  console.warn(
    `⚠️  WARNING: Generated ${name} for development. Set a secure value in production!`
  );
  return generated;
};

// Secure CORS configuration
const getSecureCorsConfig = (envVar, defaultHosts = []) => {
  if (process.env[envVar]) {
    return process.env[envVar].split(',').map((origin) => origin.trim());
  }

  if (process.env.NODE_ENV === 'production') {
    // In production, never allow wildcard
    return defaultHosts.length > 0 ? defaultHosts : ['https://your-domain.com'];
  }

  // Development fallback
  return [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4000',
  ];
};

// Security validation
if (process.env.NODE_ENV === 'production') {
  const requiredSecrets = ['JWT_SECRET', 'COOKIE_SECRET'];
  const requiredCors = ['STORE_CORS', 'ADMIN_CORS', 'AUTH_CORS'];

  for (const secret of requiredSecrets) {
    if (!process.env[secret] || process.env[secret].length < 32) {
      throw new Error(
        `SECURITY ERROR: ${secret} must be set in production and be at least 32 characters long`
      );
    }
  }

  for (const cors of requiredCors) {
    if (!process.env[cors] || process.env[cors] === '*') {
      throw new Error(
        `SECURITY ERROR: ${cors} must be configured with specific domains in production, not wildcard`
      );
    }
  }
}

// Log secure configuration loading
console.log('🔒 Secure Medusa Configuration Loading...');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log(
  '🗄️  Database:',
  process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing'
);
console.log(
  '🔑 JWT Secret:',
  process.env.JWT_SECRET ? '✅ Set' : '⚠️  Generated for dev'
);
console.log(
  '🍪 Cookie Secret:',
  process.env.COOKIE_SECRET ? '✅ Set' : '⚠️  Generated for dev'
);
console.log(
  '🌐 CORS Mode:',
  process.env.NODE_ENV === 'production' ? '🔒 Restricted' : '🔓 Development'
);
console.log('🚢 Port:', process.env.PORT || 9000);

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      port: parseInt(process.env.PORT || '9000'),
      host: process.env.HOST || '0.0.0.0',

      // Secure CORS configuration
      storeCors: getSecureCorsConfig('STORE_CORS', [
        'https://your-frontend.com',
        'https://www.your-frontend.com',
      ]),
      adminCors: getSecureCorsConfig('ADMIN_CORS', [
        'https://admin.your-frontend.com',
      ]),
      authCors: getSecureCorsConfig('AUTH_CORS', [
        'https://your-frontend.com',
        'https://admin.your-frontend.com',
      ]),

      // Secure secrets
      jwtSecret: generateSecureSecret('JWT_SECRET'),
      cookieSecret: generateSecureSecret('COOKIE_SECRET'),

      // Additional security headers
      compression: true,
      helmet: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'default-src': ["'self'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            'style-src': ["'self'", "'unsafe-inline'"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      },
    },

    // Database security
    databaseLogging: process.env.NODE_ENV !== 'production',
    databaseExtraOptions: {
      ssl:
        process.env.NODE_ENV === 'production'
          ? {
              rejectUnauthorized: false, // Railway/Heroku compatibility
            }
          : false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20, // Connection pool limit
    },
  },

  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
    autoRebuild: process.env.NODE_ENV !== 'production',
    path: '/admin',
    backendUrl:
      process.env.MEDUSA_BACKEND_URL ||
      (process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : 'http://localhost:9000'),
  },

  modules: {
    // Security: Disable tax module to reduce attack surface
    [Modules.TAX]: false,

    // Core modules with security configurations
    [Modules.CACHE]: {
      resolve: '@medusajs/cache-inmemory',
      options: {
        ttl: process.env.NODE_ENV === 'production' ? 1800000 : 300000, // 30min prod, 5min dev
        max: 1000, // Maximum cache entries
      },
    },

    [Modules.EVENT_BUS]: {
      resolve: '@medusajs/event-bus-local',
      options: {
        queueName: 'medusa-events',
        maxRetries: 3,
      },
    },

    [Modules.WORKFLOW_ENGINE]: {
      resolve: '@medusajs/workflow-engine-inmemory',
      options: {
        maxConcurrentJobs: 10,
      },
    },

    // File service with security restrictions
    [Modules.FILE]: {
      resolve: '@medusajs/file-local',
      options: {
        upload_dir: process.env.FILE_UPLOAD_DIR || 'uploads',
        backend_url: process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000',
        // Security: File type restrictions
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ],
        maxFileSize: 10 * 1024 * 1024, // 10MB limit
      },
    },
  },

  // Plugin configurations with security settings
  plugins: [
    // Security middleware plugin
    {
      resolve: './plugins/security-middleware',
      options: {
        rateLimit: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Stricter in production
          message: 'Too many requests from this IP, please try again later.',
        },
        helmet: true,
        compression: true,
      },
    },
  ],
});
