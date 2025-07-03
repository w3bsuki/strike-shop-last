# Authentication Strategy - Strike Shop

## Overview
We use a hybrid authentication approach combining Supabase's superior auth UX with Shopify's customer accounts for commerce operations.

## Architecture Decision

### Why Both Supabase + Shopify?

1. **User Experience**
   - Social logins increase conversion by 30-40%
   - Passwordless options reduce friction
   - Better session management

2. **Technical Benefits**
   - Supabase: Authentication & user data
   - Shopify: Customer records & order history
   - Clear separation of concerns

3. **Business Benefits**
   - Customers can login with Google/GitHub
   - Still get Shopify's order management
   - Better analytics and tracking

## Implementation Strategy

### Phase 1: Dual System (Current)
```typescript
// Current flow
1. User signs up with Supabase (email/social)
2. Create corresponding Shopify customer
3. Store Shopify customer ID in Supabase
4. Use Shopify for orders/checkout
```

### Phase 2: Optimized Flow (Recommended)
```typescript
// Optimized flow
1. Supabase handles ALL authentication
2. Shopify customer created on first purchase
3. Guest checkout for non-authenticated users
4. Sync only when needed
```

## Simplified Implementation

If you want to simplify and remove Supabase:

### Shopify-Only Implementation
```typescript
// 1. Remove Supabase dependencies
npm uninstall @supabase/supabase-js @supabase/ssr

// 2. Update auth to use Shopify directly
const customerAuth = {
  login: async (email: string, password: string) => {
    return shopifyClient.customerLogin(email, password);
  },
  
  logout: async (token: string) => {
    return shopifyClient.customerLogout(token);
  },
  
  register: async (input: CustomerCreateInput) => {
    return shopifyClient.customerCreate(input);
  }
};

// 3. Store auth in cookies/localStorage
const storeAuth = (token: CustomerAccessToken) => {
  // Secure httpOnly cookie recommended
  cookies().set('shopify-token', token.accessToken, {
    expires: new Date(token.expiresAt),
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  });
};
```

### Trade-offs of Shopify-Only

**Pros:**
- Simpler architecture
- One less service to manage
- Direct customer data access
- No sync required

**Cons:**
- No social logins
- Basic auth only
- Limited session management
- No real-time features
- Harder to implement features like:
  - Remember me
  - Multi-device sync
  - Advanced security

## Recommendation

For a production e-commerce site targeting modern users:

1. **Keep Supabase for auth** - The conversion boost from social logins alone justifies it
2. **Use Shopify for commerce** - Orders, payments, fulfillment
3. **Sync only essential data** - Don't over-engineer the sync

## Migration Path

If you decide to remove Supabase:

1. Export user data from Supabase
2. Create Shopify customers for existing users
3. Implement Shopify auth endpoints
4. Update all auth hooks/components
5. Remove Supabase dependencies
6. Test thoroughly

## Cost Analysis

- **Supabase**: Free tier covers 50K MAU
- **Complexity**: 2-3 days to remove vs keeping proven solution
- **Conversion impact**: ~30% lower without social logins

## Conclusion

While not strictly necessary, keeping Supabase provides significant UX and conversion benefits that outweigh the architectural complexity. The hybrid approach is recommended for production e-commerce sites.