import { z } from 'zod';

/**
 * Secure Configuration Service
 * 
 * This service provides type-safe, validated access to environment variables.
 * All required secrets are validated on startup to prevent runtime errors.
 * No direct process.env access is allowed in the codebase.
 */

// Environment variable schemas
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Critical Security Secrets
  JWT_SECRET: z.string().min(64, 'JWT_SECRET must be at least 64 characters'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters'),
  INTERNAL_API_SECRET: z.string().min(32, 'INTERNAL_API_SECRET must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters').optional(),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').optional(),
  
  // Public URLs
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_MEDUSA_BACKEND_URL: z.string().url(),
  
  // Medusa Configuration
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  NEXT_PUBLIC_MEDUSA_REGION_ID: z.string().startsWith('reg_'),
  MEDUSA_ADMIN_SECRET: z.string().min(32).optional(),
  
  // Stripe Configuration
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  
  // Sanity Configuration
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string(),
  NEXT_PUBLIC_SANITY_DATASET: z.string(),
  NEXT_PUBLIC_SANITY_API_VERSION: z.string(),
  SANITY_API_TOKEN: z.string().optional(),
  
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().default('/account'),
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().default('/account'),
  
  // Database
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  
  // Security Configuration
  ENABLE_SECURITY_HEADERS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  CSP_REPORT_URI: z.string().optional(),
  ENABLE_CSRF_PROTECTION: z.string().transform(val => val === 'true').default('true'),
  
  // CORS Configuration
  ADMIN_CORS: z.string().optional(),
  STORE_CORS: z.string().optional(),
  AUTH_CORS: z.string().optional(),
  
  // Monitoring
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // Email
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // Performance
  ENABLE_CDN: z.string().transform(val => val === 'true').default('false'),
  CDN_URL: z.string().url().optional(),
  ENABLE_CACHING: z.string().transform(val => val === 'true').default('true'),
  CACHE_TTL: z.string().transform(Number).default('3600'),
});

// Type for validated environment
type ValidatedEnv = z.infer<typeof envSchema>;

class SecureConfigService {
  private static instance: SecureConfigService;
  private config: ValidatedEnv;
  private isValidated = false;

  private constructor() {
    this.config = this.validateEnvironment();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SecureConfigService {
    if (!SecureConfigService.instance) {
      SecureConfigService.instance = new SecureConfigService();
    }
    return SecureConfigService.instance;
  }

  /**
   * Validate all environment variables on startup
   * Throws if required variables are missing or invalid
   */
  private validateEnvironment(): ValidatedEnv {
    try {
      // In production, all security secrets are required
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Create a modified schema for production
      const productionSchema = isProduction ? envSchema.extend({
        JWT_SECRET: z.string().min(64),
        COOKIE_SECRET: z.string().min(32),
        INTERNAL_API_SECRET: z.string().min(32),
        SESSION_SECRET: z.string().min(32),
        ENCRYPTION_KEY: z.string().min(32),
        DATABASE_URL: z.string().url(),
        STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
      }) : envSchema;

      const parsed = productionSchema.safeParse(process.env);

      if (!parsed.success) {
        const errors = parsed.error.flatten();
        console.error('❌ Environment validation failed:');
        console.error(JSON.stringify(errors, null, 2));
        
        // List missing required variables
        const missingVars = Object.entries(errors.fieldErrors)
          .filter(([_, errors]) => errors?.some(e => e.includes('Required')))
          .map(([key]) => key);
        
        if (missingVars.length > 0) {
          console.error('\n🚨 Missing required environment variables:', missingVars.join(', '));
        }
        
        throw new Error('Environment validation failed. Check the logs above.');
      }

      this.isValidated = true;
      
      // Log successful validation (without exposing secrets)
      console.log('✅ Environment validated successfully');
      console.log(`📍 Environment: ${parsed.data.NODE_ENV}`);
      console.log(`🔒 Security features enabled: Headers=${parsed.data.ENABLE_SECURITY_HEADERS}, RateLimit=${parsed.data.ENABLE_RATE_LIMITING}, CSRF=${parsed.data.ENABLE_CSRF_PROTECTION}`);
      
      return parsed.data;
    } catch (error) {
      console.error('💥 Fatal: Environment validation failed');
      throw error;
    }
  }

  /**
   * Get a configuration value
   * @param key - The configuration key
   * @returns The configuration value
   */
  public get<K extends keyof ValidatedEnv>(key: K): ValidatedEnv[K] {
    if (!this.isValidated) {
      throw new Error('Configuration not validated. This should not happen.');
    }
    return this.config[key];
  }

  /**
   * Get all configuration (for debugging only, excludes secrets)
   */
  public getPublicConfig(): Partial<ValidatedEnv> {
    const { 
      JWT_SECRET, 
      COOKIE_SECRET, 
      INTERNAL_API_SECRET,
      SESSION_SECRET,
      ENCRYPTION_KEY,
      STRIPE_SECRET_KEY,
      CLERK_SECRET_KEY,
      SANITY_API_TOKEN,
      SENTRY_AUTH_TOKEN,
      RESEND_API_KEY,
      DATABASE_URL,
      REDIS_URL,
      MEDUSA_ADMIN_SECRET,
      ...publicConfig 
    } = this.config;
    
    return publicConfig;
  }

  /**
   * Check if running in production
   */
  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  /**
   * Check if running in development
   */
  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  /**
   * Check if running in test
   */
  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  /**
   * Get security configuration
   */
  public getSecurityConfig() {
    return {
      enableHeaders: this.config.ENABLE_SECURITY_HEADERS,
      enableRateLimiting: this.config.ENABLE_RATE_LIMITING,
      rateLimitMax: this.config.RATE_LIMIT_MAX_REQUESTS,
      rateLimitWindow: this.config.RATE_LIMIT_WINDOW_MS,
      enableCsrf: this.config.ENABLE_CSRF_PROTECTION,
      cspReportUri: this.config.CSP_REPORT_URI,
    };
  }

  /**
   * Get CORS configuration
   */
  public getCorsConfig() {
    return {
      admin: this.config.ADMIN_CORS?.split(',').map(s => s.trim()) || [],
      store: this.config.STORE_CORS?.split(',').map(s => s.trim()) || [],
      auth: this.config.AUTH_CORS?.split(',').map(s => s.trim()) || [],
    };
  }
}

// Export singleton instance
export const config = SecureConfigService.getInstance();

// Export type for use in other files
export type { ValidatedEnv };

// Validate on module load in non-test environments
if (process.env.NODE_ENV !== 'test') {
  try {
    config.get('NODE_ENV'); // Force validation
  } catch (error) {
    console.error('Failed to initialize secure configuration:', error);
    process.exit(1);
  }
}