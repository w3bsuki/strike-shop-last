import { shopifyClient } from './lib/shopify/client.js';
import { createShopifyContext } from './lib/shopify/services.js';

async function testLocalization() {
  console.log('=== Testing Shopify Localization ===\n');
  
  try {
    // Test 1: Check if client is initialized
    if (!shopifyClient) {
      console.error('❌ Shopify client not initialized. Check environment variables.');
      return;
    }
    console.log('✅ Shopify client initialized\n');

    // Test 2: Create contexts for different locales
    const contexts = {
      'en': createShopifyContext('en'),
      'bg': createShopifyContext('bg'),
      'ua': createShopifyContext('ua')
    };
    
    console.log('📍 Created contexts:');
    Object.entries(contexts).forEach(([locale, context]) => {
      console.log(`  ${locale}: language=${context.language}, country=${context.country}`);
    });
    console.log('');

    // Test 3: Fetch products with different locales
    console.log('🛍️  Testing product fetching with different locales...\n');
    
    for (const [locale, context] of Object.entries(contexts)) {
      console.log(`\n--- Testing locale: ${locale} ---`);
      
      try {
        // Simple query without @inContext first
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
        
        const basicResult = await shopifyClient.query(basicQuery);
        console.log(`Basic query (no context):`, basicResult.products.edges[0]?.node.title || 'No products');
        
        // Query with @inContext
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
        
        const localizedResult = await shopifyClient.query(localizedQuery, {}, context);
        const firstProduct = localizedResult.products.edges[0]?.node;
        
        if (firstProduct) {
          console.log(`Localized query (${context.language}/${context.country}):`);
          console.log(`  - Title: ${firstProduct.title}`);
          console.log(`  - Handle: ${firstProduct.handle}`);
          console.log(`  - Description: ${firstProduct.description?.substring(0, 50)}...`);
        } else {
          console.log('No products found');
        }
        
      } catch (error) {
        console.error(`Error fetching for ${locale}:`, error.message);
      }
    }

    // Test 4: Check if translations are actually different
    console.log('\n\n📊 Checking if translations differ...');
    
    const productQuery = `
      query getProduct($handle: String!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
        productByHandle(handle: $handle) {
          title
          description
        }
      }
    `;
    
    // First, get a product handle
    const productsResult = await shopifyClient.query(`
      query {
        products(first: 1) {
          edges {
            node {
              handle
            }
          }
        }
      }
    `);
    
    const testHandle = productsResult.products.edges[0]?.node.handle;
    
    if (testHandle) {
      console.log(`\nTesting with product handle: ${testHandle}`);
      
      const translations = {};
      
      for (const [locale, context] of Object.entries(contexts)) {
        try {
          const result = await shopifyClient.query(productQuery, { handle: testHandle }, context);
          if (result.productByHandle) {
            translations[locale] = {
              title: result.productByHandle.title,
              description: result.productByHandle.description
            };
          }
        } catch (error) {
          console.error(`Error fetching ${locale} translation:`, error.message);
        }
      }
      
      console.log('\nTranslations found:');
      Object.entries(translations).forEach(([locale, data]) => {
        console.log(`\n${locale.toUpperCase()}:`);
        console.log(`  Title: ${data.title}`);
        console.log(`  Desc: ${data.description?.substring(0, 80)}...`);
      });
      
      // Check if titles differ
      const titles = Object.values(translations).map(t => t.title);
      const allSame = titles.every(title => title === titles[0]);
      
      if (allSame) {
        console.log('\n⚠️  Warning: All titles are the same. This suggests:');
        console.log('  1. Translations might not be set up in Shopify');
        console.log('  2. Markets might not be configured');
        console.log('  3. The @inContext directive might not be working');
      } else {
        console.log('\n✅ Translations are different - localization is working!');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testLocalization();