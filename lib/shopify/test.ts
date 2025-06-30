// Quick test to verify Shopify connection
import { ShopifyService } from './services';

export async function testShopifyConnection() {
  try {
    console.log('Testing Shopify connection...');
    
    // Test getting products
    const products = await ShopifyService.getProducts(5);
    console.log(`✅ Found ${products.length} products`);
    
    if (products.length > 0) {
      console.log('First product:', {
        id: products[0]?.id,
        name: products[0]?.content.name,
        price: products[0]?.pricing.displayPrice,
        slug: products[0]?.slug,
      });
    }
    
    // Test getting collections
    const collections = await ShopifyService.getCollections();
    console.log(`✅ Found ${collections.length} collections`);
    
    if (collections.length > 0) {
      console.log('First collection:', {
        id: collections[0]?.id,
        name: collections[0]?.name,
        slug: collections[0]?.slug,
        productCount: collections[0]?.products.length,
      });
    }
    
    return {
      success: true,
      products: products.length,
      collections: collections.length,
    };
  } catch (error) {
    console.error('❌ Shopify connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}