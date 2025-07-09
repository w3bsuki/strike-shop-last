import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/shopify';
import { logger, metrics, captureShopifyError } from '@/lib/monitoring';
import { createCheckoutService } from '@/lib/shopify/checkout';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const checkoutId = searchParams.get('checkoutId');
    
    if (!checkoutId) {
      return NextResponse.json(
        { error: 'Checkout ID is required' },
        { status: 400 }
      );
    }
    
    logger.info('Getting payment methods for checkout', { checkoutId });
    
    // Create Shopify client and checkout service
    const client = createClient();
    const checkoutService = createCheckoutService(client);
    
    // Get available payment methods
    const paymentInfo = await checkoutService.getAvailablePaymentMethods(checkoutId);
    
    // Track metrics
    const duration = Date.now() - startTime;
    metrics.increment('api.checkout.payment_methods');
    metrics.timing('api.checkout.payment_methods.duration', duration);
    
    logger.info('Payment methods retrieved successfully', {
      checkoutId,
      methodCount: paymentInfo.methods.length,
      currencies: paymentInfo.supportedCurrencies,
    });
    
    return NextResponse.json({
      methods: paymentInfo.methods,
      supportedCurrencies: paymentInfo.supportedCurrencies,
      defaultCurrency: paymentInfo.defaultCurrency,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to get payment methods', { 
      error,
      duration,
    });
    
    captureShopifyError(error instanceof Error ? error.message : String(error), {
      operation: 'api.checkout.payment_methods',
      duration: String(duration),
    });
    
    metrics.increment('api.checkout.payment_methods.error');
    
    return NextResponse.json(
      { 
        error: 'Failed to get payment methods',
        message: error instanceof Error ? error.message : 'An error occurred',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { checkoutId, currencyCode } = body;
    
    if (!checkoutId || !currencyCode) {
      return NextResponse.json(
        { error: 'Checkout ID and currency code are required' },
        { status: 400 }
      );
    }
    
    logger.info('Applying currency to checkout', { checkoutId, currencyCode });
    
    // Create Shopify client and checkout service
    const client = createClient();
    const checkoutService = createCheckoutService(client);
    
    // Apply currency code
    const result = await checkoutService.applyCurrencyCode(checkoutId, currencyCode);
    
    // Track metrics
    const duration = Date.now() - startTime;
    metrics.increment('api.checkout.currency.apply');
    metrics.timing('api.checkout.currency.apply.duration', duration);
    
    if (result.errors.length > 0) {
      logger.warn('Currency application had errors', {
        checkoutId,
        currencyCode,
        errors: result.errors,
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to apply currency',
          errors: result.errors,
        },
        { status: 400 }
      );
    }
    
    logger.info('Currency applied successfully', {
      checkoutId,
      currencyCode,
      newCheckoutId: result.checkout?.id,
    });
    
    return NextResponse.json({
      checkout: result.checkout,
      checkoutUrl: result.checkout?.webUrl,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to apply currency', { 
      error,
      duration,
    });
    
    captureShopifyError(error instanceof Error ? error.message : String(error), {
      operation: 'api.checkout.currency.apply',
      duration: String(duration),
    });
    
    metrics.increment('api.checkout.currency.apply.error');
    
    return NextResponse.json(
      { 
        error: 'Failed to apply currency',
        message: error instanceof Error ? error.message : 'An error occurred',
      },
      { status: 500 }
    );
  }
}