# Cart API Migration Guide

This guide explains how to migrate from client-side Shopify API calls to the new server-side cart API routes.

## Overview

The new server-side cart API provides:
- Better security by keeping Shopify API credentials on the server
- Consistent error handling
- TypeScript support throughout
- Simplified client-side code

## New API Endpoints

### 1. Create Cart
```
POST /api/cart
Response: { success: boolean, data?: ShopifyCart, error?: string }
```

### 2. Get Cart
```
GET /api/cart?cartId={cartId}
Response: { success: boolean, data?: ShopifyCart, error?: string }
```

### 3. Add to Cart
```
POST /api/cart/add
Body: { cartId: string, merchandiseId: string, quantity?: number }
Response: { success: boolean, data?: ShopifyCart, error?: string }
```

### 4. Update Cart Item
```
POST /api/cart/update
Body: { cartId: string, lineId: string, quantity: number }
Response: { success: boolean, data?: ShopifyCart, error?: string }
```

### 5. Remove from Cart
```
POST /api/cart/remove
Body: { cartId: string, lineIds: string[] }
Response: { success: boolean, data?: ShopifyCart, error?: string }

OR

DELETE /api/cart/remove?cartId={cartId}&lineId={lineId}
Response: { success: boolean, data?: ShopifyCart, error?: string }
```

## Migration Steps

### Step 1: Update Environment Variables

Move Shopify credentials to server-only environment variables:
```env
# Change from:
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token

# To:
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token
```

### Step 2: Update Cart Store

Replace the existing cart slice with the server-side version:

```typescript
// In lib/stores/index.ts
import { createServerCartSlice } from './slices/cart-server';
// Instead of: import { createCartSlice } from './slices/cart';
```

### Step 3: Use the Cart API Client

Replace direct Shopify client usage with the cart API client:

```typescript
// Before:
import { shopifyClient } from '@/lib/shopify/client';
const cart = await shopifyClient.createCart();

// After:
import { cartApi } from '@/lib/cart-api';
const response = await cartApi.createCart();
if (response.success) {
  const cart = response.data;
}
```

### Step 4: Use the useCartApi Hook

For React components, use the provided hook:

```typescript
import { useCartApi } from '@/hooks/use-cart-api';

function CartComponent() {
  const { cart, loading, error, addToCart, updateQuantity, removeFromCart } = useCartApi();
  
  // Add item
  await addToCart(variantId, 1);
  
  // Update quantity
  await updateQuantity(lineId, 3);
  
  // Remove item
  await removeFromCart(lineId);
}
```

## Error Handling

The new API provides consistent error responses:

```typescript
if (!response.success) {
  console.error('Cart operation failed:', response.error);
  // Handle specific errors
  if (response.error === 'Cart not found') {
    // Create new cart
  }
}
```

## Security Benefits

1. **No exposed API tokens**: Shopify credentials stay on the server
2. **Request validation**: All inputs are validated server-side
3. **Rate limiting ready**: Easy to add rate limiting to API routes
4. **CORS protection**: API routes are protected by Next.js defaults

## Performance Considerations

- API calls now go through your server, adding a small latency
- Consider implementing caching for frequently accessed carts
- Use optimistic updates in the UI for better perceived performance

## Rollback Plan

If you need to rollback to client-side operations:
1. Restore the original cart slice from `cart.ts`
2. Update environment variables back to `NEXT_PUBLIC_` prefix
3. Remove the API routes
4. Update imports to use the original cart store

## Testing

Test all cart operations after migration:
- [ ] Create new cart
- [ ] Add items to cart
- [ ] Update item quantities
- [ ] Remove items from cart
- [ ] Clear entire cart
- [ ] Handle expired cart IDs
- [ ] Test error scenarios