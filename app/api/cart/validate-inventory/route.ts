import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';

interface InventoryValidationRequest {
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
}

interface InventoryStatus {
  variantId: string;
  available: boolean;
  quantity: number | null;
  policy: 'deny' | 'continue';
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { items }: InventoryValidationRequest = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Validate items structure
    for (const item of items) {
      if (!item.variantId || typeof item.quantity !== 'number') {
        return NextResponse.json(
          { error: 'Each item must have variantId and quantity' },
          { status: 400 }
        );
      }
    }

    if (!shopifyClient) {
      return NextResponse.json(
        { error: 'Shopify client not initialized' },
        { status: 500 }
      );
    }

    const inventoryStatuses: InventoryStatus[] = [];

    // Check inventory for each variant
    for (const item of items) {
      try {
        // Extract product ID from variant ID (Shopify variant IDs contain product ID)
        const productId = item.variantId.split('/').slice(0, -1).join('/');
        const product = await shopifyClient.getProductById(productId);
        const variant = product?.variants?.edges?.find(
          edge => edge.node.id === item.variantId
        )?.node;
        
        if (!variant) {
          inventoryStatuses.push({
            variantId: item.variantId,
            available: false,
            quantity: null,
            policy: 'deny',
            message: 'Product variant not found',
          });
          continue;
        }

        const inventoryQuantity = variant.quantityAvailable || 0;
        // Check if requested quantity is available (using 'deny' policy by default)
        const isAvailable = inventoryQuantity >= item.quantity;

        let message: string | undefined;
        if (!isAvailable) {
          if (inventoryQuantity === 0) {
            message = 'Item is out of stock';
          } else {
            message = `Only ${inventoryQuantity} items available`;
          }
        }

        inventoryStatuses.push({
          variantId: item.variantId,
          available: isAvailable,
          quantity: inventoryQuantity,
          policy: 'deny' as const,
          message,
        });

      } catch (error) {
        console.error(`Failed to check inventory for variant ${item.variantId}:`, error);
        
        inventoryStatuses.push({
          variantId: item.variantId,
          available: false,
          quantity: null,
          policy: 'deny',
          message: 'Failed to check inventory',
        });
      }
    }

    // Summary statistics
    const availableCount = inventoryStatuses.filter(status => status.available).length;
    const unavailableCount = inventoryStatuses.length - availableCount;

    return NextResponse.json({
      success: true,
      inventoryStatus: inventoryStatuses,
      summary: {
        total: inventoryStatuses.length,
        available: availableCount,
        unavailable: unavailableCount,
        allAvailable: unavailableCount === 0,
      },
    });

  } catch (error) {
    console.error('Inventory validation error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to validate inventory',
        success: false 
      },
      { status: 500 }
    );
  }
}