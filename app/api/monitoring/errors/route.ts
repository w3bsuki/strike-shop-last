import { NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ErrorReport {
  name?: string;
  message?: string;
  error?: string;
  stack?: string;
  context?: any;
  page?: string;
  timestamp: string;
  severity?: string;
  digest?: string;
}

// POST /api/monitoring/errors - Receive error reports
export async function POST(request: Request) {
  try {
    const errorReport: ErrorReport = await request.json();
    
    // Support both new and legacy error formats
    const errorName = errorReport.name || errorReport.error || 'Unknown error';
    const errorMessage = errorReport.message || errorReport.error || 'No message provided';
    
    // Log the error
    logger.error(`Client error: ${errorName}`, {
      error: errorReport,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      page: errorReport.page,
    });
    
    // Also log to console for development (legacy analytics/errors behavior)
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error:', {
        error: errorMessage,
        page: errorReport.page,
        timestamp: new Date(errorReport.timestamp).toISOString(),
        stack: errorReport.stack,
        digest: errorReport.digest,
      });
    }
    
    // In production, log to server console (legacy analytics/errors behavior)
    if (process.env.NODE_ENV === 'production') {
      console.error('[CLIENT ERROR]', {
        error: errorMessage,
        page: errorReport.page,
        timestamp: new Date(errorReport.timestamp).toISOString(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
    }
    
    // In production, you would:
    // 1. Send to Sentry or similar service
    // 2. Store in database for analysis
    // 3. Trigger alerts for critical errors
    
    return NextResponse.json({ 
      success: true, 
      id: `error_${Date.now()}` 
    });
  } catch (error) {
    logger.error('Failed to process error report', error);
    return NextResponse.json({ 
      error: 'Invalid error report' 
    }, { status: 400 });
  }
}

// GET /api/monitoring/errors - Get error summary (dev only)
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  // In development, return mock data
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      recentErrors: [],
    },
  });
}