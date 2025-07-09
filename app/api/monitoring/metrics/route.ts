import { NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/monitoring/metrics - Get current metrics (dev only)
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  // In a real app, this would pull from your metrics store
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    metrics: {
      webVitals: {
        fcp: null,
        lcp: null,
        fid: null,
        cls: null,
        ttfb: null,
      },
      api: {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
      },
      shopify: {
        totalQueries: 0,
        avgQueryTime: 0,
        errorRate: 0,
      },
      business: {
        pageViews: 0,
        cartActions: 0,
        checkoutSteps: 0,
      },
    },
  });
}

// POST /api/monitoring/metrics - Receive metrics from client
export async function POST(request: Request) {
  try {
    const metrics = await request.json();
    
    // Log received metrics
    logger.info('Client metrics received', { metrics });
    
    // In production, you would send these to your metrics service
    // For now, just acknowledge receipt
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to process metrics', error);
    return NextResponse.json({ error: 'Invalid metrics data' }, { status: 400 });
  }
}