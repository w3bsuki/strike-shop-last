/**
 * Shopify GraphQL Queries for Advanced Features
 */

export const SUBSCRIPTION_QUERY = `
  query SubscriptionProducts($first: Int!) {
    products(first: $first, query: "tag:subscription") {
      edges {
        node {
          id
          title
          handle
          tags
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
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
        }
      }
    }
  }
`;

export const BUNDLE_QUERY = `
  query BundleProducts($first: Int!) {
    products(first: $first, query: "tag:bundle") {
      edges {
        node {
          id
          title
          handle
          tags
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          metafields(first: 10, namespace: "bundles") {
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
    }
  }
`;

export const GIFT_CARD_QUERY = `
  query GiftCards($first: Int!) {
    products(first: $first, productType: "Gift Card") {
      edges {
        node {
          id
          title
          handle
          productType
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const DISCOUNT_CODES_QUERY = `
  query DiscountCodes($first: Int!) {
    codeDiscountNodes(first: $first) {
      edges {
        node {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 10) {
                edges {
                  node {
                    id
                    code
                  }
                }
              }
              status
              startsAt
              endsAt
              usageLimit
              customerGets {
                value {
                  ... on DiscountPercentage {
                    percentage
                  }
                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }
                  }
                }
              }
              customerSelection {
                ... on DiscountCustomerAll {
                  allCustomers
                }
                ... on DiscountCustomers {
                  customers(first: 10) {
                    edges {
                      node {
                        id
                        email
                      }
                    }
                  }
                }
              }
            }
            ... on DiscountCodeBxgy {
              title
              codes(first: 10) {
                edges {
                  node {
                    id
                    code
                  }
                }
              }
              status
              startsAt
              endsAt
              usageLimit
              customerBuys {
                value {
                  ... on DiscountQuantity {
                    quantity
                  }
                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }
                  }
                }
                items {
                  ... on DiscountProducts {
                    products(first: 10) {
                      edges {
                        node {
                          id
                          title
                        }
                      }
                    }
                  }
                  ... on DiscountCollections {
                    collections(first: 10) {
                      edges {
                        node {
                          id
                          title
                        }
                      }
                    }
                  }
                }
              }
              customerGets {
                value {
                  ... on DiscountPercentage {
                    percentage
                  }
                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }
                  }
                }
                items {
                  ... on DiscountProducts {
                    products(first: 10) {
                      edges {
                        node {
                          id
                          title
                        }
                      }
                    }
                  }
                  ... on DiscountCollections {
                    collections(first: 10) {
                      edges {
                        node {
                          id
                          title
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
  }
`;

export const AUTOMATIC_DISCOUNTS_QUERY = `
  query AutomaticDiscounts($first: Int!) {
    automaticDiscountNodes(first: $first) {
      edges {
        node {
          id
          automaticDiscount {
            ... on DiscountAutomaticBasic {
              title
              status
              startsAt
              endsAt
              customerGets {
                value {
                  ... on DiscountPercentage {
                    percentage
                  }
                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }
                  }
                }
              }
              minimumRequirement {
                ... on DiscountMinimumQuantity {
                  greaterThanOrEqualToQuantity
                }
                ... on DiscountMinimumSubtotal {
                  greaterThanOrEqualToSubtotal {
                    amount
                    currencyCode
                  }
                }
              }
            }
            ... on DiscountAutomaticBxgy {
              title
              status
              startsAt
              endsAt
              customerBuys {
                value {
                  ... on DiscountQuantity {
                    quantity
                  }
                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }
                  }
                }
                items {
                  ... on DiscountProducts {
                    products(first: 10) {
                      edges {
                        node {
                          id
                          title
                        }
                      }
                    }
                  }
                  ... on DiscountCollections {
                    collections(first: 10) {
                      edges {
                        node {
                          id
                          title
                        }
                      }
                    }
                  }
                }
              }
              customerGets {
                value {
                  ... on DiscountPercentage {
                    percentage
                  }
                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }
                  }
                }
                items {
                  ... on DiscountProducts {
                    products(first: 10) {
                      edges {
                        node {
                          id
                          title
                        }
                      }
                    }
                  }
                  ... on DiscountCollections {
                    collections(first: 10) {
                      edges {
                        node {
                          id
                          title
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
  }
`;

export const B2B_CUSTOMER_QUERY = `
  query B2BCustomer($customerId: ID!) {
    customer(id: $customerId) {
      id
      firstName
      lastName
      email
      phone
      tags
      totalSpent {
        amount
        currencyCode
      }
      metafields(first: 20, namespace: "b2b") {
        edges {
          node {
            id
            key
            value
            type
          }
        }
      }
      defaultAddress {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        country
        zip
        phone
      }
    }
  }
`;

export const WHOLESALE_PRICING_QUERY = `
  query WholesalePricing($productId: ID!, $customerId: ID!) {
    product(id: $productId) {
      id
      title
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      metafields(first: 10, namespace: "wholesale") {
        edges {
          node {
            id
            key
            value
            type
          }
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
            metafields(first: 10, namespace: "wholesale") {
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
      }
    }
    customer(id: $customerId) {
      id
      tags
      metafields(first: 10, namespace: "wholesale") {
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

export const SUBSCRIPTION_CONTRACT_QUERY = `
  query SubscriptionContract($id: ID!) {
    subscriptionContract(id: $id) {
      id
      status
      nextBillingDate
      createdAt
      updatedAt
      customer {
        id
        firstName
        lastName
        email
      }
      deliveryMethod {
        ... on SubscriptionDeliveryMethodShipping {
          address {
            firstName
            lastName
            company
            address1
            address2
            city
            province
            country
            zip
          }
        }
      }
      lines(first: 10) {
        edges {
          node {
            id
            quantity
            currentPrice {
              amount
              currencyCode
            }
            productId
            variantId
            title
            variantTitle
            variantImage {
              url
              altText
            }
            discountAllocations {
              discountApplication {
                ... on SubscriptionDiscountApplication {
                  title
                  value {
                    ... on SubscriptionDiscountPercentage {
                      percentage
                    }
                    ... on SubscriptionDiscountFixedAmount {
                      amount {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      billingPolicy {
        intervalCount
        interval
        minCycles
        maxCycles
      }
      deliveryPolicy {
        intervalCount
        interval
      }
    }
  }
`;

export const GIFT_CARD_BALANCE_QUERY = `
  query GiftCardBalance($id: ID!) {
    node(id: $id) {
      ... on GiftCard {
        id
        maskedCode
        balance {
          amount
          currencyCode
        }
        initialValue {
          amount
          currencyCode
        }
        createdAt
        expiresOn
        enabled
        note
        recipientAttributes {
          name
          value
        }
        transactions(first: 10) {
          edges {
            node {
              id
              amount {
                amount
                currencyCode
              }
              processedAt
              kind
            }
          }
        }
      }
    }
  }
`;

export const PRODUCT_BUNDLE_QUERY = `
  query ProductBundle($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      tags
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      metafields(first: 10, namespace: "bundles") {
        edges {
          node {
            id
            key
            value
            type
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            metafields(first: 10, namespace: "bundles") {
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
      }
    }
  }
`;

export const CUSTOMER_SEGMENTS_QUERY = `
  query CustomerSegments($first: Int!) {
    customerSegments(first: $first) {
      edges {
        node {
          id
          name
          query
          createdAt
          updatedAt
        }
      }
    }
  }
`;

export const LOYALTY_PROGRAM_QUERY = `
  query LoyaltyProgram($customerId: ID!) {
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

export const TIERED_PRICING_QUERY = `
  query TieredPricing($productId: ID!) {
    product(id: $productId) {
      id
      title
      metafields(first: 10, namespace: "pricing") {
        edges {
          node {
            id
            key
            value
            type
          }
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
            metafields(first: 10, namespace: "pricing") {
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
      }
    }
  }
`;

export const CREATE_SUBSCRIPTION_CONTRACT_MUTATION = `
  mutation CreateSubscriptionContract($input: SubscriptionContractCreateInput!) {
    subscriptionContractCreate(input: $input) {
      contract {
        id
        status
        nextBillingDate
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_GIFT_CARD_MUTATION = `
  mutation CreateGiftCard($input: GiftCardCreateInput!) {
    giftCardCreate(input: $input) {
      giftCard {
        id
        maskedCode
        balance {
          amount
          currencyCode
        }
        initialValue {
          amount
          currencyCode
        }
        createdAt
        expiresOn
        enabled
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_DISCOUNT_CODE_MUTATION = `
  mutation CreateDiscountCode($input: DiscountCodeBasicCreateInput!) {
    discountCodeBasicCreate(input: $input) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            codes(first: 1) {
              edges {
                node {
                  id
                  code
                }
              }
            }
            status
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

export const CREATE_AUTOMATIC_DISCOUNT_MUTATION = `
  mutation CreateAutomaticDiscount($input: DiscountAutomaticBasicCreateInput!) {
    discountAutomaticBasicCreate(input: $input) {
      automaticDiscountNode {
        id
        automaticDiscount {
          ... on DiscountAutomaticBasic {
            title
            status
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

export const UPDATE_CUSTOMER_B2B_MUTATION = `
  mutation UpdateCustomerB2B($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        tags
        metafields(first: 10, namespace: "b2b") {
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
      userErrors {
        field
        message
      }
    }
  }
`;