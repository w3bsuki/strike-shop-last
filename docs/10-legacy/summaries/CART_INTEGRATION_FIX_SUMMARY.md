# Shopify Cart Integration Fix Summary

## Overview
Fixed the Shopify cart integration in `lib/stores/slices/cart.ts` to properly sync with Shopify's Cart API using GraphQL mutations.

## Issues Identified
1. **addItem function**: Was only updating local state without calling Shopify's `cartLinesAdd` mutation
2. **updateQuantity function**: Not using Shopify's `cartLinesUpdate` mutation
3. **removeItem function**: Not properly calling Shopify's `cartLinesRemove` mutation
4. **Cart persistence**: Cart state wasn't properly syncing with Shopify across page refreshes
5. **Missing cart creation**: No cart was being created when adding the first item

## Changes Made

### 1. Updated `addItem` Function
- Now creates a Shopify cart if one doesn't exist using `cartCreate` mutation
- Properly calls `cartLinesAdd` mutation to add items to Shopify cart
- Syncs the Shopify cart response back to local state
- Stores cart ID in localStorage for persistence

### 2. Added `cartLinesUpdate` Mutation to Shopify Client
```typescript
async updateCartLines(cartId: string, lineId: string, quantity: number): Promise<ShopifyCart>
```
- Implements the Shopify `cartLinesUpdate` mutation for updating item quantities

### 3. Updated `updateItemQuantity` Function
- Now uses Shopify's `cartLinesUpdate` mutation for quantity changes
- Falls back to `cartLinesRemove` when quantity is 0
- Properly syncs response back to local state
- Added proper error handling and user feedback

### 4. Updated `removeItem` Function
- Delegates to `updateItemQuantity` with quantity 0
- Ensures proper Shopify cart sync

### 5. Updated `clearCart` Function
- Now async to handle Shopify API calls
- Removes all items from Shopify cart before clearing local state
- Cleans up localStorage entries

### 6. Enhanced Error Handling
- Added toast notifications for user feedback
- Graceful fallback for when Shopify client is not configured
- Proper error logging for debugging

## Key Implementation Details

### Cart State Synchronization
- Every cart operation now follows this pattern:
  1. Update Shopify cart via GraphQL mutation
  2. Convert Shopify response to local format
  3. Update local state with Shopify data
  4. Persist to localStorage
  5. Emit appropriate events

### Data Conversion
- Shopify prices are in decimal format (e.g., "19.99")
- Local prices are stored in cents (e.g., 1999)
- Proper conversion happens during sync

### Cart Persistence
- Cart ID stored in `localStorage` as `strike-cart-id`
- Full cart data cached in `localStorage` as `strike-cart`
- Cart is re-initialized from Shopify on page load

## Testing Recommendations

1. **Test Cart Creation**
   - Clear localStorage
   - Add first item to cart
   - Verify cart is created in Shopify

2. **Test Add to Cart**
   - Add new items
   - Add existing items (should increase quantity)
   - Verify Shopify cart updates

3. **Test Update Quantity**
   - Increase/decrease quantities
   - Set quantity to 0 (should remove)
   - Verify Shopify sync

4. **Test Cart Persistence**
   - Add items to cart
   - Refresh page
   - Verify cart is restored from Shopify

5. **Test Checkout Flow**
   - Add items and click checkout
   - Should redirect to Shopify checkout with all items

## Environment Requirements
Ensure these environment variables are set:
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
- `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`

Without these, the cart will fall back to local-only mode.

## Future Improvements
1. Add optimistic updates for better UX
2. Implement cart synchronization across tabs
3. Add cart recovery for abandoned carts
4. Implement guest cart merging on login