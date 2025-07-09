/**
 * Market and localization-related GraphQL queries
 * For querying available markets, localization settings, and translations
 */

// Get available markets
export const GET_MARKETS_QUERY = `
  query getMarkets {
    localization {
      availableCountries {
        currency {
          isoCode
          name
          symbol
        }
        isoCode
        name
        unitSystem
      }
      availableLanguages {
        isoCode
        name
        endonymName
      }
    }
  }
`;

// Get shop localization settings
export const GET_SHOP_LOCALIZATION_QUERY = `
  query getShopLocalization {
    shop {
      name
      primaryDomain {
        host
        url
      }
      paymentSettings {
        currencyCode
        supportedDigitalWallets
        countryCode
      }
      shipsToCountries
    }
    localization {
      availableCountries {
        currency {
          isoCode
          name
          symbol
        }
        isoCode
        name
        unitSystem
      }
      availableLanguages {
        isoCode
        name
        endonymName
      }
    }
  }
`;

// Get translated content for a specific product
export const GET_PRODUCT_TRANSLATIONS_QUERY = `
  query getProductTranslations($handle: String!, $language: LanguageCode!) @inContext(language: $language) {
    productByHandle(handle: $handle) {
      id
      title
      description
      seo {
        title
        description
      }
      metafields(identifiers: [
        { namespace: "custom", key: "translated_features" }
        { namespace: "custom", key: "translated_materials" }
      ]) {
        key
        value
      }
    }
  }
`;

// Get translated content for a specific collection
export const GET_COLLECTION_TRANSLATIONS_QUERY = `
  query getCollectionTranslations($handle: String!, $language: LanguageCode!) @inContext(language: $language) {
    collectionByHandle(handle: $handle) {
      id
      title
      description
      seo {
        title
        description
      }
    }
  }
`;

// Get shop policies in specific language
export const GET_SHOP_POLICIES_QUERY = `
  query getShopPolicies($language: LanguageCode!) @inContext(language: $language) {
    shop {
      privacyPolicy {
        id
        title
        body
        handle
      }
      refundPolicy {
        id
        title
        body
        handle
      }
      shippingPolicy {
        id
        title
        body
        handle
      }
      termsOfService {
        id
        title
        body
        handle
      }
    }
  }
`;

// Get menu translations
export const GET_MENU_TRANSLATIONS_QUERY = `
  query getMenuTranslations($handle: String!, $language: LanguageCode!) @inContext(language: $language) {
    menu(handle: $handle) {
      id
      title
      items {
        id
        title
        url
        items {
          id
          title
          url
        }
      }
    }
  }
`;

// Check product availability in specific market
export const CHECK_PRODUCT_AVAILABILITY_QUERY = `
  query checkProductAvailability($handle: String!, $country: CountryCode!) @inContext(country: $country) {
    productByHandle(handle: $handle) {
      id
      availableForSale
      variants(first: 100) {
        edges {
          node {
            id
            availableForSale
            quantityAvailable
          }
        }
      }
    }
  }
`;

// Get market-specific pricing
export const GET_MARKET_PRICING_QUERY = `
  query getMarketPricing($handle: String!, $country: CountryCode!, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productByHandle(handle: $handle) {
      id
      title
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      compareAtPriceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;