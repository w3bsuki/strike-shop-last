import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
  checks: {
    database?: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    medusa?: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    sanity?: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    stripe?: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    redis?: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
  };
}

// Track application start time
const startTime = Date.now();

async function checkDatabase(): Promise<HealthCheckResponse['checks']['database']> {
  try {
    const start = Date.now();
    // TODO: Add actual database check here
    // Example: await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start;
    
    return {
      status: 'ok',
      latency,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkMedusa(): Promise<HealthCheckResponse['checks']['medusa']> {
  try {
    const start = Date.now();
    const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products?limit=1`, {
      method: 'GET',
      headers: {
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      },
      next: { revalidate: 0 },
    });
    
    const latency = Date.now() - start;
    
    if (!response.ok) {
      return {
        status: 'error',
        error: `HTTP ${response.status}`,
        latency,
      };
    }
    
    return {
      status: 'ok',
      latency,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkSanity(): Promise<HealthCheckResponse['checks']['sanity']> {
  try {
    const start = Date.now();
    const response = await fetch(
      `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v1/data/query/${process.env.NEXT_PUBLIC_SANITY_DATASET}?query=*[_type == "product"][0]`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`,
        },
        next: { revalidate: 0 },
      }
    );
    
    const latency = Date.now() - start;
    
    if (!response.ok) {
      return {
        status: 'error',
        error: `HTTP ${response.status}`,
        latency,
      };
    }
    
    return {
      status: 'ok',
      latency,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkStripe(): Promise<HealthCheckResponse['checks']['stripe']> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        status: 'error',
        error: 'Stripe not configured',
      };
    }
    
    const start = Date.now();
    // Simple check - just verify the API key format
    const isValid = process.env.STRIPE_SECRET_KEY.startsWith('sk_');
    const latency = Date.now() - start;
    
    if (isValid) {
      return {
        status: 'ok' as const,
        latency,
      };
    } else {
      return {
        status: 'error' as const,
        latency,
        error: 'Invalid API key format',
      };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkRedis(): Promise<HealthCheckResponse['checks']['redis']> {
  try {
    if (!process.env.REDIS_URL) {
      return {
        status: 'error',
        error: 'Redis not configured',
      };
    }
    
    // TODO: Add actual Redis check here
    // Example: await redis.ping()
    
    return {
      status: 'ok',
      latency: 0,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  // Basic auth check for health endpoint in production
  if (process.env.NODE_ENV === 'production' && process.env.HEALTH_CHECK_AUTH_TOKEN) {
    if (authHeader !== `Bearer ${process.env.HEALTH_CHECK_AUTH_TOKEN}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  // Run all checks in parallel
  const [database, medusa, sanity, stripe, redis] = await Promise.all([
    checkDatabase(),
    checkMedusa(),
    checkSanity(),
    checkStripe(),
    checkRedis(),
  ]);
  
  const checks = {
    ...(database && { database }),
    ...(medusa && { medusa }),
    ...(sanity && { sanity }),
    ...(stripe && { stripe }),
    ...(redis && { redis }),
  };
  
  // Determine overall status
  const hasError = Object.values(checks).some(check => check?.status === 'error');
  const status: HealthCheckResponse['status'] = hasError ? 'unhealthy' : 'healthy';
  
  const response: HealthCheckResponse = {
    status,
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
    checks,
  };
  
  // Return appropriate status code
  const statusCode = status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Check-Status': status,
    },
  });
}

// HEAD request for simple health check
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Health-Check-Status': 'healthy',
    },
  });
}