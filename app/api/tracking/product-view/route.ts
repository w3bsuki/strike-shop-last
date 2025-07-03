// Product View Tracking API
// Tracks product views for recommendation engine and analytics

import { NextRequest, NextResponse } from 'next/server';
import { RecommendationEngine } from '@/lib/recommendations/recommendation-engine';
import { trackingAnalytics } from '@/lib/analytics/tracking-analytics';

const engine = new RecommendationEngine();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Extract tracking data
    const trackingData = {
      userId: body.userId,
      sessionId: body.sessionId || generateSessionId(request),
      productId: body.productId,
      source: body.source || 'direct',
      duration: body.duration || 0,
      referrerProductId: body.referrerProductId
    };

    console.log('Tracking product view:', trackingData);

    // Track with recommendation engine
    await engine.trackProductView(trackingData);

    // Track with analytics
    trackingAnalytics.trackViewItem({
      id: trackingData.productId,
      name: body.productName || 'Product View',
      category: body.category || 'Unknown',
      price: body.price,
      currency: body.currency || 'USD',
      brand: body.brand,
      variant: body.variant,
      metadata: {
        source: trackingData.source,
        duration: trackingData.duration,
        referrerProductId: trackingData.referrerProductId,
        userId: trackingData.userId,
        sessionId: trackingData.sessionId
      }
    });

    // Track generic event
    trackingAnalytics.trackEvent({
      action: 'product_view',
      category: 'engagement',
      label: trackingData.source,
      value: trackingData.duration,
      metadata: {
        productId: trackingData.productId,
        userId: trackingData.userId,
        sessionId: trackingData.sessionId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product view tracked successfully',
      data: {
        productId: trackingData.productId,
        sessionId: trackingData.sessionId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Product view tracking error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track product view',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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