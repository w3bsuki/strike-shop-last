import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error:', {
        error: errorData.error,
        page: errorData.page,
        timestamp: new Date(errorData.timestamp).toISOString(),
        stack: errorData.stack,
        digest: errorData.digest,
      });
    }
    
    // In production, you would send this to your error tracking service
    // Examples: Sentry, LogRocket, Datadog, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external logging service
      // await sendToLoggingService(errorData);
      
      // For now, just log to server console
      console.error('[CLIENT ERROR]', {
        error: errorData.error,
        page: errorData.page,
        timestamp: new Date(errorData.timestamp).toISOString(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log client error:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}

// Utility function to send errors to external services
// @ts-ignore - Function kept for future implementation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sendToLoggingService(errorData: any) {
  // Example implementation for different services:
  
  // Sentry
  if (process.env.SENTRY_DSN) {
    // Would use @sentry/node here
    // Sentry.captureException(new Error(errorData.error), {
    //   contexts: {
    //     page: errorData.page,
    //     timestamp: errorData.timestamp,
    //   },
    // });
  }
  
  // DataDog
  if (process.env.DATADOG_API_KEY) {
    // Would send to DataDog logs API
    // await fetch('https://http-intake.logs.datadoghq.com/v1/input/' + process.env.DATADOG_API_KEY, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     ddsource: 'javascript',
    //     service: 'strike-shop',
    //     message: errorData.error,
    //     level: 'error',
    //     page: errorData.page,
    //   }),
    // });
  }
  
  // LogRocket
  if (process.env.LOGROCKET_APP_ID) {
    // LogRocket would typically be client-side only
    // This is just for server-side logging correlation
  }
  
  // Custom webhook
  if (process.env.ERROR_WEBHOOK_URL) {
    try {
      await fetch(process.env.ERROR_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...errorData,
          service: 'strike-shop',
          environment: process.env.NODE_ENV,
        }),
      });
    } catch (err) {
      console.error('Failed to send to webhook:', err);
    }
  }
}