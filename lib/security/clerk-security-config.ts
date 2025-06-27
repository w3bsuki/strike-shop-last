// Clerk Security Configuration
// This module provides enhanced security settings for Clerk authentication

export const CLERK_SECURITY_CONFIG = {
  // Password Requirements
  passwordSettings: {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    // Clerk setting names for configuration
    settings: {
      min_length: 12,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_special_char: true,
      // Prevent common passwords
      disable_hibp: false, // Enable "Have I Been Pwned" check
      show_zxcvbn: true // Show password strength indicator
    }
  },

  // Multi-Factor Authentication
  mfaSettings: {
    // Enforce MFA for admin accounts
    enforceForAdmins: true,
    // MFA methods to enable
    methods: {
      totp: true, // Time-based One-Time Password (Authenticator apps)
      sms: true, // SMS-based verification
      backup_codes: true // Backup codes for recovery
    },
    // Grace period for MFA enrollment (days)
    gracePeriod: 7
  },

  // Session Configuration
  sessionSettings: {
    // Session lifetime in minutes
    sessionLifetime: 480, // 8 hours
    // Inactivity timeout in minutes
    inactivityTimeout: 30,
    // Maximum concurrent sessions per user
    maxConcurrentSessions: 3,
    // Token rotation
    tokenRotation: {
      enabled: true,
      rotationPeriod: 3600 // 1 hour in seconds
    }
  },

  // Sign-in Security
  signInSettings: {
    // Attempt limits
    maxAttempts: 5,
    // Lockout duration in minutes
    lockoutDuration: 30,
    // Progressive delays
    progressiveDelays: {
      enabled: true,
      delayPattern: [0, 2, 5, 10, 15, 30] // Delays in seconds
    },
    // Suspicious activity detection
    detectSuspiciousActivity: true,
    // Device tracking
    trackDevices: true,
    // IP-based restrictions
    ipRestrictions: {
      enabled: false, // Enable for production
      allowedIPs: [], // Whitelist specific IPs
      blockedIPs: [] // Blacklist specific IPs
    }
  },

  // User Verification
  verificationSettings: {
    // Email verification
    emailVerification: {
      required: true,
      codeExpiration: 600, // 10 minutes
      maxAttempts: 5
    },
    // Phone verification
    phoneVerification: {
      required: false,
      codeExpiration: 300, // 5 minutes
      maxAttempts: 3
    }
  },

  // Security Headers
  securityHeaders: {
    // Recommended security headers for Clerk
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  },

  // Webhook Security
  webhookSettings: {
    // Verify webhook signatures
    verifySignatures: true,
    // Allowed event types
    allowedEvents: [
      'user.created',
      'user.updated',
      'user.deleted',
      'session.created',
      'session.ended',
      'user.signed_in',
      'user.signed_out',
      'organization.created',
      'organization.updated',
      'organization.deleted'
    ]
  },

  // Admin-specific Security
  adminSecurity: {
    // Require MFA for all admin operations
    requireMFA: true,
    // Admin role identifiers
    adminRoles: ['admin', 'super_admin', 'moderator'],
    // Additional session restrictions
    sessionRestrictions: {
      maxLifetime: 240, // 4 hours for admins
      requireReauth: 60 // Require re-authentication every 60 minutes
    },
    // Audit logging
    auditLogging: {
      enabled: true,
      logLevel: 'verbose',
      retention: 90 // days
    }
  },

  // Rate Limiting (additional to our custom implementation)
  rateLimiting: {
    // Sign-in attempts
    signIn: {
      maxAttempts: 5,
      windowMs: 900000 // 15 minutes
    },
    // Sign-up attempts
    signUp: {
      maxAttempts: 3,
      windowMs: 3600000 // 1 hour
    },
    // Password reset
    passwordReset: {
      maxAttempts: 3,
      windowMs: 3600000 // 1 hour
    },
    // API requests
    api: {
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    }
  },

  // Security Monitoring
  monitoring: {
    // Alert thresholds
    alerts: {
      failedLoginThreshold: 10, // Alert after 10 failed logins
      suspiciousIPThreshold: 5, // Alert after 5 suspicious IPs
      mfaFailureThreshold: 3 // Alert after 3 MFA failures
    },
    // Metrics to track
    metrics: [
      'failed_login_attempts',
      'successful_logins',
      'mfa_enrollments',
      'password_resets',
      'account_lockouts',
      'suspicious_activities'
    ]
  },

  // Compliance Settings
  compliance: {
    // GDPR compliance
    gdpr: {
      enabled: true,
      dataRetention: 365, // days
      allowDataExport: true,
      allowDataDeletion: true
    },
    // SOC 2 compliance
    soc2: {
      enabled: true,
      encryptionRequired: true,
      auditTrailRequired: true
    }
  }
};

// Helper function to apply Clerk security settings
export function getClerkSecurityEnv(): Record<string, string> {
  return {
    // Password policy
    CLERK_PASSWORD_MIN_LENGTH: CLERK_SECURITY_CONFIG.passwordSettings.minLength.toString(),
    CLERK_PASSWORD_REQUIRE_UPPERCASE: CLERK_SECURITY_CONFIG.passwordSettings.requireUppercase.toString(),
    CLERK_PASSWORD_REQUIRE_LOWERCASE: CLERK_SECURITY_CONFIG.passwordSettings.requireLowercase.toString(),
    CLERK_PASSWORD_REQUIRE_NUMBERS: CLERK_SECURITY_CONFIG.passwordSettings.requireNumbers.toString(),
    CLERK_PASSWORD_REQUIRE_SPECIAL_CHAR: CLERK_SECURITY_CONFIG.passwordSettings.requireSpecialChars.toString(),
    
    // Session settings
    CLERK_SESSION_LIFETIME: CLERK_SECURITY_CONFIG.sessionSettings.sessionLifetime.toString(),
    CLERK_INACTIVITY_TIMEOUT: CLERK_SECURITY_CONFIG.sessionSettings.inactivityTimeout.toString(),
    
    // Security features
    CLERK_ENHANCED_SECURITY: 'true',
    CLERK_STRICT_MODE: 'true'
  };
}

// Middleware configuration for Clerk
export const clerkMiddlewareConfig = {
  // Protected routes that require authentication
  protectedRoutes: [
    '/dashboard',
    '/profile',
    '/settings',
    '/admin',
    '/api/user',
    '/api/admin'
  ],
  
  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/sign-in',
    '/sign-up',
    '/product',
    '/products',
    '/category',
    '/categories',
    '/search',
    '/cart',
    '/checkout',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/faq',
    '/help',
    '/new',
    '/sale',
    '/men',
    '/women',
    '/kids',
    '/footwear',
    '/accessories',
    '/brands',
    '/community',
    '/api/public',
    '/api/products',
    '/api/webhooks',
    '/api/store',
    '/placeholder.svg',
    '/fonts',
    '/images',
    '/icons',
    '/_next',
    '/static'
  ],
  
  // Routes that require admin role
  adminRoutes: [
    '/admin',
    '/api/admin'
  ],
  
  // Custom redirect URLs
  redirectUrls: {
    signIn: '/sign-in',
    signUp: '/sign-up',
    afterSignIn: '/dashboard',
    afterSignUp: '/onboarding',
    afterSignOut: '/'
  }
};

// Clerk webhook verification
export async function verifyClerkWebhook(
  payload: string,
  headers: Record<string, string>
): Promise<boolean> {
  const signature = headers['svix-signature'];
  const timestamp = headers['svix-timestamp'];
  const webhookId = headers['svix-id'];
  
  if (!signature || !timestamp || !webhookId) {
    return false;
  }
  
  // TODO: Implement actual webhook verification using Clerk's webhook secret
  // This is a placeholder - implement according to Clerk's webhook docs
  return true;
}

// Export configuration for use in application
export default CLERK_SECURITY_CONFIG;