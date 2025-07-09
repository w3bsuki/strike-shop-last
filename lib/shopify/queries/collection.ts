/**
 * Collection-related GraphQL queries with market support
 * Uses @inContext directive for market-specific product availability and pricing
 */

// Collection fragment
export const COLLECTION_FRAGMENT = `
  fragment CollectionFragment on Collection {
    id
    handle
    title
    description
    descriptionHtml
    image {
      url
      altText
      width
      height
    }
    seo {
      title
      description
    }
  }
`;

// Product in collection fragment (simplified for list views)
export const PRODUCT_IN_COLLECTION_FRAGMENT = `
  fragment ProductInCollectionFragment on Product {
    id
    handle
    title
    vendor
    availableForSale
    images(first: 1) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
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
`;

// Get all collections with market context
export const GET_COLLECTIONS_QUERY = `
  query getCollections($first: Int!) {
    collections(first: $first, sortKey: TITLE) {
      edges {
        node {
          ...CollectionFragment
          products(first: 4) {
            edges {
              node {
                ...ProductInCollectionFragment
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${COLLECTION_FRAGMENT}
  ${PRODUCT_IN_COLLECTION_FRAGMENT}
`;

// Get collection by handle with products
export const GET_COLLECTION_BY_HANDLE_QUERY = `
  query getCollectionByHandle($handle: String!, $productsFirst: Int!) {
    collectionByHandle(handle: $handle) {
      ...CollectionFragment
      products(first: $productsFirst, sortKey: POSITION) {
        edges {
          node {
            ...ProductInCollectionFragment
            tags
            productType
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  selectedOptions {
                    name
                    value
                  }
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
        pageInfo {
          hasNextPage
          endCursor
        }
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
      }
    }
  }
  ${COLLECTION_FRAGMENT}
  ${PRODUCT_IN_COLLECTION_FRAGMENT}
`;

// Get collection products with pagination
export const GET_COLLECTION_PRODUCTS_QUERY = `
  query getCollectionProducts($handle: String!, $first: Int!, $after: String, $filters: [ProductFilter!], $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
    collectionByHandle(handle: $handle) {
      id
      products(first: $first, after: $after, filters: $filters, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node {
            ...ProductInCollectionFragment
            tags
            productType
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
  ${PRODUCT_IN_COLLECTION_FRAGMENT}
`;

// Get featured collections
export const GET_FEATURED_COLLECTIONS_QUERY = `
  query getFeaturedCollections {
    collections(first: 6, query: "tag:featured", sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          ...CollectionFragment
          products(first: 3) {
            edges {
              node {
                ...ProductInCollectionFragment
              }
            }
          }
        }
      }
    }
  }
  ${COLLECTION_FRAGMENT}
  ${PRODUCT_IN_COLLECTION_FRAGMENT}
`;