/**
 * Product-related GraphQL queries with market support
 * Uses @inContext directive for automatic market-based pricing and availability
 */

// Product fragment with presentment prices
export const PRODUCT_FRAGMENT = `
  fragment ProductFragment on Product {
    id
    handle
    title
    description
    tags
    vendor
    productType
    createdAt
    updatedAt
    availableForSale
    images(first: 10) {
      edges {
        node {
          id
          url
          altText
          width
          height
        }
      }
    }
    variants(first: 100) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
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
          image {
            url
            altText
          }
        }
      }
    }
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
  }
`;

// Get products with market context
export const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          ...ProductFragment
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

// Get product by handle with market context
export const GET_PRODUCT_BY_HANDLE_QUERY = `
  query getProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      ...ProductFragment
      seo {
        title
        description
      }
      metafields(identifiers: [
        { namespace: "custom", key: "features" }
        { namespace: "custom", key: "materials" }
        { namespace: "custom", key: "care_instructions" }
      ]) {
        key
        namespace
        value
        type
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

// Get product by ID with market context
export const GET_PRODUCT_BY_ID_QUERY = `
  query getProductById($id: ID!) {
    product(id: $id) {
      ...ProductFragment
      seo {
        title
        description
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

// Search products with market context
export const SEARCH_PRODUCTS_QUERY = `
  query searchProducts($query: String!, $first: Int!) {
    search(query: $query, types: [PRODUCT], first: $first) {
      edges {
        node {
          ... on Product {
            ...ProductFragment
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

// Get product recommendations with market context
export const GET_PRODUCT_RECOMMENDATIONS_QUERY = `
  query getProductRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      ...ProductFragment
    }
  }
  ${PRODUCT_FRAGMENT}
`;

// Get products by collection with market context
export const GET_PRODUCTS_BY_COLLECTION_QUERY = `
  query getProductsByCollection($handle: String!, $first: Int!) {
    collectionByHandle(handle: $handle) {
      id
      title
      description
      products(first: $first, sortKey: POSITION) {
        edges {
          node {
            ...ProductFragment
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;