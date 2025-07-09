# Shopify Markets Feature Analysis
*Generated: 2025-07-07*

## Executive Summary

This analysis examines what Shopify Markets features we can implement in Strike Shop without requiring a specific Shopify plan upgrade. Based on the codebase review and current Shopify documentation, we have strong foundations in place but are not fully utilizing available Markets features.

## Current Implementation Status

### ✅ Already Implemented

1. **Region Detection System** (`/lib/region/region-detection.ts`)
   - Advanced geo-location detection using multiple methods
   - Support for BG, EU, and UA markets
   - Multiple fallback mechanisms (CDN headers, Geo-IP services, browser language)
   - Confidence scoring for detection accuracy

2. **Multi-Currency Support** (`/lib/currency/currency-context.tsx`)
   - Support for EUR, USD, BGN, UAH
   - Currency switching functionality
   - Exchange rate fetching (currently using mock rates)
   - Persistent currency preferences

3. **Language/Locale Support**
   - Three languages configured: en, bg, ua
   - i18n infrastructure in place
   - Locale-aware routing

4. **@inContext Directive Usage** (`/lib/shopify/client.ts`)
   - GraphQL queries already include `@inContext` directive
   - Support for `language` and `country` parameters
   - Properly structured for Markets API

5. **Regional Market Configuration**
   - Tax-inclusive pricing by region
   - Shipping zones defined per market
   - Payment methods configuration per region

### ❌ Not Yet Implemented

1. **Presentment Prices**
   - Not using Shopify's automatic currency conversion
   - Manual currency conversion instead of native support

2. **Market-Specific Product Availability**
   - Not filtering products by market availability
   - No market-specific inventory management

3. **Localized Product Content**
   - No translated product titles/descriptions from Shopify
   - Manual translations only

4. **Market-Specific Checkout**
   - Not passing market context to checkout
   - Missing duty/tax calculations per market

## Features Available by Plan Tier

### Basic Plan Features (Available Now)

1. **Multi-Currency Display** ✅
   - Display prices in customer's local currency
   - Automatic currency conversion via @inContext
   - Up to 3 markets supported

2. **Multi-Language Support** ✅
   - Translate store content
   - Language switcher
   - Localized URLs

3. **Basic International Pricing** ⚠️
   - Currency rounding rules
   - Exchange rate management
   - Note: No country-specific pricing

4. **Geo-Location** ✅
   - Detect customer location
   - Auto-redirect to appropriate market
   - Saved preferences

5. **Payment Methods by Region** ✅
   - Configure available payment methods per market
   - Already configured in environment variables

### Plus/Advanced Features (Require Upgrade)

1. **Advanced Pricing**
   - Country-specific pricing (not just currency conversion)
   - Duty and import fee collection
   - Advanced tax configuration

2. **50 Markets**
   - Basic plan limited to 3 markets
   - We're already at the limit with BG, EU, UA

3. **B2B Features**
   - Wholesale pricing
   - Customer-specific catalogs
   - Volume discounts

4. **Advanced Shipping**
   - Market-specific shipping rates
   - Carrier calculated shipping per market

## Implementation Recommendations for Phase 3

### 1. Enable Native Multi-Currency (High Priority)

**What**: Use Shopify's @inContext directive properly for automatic currency conversion

**Implementation**:
```typescript
// Update product queries to use buyer's context
const context: ShopifyRequestContext = {
  country: detectedRegion.countryCode, // e.g., 'BG', 'UA'
  language: detectedRegion.language     // e.g., 'bg', 'uk'
};

// Products will return prices in local currency automatically
const products = await shopifyClient.getProducts(10, context);
```

**Benefits**:
- Automatic currency conversion handled by Shopify
- Accurate exchange rates
- Proper currency formatting

### 2. Market-Aware Product Catalog (High Priority)

**What**: Filter products based on market availability

**Implementation**:
- Products queried with @inContext automatically filter by market
- Add market selector to product list pages
- Cache products per market

### 3. Enhanced Checkout Context (High Priority)

**What**: Pass market context through checkout flow

**Implementation**:
```typescript
// When creating checkout
const checkout = await createCheckout({
  lineItems,
  buyerIdentity: {
    countryCode: market.countryCode,
    // This enables market-specific pricing/taxes
  }
});
```

### 4. Localized Content from Shopify (Medium Priority)

**What**: Fetch translated content from Shopify when available

**Implementation**:
- Configure translations in Shopify admin
- Query with language parameter
- Fallback to default language if translation missing

### 5. Smart Currency Switching (Medium Priority)

**What**: Improve currency switcher to show only relevant currencies

**Implementation**:
- BG market: Show BGN, EUR
- EU market: Show EUR, USD, GBP
- UA market: Show UAH, EUR, USD

### 6. Tax Display Improvements (Low Priority)

**What**: Show tax-inclusive/exclusive prices based on market

**Implementation**:
- Use existing `taxInclusive` configuration
- Display "incl. VAT" or "excl. tax" labels
- Show tax breakdown in cart

## Technical Implementation Guide

### Step 1: Update ShopifyClient Context Usage

```typescript
// In components/product/product-card.tsx
const { market, locale } = useRegion();
const context: ShopifyRequestContext = {
  country: MARKET_TO_COUNTRY[market],
  language: locale.toUpperCase()
};

const product = await shopifyClient.getProductByHandle(handle, context);
// Price will be in customer's currency automatically
```

### Step 2: Update Cart Context

```typescript
// In lib/shopify/cart.ts
export async function createCart(market: string) {
  const context = getMarketContext(market);
  
  return shopifyClient.createCart({
    buyerIdentity: {
      countryCode: context.country,
      // Enables market-specific features
    }
  });
}
```

### Step 3: Enhance Region Detection

```typescript
// Add country code mapping
const MARKET_TO_COUNTRY: Record<string, string> = {
  'bg': 'BG',
  'eu': 'GB', // Default EU country
  'ua': 'UA'
};
```

## Cost-Benefit Analysis

### Implementing Now (No Cost)
- **Multi-currency display**: High impact, already supported
- **Market filtering**: Medium impact, improves UX
- **Enhanced checkout**: High impact, better conversion
- **Estimated effort**: 2-3 days

### Deferring (Requires Plus)
- **Country-specific pricing**: Low initial impact
- **50 markets**: Not needed yet
- **B2B features**: Future consideration

## Conclusion

We can implement significant Markets functionality on the Basic plan:
1. Native multi-currency with @inContext (not using manual conversion)
2. Market-aware product filtering
3. Localized checkout experience
4. Smart geo-detection already in place

The main limitations are:
- Only 3 markets (sufficient for current BG/EU/UA strategy)
- No country-specific pricing (only currency conversion)
- No duty collection

**Recommendation**: Implement the high-priority items in Phase 3. These provide immediate value without requiring a plan upgrade. The current Basic plan supports our three-market strategy well.