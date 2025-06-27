import { NextResponse } from 'next/server';
import { MedusaProductService } from '@/lib/medusa-service-refactored';

export async function GET() {
  try {
    const products = await MedusaProductService.getProducts({ limit: 100 });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}