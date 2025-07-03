// Shopify Customer API Types

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  phone?: string;
  acceptsMarketing: boolean;
  createdAt: string;
  updatedAt: string;
  defaultAddress?: CustomerAddress;
  addresses: {
    edges: Array<{
      node: CustomerAddress;
    }>;
  };
  orders: {
    edges: Array<{
      node: CustomerOrder;
    }>;
  };
}

export interface CustomerAddress {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
  formatted: string[];
}

export interface CustomerOrder {
  id: string;
  orderNumber: number;
  processedAt: string;
  fulfillmentStatus: string;
  financialStatus: string;
  currentTotalPrice: {
    amount: string;
    currencyCode: string;
  };
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        variant: {
          id: string;
          title: string;
          image?: {
            url: string;
            altText?: string;
          };
        };
      };
    }>;
  };
}

export interface CustomerAccessToken {
  accessToken: string;
  expiresAt: string;
}

export interface CustomerUserError {
  field?: string[];
  message: string;
  code?: string;
}

// Mutation Payloads
export interface CustomerAccessTokenCreatePayload {
  customerAccessToken?: CustomerAccessToken;
  customerUserErrors: CustomerUserError[];
}

export interface CustomerCreatePayload {
  customer?: Customer;
  customerAccessToken?: CustomerAccessToken;
  customerUserErrors: CustomerUserError[];
}

export interface CustomerUpdatePayload {
  customer?: Customer;
  customerAccessToken?: CustomerAccessToken;
  customerUserErrors: CustomerUserError[];
}

export interface CustomerAddressCreatePayload {
  customerAddress?: CustomerAddress;
  customerUserErrors: CustomerUserError[];
}

export interface CustomerAddressUpdatePayload {
  customerAddress?: CustomerAddress;
  customerUserErrors: CustomerUserError[];
}

export interface CustomerAddressDeletePayload {
  deletedCustomerAddressId?: string;
  customerUserErrors: CustomerUserError[];
}

export interface CustomerResetPayload {
  customer?: Customer;
  customerAccessToken?: CustomerAccessToken;
  customerUserErrors: CustomerUserError[];
}

export interface CustomerRecoverPayload {
  customerUserErrors: CustomerUserError[];
}

// Input Types
export interface CustomerCreateInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

export interface CustomerUpdateInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

export interface CustomerAccessTokenCreateInput {
  email: string;
  password: string;
}

export interface MailingAddressInput {
  address1?: string;
  address2?: string;
  city?: string;
  company?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  province?: string;
  zip?: string;
}

export interface CustomerResetInput {
  resetToken: string;
  password: string;
}

export interface CustomerActivateInput {
  activationToken: string;
  password: string;
}