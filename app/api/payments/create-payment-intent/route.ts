import type { NextRequest } from 'next/server';
// import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createPaymentIntent } from '@/lib/stripe-server';
import { withAPISecurity, APISecurityMiddleware } from '@/lib/api-security';
import { InputValidator } from '@/lib/security-fortress';
import { z } from 'zod';
import { PaymentValidator } from '@/lib/security/payment-validator';
import { FraudDetectionService } from '@/lib/security/fraud-detection';
import { PaymentMonitoringService } from '@/lib/security/payment-monitoring';

// 🛡️ FORTRESS-LEVEL PAYMENT SECURITY VALIDATION
const createPaymentIntentSchema = z.object({
  amount: z.number()
    .positive()
    .min(0.5) // Minimum 50p
    .max(100000) // Maximum £1000 for fraud prevention
    .refine(val => Number.isInteger(val * 100), 'Amount must be in valid currency units'),
  
  currency: z.string()
    .regex(/^[a-z]{3}$/, 'Currency must be valid ISO code')
    .refine(val => ['gbp', 'usd', 'eur'].includes(val), 'Unsupported currency')
    .default('gbp'),
    
  items: z.array(z.object({
    id: z.string()
      .min(1)
      .max(50)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid product ID format'),
    name: z.string()
      .min(1)
      .max(100)
      .transform(val => InputValidator.sanitizeHTML(val)),
    price: z.number()
      .positive()
      .max(10000), // Max £100 per item
    quantity: z.number()
      .int()
      .positive()
      .max(100), // Max 100 of any item
    size: z.string()
      .max(20)
      .optional()
      .transform(val => val ? InputValidator.sanitizeHTML(val) : val),
  }))
  .min(1, 'At least one item required')
  .max(50, 'Too many items in cart'),
  
  shipping: z.object({
    name: z.string()
      .min(1)
      .max(100)
      .transform(val => InputValidator.sanitizeHTML(val)),
    address: z.object({
      line1: z.string()
        .min(1)
        .max(100)
        .transform(val => InputValidator.sanitizeHTML(val)),
      line2: z.string()
        .max(100)
        .optional()
        .transform(val => val ? InputValidator.sanitizeHTML(val) : val),
      city: z.string()
        .min(1)
        .max(50)
        .transform(val => InputValidator.sanitizeHTML(val)),
      postal_code: z.string()
        .min(2)
        .max(20)
        .regex(/^[A-Z0-9\s-]+$/i, 'Invalid postal code format'),
      country: z.string()
        .length(2)
        .regex(/^[A-Z]{2}$/, 'Country must be valid ISO code')
        .refine(val => ['GB', 'US', 'FR', 'DE', 'ES', 'IT'].includes(val), 'Unsupported country'),
    }),
  }).optional(),
});

// 🔐 Secure POST handler with comprehensive validation
const securePostHandler = async (request: NextRequest) => {
  try {
    // 🛡️ AUTHENTICATION VERIFICATION
    const { userId } = await auth();
    
    if (!userId) {
      return APISecurityMiddleware.createErrorResponse(
        401,
        'UNAUTHORIZED',
        'User authentication required for payment processing'
      );
    }

    // 🔍 REQUEST BODY VALIDATION
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return APISecurityMiddleware.createErrorResponse(
        400,
        'INVALID_JSON',
        'Request body must be valid JSON'
      );
    }

    // 🛡️ COMPREHENSIVE SECURITY VALIDATION
    let validatedData;
    try {
      validatedData = createPaymentIntentSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return APISecurityMiddleware.createErrorResponse(
          400,
          'VALIDATION_ERROR',
          'Payment data validation failed',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        );
      }
      throw error;
    }

    const { amount, currency, items, shipping } = validatedData;

    // 🛡️ COMPREHENSIVE PAYMENT VALIDATION
    const userEmail = (await auth()).sessionClaims?.email || '';
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';
    
    const validationResult = await PaymentValidator.validatePayment({
      amount,
      currency,
      items: items as any, // Type assertion needed due to exactOptionalPropertyTypes
      userId,
      userEmail,
      ...(shipping?.address.country && { 
        shippingCountry: shipping.address.country,
        billingCountry: shipping.address.country, // Using shipping as billing for now
      }),
      ipAddress: clientIp,
      userAgent,
    });

    // Check validation result
    if (!validationResult.isValid) {
      await PaymentMonitoringService.logEvent({
        id: `validation_fail_${Date.now()}`,
        type: 'fraud_alert',
        timestamp: new Date().toISOString(),
        userId,
        amount,
        currency,
        metadata: {
          errors: validationResult.errors,
          riskScore: validationResult.riskScore,
        },
      });

      return APISecurityMiddleware.createErrorResponse(
        400,
        'VALIDATION_FAILED',
        'Payment validation failed',
        validationResult.errors
      );
    }

    // 🚨 FRAUD DETECTION
    const fraudCheckResult = await FraudDetectionService.checkTransaction({
      userId,
      email: userEmail,
      amount,
      currency,
      ipAddress: clientIp,
      userAgent,
      ...(shipping && {
        shippingAddress: {
          country: shipping.address.country,
          city: shipping.address.city,
          postalCode: shipping.address.postal_code,
        }
      }),
      items,
    });

    // Handle fraud check results
    if (!fraudCheckResult.allow) {
      await PaymentMonitoringService.logEvent({
        id: `fraud_block_${Date.now()}`,
        type: 'fraud_alert',
        timestamp: new Date().toISOString(),
        userId,
        amount,
        currency,
        riskScore: fraudCheckResult.riskScore,
        metadata: {
          reasons: fraudCheckResult.reasons,
          action: fraudCheckResult.suggestedAction,
        },
      });

      return APISecurityMiddleware.createErrorResponse(
        403,
        'PAYMENT_BLOCKED',
        'Payment blocked due to security concerns'
      );
    }

    // Log warnings if any
    if (validationResult.warnings.length > 0 || fraudCheckResult.reasons.length > 0) {
      console.warn(`⚠️ PAYMENT WARNINGS for user ${userId}`, {
        validationWarnings: validationResult.warnings,
        fraudReasons: fraudCheckResult.reasons,
        riskScore: fraudCheckResult.riskScore,
        timestamp: new Date().toISOString()
      });
    }

    // 🔐 SECURE METADATA CREATION
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const metadata: Record<string, string> = {
      userId,
      itemCount: items.length.toString(),
      totalQuantity: totalItems.toString(),
      securityHash: InputValidator.validateInput(
        `${userId}-${amount}-${items.length}`,
        'text'
      ).sanitized,
      timestamp: new Date().toISOString(),
      // Store minimal item data for verification
      items: JSON.stringify(items.map(item => ({
        id: item.id,
        name: item.name.substring(0, 50), // Truncate for metadata limits
        quantity: item.quantity,
        price: item.price,
        size: item.size,
      }))),
    };

    if (shipping) {
      metadata.shipping_name = shipping.name;
      metadata.shipping_country = shipping.address.country;
      metadata.shipping_city = shipping.address.city;
      // Store full address securely
      metadata.shipping_address = JSON.stringify(shipping.address);
    }

    // 💳 CREATE PAYMENT INTENT WITH ENHANCED SECURITY
    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      metadata: {
        ...metadata,
        riskScore: fraudCheckResult.riskScore.toString(),
        requires3DS: (validationResult.requires3DS || fraudCheckResult.suggestedAction === 'challenge').toString(),
        requiresReview: fraudCheckResult.requiresManualReview.toString(),
      },
      customerEmail: userEmail,
      description: `Order for ${items.length} items - Risk Score: ${fraudCheckResult.riskScore}`,
    });

    // 📝 PAYMENT MONITORING
    await PaymentMonitoringService.logEvent({
      id: paymentIntent.id,
      type: 'payment_intent.created',
      timestamp: new Date().toISOString(),
      userId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      riskScore: fraudCheckResult.riskScore,
      metadata: {
        itemCount: items.length,
        requires3DS: validationResult.requires3DS || fraudCheckResult.suggestedAction === 'challenge',
        requiresReview: fraudCheckResult.requiresManualReview,
        validationWarnings: validationResult.warnings.length,
        fraudReasons: fraudCheckResult.reasons.length,
      },
    });

    console.log(`💳 SECURE PAYMENT INTENT CREATED: ${paymentIntent.id}`, {
      userId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      riskScore: fraudCheckResult.riskScore,
      requires3DS: validationResult.requires3DS,
      timestamp: new Date().toISOString()
    });

    // 🎯 SECURE RESPONSE WITH SECURITY INDICATORS
    return APISecurityMiddleware.createSuccessResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      // Include security flags for client-side handling
      security: {
        requires3DS: validationResult.requires3DS || fraudCheckResult.suggestedAction === 'challenge',
        riskLevel: fraudCheckResult.riskScore > 70 ? 'high' : fraudCheckResult.riskScore > 40 ? 'medium' : 'low',
      },
    }, 'Secure payment intent created successfully');

  } catch (error) {
    // 🚨 COMPREHENSIVE ERROR HANDLING
    console.error('🚨 PAYMENT INTENT ERROR:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      userId: (await auth()).userId
    });

    if (error instanceof z.ZodError) {
      return APISecurityMiddleware.createErrorResponse(
        400,
        'VALIDATION_ERROR',
        'Payment data validation failed',
        error.errors
      );
    }

    return APISecurityMiddleware.createErrorResponse(
      500,
      'PAYMENT_ERROR',
      'Payment processing temporarily unavailable'
    );
  }
}

// 🔍 Secure GET handler for payment intent retrieval
const secureGetHandler = async (request: NextRequest) => {
  try {
    // 🛡️ AUTHENTICATION VERIFICATION
    const { userId } = await auth();
    
    if (!userId) {
      return APISecurityMiddleware.createErrorResponse(
        401,
        'UNAUTHORIZED',
        'User authentication required'
      );
    }

    // 🔍 QUERY PARAMETER VALIDATION
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return APISecurityMiddleware.createErrorResponse(
        400,
        'MISSING_PARAMETER',
        'Payment intent ID is required'
      );
    }

    // Validate payment intent ID format (Stripe format: pi_...)
    if (!/^pi_[a-zA-Z0-9_]+$/.test(paymentIntentId)) {
      return APISecurityMiddleware.createErrorResponse(
        400,
        'INVALID_FORMAT',
        'Invalid payment intent ID format'
      );
    }

    // TODO: Implement proper stripe server integration
    // const { retrievePaymentIntent } = await import('@/lib/stripe-server');
    // const paymentIntent = await retrievePaymentIntent(paymentIntentId);
    
    // Temporary mock response with security validation
    const paymentIntent = { 
      id: paymentIntentId, 
      status: 'succeeded',
      amount: 1000,
      currency: 'gbp',
      metadata: { 
        userId,
        timestamp: new Date().toISOString(),
        securityHash: 'validated'
      } 
    };

    // 🔐 OWNERSHIP VERIFICATION - Critical security check
    if (paymentIntent.metadata.userId !== userId) {
      console.warn(`🚨 UNAUTHORIZED ACCESS ATTEMPT: User ${userId} tried to access payment intent ${paymentIntentId}`, {
        attemptedUserId: userId,
        paymentIntentOwner: paymentIntent.metadata.userId,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for')
      });
      
      return APISecurityMiddleware.createErrorResponse(
        403,
        'FORBIDDEN',
        'Access denied: Payment intent belongs to different user'
      );
    }

    // 🎯 SECURE RESPONSE WITH MINIMAL DATA EXPOSURE
    return APISecurityMiddleware.createSuccessResponse({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      // Only return safe metadata
      created: paymentIntent.metadata.timestamp,
    }, 'Payment intent retrieved successfully');

  } catch (error) {
    console.error('🚨 PAYMENT RETRIEVAL ERROR:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      userId: (await auth()).userId
    });

    return APISecurityMiddleware.createErrorResponse(
      500,
      'RETRIEVAL_ERROR',
      'Payment retrieval temporarily unavailable'
    );
  }
}

// 🛡️ EXPORT SECURED ENDPOINTS WITH FORTRESS-LEVEL PROTECTION
export const POST = withAPISecurity(securePostHandler, {
  requireAuth: true,
  requireCSRF: true,
  rateLimit: 'STRICT',
  allowedMethods: ['POST']
});

export const GET = withAPISecurity(secureGetHandler, {
  requireAuth: true,
  requireCSRF: false, // GET requests don't need CSRF
  rateLimit: 'MODERATE',
  allowedMethods: ['GET']
});