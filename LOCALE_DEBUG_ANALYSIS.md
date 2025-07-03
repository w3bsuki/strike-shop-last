# Strike Shop Locale Issue Analysis

## Executive Summary

The locale/language switching functionality in Strike Shop is **partially implemented** but **not working** for product content. While the UI can switch languages (navigation, buttons, etc.), the product data remains in English regardless of the selected locale.

## Current State

### ✅ What's Working:
1. **URL Routing**: The middleware correctly redirects to locale-prefixed URLs (e.g., `/bg/`, `/en/`, `/ua/`)
2. **UI Translations**: Dictionary files exist for all locales with complete UI translations
3. **Locale Detection**: The middleware can detect locale from browser settings and geo-location
4. **Context Creation**: Shopify contexts are properly created with language/country codes
5. **Language Switcher**: The UI component correctly navigates between locales

### ❌ What's NOT Working:
1. **Product Translations**: All product titles/descriptions show in English regardless of locale
2. **Shopify @inContext**: The GraphQL directive appears to have no effect
3. **Product Data**: Products only have placeholder descriptions ("XYZ")

## Root Causes

### 1. **Shopify Markets Not Configured**
The @inContext directive requires Shopify Markets to be properly set up:
- Markets for Bulgaria (BG), Ukraine (UA), and UK (GB) need to be created
- Each market needs language translations enabled
- Products need translated content for each language

### 2. **Missing Product Translations in Shopify**
- Products only have default English content
- No translations exist for Bulgarian or Ukrainian
- The Shopify Admin needs translated product data

### 3. **Currency Mapping Issues**
The locale context uses:
- `en` → Country: GB (but might need US for some stores)
- `bg` → Country: BG 
- `ua` → Country: UA

## Technical Implementation Review

### 1. **Locale Flow**:
```
User visits /bg/ → Middleware validates → Page component receives lang param → 
createShopifyContext('bg') → Returns { language: 'BG', country: 'BG' } →
ShopifyClient.query() with @inContext directive → Shopify returns default content
```

### 2. **GraphQL Query Structure**:
```graphql
query getProducts($language: LanguageCode, $country: CountryCode) 
  @inContext(language: $language, country: $country) {
  products(first: 10) {
    edges {
      node {
        title  # Should be localized but isn't
        description  # Should be localized but isn't
      }
    }
  }
}
```

### 3. **Context Passing**:
- ✅ Context is created correctly: `{ language: 'BG', country: 'BG' }`
- ✅ Variables are passed to GraphQL query
- ❌ Shopify ignores the context (likely due to missing market setup)

## Solutions

### Immediate Fix (Client-Side Translation)
1. **Create product translation files**:
   ```typescript
   // lib/i18n/product-translations.ts
   export const productTranslations = {
     'bg': {
       't-shirt-1': { 
         title: 'Тениска', 
         description: 'Премиум памучна тениска...' 
       },
       'denim-shorts': { 
         title: 'Дънкови къси панталони',
         description: 'Висококачествени дънкови...'
       }
     },
     'ua': {
       't-shirt-1': { 
         title: 'Футболка',
         description: 'Преміум бавовняна футболка...'
       }
     }
   };
   ```

2. **Apply translations in services.ts**:
   ```typescript
   // In transformShopifyProduct()
   const translatedTitle = productTranslations[locale]?.[product.handle]?.title || product.title;
   const translatedDesc = productTranslations[locale]?.[product.handle]?.description || product.description;
   ```

### Proper Fix (Shopify Configuration)
1. **Set up Shopify Markets**:
   - Create markets for BG, UA, and GB in Shopify Admin
   - Enable multiple languages per market
   - Configure currency for each market

2. **Add Product Translations**:
   - Use Shopify Admin or Translation API
   - Add Bulgarian and Ukrainian translations for all products
   - Ensure metafields are also translated

3. **Test Market Detection**:
   - Verify @inContext directive works with proper market setup
   - Check if automatic geo-detection selects correct market

### Alternative Approach (Hybrid)
1. **Use Shopify for structure, local files for content**:
   - Fetch product structure from Shopify
   - Override title/description from local translation files
   - Maintain translations in the codebase until Shopify is configured

2. **Create translation management system**:
   - Admin interface to manage translations
   - Store in database (Supabase)
   - Sync with Shopify when available

## Testing Checklist

- [ ] Navigate to `/bg/` - Check if URL stays Bulgarian
- [ ] Check Network tab for GraphQL requests with language/country params
- [ ] Verify UI elements show Bulgarian text
- [ ] Check if product titles/descriptions are translated
- [ ] Test language switcher functionality
- [ ] Clear cache and test again
- [ ] Test with VPN to verify geo-detection

## Recommended Next Steps

1. **Short-term**: Implement client-side translations to unblock launch
2. **Medium-term**: Configure Shopify Markets and add product translations
3. **Long-term**: Build proper translation management system

## Debug URLs

- Test API: `http://localhost:3000/api/test-locale?locale=bg`
- Debug Page: `http://localhost:3000/bg/debug-locale`
- Direct comparison: Open `/en/debug-locale` and `/bg/debug-locale` side by side