// Recommendations API Route
// Handles all recommendation requests for the e-commerce platform

import { NextRequest, NextResponse } from 'next/server';
import { RecommendationEngine } from '@/lib/recommendations/recommendation-engine';
import { trackingAnalytics } from '@/lib/analytics/tracking-analytics';
import type { RecommendationRequest } from '@/types/recommendations';

const engine = new RecommendationEngine();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json() as RecommendationRequest;
    
    // Validate required fields
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json(
        { 
          success: false, 
          error: validationError,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Add default values
    const requestWithDefaults = {
      limit: 6,
      excludeProductIds: [],
      ...body
    };

    // Generate session ID if not provided
    if (!requestWithDefaults.sessionId && !requestWithDefaults.userId) {
      requestWithDefaults.sessionId = generateSessionId(request);
    }

    console.log('Generating recommendations:', {
      type: requestWithDefaults.type,
      userId: requestWithDefaults.userId,
      sessionId: requestWithDefaults.sessionId,
      productId: requestWithDefaults.productId,
      limit: requestWithDefaults.limit
    });

    // Generate recommendations
    const result = await engine.generateRecommendations(requestWithDefaults);

    // Log performance
    const responseTime = Date.now() - startTime;
    console.log(`Recommendations generated in ${responseTime}ms`, {
      type: body.type,
      productCount: result.products.length,
      cached: result.cached,
      confidence: result.confidence
    });

    // Track analytics - only pass defined values
    const eventData: any = {
      type: body.type,
      event: 'generated',
      productCount: result.products.length,
      responseTime,
      cached: result.cached,
      confidence: result.confidence
    };
    
    if (body.userId) eventData.userId = body.userId;
    if (requestWithDefaults.sessionId) eventData.sessionId = requestWithDefaults.sessionId;
    if (body.productId) eventData.productId = body.productId;
    
    await trackRecommendationEvent(eventData);

    // Return successful response
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        requestId: generateRequestId(),
        responseTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Recommendation API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      responseTime
    });

    // Track error
    await trackRecommendationEvent({
      type: 'unknown',
      event: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate recommendations',
        code: 'INTERNAL_ERROR',
        meta: {
          requestId: generateRequestId(),
          responseTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Convert GET parameters to POST body format
  const body: any = {
    type: (searchParams.get('type') as any) || 'similar',
    limit: parseInt(searchParams.get('limit') || '6'),
    excludeProductIds: searchParams.get('exclude')?.split(',') || []
  };
  
  // Only add optional fields if they exist
  const userId = searchParams.get('userId');
  const sessionId = searchParams.get('sessionId');
  const productId = searchParams.get('productId');
  const category = searchParams.get('category');
  
  if (userId) body.userId = userId;
  if (sessionId) body.sessionId = sessionId;
  if (productId) body.productId = productId;
  if (category) body.category = category;

  // Add price range if provided
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  if (minPrice || maxPrice) {
    body.priceRange = {
      min: minPrice ? parseFloat(minPrice) : undefined,
      max: maxPrice ? parseFloat(maxPrice) : undefined
    };
  }

  // Create a new request with the body
  const postRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(body)
  });

  // Forward to POST handler
  return POST(postRequest as NextRequest);
}

// Validation function
function validateRequest(body: RecommendationRequest): string | null {
  if (!body.type) {
    return 'Recommendation type is required';
  }

  const validTypes = [
    'similar', 'collaborative', 'frequently_bought', 'recently_viewed',
    'trending', 'personalized', 'category_popular', 'price_similar',
    'brand_related', 'seasonal'
  ];

  if (!validTypes.includes(body.type)) {
    return `Invalid recommendation type. Must be one of: ${validTypes.join(', ')}`;
  }

  // Type-specific validation
  switch (body.type) {
    case 'similar':
    case 'frequently_bought':
    case 'price_similar':
    case 'brand_related':
      if (!body.productId) {
        return `Product ID is required for ${body.type} recommendations`;
      }
      break;
      
    case 'collaborative':
    case 'personalized':
      if (!body.userId) {
        return `User ID is required for ${body.type} recommendations`;
      }
      break;
      
    case 'recently_viewed':
      if (!body.userId && !body.sessionId) {
        return 'User ID or Session ID is required for recently viewed recommendations';
      }
      break;
  }

  // Validate limit
  if (body.limit && (body.limit < 1 || body.limit > 50)) {
    return 'Limit must be between 1 and 50';
  }

  // Validate price range
  if (body.priceRange) {
    const { min, max } = body.priceRange;
    if (min && min < 0) {
      return 'Minimum price cannot be negative';
    }
    if (max && max < 0) {
      return 'Maximum price cannot be negative';
    }
    if (min && max && min > max) {
      return 'Minimum price cannot be greater than maximum price';
    }
  }

  return null;
}

// Helper functions
function generateSessionId(request: NextRequest): string {
  // Generate session ID from IP and user agent
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const timestamp = Date.now();
  
  return `session_${Buffer.from(`${ip}-${userAgent}-${timestamp}`).toString('base64').slice(0, 16)}`;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Analytics tracking
async function trackRecommendationEvent(data: {
  type: string;
  userId?: string;
  sessionId?: string;
  productId?: string;
  event: string;
  productCount?: number;
  responseTime?: number;
  cached?: boolean;
  confidence?: number;
  error?: string;
}) {
  try {
    // Track with internal analytics - only pass defined values
    const eventData: any = {
      action: `recommendation_${data.event}`,
      category: 'recommendations',
      label: data.type,
      metadata: {}
    };
    
    if (data.responseTime !== undefined) eventData.value = data.responseTime;
    if (data.userId) eventData.metadata.userId = data.userId;
    if (data.sessionId) eventData.metadata.sessionId = data.sessionId;
    if (data.productId) eventData.metadata.productId = data.productId;
    if (data.productCount !== undefined) eventData.metadata.productCount = data.productCount;
    if (data.cached !== undefined) eventData.metadata.cached = data.cached;
    if (data.confidence !== undefined) eventData.metadata.confidence = data.confidence;
    if (data.error) eventData.metadata.error = data.error;
    
    trackingAnalytics.trackEvent(eventData);

    // Track specific recommendation events
    if (data.event === 'generated' && data.productCount && data.productCount > 0) {
      trackingAnalytics.trackEvent({
        action: 'recommendation_displayed',
        category: 'product_recommendations',
        label: data.type,
        value: data.productCount,
        metadata: {
          algorithm: 'recommendation_engine',
          cached: data.cached,
          confidence: data.confidence
        }
      });
    }

  } catch (error) {
    console.error('Failed to track recommendation event:', error);
    // Don't throw - analytics failure shouldn't break recommendations
  }
}