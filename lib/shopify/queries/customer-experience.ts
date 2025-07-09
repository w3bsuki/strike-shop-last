/**
 * Shopify GraphQL Queries for Customer Experience Features
 */

export const CUSTOMER_WISHLIST_QUERY = `
  query CustomerWishlist($customerId: ID!) {
    customer(id: $customerId) {
      id
      metafields(first: 10, namespace: "wishlist") {
        edges {
          node {
            id
            key
            value
            type
          }
        }
      }
    }
  }
`;

export const PRODUCT_RECOMMENDATIONS_QUERY = `
  query ProductRecommendations($productId: ID!, $intent: ProductRecommendationIntent!) {
    productRecommendations(productId: $productId, intent: $intent) {
      id
      title
      handle
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      featuredImage {
        url
        altText
      }
      variants(first: 1) {
        edges {
          node {
            id
            availableForSale
            inventoryQuantity
          }
        }
      }
    }
  }
`;

export const CUSTOMER_SEGMENT_QUERY = `
  query CustomerSegment($query: String!, $first: Int!) {
    customers(query: $query, first: $first) {
      edges {
        node {
          id
          email
          firstName
          lastName
          phone
          tags
          totalSpent {
            amount
            currencyCode
          }
          ordersCount
          lastOrder {
            id
            createdAt
          }
          defaultAddress {
            country
            province
            city
          }
          metafields(first: 10) {
            edges {
              node {
                id
                key
                value
                namespace
              }
            }
          }
        }
      }
    }
  }
`;

export const CUSTOMER_ORDERS_QUERY = `
  query CustomerOrders($customerId: ID!, $first: Int!) {
    customer(id: $customerId) {
      id
      orders(first: $first) {
        edges {
          node {
            id
            orderNumber
            createdAt
            totalPriceV2 {
              amount
              currencyCode
            }
            lineItems(first: 10) {
              edges {
                node {
                  id
                  quantity
                  variant {
                    id
                    product {
                      id
                      title
                      handle
                      productType
                      vendor
                      tags
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const SIMILAR_PRODUCTS_QUERY = `
  query SimilarProducts($productId: ID!, $first: Int!) {
    product(id: $productId) {
      id
      productType
      vendor
      tags
      collections(first: 5) {
        edges {
          node {
            id
            products(first: $first) {
              edges {
                node {
                  id
                  title
                  handle
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  featuredImage {
                    url
                    altText
                  }
                  variants(first: 1) {
                    edges {
                      node {
                        id
                        availableForSale
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const TRENDING_PRODUCTS_QUERY = `
  query TrendingProducts($first: Int!) {
    products(first: $first, sortKey: BEST_SELLING) {
      edges {
        node {
          id
          title
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
          }
          variants(first: 1) {
            edges {
              node {
                id
                availableForSale
                inventoryQuantity
              }
            }
          }
        }
      }
    }
  }
`;

export const CUSTOMER_BROWSING_HISTORY_QUERY = `
  query CustomerBrowsingHistory($customerId: ID!) {
    customer(id: $customerId) {
      id
      metafields(first: 10, namespace: "browsing") {
        edges {
          node {
            id
            key
            value
            type
            updatedAt
          }
        }
      }
    }
  }
`;

export const FREQUENTLY_BOUGHT_TOGETHER_QUERY = `
  query FrequentlyBoughtTogether($productId: ID!) {
    product(id: $productId) {
      id
      title
      # This would typically require custom analytics
      # For now, we'll use related products from collections
      collections(first: 3) {
        edges {
          node {
            id
            products(first: 5) {
              edges {
                node {
                  id
                  title
                  handle
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  featuredImage {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const CUSTOMER_LIFECYCLE_QUERY = `
  query CustomerLifecycle($customerId: ID!) {
    customer(id: $customerId) {
      id
      createdAt
      lastOrder {
        id
        createdAt
      }
      ordersCount
      totalSpent {
        amount
        currencyCode
      }
      tags
      acceptsMarketing
      emailMarketingConsent {
        state
        opt_in_level
        consent_updated_at
      }
      smsMarketingConsent {
        state
        opt_in_level
        consent_updated_at
      }
    }
  }
`;

export const CUSTOMER_PREFERENCES_QUERY = `
  query CustomerPreferences($customerId: ID!) {
    customer(id: $customerId) {
      id
      metafields(first: 20, namespace: "preferences") {
        edges {
          node {
            id
            key
            value
            type
          }
        }
      }
      # Common preference indicators
      orders(first: 10) {
        edges {
          node {
            id
            lineItems(first: 10) {
              edges {
                node {
                  variant {
                    product {
                      productType
                      vendor
                      tags
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const ABANDONED_CART_QUERY = `
  query AbandonedCart($customerId: ID!) {
    customer(id: $customerId) {
      id
      lastIncompleteCheckout {
        id
        createdAt
        updatedAt
        webUrl
        totalPriceV2 {
          amount
          currencyCode
        }
        lineItems(first: 10) {
          edges {
            node {
              id
              quantity
              variant {
                id
                title
                image {
                  url
                  altText
                }
                product {
                  id
                  title
                  handle
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const CUSTOMER_REVIEW_ELIGIBILITY_QUERY = `
  query CustomerReviewEligibility($customerId: ID!, $productId: ID!) {
    customer(id: $customerId) {
      id
      orders(first: 50) {
        edges {
          node {
            id
            createdAt
            lineItems(first: 10) {
              edges {
                node {
                  variant {
                    product {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const CUSTOMER_LOYALTY_POINTS_QUERY = `
  query CustomerLoyaltyPoints($customerId: ID!) {
    customer(id: $customerId) {
      id
      metafields(first: 10, namespace: "loyalty") {
        edges {
          node {
            id
            key
            value
            type
          }
        }
      }
      tags
      ordersCount
      totalSpent {
        amount
        currencyCode
      }
    }
  }
`;

export const CUSTOMER_COMMUNICATION_PREFERENCES_QUERY = `
  query CustomerCommunicationPreferences($customerId: ID!) {
    customer(id: $customerId) {
      id
      acceptsMarketing
      emailMarketingConsent {
        state
        opt_in_level
        consent_updated_at
      }
      smsMarketingConsent {
        state
        opt_in_level
        consent_updated_at
      }
      metafields(first: 10, namespace: "communication") {
        edges {
          node {
            id
            key
            value
            type
          }
        }
      }
    }
  }
`;

export const CUSTOMER_SUBSCRIPTION_QUERY = `
  query CustomerSubscriptions($customerId: ID!) {
    customer(id: $customerId) {
      id
      # This would typically require a subscription app
      # For now, we'll check for subscription-related metafields
      metafields(first: 10, namespace: "subscriptions") {
        edges {
          node {
            id
            key
            value
            type
          }
        }
      }
      orders(first: 10) {
        edges {
          node {
            id
            lineItems(first: 10) {
              edges {
                node {
                  variant {
                    product {
                      tags
                      productType
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const UPDATE_CUSTOMER_METAFIELD_MUTATION = `
  mutation UpdateCustomerMetafield($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        metafields(first: 10) {
          edges {
            node {
              id
              key
              value
              namespace
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_CUSTOMER_METAFIELD_MUTATION = `
  mutation CreateCustomerMetafield($metafields: [MetafieldInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        key
        value
        namespace
      }
      userErrors {
        field
        message
      }
    }
  }
`;