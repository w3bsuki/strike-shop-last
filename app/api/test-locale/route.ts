import { NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';
import { createShopifyContext } from '@/lib/shopify/services';
import type { Locale } from '@/lib/i18n/config';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = (url.searchParams.get('locale') || 'en') as Locale;
  
  try {
    if (!shopifyClient) {
      return NextResponse.json({ error: 'Shopify client not initialized' }, { status: 500 });
    }

    // Create context for the requested locale
    const context = createShopifyContext(locale);
    
    console.log('[Test Locale API] Testing with locale:', locale);
    console.log('[Test Locale API] Context:', context);

    // Test 1: Basic query without context
    const basicQuery = `
      query {
        products(first: 2) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `;
    
    const basicResult = await shopifyClient.query<any>(basicQuery);
    const basicProducts = basicResult.products.edges.map((edge: any) => edge.node);
    
    // Test 2: Query with @inContext directive
    const localizedQuery = `
      query getProducts($language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
        products(first: 2) {
          edges {
            node {
              id
              title
              handle
              description
            }
          }
        }
      }
    `;
    
    const localizedResult = await shopifyClient.query<any>(localizedQuery, {}, context);
    const localizedProducts = localizedResult.products.edges.map((edge: any) => edge.node);
    
    // Test 3: Check a specific product with different locales
    let translationTest = null;
    if (basicProducts.length > 0) {
      const testHandle = basicProducts[0].handle;
      const productQuery = `
        query getProduct($handle: String!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
          productByHandle(handle: $handle) {
            title
            description
          }
        }
      `;
      
      const translations: Record<string, any> = {};
      
      // Test all locales
      for (const testLocale of ['en', 'bg', 'ua'] as Locale[]) {
        const testContext = createShopifyContext(testLocale);
        try {
          const result = await shopifyClient.query<any>(productQuery, { handle: testHandle }, testContext);
          if (result.productByHandle) {
            translations[testLocale] = {
              title: result.productByHandle.title,
              description: result.productByHandle.description
            };
          }
        } catch (error) {
          console.error(`Error fetching ${testLocale} translation:`, error);
        }
      }
      
      translationTest = {
        handle: testHandle,
        translations,
        allTitlesSame: Object.values(translations).every(
          (t: any) => t.title === Object.values(translations)[0].title
        )
      };
    }
    
    return NextResponse.json({
      success: true,
      locale,
      context,
      tests: {
        basic: {
          description: 'Products without locale context',
          count: basicProducts.length,
          products: basicProducts
        },
        localized: {
          description: `Products with locale context (${locale})`,
          count: localizedProducts.length,
          products: localizedProducts,
          context: context
        },
        translationTest,
        warnings: translationTest?.allTitlesSame ? [
          'All product titles are the same across locales.',
          'This suggests either:',
          '1. Translations are not set up in Shopify',
          '2. Markets are not configured in Shopify',
          '3. The @inContext directive is not working properly'
        ] : []
      }
    });
  } catch (error) {
    console.error('[Test Locale API] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}