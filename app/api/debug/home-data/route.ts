import { NextResponse } from 'next/server';
import { ShopifyService } from '@/lib/shopify/services';
import { createCategoryId, createImageURL, createSlug, createProductId } from '@/types';
import type { HomePageCategory, HomePageProduct } from '@/types/home-page';

export async function GET() {
  try {
    console.log('[Debug] Starting home page data fetch...');
    
    // Fetch all collections and products from Shopify
    const [allProducts, shopifyCollections] = await Promise.all([
      ShopifyService.getProducts(50),
      ShopifyService.getCollections()
    ]);
    
    console.log('[Debug] Products fetched:', allProducts.length);
    console.log('[Debug] Collections fetched:', shopifyCollections.length);
    
    // Transform Shopify collections to categories
    const categories: HomePageCategory[] = shopifyCollections.map(collection => ({
      id: createCategoryId(collection.id),
      name: collection.name.toUpperCase(),
      count: collection.products.length,
      image: createImageURL(collection.image?.url || '/placeholder-category.jpg'),
      slug: createSlug(collection.slug),
    }));

    // Transform all Shopify products with enhanced descriptions
    const products: HomePageProduct[] = allProducts.map(product => {
      // Enhanced product descriptions based on product type/name
      const getEnhancedDescription = (name: string, originalDesc: string): string => {
        if (originalDesc && originalDesc !== 'XYZ') return originalDesc;
        
        const lowercaseName = name.toLowerCase();
        if (lowercaseName.includes('t-shirt') || lowercaseName.includes('tee')) {
          return 'Premium cotton t-shirt featuring contemporary streetwear design. Comfortable fit with modern style.';
        }
        if (lowercaseName.includes('denim') || lowercaseName.includes('short')) {
          return 'High-quality denim shorts with modern cut. Perfect for casual wear and summer style.';
        }
        if (lowercaseName.includes('sneaker') || lowercaseName.includes('shoe')) {
          return 'Contemporary sneakers combining comfort and style. Ideal for everyday wear and active lifestyle.';
        }
        if (lowercaseName.includes('jacket')) {
          return 'Stylish jacket crafted with premium materials. Perfect for layering and all-season wear.';
        }
        if (lowercaseName.includes('accessory')) {
          return 'Essential accessory to complete your look. Quality craftsmanship with modern design.';
        }
        return 'Premium quality streetwear item featuring contemporary design and exceptional craftsmanship.';
      };

      return {
        id: product.id,
        name: product.content?.name || 'Product',
        price: product.pricing?.displayPrice || '€0.00',
        image: (product.content?.images?.[0]?.url || '/placeholder-product.jpg') as any,
        slug: product.slug,
        isNew: product.badges?.isNew || false,
        soldOut: product.badges?.isSoldOut || false,
        colors: product.commerce?.variants?.length || 1,
        description: getEnhancedDescription(product.content?.name || '', product.content?.description || ''),
        sku: (product.sku || `SKU-${product.id}`) as any,
        variants: (product.commerce?.variants || []) as any,
        variantId: product.commerce?.variants?.[0]?.id || `variant_${product.id}`,
      };
    });

    // Create product sections - smart categorization
    const availableProducts = products.filter(p => !p.soldOut);
    
    // New arrivals - recently added products (or first 8 if all are new)
    const newArrivals = availableProducts.filter(p => p.isNew).slice(0, 8);
    const newArrivalsSection = newArrivals.length > 0 ? newArrivals : availableProducts.slice(0, 8);
    
    // Sale items - products with sale badges or on-sale collections
    const saleItems = availableProducts.filter(p => p.price.includes('sale') || p.isNew).slice(0, 8);
    const saleItemsSection = saleItems.length > 0 ? saleItems : availableProducts.slice(0, 8);
    
    // Sneakers - footwear products
    const sneakers = availableProducts.filter(p => 
      p.name.toLowerCase().includes('sneaker') || 
      p.name.toLowerCase().includes('shoe') ||
      p.name.toLowerCase().includes('runner')
    ).slice(0, 4);
    const sneakersSection = sneakers.length > 0 ? sneakers : availableProducts.slice(0, 4);
    
    // Kids items - none available currently
    const kidsItems: HomePageProduct[] = [];
    
    const result = {
      categories,
      newArrivals: newArrivalsSection,
      saleItems: saleItemsSection,
      sneakers: sneakersSection,
      kidsItems,
      raw: {
        totalProducts: allProducts.length,
        availableProducts: availableProducts.length,
        collections: shopifyCollections.length,
        categoriesCreated: categories.length,
      }
    };
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Debug] Error fetching home data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}