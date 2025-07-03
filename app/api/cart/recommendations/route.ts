import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';

interface CartItem {
  productId: string;
  variantId: string;
  categoryId?: string;
}

interface RecommendationRequest {
  cartItems: CartItem[];
  userId?: string;
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { cartItems, userId, limit = 5 }: RecommendationRequest = await request.json();

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json(
        { error: 'Cart items array is required' },
        { status: 400 }
      );
    }

    const recommendations = await generateRecommendations(cartItems, userId, limit);

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });

  } catch (error) {
    console.error('Cart recommendations error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate recommendations',
        success: false 
      },
      { status: 500 }
    );
  }
}

async function generateRecommendations(
  cartItems: CartItem[], 
  userId?: string, 
  limit: number = 5
) {
  const recommendations = [];

  try {
    // Get product IDs from cart
    const cartProductIds = cartItems.map(item => item.productId);
    
    // Strategy 1: Frequently Bought Together
    const frequentlyBoughtTogether = await getFrequentlyBoughtTogether(cartProductIds, limit);
    recommendations.push(...frequentlyBoughtTogether);

    // Strategy 2: Similar Products (same category/collection)
    if (recommendations.length < limit) {
      const similarProducts = await getSimilarProducts(cartItems, limit - recommendations.length);
      recommendations.push(...similarProducts);
    }

    // Strategy 3: Trending Products
    if (recommendations.length < limit) {
      const trendingProducts = await getTrendingProducts(limit - recommendations.length);
      recommendations.push(...trendingProducts);
    }

    // Strategy 4: Recently Viewed (if user is authenticated)
    if (userId && recommendations.length < limit) {
      const recentlyViewed = await getRecentlyViewedProducts(userId, limit - recommendations.length);
      recommendations.push(...recentlyViewed);
    }

    // Remove duplicates and products already in cart
    const uniqueRecommendations = recommendations
      .filter((rec, index, self) => 
        index === self.findIndex(r => r.productId === rec.productId) &&
        !cartProductIds.includes(rec.productId)
      )
      .slice(0, limit);

    return uniqueRecommendations;

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

async function getFrequentlyBoughtTogether(productIds: string[], limit: number) {
  try {
    // In a real implementation, this would query your analytics database
    // For now, we'll use Shopify's product recommendations API
    const recommendations = [];
    
    for (const productId of productIds.slice(0, 2)) { // Limit to avoid too many API calls
      try {
        if (!shopifyClient) continue;
        const product = await shopifyClient.getProductById(productId);
        if (product?.collections?.edges && product.collections.edges.length > 0) {
          // Get products from the same collection
          const collectionHandle = product.collections.edges[0]?.node?.handle;
          if (!collectionHandle) continue;
          if (!shopifyClient) continue;
          const collection = await shopifyClient.getCollectionByHandle(collectionHandle);
          const collectionProducts = collection?.products?.edges?.map(edge => edge.node) || [];
          
          for (const collectionProduct of collectionProducts.slice(0, 2)) {
            if (collectionProduct.id !== productId) {
              recommendations.push({
                productId: collectionProduct.id,
                variantId: collectionProduct.variants.edges[0]?.node.id,
                reason: 'frequently-bought-together' as const,
                confidence: 0.8,
                productData: {
                  name: collectionProduct.title,
                  image: collectionProduct.images.edges[0]?.node.url || '',
                  price: parseFloat(collectionProduct.variants.edges[0]?.node.price.amount || '0') * 100,
                  slug: collectionProduct.handle,
                },
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error getting recommendations for product ${productId}:`, error);
      }
    }
    
    return recommendations.slice(0, limit);
  } catch (error) {
    console.error('Error getting frequently bought together:', error);
    return [];
  }
}

async function getSimilarProducts(cartItems: CartItem[], limit: number) {
  try {
    const recommendations = [];
    
    // Get products from similar categories
    for (const cartItem of cartItems.slice(0, 2)) {
      try {
        if (!shopifyClient) continue;
        const product = await shopifyClient.getProductById(cartItem.productId);
        if (product?.productType) {
          // Search for products with the same product type
          if (!shopifyClient) continue;
          const similarProducts = await shopifyClient.searchProducts(
            `product_type:"${product.productType}"`,
            3
          );
          
          for (const similarProduct of similarProducts.slice(0, 2)) {
            if (similarProduct.id !== cartItem.productId) {
              recommendations.push({
                productId: similarProduct.id,
                variantId: similarProduct.variants.edges[0]?.node.id,
                reason: 'similar-products' as const,
                confidence: 0.7,
                productData: {
                  name: similarProduct.title,
                  image: similarProduct.images.edges[0]?.node.url || '',
                  price: parseFloat(similarProduct.variants.edges[0]?.node.price.amount || '0') * 100,
                  slug: similarProduct.handle,
                },
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error getting similar products for ${cartItem.productId}:`, error);
      }
    }
    
    return recommendations.slice(0, limit);
  } catch (error) {
    console.error('Error getting similar products:', error);
    return [];
  }
}

async function getTrendingProducts(limit: number) {
  try {
    // Get best-selling or recently created products
    if (!shopifyClient) return [];
    const products = await shopifyClient.getProducts(limit * 2); // Get more to filter from
    
    return products.slice(0, limit).map(product => ({
      productId: product.id,
      variantId: product.variants.edges[0]?.node.id,
      reason: 'trending' as const,
      confidence: 0.6,
      productData: {
        name: product.title,
        image: product.images.edges[0]?.node.url || '',
        price: parseFloat(product.variants.edges[0]?.node.price.amount || '0') * 100,
        slug: product.handle,
      },
    }));
  } catch (error) {
    console.error('Error getting trending products:', error);
    return [];
  }
}

async function getRecentlyViewedProducts(userId: string, limit: number) {
  try {
    // In a real implementation, you would query your user analytics database
    // For now, return empty array or mock data
    return [];
  } catch (error) {
    console.error('Error getting recently viewed products:', error);
    return [];
  }
}