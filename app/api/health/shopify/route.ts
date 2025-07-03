import { NextResponse } from 'next/server';
import { ShopifyService } from '@/lib/shopify/services';
import { shopifyClient } from '@/lib/shopify/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  shopify: {
    connected: boolean;
    productCount: number;
    collectionCount: number;
    apiVersion: string;
    responseTime: number;
  };
  errors?: string[];
}

export async function GET() {
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    // Check if client is initialized
    if (!shopifyClient) {
      return NextResponse.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        shopify: {
          connected: false,
          productCount: 0,
          collectionCount: 0,
          apiVersion: '2025-01',
          responseTime: Date.now() - startTime,
        },
        errors: ['Shopify client not initialized. Check environment variables.'],
      } as HealthCheckResponse, { status: 503 });
    }

    // Fetch minimal data to verify connection
    const [products, collections] = await Promise.allSettled([
      ShopifyService.getProducts(5),
      ShopifyService.getCollections(),
    ]);

    const productCount = products.status === 'fulfilled' ? products.value.length : 0;
    const collectionCount = collections.status === 'fulfilled' ? collections.value.length : 0;

    if (products.status === 'rejected') {
      errors.push(`Product fetch failed: ${products.reason}`);
    }
    if (collections.status === 'rejected') {
      errors.push(`Collection fetch failed: ${collections.reason}`);
    }

    const responseTime = Date.now() - startTime;
    const status = errors.length === 0 ? 'healthy' : errors.length > 1 ? 'unhealthy' : 'degraded';

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      shopify: {
        connected: productCount > 0 || collectionCount > 0,
        productCount,
        collectionCount,
        apiVersion: '2024-10',
        responseTime,
      },
      ...(errors.length > 0 && { errors }),
    } as HealthCheckResponse);

  } catch (error) {
    console.error('[Health Check] Unexpected error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      shopify: {
        connected: false,
        productCount: 0,
        collectionCount: 0,
        apiVersion: '2024-10',
        responseTime: Date.now() - startTime,
      },
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    } as HealthCheckResponse, { status: 503 });
  }
}

// Health check for monitoring services
export async function HEAD() {
  try {
    const products = await ShopifyService.getProducts(1);
    if (products.length > 0) {
      return new NextResponse(null, { status: 200 });
    }
    return new NextResponse(null, { status: 503 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}