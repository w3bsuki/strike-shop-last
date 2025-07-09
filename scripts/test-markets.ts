/**
 * Test script for Shopify Markets functionality
 * Run with: npx tsx scripts/test-markets.ts
 */

import { shopifyClient } from '../lib/shopify/client';
import { 
  getMarketByCountry, 
  getMarketFromLocale, 
  getAvailableCountries,
  getAvailableCurrencies,
  localeToShopifyContext,
} from '../lib/shopify/markets';
import { createShopifyContext, ShopifyService } from '../lib/shopify/services';
import type { Locale } from '../lib/i18n/config';

async function testMarkets() {
  console.log('🧪 Testing Shopify Markets Integration\n');
  
  // Test 1: Market Configuration
  console.log('1️⃣ Testing Market Configuration:');
  console.log('Available Countries:', getAvailableCountries());
  console.log('Available Currencies:', getAvailableCurrencies());
  console.log('');
  
  // Test 2: Market Detection
  console.log('2️⃣ Testing Market Detection:');
  const testCountries = ['BG', 'DE', 'UA', 'US'];
  testCountries.forEach(country => {
    const market = getMarketByCountry(country);
    console.log(`Country ${country} → Market: ${market.name} (${market.handle})`);
  });
  console.log('');
  
  // Test 3: Locale to Context Mapping
  console.log('3️⃣ Testing Locale to Context Mapping:');
  const locales: Locale[] = ['bg', 'en', 'ua'];
  locales.forEach(locale => {
    const context = localeToShopifyContext(locale);
    console.log(`Locale '${locale}' → Language: ${context.language}, Country: ${context.country}`);
  });
  console.log('');
  
  // Test 4: Product Pricing by Market
  console.log('4️⃣ Testing Product Pricing by Market:');
  
  if (!shopifyClient) {
    console.error('❌ Shopify client not initialized');
    return;
  }
  
  try {
    // Get a product handle
    const products = await ShopifyService.getProducts(1);
    if (products.length === 0) {
      console.log('No products found to test');
      return;
    }
    
    const testProduct = products[0];
    console.log(`\nTesting product: ${testProduct.content.name} (${testProduct.slug})`);
    
    // Test different market contexts
    const marketTests = [
      { locale: 'bg' as Locale, name: 'Bulgaria' },
      { locale: 'en' as Locale, name: 'EU/Germany' },
      { locale: 'ua' as Locale, name: 'Ukraine' },
    ];
    
    for (const test of marketTests) {
      const context = createShopifyContext(test.locale);
      const product = await ShopifyService.getProductBySlug(testProduct.slug, context);
      
      if (product) {
        console.log(`\n${test.name} Market:`);
        console.log(`- Currency: ${product.pricing.currency}`);
        console.log(`- Base Price: ${product.pricing.displayPrice}`);
        if (product.pricing.salePrice) {
          console.log(`- Sale Price: ${product.pricing.displaySalePrice}`);
        }
        console.log(`- Available: ${!product.badges.isSoldOut}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing product pricing:', error);
  }
  
  // Test 5: Collection Availability
  console.log('\n5️⃣ Testing Collection Availability by Market:');
  
  try {
    const collections = await ShopifyService.getCollections();
    console.log(`Found ${collections.length} collections`);
    
    if (collections.length > 0) {
      const testCollection = collections[0];
      console.log(`\nTesting collection: ${testCollection.name}`);
      
      for (const locale of locales) {
        const context = createShopifyContext(locale);
        const collection = await ShopifyService.getCollectionBySlug(testCollection.slug, context);
        
        if (collection) {
          const availableProducts = collection.products.filter(p => !p.badges?.isSoldOut);
          console.log(`- ${locale.toUpperCase()}: ${availableProducts.length}/${collection.products.length} products available`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error testing collections:', error);
  }
  
  console.log('\n✅ Market testing complete!');
}

// Run the test
testMarkets().catch(console.error);