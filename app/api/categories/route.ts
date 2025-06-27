import { NextResponse } from 'next/server';
import { MedusaProductService } from '@/lib/medusa-service-refactored';

export async function GET() {
  try {
    const categories = await MedusaProductService.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}