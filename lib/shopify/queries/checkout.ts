/**
 * Checkout GraphQL Queries and Mutations
 * For Shopify Storefront API 2025-01
 */

// ============================================
// Fragments
// ============================================

export const CHECKOUT_FRAGMENT = `
  fragment CheckoutFragment on Checkout {
    id
    webUrl
    subtotalPriceV2 {
      amount
      currencyCode
    }
    totalTaxV2 {
      amount
      currencyCode
    }
    totalPriceV2 {
      amount
      currencyCode
    }
    completedAt
    createdAt
    updatedAt
    email
    note
    requiresShipping
    shippingAddress {
      id
      address1
      address2
      city
      company
      country
      countryCodeV2
      firstName
      lastName
      phone
      province
      provinceCode
      zip
    }
    shippingLine {
      handle
      priceV2 {
        amount
        currencyCode
      }
      title
    }
    availableShippingRates {
      ready
      shippingRates {
        handle
        priceV2 {
          amount
          currencyCode
        }
        title
      }
    }
    lineItems(first: 250) {
      edges {
        node {
          id
          title
          quantity
          variant {
            id
            title
            price {
              amount
              currencyCode
            }
            image {
              url
              altText
            }
            product {
              id
              handle
              title
            }
          }
          customAttributes {
            key
            value
          }
        }
      }
    }
    discountApplications(first: 10) {
      edges {
        node {
          targetSelection
          allocationMethod
          targetType
          ... on DiscountCodeApplication {
            applicable
            code
          }
          ... on ManualDiscountApplication {
            title
            description
          }
          ... on ScriptDiscountApplication {
            title
          }
          ... on AutomaticDiscountApplication {
            title
          }
        }
      }
    }
    appliedGiftCards {
      id
      balance {
        amount
        currencyCode
      }
      amountUsed {
        amount
        currencyCode
      }
      lastCharacters
    }
    order {
      id
      orderNumber
      processedAt
      totalPriceV2 {
        amount
        currencyCode
      }
      statusUrl
      customerUrl
    }
    ready
    taxExempt
    taxesIncluded
    currencyCode
    paymentDueV2 {
      amount
      currencyCode
    }
  }
`;

export const CHECKOUT_USER_ERROR_FRAGMENT = `
  fragment CheckoutUserErrorFragment on CheckoutUserError {
    field
    message
    code
  }
`;

// ============================================
// Mutations
// ============================================

export const CHECKOUT_CREATE = `
  mutation checkoutCreate($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout {
        ...CheckoutFragment
      }
      checkoutUserErrors {
        ...CheckoutUserErrorFragment
      }
      queueToken
    }
  }
  ${CHECKOUT_FRAGMENT}
  ${CHECKOUT_USER_ERROR_FRAGMENT}
`;

export const CHECKOUT_CUSTOMER_ASSOCIATE_V2 = `
  mutation checkoutCustomerAssociateV2($checkoutId: ID!, $customerAccessToken: String!) {
    checkoutCustomerAssociateV2(checkoutId: $checkoutId, customerAccessToken: $customerAccessToken) {
      checkout {
        ...CheckoutFragment
      }
      checkoutUserErrors {
        ...CheckoutUserErrorFragment
      }
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
    }
  }
  ${CHECKOUT_FRAGMENT}
  ${CHECKOUT_USER_ERROR_FRAGMENT}
`;

export const CHECKOUT_EMAIL_UPDATE_V2 = `
  mutation checkoutEmailUpdateV2($checkoutId: ID!, $email: String!) {
    checkoutEmailUpdateV2(checkoutId: $checkoutId, email: $email) {
      checkout {
        ...CheckoutFragment
      }
      checkoutUserErrors {
        ...CheckoutUserErrorFragment
      }
    }
  }
  ${CHECKOUT_FRAGMENT}
  ${CHECKOUT_USER_ERROR_FRAGMENT}
`;

export const CHECKOUT_SHIPPING_ADDRESS_UPDATE_V2 = `
  mutation checkoutShippingAddressUpdateV2($checkoutId: ID!, $shippingAddress: MailingAddressInput!) {
    checkoutShippingAddressUpdateV2(checkoutId: $checkoutId, shippingAddress: $shippingAddress) {
      checkout {
        ...CheckoutFragment
      }
      checkoutUserErrors {
        ...CheckoutUserErrorFragment
      }
    }
  }
  ${CHECKOUT_FRAGMENT}
  ${CHECKOUT_USER_ERROR_FRAGMENT}
`;

export const CHECKOUT_SHIPPING_LINE_UPDATE = `
  mutation checkoutShippingLineUpdate($checkoutId: ID!, $shippingRateHandle: String!) {
    checkoutShippingLineUpdate(checkoutId: $checkoutId, shippingRateHandle: $shippingRateHandle) {
      checkout {
        ...CheckoutFragment
      }
      checkoutUserErrors {
        ...CheckoutUserErrorFragment
      }
    }
  }
  ${CHECKOUT_FRAGMENT}
  ${CHECKOUT_USER_ERROR_FRAGMENT}
`;

export const CHECKOUT_ATTRIBUTES_UPDATE_V2 = `
  mutation checkoutAttributesUpdateV2($checkoutId: ID!, $input: CheckoutAttributesUpdateV2Input!) {
    checkoutAttributesUpdateV2(checkoutId: $checkoutId, input: $input) {
      checkout {
        ...CheckoutFragment
      }
      checkoutUserErrors {
        ...CheckoutUserErrorFragment
      }
    }
  }
  ${CHECKOUT_FRAGMENT}
  ${CHECKOUT_USER_ERROR_FRAGMENT}
`;

export const CHECKOUT_DISCOUNT_CODE_APPLY_V2 = `
  mutation checkoutDiscountCodeApplyV2($checkoutId: ID!, $discountCode: String!) {
    checkoutDiscountCodeApplyV2(checkoutId: $checkoutId, discountCode: $discountCode) {
      checkout {
        ...CheckoutFragment
      }
      checkoutUserErrors {
        ...CheckoutUserErrorFragment
      }
    }
  }
  ${CHECKOUT_FRAGMENT}
  ${CHECKOUT_USER_ERROR_FRAGMENT}
`;

export const CHECKOUT_DISCOUNT_CODE_REMOVE = `
  mutation checkoutDiscountCodeRemove($checkoutId: ID!) {
    checkoutDiscountCodeRemove(checkoutId: $checkoutId) {
      checkout {
        ...CheckoutFragment
      }
      checkoutUserErrors {
        ...CheckoutUserErrorFragment
      }
    }
  }
  ${CHECKOUT_FRAGMENT}
  ${CHECKOUT_USER_ERROR_FRAGMENT}
`;

export const CHECKOUT_GIFT_CARD_APPLY = `
  mutation checkoutGiftCardApply($checkoutId: ID!, $giftCardCode: String!) {
    checkoutGiftCardApply(checkoutId: $checkoutId, giftCardCode: $giftCardCode) {
      checkout {
        ...CheckoutFragment
      }
      checkoutUserErrors {
        ...CheckoutUserErrorFragment
      }
    }
  }
  ${CHECKOUT_FRAGMENT}
  ${CHECKOUT_USER_ERROR_FRAGMENT}
`;

export const CHECKOUT_GIFT_CARD_REMOVE_V2 = `
  mutation checkoutGiftCardRemoveV2($checkoutId: ID!, $appliedGiftCardId: ID!) {
    checkoutGiftCardRemoveV2(checkoutId: $checkoutId, appliedGiftCardId: $appliedGiftCardId) {
      checkout {
        ...CheckoutFragment
      }
      checkoutUserErrors {
        ...CheckoutUserErrorFragment
      }
    }
  }
  ${CHECKOUT_FRAGMENT}
  ${CHECKOUT_USER_ERROR_FRAGMENT}
`;

export const CHECKOUT_COMPLETE_FREE = `
  mutation checkoutCompleteFree($checkoutId: ID!) {
    checkoutCompleteFree(checkoutId: $checkoutId) {
      checkout {
        ...CheckoutFragment
      }
      checkoutUserErrors {
        ...CheckoutUserErrorFragment
      }
    }
  }
  ${CHECKOUT_FRAGMENT}
  ${CHECKOUT_USER_ERROR_FRAGMENT}
`;

// ============================================
// Queries
// ============================================

export const GET_CHECKOUT = `
  query getCheckout($checkoutId: ID!) {
    node(id: $checkoutId) {
      ... on Checkout {
        ...CheckoutFragment
      }
    }
  }
  ${CHECKOUT_FRAGMENT}
`;

export const CHECKOUT_SHIPPING_RATES = `
  query checkoutShippingRates($checkoutId: ID!) {
    node(id: $checkoutId) {
      ... on Checkout {
        id
        availableShippingRates {
          ready
          shippingRates {
            handle
            priceV2 {
              amount
              currencyCode
            }
            title
          }
        }
      }
    }
  }
`;

// ============================================
// Helper Queries for Cart to Checkout conversion
// ============================================

export const CART_TO_CHECKOUT_QUERY = `
  query cartToCheckout($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      buyerIdentity {
        email
        phone
        customer {
          id
          email
          firstName
          lastName
        }
        countryCode
      }
      note
      attributes {
        key
        value
      }
      lines(first: 250) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
              }
            }
            attributes {
              key
              value
            }
          }
        }
      }
      discountCodes {
        applicable
        code
      }
      deliveryGroups(first: 1) {
        edges {
          node {
            id
            deliveryAddress {
              ... on MailingAddress {
                address1
                address2
                city
                company
                country
                countryCodeV2
                firstName
                lastName
                phone
                province
                provinceCode
                zip
              }
            }
          }
        }
      }
    }
  }
`;