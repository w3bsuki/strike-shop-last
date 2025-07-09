import { ShopifyClient } from './client';
import type {
  Customer,
  CustomerAccessToken,
  CustomerCreateInput,
  CustomerUpdateInput,
  CustomerAccessTokenCreateInput,
  CustomerCreatePayload,
  CustomerAccessTokenCreatePayload,
  CustomerUpdatePayload,
  CustomerAddressCreatePayload,
  CustomerAddressUpdatePayload,
  CustomerAddressDeletePayload,
  CustomerResetPayload,
  CustomerRecoverPayload,
  CustomerResetInput,
  MailingAddressInput,
  CustomerOrder,
} from './types/customer';

/**
 * Shopify Customer Service
 * Handles all customer-related operations with Shopify Storefront API
 */
export class ShopifyCustomerService {
  constructor(private client: ShopifyClient) {}

  /**
   * Create a new customer account
   */
  async createCustomer(input: CustomerCreateInput): Promise<CustomerCreatePayload> {
    const mutation = `
      mutation customerCreate($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          customer {
            id
            email
            firstName
            lastName
            displayName
            phone
            acceptsMarketing
            createdAt
            updatedAt
          }
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.client.query<{ customerCreate: CustomerCreatePayload }>(
      mutation,
      { input }
    );

    return response.customerCreate;
  }

  /**
   * Customer login - create access token
   */
  async login(input: CustomerAccessTokenCreateInput): Promise<CustomerAccessTokenCreatePayload> {
    const mutation = `
      mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.client.query<{ customerAccessTokenCreate: CustomerAccessTokenCreatePayload }>(
      mutation,
      { input }
    );

    return response.customerAccessTokenCreate;
  }

  /**
   * Customer logout - delete access token
   */
  async logout(customerAccessToken: string): Promise<{ success: boolean; errors: any[] }> {
    const mutation = `
      mutation customerAccessTokenDelete($customerAccessToken: String!) {
        customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
          deletedAccessToken
          deletedCustomerAccessTokenId
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.query<{
      customerAccessTokenDelete: {
        deletedAccessToken?: string;
        deletedCustomerAccessTokenId?: string;
        userErrors: Array<{ field?: string[]; message: string }>;
      };
    }>(mutation, { customerAccessToken });

    return {
      success: !!response.customerAccessTokenDelete.deletedAccessToken,
      errors: response.customerAccessTokenDelete.userErrors,
    };
  }

  /**
   * Get customer details using access token
   */
  async getCustomer(customerAccessToken: string): Promise<Customer | null> {
    const query = `
      query getCustomer($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
          email
          firstName
          lastName
          displayName
          phone
          acceptsMarketing
          createdAt
          updatedAt
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
            formatted
          }
          addresses(first: 10) {
            edges {
              node {
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
                formatted
              }
            }
          }
          orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              node {
                id
                orderNumber
                processedAt
                fulfillmentStatus
                financialStatus
                currentTotalPrice {
                  amount
                  currencyCode
                }
                lineItems(first: 5) {
                  edges {
                    node {
                      title
                      quantity
                      variant {
                        id
                        title
                        image {
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
      }
    `;

    const response = await this.client.query<{ customer: Customer | null }>(
      query,
      { customerAccessToken }
    );

    return response.customer;
  }

  /**
   * Update customer information
   */
  async updateCustomer(
    customerAccessToken: string,
    customer: CustomerUpdateInput
  ): Promise<CustomerUpdatePayload> {
    const mutation = `
      mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
        customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
          customer {
            id
            email
            firstName
            lastName
            displayName
            phone
            acceptsMarketing
            updatedAt
          }
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.client.query<{ customerUpdate: CustomerUpdatePayload }>(
      mutation,
      { customerAccessToken, customer }
    );

    return response.customerUpdate;
  }

  /**
   * Add a new address to customer account
   */
  async createAddress(
    customerAccessToken: string,
    address: MailingAddressInput
  ): Promise<CustomerAddressCreatePayload> {
    const mutation = `
      mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
        customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
          customerAddress {
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
            formatted
          }
          customerUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.client.query<{ customerAddressCreate: CustomerAddressCreatePayload }>(
      mutation,
      { customerAccessToken, address }
    );

    return response.customerAddressCreate;
  }

  /**
   * Update an existing address
   */
  async updateAddress(
    customerAccessToken: string,
    id: string,
    address: MailingAddressInput
  ): Promise<CustomerAddressUpdatePayload> {
    const mutation = `
      mutation customerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
        customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
          customerAddress {
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
            formatted
          }
          customerUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.client.query<{ customerAddressUpdate: CustomerAddressUpdatePayload }>(
      mutation,
      { customerAccessToken, id, address }
    );

    return response.customerAddressUpdate;
  }

  /**
   * Delete an address
   */
  async deleteAddress(
    customerAccessToken: string,
    id: string
  ): Promise<CustomerAddressDeletePayload> {
    const mutation = `
      mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
        customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
          deletedCustomerAddressId
          customerUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.client.query<{ customerAddressDelete: CustomerAddressDeletePayload }>(
      mutation,
      { customerAccessToken, id }
    );

    return response.customerAddressDelete;
  }

  /**
   * Set a default address
   */
  async setDefaultAddress(
    customerAccessToken: string,
    addressId: string
  ): Promise<CustomerUpdatePayload> {
    const mutation = `
      mutation customerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
        customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
          customer {
            id
            defaultAddress {
              id
              formatted
            }
          }
          customerUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.client.query<{ customerDefaultAddressUpdate: CustomerUpdatePayload }>(
      mutation,
      { customerAccessToken, addressId }
    );

    return response.customerDefaultAddressUpdate;
  }

  /**
   * Request password reset
   */
  async recoverPassword(email: string): Promise<CustomerRecoverPayload> {
    const mutation = `
      mutation customerRecover($email: String!) {
        customerRecover(email: $email) {
          customerUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.client.query<{ customerRecover: CustomerRecoverPayload }>(
      mutation,
      { email }
    );

    return response.customerRecover;
  }

  /**
   * Reset password with token
   */
  async resetPassword(input: CustomerResetInput): Promise<CustomerResetPayload> {
    const mutation = `
      mutation customerReset($input: CustomerResetInput!) {
        customerReset(input: $input) {
          customer {
            id
            email
          }
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.client.query<{ customerReset: CustomerResetPayload }>(
      mutation,
      { input }
    );

    return response.customerReset;
  }

  /**
   * Get customer orders
   */
  async getOrders(
    customerAccessToken: string,
    first: number = 10,
    after?: string
  ): Promise<{ orders: CustomerOrder[]; hasNextPage: boolean; endCursor?: string }> {
    const query = `
      query getCustomerOrders($customerAccessToken: String!, $first: Int!, $after: String) {
        customer(customerAccessToken: $customerAccessToken) {
          orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              node {
                id
                orderNumber
                processedAt
                fulfillmentStatus
                financialStatus
                currentTotalPrice {
                  amount
                  currencyCode
                }
                lineItems(first: 50) {
                  edges {
                    node {
                      title
                      quantity
                      variant {
                        id
                        title
                        image {
                          url
                          altText
                        }
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
          }
        }
      }
    `;

    const response = await this.client.query<{
      customer: {
        orders: {
          edges: Array<{ node: CustomerOrder }>;
          pageInfo: { hasNextPage: boolean; endCursor?: string };
        };
      };
    }>(query, { customerAccessToken, first, after });

    return {
      orders: response.customer.orders.edges.map(edge => edge.node),
      hasNextPage: response.customer.orders.pageInfo.hasNextPage,
      endCursor: response.customer.orders.pageInfo.endCursor,
    };
  }

  /**
   * Renew customer access token
   */
  async renewAccessToken(customerAccessToken: string): Promise<CustomerAccessToken | null> {
    const mutation = `
      mutation customerAccessTokenRenew($customerAccessToken: String!) {
        customerAccessTokenRenew(customerAccessToken: $customerAccessToken) {
          customerAccessToken {
            accessToken
            expiresAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.query<{
      customerAccessTokenRenew: {
        customerAccessToken?: CustomerAccessToken;
        userErrors: Array<{ field?: string[]; message: string }>;
      };
    }>(mutation, { customerAccessToken });

    return response.customerAccessTokenRenew.customerAccessToken || null;
  }

  /**
   * Activate customer account
   */
  async activateAccount(
    activationToken: string,
    password: string
  ): Promise<CustomerAccessToken | null> {
    const mutation = `
      mutation customerActivate($activationToken: String!, $password: String!) {
        customerActivate(input: { activationToken: $activationToken, password: $password }) {
          customer {
            id
            email
          }
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.client.query<{
      customerActivate: {
        customer?: Customer;
        customerAccessToken?: CustomerAccessToken;
        customerUserErrors: Array<{ field?: string[]; message: string; code?: string }>;
      };
    }>(mutation, { activationToken, password });

    return response.customerActivate.customerAccessToken || null;
  }
}

// Create singleton instance
export const createCustomerService = (client: ShopifyClient) => {
  return new ShopifyCustomerService(client);
};