# Shopify Checkout Implementation

## Overview

This document describes the implementation of the Shopify checkout service for Phase 2 of the Strike Shop project.

## Components

### 1. ShopifyCheckoutService (`/lib/shopify/checkout.ts`)

The main service class that handles all checkout-related operations:

- **createCheckout(cartId)** - Creates a new checkout from an existing cart
- **updateCheckout(checkoutId, updates)** - Updates checkout information (email, address, etc.)
- **getCheckout(checkoutId)** - Retrieves checkout details
- **associateCustomerWithCheckout(checkoutId, token)** - Links authenticated customer
- **completeCheckout(checkoutId)** - Marks checkout as complete for tracking

### 2. Checkout Types (`/lib/shopify/types/checkout.ts`)

Comprehensive TypeScript interfaces for:
- Checkout data structures
- Input/update types
- Payment gateway enums
- Error handling types
- Rate limiting interfaces

### 3. GraphQL Queries (`/lib/shopify/queries/checkout.ts`)

All GraphQL queries and mutations for checkout operations:
- checkoutCreate
- checkoutCustomerAssociateV2
- checkoutEmailUpdateV2
- checkoutShippingAddressUpdateV2
- checkoutAttributesUpdateV2
- checkoutDiscountCodeApplyV2

### 4. API Routes

#### `/api/checkout/create` (POST)
- Creates a new checkout from cart
- Supports guest and authenticated checkouts
- Rate limited to 5 requests per minute per IP
- Returns checkout URL for redirect

#### `/api/checkout` (Multiple methods)
- **GET** - Get checkout status
- **POST** - Legacy endpoint (redirects to /create)
- **PUT** - Mark checkout as complete
- **PATCH** - Update checkout or recover cart

## Features

### Rate Limiting
- Implemented per-endpoint rate limiting
- Prevents checkout spam
- Returns proper HTTP headers for rate limit info

### Error Handling
- Comprehensive error logging via monitoring system
- User-friendly error messages
- Detailed error tracking for debugging

### Multi-language Support
- Supports existing locales (en, bg, ua)
- Currency conversion based on locale
- Country code mapping for checkout

### Security
- Customer authentication integration
- Secure token handling
- Input validation

## Usage Example

```typescript
// Create checkout from cart
const response = await fetch('/api/checkout/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'customer@example.com',
    shippingAddress: {
      address1: '123 Main St',
      city: 'New York',
      province: 'NY',
      country: 'US',
      zip: '10001'
    },
    locale: 'en'
  })
});

const { checkout } = await response.json();
// Redirect to checkout.webUrl
```

## Integration Points

1. **Cart System** - Seamlessly converts cart to checkout
2. **Authentication** - Automatically associates logged-in customers
3. **Cookies** - Stores checkout state for recovery
4. **Monitoring** - Full metrics and error tracking

## Next Steps

1. Implement webhook handlers for order creation
2. Add checkout recovery UI
3. Implement express checkout options
4. Add support for multiple payment methods
5. Create checkout completion tracking

## Testing

The checkout service includes comprehensive error handling and logging. To test:

1. Create a cart with items
2. Call the checkout create endpoint
3. Verify the checkout URL is returned
4. Complete checkout on Shopify
5. Verify order webhook is received

## Notes

- The service uses Shopify's 2025-01 API version
- All monetary values use MoneyV2 format
- Rate limiting is implemented to prevent abuse
- Full TypeScript support for type safety