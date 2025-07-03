// Product Interaction Tracking API
// Tracks user interactions with products for recommendation engine

import { NextRequest, NextResponse } from 'next/server';
import { RecommendationEngine } from '@/lib/recommendations/recommendation-engine';
import { trackingAnalytics } from '@/lib/analytics/tracking-analytics';

const engine = new RecommendationEngine();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.productId || !body.interactionType) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product ID and interaction type are required' 
        },
        { status: 400 }
      );
    }

    // Validate interaction type
    const validInteractionTypes = [
      'view', 'cart_add', 'cart_remove', 'wishlist_add', 'wishlist_remove',
      'purchase', 'share', 'review', 'search', 'compare'
    ];

    if (!validInteractionTypes.includes(body.interactionType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid interaction type. Must be one of: ${validInteractionTypes.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Extract interaction data
    const interactionData = {
      userId: body.userId,
      sessionId: body.sessionId || generateSessionId(request),
      productId: body.productId,
      interactionType: body.interactionType,
      interactionData: body.interactionData || {}
    };

    console.log('Tracking product interaction:', interactionData);

    // Track with recommendation engine
    await engine.trackInteraction(interactionData);

    // Track with analytics based on interaction type
    await trackInteractionAnalytics(interactionData, body);

    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully',
      data: {
        productId: interactionData.productId,
        interactionType: interactionData.interactionType,
        sessionId: interactionData.sessionId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Product interaction tracking error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track interaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function trackInteractionAnalytics(interactionData: any, requestBody: any) {
  const { productId, interactionType, userId, sessionId } = interactionData;
  
  // Common product data
  const productData = {
    id: productId,
    name: requestBody.productName || 'Unknown Product',
    category: requestBody.category || 'Unknown',
    price: requestBody.price,
    currency: requestBody.currency || 'USD',
    brand: requestBody.brand,
    variant: requestBody.variant
  };

  const commonMetadata = {
    userId,
    sessionId,
    source: requestBody.source || 'direct'
  };

  try {
    switch (interactionType) {
      case 'cart_add':
        trackingAnalytics.trackAddToCart({
          ...productData,
          quantity: requestBody.quantity || 1,
          metadata: {
            ...commonMetadata,
            variantId: requestBody.variantId
          }
        });
        
        trackingAnalytics.trackEvent({
          action: 'add_to_cart',
          category: 'ecommerce',
          label: productData.category,
          value: productData.price,
          metadata: commonMetadata
        });
        break;

      case 'cart_remove':
        trackingAnalytics.trackRemoveFromCart({
          ...productData,
          quantity: requestBody.quantity || 1,
          metadata: {
            ...commonMetadata,
            variantId: requestBody.variantId
          }
        });
        
        trackingAnalytics.trackEvent({
          action: 'remove_from_cart',
          category: 'ecommerce',
          label: productData.category,
          metadata: commonMetadata
        });
        break;

      case 'wishlist_add':
        trackingAnalytics.trackEvent({
          action: 'add_to_wishlist',
          category: 'engagement',
          label: productData.category,
          value: productData.price,
          metadata: commonMetadata
        });
        break;

      case 'wishlist_remove':
        trackingAnalytics.trackEvent({
          action: 'remove_from_wishlist',
          category: 'engagement',
          label: productData.category,
          metadata: commonMetadata
        });
        break;

      case 'purchase':
        trackingAnalytics.trackPurchase({
          orderId: requestBody.orderId,
          items: [{
            ...productData,
            quantity: requestBody.quantity || 1
          }],
          total: requestBody.total || productData.price,
          currency: productData.currency,
          metadata: {
            ...commonMetadata,
            paymentMethod: requestBody.paymentMethod,
            shippingMethod: requestBody.shippingMethod
          }
        });
        
        trackingAnalytics.trackEvent({
          action: 'purchase',
          category: 'ecommerce',
          label: productData.category,
          value: requestBody.total || productData.price,
          metadata: commonMetadata
        });
        break;

      case 'share':
        trackingAnalytics.trackEvent({
          action: 'share_product',
          category: 'engagement',
          label: requestBody.shareMethod || 'unknown',
          metadata: {
            ...commonMetadata,
            shareMethod: requestBody.shareMethod,
            shareUrl: requestBody.shareUrl
          }
        });
        break;

      case 'review':
        trackingAnalytics.trackEvent({
          action: 'product_review',
          category: 'engagement',
          label: productData.category,
          value: requestBody.rating,
          metadata: {
            ...commonMetadata,
            rating: requestBody.rating,
            reviewLength: requestBody.reviewText?.length || 0
          }
        });
        break;

      case 'search':
        trackingAnalytics.trackEvent({
          action: 'product_search',
          category: 'engagement',
          label: requestBody.searchQuery || 'unknown',
          metadata: {
            ...commonMetadata,
            searchQuery: requestBody.searchQuery,
            resultCount: requestBody.resultCount,
            clickPosition: requestBody.clickPosition
          }
        });
        break;

      case 'compare':
        trackingAnalytics.trackEvent({
          action: 'product_compare',
          category: 'engagement',
          label: productData.category,
          metadata: {
            ...commonMetadata,
            compareWith: requestBody.compareWith
          }
        });
        break;

      default:
        // Generic interaction tracking
        trackingAnalytics.trackEvent({
          action: `product_${interactionType}`,
          category: 'engagement',
          label: productData.category,
          metadata: commonMetadata
        });
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't throw - analytics failure shouldn't break interaction tracking
  }
}

function generateSessionId(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const timestamp = Date.now();
  
  return `session_${Buffer.from(`${ip}-${userAgent}-${timestamp}`).toString('base64').slice(0, 16)}`;
}