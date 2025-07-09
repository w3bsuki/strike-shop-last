import { NextResponse } from 'next/server';
import { shopifyService } from '@/lib/shopify';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Validate parameters
    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search products with pagination support
    const products = await shopifyService.searchProducts(query);
    
    // Apply pagination
    const paginatedProducts = products.slice(offset, offset + limit);
    
    // Return response with cache headers
    const response = NextResponse.json({
      products: paginatedProducts,
      total: products.length,
      hasMore: offset + limit < products.length,
      query,
    });

    // Cache for 5 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}

// Prefetch popular searches
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { terms } = body;
    
    if (!Array.isArray(terms)) {
      return NextResponse.json(
        { error: 'Terms must be an array' },
        { status: 400 }
      );
    }

    // Prefetch search results for popular terms
    const results = await Promise.all(
      terms.slice(0, 5).map(async (term) => {
        try {
          const products = await shopifyService.searchProducts(term);
          return { term, count: products.length };
        } catch {
          return { term, count: 0 };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search prefetch error:', error);
    
    return NextResponse.json(
      { error: 'Failed to prefetch searches' },
      { status: 500 }
    );
  }
}