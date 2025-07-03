/**
 * Comprehensive TypeScript types for Shopify Storefront API
 * Based on Shopify Storefront API 2025-04
 */

// ============================================
// Base Types & Enums
// ============================================

export type ShopifyID = string;

export enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  JPY = 'JPY',
  // Add more as needed
}

export enum CountryCode {
  US = 'US',
  CA = 'CA',
  GB = 'GB',
  DE = 'DE',
  FR = 'FR',
  JP = 'JP',
  // Add more as needed
}

export enum ProductSortKey {
  TITLE = 'TITLE',
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
  PRICE = 'PRICE',
  BEST_SELLING = 'BEST_SELLING',
  RELEVANCE = 'RELEVANCE',
}

export enum CollectionSortKey {
  TITLE = 'TITLE',
  UPDATED_AT = 'UPDATED_AT',
  RELEVANCE = 'RELEVANCE',
}

export enum MediaContentType {
  EXTERNAL_VIDEO = 'EXTERNAL_VIDEO',
  IMAGE = 'IMAGE',
  MODEL_3D = 'MODEL_3D',
  VIDEO = 'VIDEO',
}

export enum ProductMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  MODEL_3D = 'MODEL_3D',
  EXTERNAL_VIDEO = 'EXTERNAL_VIDEO',
}

export enum OrderFulfillmentStatus {
  FULFILLED = 'FULFILLED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  OPEN = 'OPEN',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  PENDING_FULFILLMENT = 'PENDING_FULFILLMENT',
  RESTOCKED = 'RESTOCKED',
  SCHEDULED = 'SCHEDULED',
  UNFULFILLED = 'UNFULFILLED',
}

export enum OrderFinancialStatus {
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  PENDING = 'PENDING',
  REFUNDED = 'REFUNDED',
  VOIDED = 'VOIDED',
}

// ============================================
// Common Types
// ============================================

export interface MoneyV2 {
  amount: string;
  currencyCode: CurrencyCode;
}

export interface Image {
  id?: ShopifyID;
  url: string;
  altText?: string | null;
  width?: number;
  height?: number;
}

export interface SEO {
  title?: string | null;
  description?: string | null;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductOption {
  id: ShopifyID;
  name: string;
  values: string[];
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

// ============================================
// Metafield Types
// ============================================

export interface Metafield {
  id: ShopifyID;
  namespace: string;
  key: string;
  value: string;
  type: string;
  description?: string | null;
  reference?: MetafieldReference | null;
}

export interface MetafieldReference {
  __typename: string;
  [key: string]: any;
}

export interface MetafieldFilter {
  namespace: string;
  key: string;
}

// ============================================
// Media Types
// ============================================

export interface MediaImage {
  __typename: 'MediaImage';
  id: ShopifyID;
  image: Image;
  mediaContentType: MediaContentType;
  alt?: string | null;
  previewImage?: Image;
}

export interface Video {
  __typename: 'Video';
  id: ShopifyID;
  mediaContentType: MediaContentType;
  alt?: string | null;
  previewImage?: Image;
  sources: VideoSource[];
}

export interface VideoSource {
  url: string;
  mimeType: string;
  format: string;
  height: number;
  width: number;
}

export interface Model3d {
  __typename: 'Model3d';
  id: ShopifyID;
  mediaContentType: MediaContentType;
  alt?: string | null;
  previewImage?: Image;
  sources: Model3dSource[];
}

export interface Model3dSource {
  url: string;
  mimeType: string;
  format: string;
  filesize: number;
}

export interface ExternalVideo {
  __typename: 'ExternalVideo';
  id: ShopifyID;
  mediaContentType: MediaContentType;
  alt?: string | null;
  previewImage?: Image;
  host: string;
  embeddedUrl: string;
}

export type Media = MediaImage | Video | Model3d | ExternalVideo;

// ============================================
// Product Types
// ============================================

export interface ProductVariant {
  id: ShopifyID;
  title: string;
  availableForSale: boolean;
  selectedOptions: SelectedOption[];
  price: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
  sku?: string | null;
  barcode?: string | null;
  weight?: number | null;
  weightUnit?: string | null;
  quantityAvailable?: number | null;
  requiresShipping: boolean;
  image?: Image | null;
  metafields: Connection<Metafield>;
  product: Product;
}

export interface ProductPriceRange {
  minVariantPrice: MoneyV2;
  maxVariantPrice: MoneyV2;
}

export interface Product {
  id: ShopifyID;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  onlineStoreUrl?: string | null;
  options: ProductOption[];
  images: Connection<Image>;
  media: Connection<Media>;
  variants: Connection<ProductVariant>;
  priceRange: ProductPriceRange;
  compareAtPriceRange: ProductPriceRange;
  availableForSale: boolean;
  seo: SEO;
  metafields: Connection<Metafield>;
  collections: Connection<Collection>;
  totalInventory?: number | null;
}

// ============================================
// Collection Types
// ============================================

export interface Collection {
  id: ShopifyID;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  image?: Image | null;
  products: Connection<Product>;
  seo: SEO;
  updatedAt: string;
  metafields: Connection<Metafield>;
}

// ============================================
// Cart & Checkout Types
// ============================================

export interface CartLine {
  id: ShopifyID;
  quantity: number;
  merchandise: ProductVariant;
  attributes: Attribute[];
  cost: {
    totalAmount: MoneyV2;
    subtotalAmount: MoneyV2;
    compareAtAmountPerQuantity?: MoneyV2 | null;
  };
  discountAllocations: CartDiscountAllocation[];
}

export interface Attribute {
  key: string;
  value: string;
}

export interface CartDiscountAllocation {
  discountedAmount: MoneyV2;
  discountCode?: CartDiscountCode;
  automaticDiscount?: CartAutomaticDiscountAllocation;
}

export interface CartDiscountCode {
  code: string;
  applicable: boolean;
}

export interface CartAutomaticDiscountAllocation {
  title: string;
  discountedAmount: MoneyV2;
}

export interface CartBuyerIdentity {
  email?: string | null;
  phone?: string | null;
  customer?: Customer | null;
  countryCode?: CountryCode | null;
  deliveryAddressPreferences?: DeliveryAddress[];
}

export interface DeliveryAddress {
  deliveryAddress?: MailingAddress;
}

export interface Cart {
  id: ShopifyID;
  checkoutUrl: string;
  createdAt: string;
  updatedAt: string;
  totalQuantity: number;
  lines: Connection<CartLine>;
  attributes: Attribute[];
  discountCodes: CartDiscountCode[];
  buyerIdentity: CartBuyerIdentity;
  note?: string | null;
  cost: {
    totalAmount: MoneyV2;
    subtotalAmount: MoneyV2;
    // Note: totalTaxAmount and totalDutyAmount deprecated in 2025-01
  };
  discountAllocations: CartDiscountAllocation[];
}

// 2025-01 API: New CartDelivery interface with addresses field
export interface CartDelivery {
  addresses: DeliveryAddress[];
}

export interface DeliveryAddress {
  id: ShopifyID;
  address: MailingAddress;
  isDefault: boolean;
}

export interface CartLineInput {
  merchandiseId: ShopifyID;
  quantity: number;
  attributes?: AttributeInput[];
}

export interface CartLineUpdateInput {
  id: ShopifyID;
  quantity?: number;
  merchandiseId?: ShopifyID;
  attributes?: AttributeInput[];
}

export interface AttributeInput {
  key: string;
  value: string;
}

export interface CartInput {
  lines?: CartLineInput[];
  discountCodes?: string[];
  note?: string;
  buyerIdentity?: CartBuyerIdentityInput;
  attributes?: AttributeInput[];
}

export interface CartBuyerIdentityInput {
  email?: string;
  phone?: string;
  customerAccessToken?: string;
  countryCode?: CountryCode;
  deliveryAddressPreferences?: DeliveryAddressInput[];
}

export interface DeliveryAddressInput {
  deliveryAddress?: MailingAddressInput;
}

// ============================================
// Customer Types
// ============================================

export interface Customer {
  id: ShopifyID;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName: string;
  acceptsMarketing: boolean;
  createdAt: string;
  updatedAt: string;
  orders: Connection<Order>;
  addresses: Connection<MailingAddress>;
  defaultAddress?: MailingAddress | null;
  tags: string[];
  metafields: Connection<Metafield>;
}

export interface CustomerAccessToken {
  accessToken: string;
  expiresAt: string;
}

export interface CustomerUserError {
  field?: string[] | null;
  message: string;
  code?: string | null;
}

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

// ============================================
// Address Types
// ============================================

export interface MailingAddress {
  id?: ShopifyID;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  company?: string | null;
  country?: string | null;
  countryCodeV2?: CountryCode | null;
  firstName?: string | null;
  lastName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
  phone?: string | null;
  province?: string | null;
  provinceCode?: string | null;
  zip?: string | null;
  formatted: string[];
  formattedArea?: string | null;
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

// ============================================
// Order Types
// ============================================

export interface Order {
  id: ShopifyID;
  name: string;
  orderNumber: number;
  processedAt: string;
  fulfillmentStatus: OrderFulfillmentStatus;
  financialStatus?: OrderFinancialStatus | null;
  totalPrice: MoneyV2;
  subtotalPrice?: MoneyV2 | null;
  totalShippingPrice: MoneyV2;
  totalTax?: MoneyV2 | null;
  totalRefunded: MoneyV2;
  currencyCode: CurrencyCode;
  customerUrl?: string | null;
  shippingAddress?: MailingAddress | null;
  billingAddress?: MailingAddress | null;
  lineItems: Connection<OrderLineItem>;
  fulfillments: OrderFulfillment[];
  metafields: Connection<Metafield>;
  statusUrl: string;
  email?: string | null;
  phone?: string | null;
}

export interface OrderLineItem {
  id: ShopifyID;
  title: string;
  quantity: number;
  variant?: ProductVariant | null;
  customAttributes: Attribute[];
  discountAllocations: OrderLineItemDiscountAllocation[];
  originalTotalPrice: MoneyV2;
  discountedTotalPrice: MoneyV2;
}

export interface OrderLineItemDiscountAllocation {
  allocatedAmount: MoneyV2;
  discountApplication: DiscountApplication;
}

export interface DiscountApplication {
  targetType: string;
  value: MoneyV2 | DiscountPercentage;
  allocationMethod?: string;
  targetSelection?: string;
}

export interface DiscountPercentage {
  percentage: number;
}

export interface OrderFulfillment {
  trackingCompany?: string | null;
  trackingInfo: FulfillmentTrackingInfo[];
  fulfillmentLineItems: Connection<FulfillmentLineItem>;
}

export interface FulfillmentTrackingInfo {
  number?: string | null;
  url?: string | null;
}

export interface FulfillmentLineItem {
  lineItem: OrderLineItem;
  quantity: number;
}

// ============================================
// Shop Types
// ============================================

export interface Shop {
  id: ShopifyID;
  name: string;
  description?: string | null;
  primaryDomain: Domain;
  privacyPolicy?: ShopPolicy | null;
  refundPolicy?: ShopPolicy | null;
  termsOfService?: ShopPolicy | null;
  shippingPolicy?: ShopPolicy | null;
  moneyFormat: string;
  paymentSettings: PaymentSettings;
  shipsToCountries: CountryCode[];
  metafields: Connection<Metafield>;
}

export interface Domain {
  host: string;
  sslEnabled: boolean;
  url: string;
}

export interface ShopPolicy {
  id: ShopifyID;
  title: string;
  handle: string;
  body: string;
  url: string;
}

export interface PaymentSettings {
  supportedDigitalWallets: string[];
  cardVaultUrl?: string | null;
  countryCode: CountryCode;
  currencyCode: CurrencyCode;
  enabledPresentmentCurrencies: CurrencyCode[];
  shopifyPaymentAccountId?: string | null;
}

// ============================================
// Search & Filter Types
// ============================================

export interface SearchResultItem {
  __typename: 'Product' | 'Article' | 'Collection' | 'Page';
  id: ShopifyID;
  handle: string;
  title: string;
  // Add type-specific fields as needed
}

export interface ProductFilter {
  available?: boolean;
  variantOption?: VariantOptionFilter;
  productType?: string;
  productVendor?: string;
  price?: PriceRangeFilter;
  productMetafield?: MetafieldFilter;
  variantMetafield?: MetafieldFilter;
  tag?: string;
}

export interface VariantOptionFilter {
  name: string;
  value: string;
}

export interface PriceRangeFilter {
  min?: number;
  max?: number;
}

// ============================================
// Mutation Response Types
// ============================================

export interface CartCreatePayload {
  cart?: Cart | null;
  userErrors: CartUserError[];
}

export interface CartLinesAddPayload {
  cart?: Cart | null;
  userErrors: CartUserError[];
}

export interface CartLinesUpdatePayload {
  cart?: Cart | null;
  userErrors: CartUserError[];
}

export interface CartLinesRemovePayload {
  cart?: Cart | null;
  userErrors: CartUserError[];
}

export interface CartUserError {
  field?: string[] | null;
  message: string;
  code?: string | null;
}

export interface CustomerCreatePayload {
  customer?: Customer | null;
  customerUserErrors: CustomerUserError[];
  customerAccessToken?: CustomerAccessToken | null;
}

export interface CustomerAccessTokenCreatePayload {
  customerAccessToken?: CustomerAccessToken | null;
  customerUserErrors: CustomerUserError[];
}

export interface CustomerUpdatePayload {
  customer?: Customer | null;
  customerUserErrors: CustomerUserError[];
  customerAccessToken?: CustomerAccessToken | null;
}

export interface CustomerAddressCreatePayload {
  customerAddress?: MailingAddress | null;
  customerUserErrors: CustomerUserError[];
}

export interface CustomerAddressUpdatePayload {
  customerAddress?: MailingAddress | null;
  customerUserErrors: CustomerUserError[];
}

export interface CustomerAddressDeletePayload {
  customerUserErrors: CustomerUserError[];
  deletedCustomerAddressId?: string | null;
}

// ============================================
// Re-export Customer Types
// ============================================

export * from './types/customer';

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Maybe<T> = T | null | undefined;

export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: string;
  Decimal: string;
  HTML: string;
  JSON: string;
  URL: string;
};

// ============================================
// GraphQL Fragment Types
// ============================================

export interface ProductFragment {
  id: ShopifyID;
  handle: string;
  title: string;
  vendor: string;
  tags: string[];
  priceRange: ProductPriceRange;
  images: Connection<Image>;
  variants: Connection<ProductVariant>;
}

export interface CollectionFragment {
  id: ShopifyID;
  handle: string;
  title: string;
  description: string;
  image?: Image | null;
}

export interface CartFragment {
  id: ShopifyID;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: MoneyV2;
    subtotalAmount: MoneyV2;
  };
  lines: Connection<CartLine>;
}

// ============================================
// Query Variables Types
// ============================================

export interface ProductQueryVariables {
  handle?: string;
  id?: ShopifyID;
  includeMetafields?: boolean;
  metafieldIdentifiers?: MetafieldFilter[];
}

export interface CollectionQueryVariables {
  handle?: string;
  id?: ShopifyID;
  productsFirst?: number;
  productFilters?: ProductFilter[];
  productSortKey?: ProductSortKey;
  reverse?: boolean;
}

export interface CartQueryVariables {
  cartId: ShopifyID;
  numCartLines?: number;
}

export interface SearchQueryVariables {
  query: string;
  first?: number;
  after?: string;
  productFilters?: ProductFilter[];
  sortKey?: ProductSortKey;
  reverse?: boolean;
}