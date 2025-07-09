# Phase 3: Shopify Markets Implementation

## Overview
This implementation adds full Shopify Markets support for the basic plan, enabling automatic currency conversion and market-specific pricing/availability.

## Key Features Implemented

### 1. GraphQL Query Updates
- **Product Queries** (`/lib/shopify/queries/product.ts`)
  - Added `@inContext` directive to all price and availability fields
  - Included `compareAtPrice` with market context
  - Support for presentment prices in user's currency

- **Collection Queries** (`/lib/shopify/queries/collection.ts`)
  - Added `@inContext` for product availability in collections
  - Market-aware product filtering

### 2. Markets Configuration (`/lib/shopify/markets.ts`)
- Configured 3 markets for basic plan:
  - Bulgaria (BG) - BGN currency
  - European Union (EU) - EUR currency  
  - Ukraine (UA) - UAH currency
- Market detection by country code
- Currency and language mapping
- Cookie-based preference storage

### 3. Enhanced Shopify Client (`/lib/shopify/client.ts`)
- Added buyer IP header support for geo-detection
- Accept-Language header based on locale
- Dynamic headers per request with market context

### 4. Market Selector Component (`/components/market-selector.tsx`)
- Combined country/currency selector
- Saves preferences to cookies
- Updates product prices on change
- Mobile-friendly dropdown UI

### 5. Server Context Utilities
- `getServerShopifyContext()` - Get context in server components
- `getBuyerIp()` - Extract buyer IP from headers
- Market-aware checkout URLs

### 6. API Routes
- `/api/market` - Update market preferences
- Handles cookie management
- Returns current market settings

## Usage

### In Server Components
```typescript
import { createShopifyContext } from '@/lib/shopify/services';
import { ShopifyService } from '@/lib/shopify/services';

// Get products with market context
const context = createShopifyContext(locale);
const products = await ShopifyService.getProducts(20, context);
```

### In Client Components
```typescript
import { MarketSelector } from '@/components/market-selector';

// Add to header/navigation
<MarketSelector />
```

### Getting Current Market
```typescript
import { getCurrentMarket } from '@/lib/shopify/markets';

const market = await getCurrentMarket();
console.log(market.name, market.countries[0].currency.code);
```

## Testing
Run the test script to verify markets are working:
```bash
npx tsx scripts/test-markets.ts
```

## Benefits
1. **Automatic Currency Conversion** - Shopify handles conversion based on market
2. **Market-Specific Availability** - Products show correct availability per market
3. **Localized Pricing** - Prices display in customer's currency
4. **SEO Benefits** - Market-specific URLs and content
5. **Better UX** - Customers see relevant prices immediately

## Next Steps
- Add market-specific shipping rates
- Implement tax calculation by market
- Add market-specific payment methods
- Create market analytics dashboard