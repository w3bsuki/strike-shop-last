import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAPISecurity, APISecurityMiddleware } from '@/lib/api-security';
import { SecureRefundService } from '@/lib/security/secure-refunds';
import { z } from 'zod';
import { logSecurityEvent } from '@/lib/security-config';

// Refund request validation schema
const refundRequestSchema = z.object({
  paymentIntentId: z.string()
    .regex(/^pi_[a-zA-Z0-9_]+$/, 'Invalid payment intent ID format'),
  
  amount: z.number()
    .positive()
    .optional()
    .refine(val => !val || Number.isInteger(val), 'Amount must be in cents/pence'),
    
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer', 'other']),
  
  metadata: z.record(z.string()).optional(),
  
  adminOverride: z.boolean().optional(),
});

// Secure POST handler for refund processing
const securePostHandler = async (request: NextRequest) => {
  try {
    // Authentication verification
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return APISecurityMiddleware.createErrorResponse(
        401,
        'UNAUTHORIZED',
        'User authentication required for refund processing'
      );
    }
    
    const userId = user.id;
    const sessionClaims = user.user_metadata;

    // Parse and validate request body
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

    // Validate refund request
    let validatedData;
    try {
      validatedData = refundRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return APISecurityMiddleware.createErrorResponse(
          400,
          'VALIDATION_ERROR',
          'Refund request validation failed',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        );
      }
      throw error;
    }

    const { paymentIntentId, amount, reason, metadata, adminOverride } = validatedData;

    // Check admin privileges if override requested
    let adminUserId: string | undefined;
    if (adminOverride) {
      const isAdmin = (sessionClaims as any)?.metadata?.role === 'admin';
      if (!isAdmin) {
        logSecurityEvent('Unauthorized admin refund attempt', {
          userId,
          paymentIntentId,
          attemptedOverride: true,
        });
        
        return APISecurityMiddleware.createErrorResponse(
          403,
          'FORBIDDEN',
          'Admin privileges required for override'
        );
      }
      adminUserId = userId;
    }

    // Process refund with security checks
    const result = await SecureRefundService.processRefund({
      paymentIntentId,
      ...(amount !== undefined && { amount }),
      reason,
      metadata: {
        ...metadata,
        requestIp: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
      },
      userId,
      ...(adminUserId && { adminUserId }),
    });

    // Handle refund result
    if (!result.success) {
      logSecurityEvent('Refund failed', {
        paymentIntentId,
        reason: result.error,
        validationResult: result.validationResult,
        userId,
      });

      // Determine appropriate error code
      const errorCode = result.validationResult.requiresApproval ? 'APPROVAL_REQUIRED' : 'REFUND_FAILED';
      const statusCode = result.validationResult.requiresApproval ? 202 : 400;

      return APISecurityMiddleware.createErrorResponse(
        statusCode,
        errorCode,
        result.error || 'Refund processing failed',
        result.validationResult.errors
      );
    }

    // Success response
    return APISecurityMiddleware.createSuccessResponse({
      refundId: result.refund!.id,
      amount: result.refund!.amount,
      currency: result.refund!.currency,
      status: result.refund!.status,
      reason: result.refund!.reason,
      created: new Date(result.refund!.created * 1000).toISOString(),
      validationResult: {
        warnings: result.validationResult.warnings,
        riskScore: result.validationResult.riskScore,
      },
    }, 'Refund processed successfully');

  } catch (error) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    logSecurityEvent('Refund endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: user?.id,
    });

    return APISecurityMiddleware.createErrorResponse(
      500,
      'REFUND_ERROR',
      'Refund processing temporarily unavailable'
    );
  }
};

// Secure GET handler for refund status/history
const secureGetHandler = async (_request: NextRequest) => {
  try {
    // Authentication verification
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return APISecurityMiddleware.createErrorResponse(
        401,
        'UNAUTHORIZED',
        'User authentication required'
      );
    }
    
    const userId = user.id;

    // Get refund history
    const history = await SecureRefundService.getRefundHistory(userId, 20);

    return APISecurityMiddleware.createSuccessResponse({
      refunds: history.refunds,
      summary: history.summary,
    }, 'Refund history retrieved successfully');

  } catch (error) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    logSecurityEvent('Refund history error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: user?.id,
    });

    return APISecurityMiddleware.createErrorResponse(
      500,
      'RETRIEVAL_ERROR',
      'Refund history temporarily unavailable'
    );
  }
};

// Export secured endpoints
export const POST = withAPISecurity(securePostHandler, {
  requireAuth: true,
  requireCSRF: true,
  rateLimit: 'STRICT', // Strict rate limiting for refunds
  allowedMethods: ['POST']
});

export const GET = withAPISecurity(secureGetHandler, {
  requireAuth: true,
  requireCSRF: false,
  rateLimit: 'MODERATE',
  allowedMethods: ['GET']
});