/**
 * Branded Types for Strike Shop
 * Provides compile-time type safety for different ID types
 * Prevents mixing different types of IDs accidentally
 */

// Branded type utility
export declare const Brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { readonly [Brand]: TBrand };

// ID Branded Types
export type ProductId = Brand<string, 'ProductId'>;
export type VariantId = Brand<string, 'VariantId'>;
export type CartId = Brand<string, 'CartId'>;
export type LineItemId = Brand<string, 'LineItemId'>;
export type UserId = Brand<string, 'UserId'>;
export type CustomerId = Brand<string, 'CustomerId'>;
export type OrderId = Brand<string, 'OrderId'>;
export type CategoryId = Brand<string, 'CategoryId'>;
export type CollectionId = Brand<string, 'CollectionId'>;
export type TagId = Brand<string, 'TagId'>;
export type AddressId = Brand<string, 'AddressId'>;
export type PaymentId = Brand<string, 'PaymentId'>;
export type RegionId = Brand<string, 'RegionId'>;
export type CurrencyCode = Brand<string, 'CurrencyCode'>;
export type CountryCode = Brand<string, 'CountryCode'>;
export type SKU = Brand<string, 'SKU'>;
export type Handle = Brand<string, 'Handle'>;
export type Slug = Brand<string, 'Slug'>;
export type Email = Brand<string, 'Email'>;
export type PhoneNumber = Brand<string, 'PhoneNumber'>;
export type URL = Brand<string, 'URL'>;
export type ImageURL = Brand<string, 'ImageURL'>;

// Numeric branded types
export type Price = Brand<number, 'Price'>;
export type Quantity = Brand<number, 'Quantity'>;
export type Weight = Brand<number, 'Weight'>;
export type Percentage = Brand<number, 'Percentage'>;
export type Timestamp = Brand<number, 'Timestamp'>;

// Date branded types
export type DateISO = Brand<string, 'DateISO'>;
export type CreatedAt = Brand<string, 'CreatedAt'>;
export type UpdatedAt = Brand<string, 'UpdatedAt'>;
export type DeletedAt = Brand<string | null, 'DeletedAt'>;

// Constructor functions for branded types
export const createProductId = (id: string): ProductId => id as ProductId;
export const createVariantId = (id: string): VariantId => id as VariantId;
export const createCartId = (id: string): CartId => id as CartId;
export const createLineItemId = (id: string): LineItemId => id as LineItemId;
export const createUserId = (id: string): UserId => id as UserId;
export const createCustomerId = (id: string): CustomerId => id as CustomerId;
export const createOrderId = (id: string): OrderId => id as OrderId;
export const createCategoryId = (id: string): CategoryId => id as CategoryId;
export const createCollectionId = (id: string): CollectionId => id as CollectionId;
export const createTagId = (id: string): TagId => id as TagId;
export const createAddressId = (id: string): AddressId => id as AddressId;
export const createPaymentId = (id: string): PaymentId => id as PaymentId;
export const createRegionId = (id: string): RegionId => id as RegionId;
export const createCurrencyCode = (code: string): CurrencyCode => code as CurrencyCode;
export const createCountryCode = (code: string): CountryCode => code as CountryCode;
export const createSKU = (sku: string): SKU => sku as SKU;
export const createHandle = (handle: string): Handle => handle as Handle;
export const createSlug = (slug: string): Slug => slug as Slug;
export const createEmail = (email: string): Email => email as Email;
export const createPhoneNumber = (phone: string): PhoneNumber => phone as PhoneNumber;
export const createURL = (url: string): URL => url as URL;
export const createImageURL = (url: string): ImageURL => url as ImageURL;
export const createPrice = (price: number): Price => price as Price;
export const createQuantity = (quantity: number): Quantity => quantity as Quantity;
export const createWeight = (weight: number): Weight => weight as Weight;
export const createPercentage = (percentage: number): Percentage => percentage as Percentage;
export const createTimestamp = (timestamp: number): Timestamp => timestamp as Timestamp;
export const createDateISO = (date: string): DateISO => date as DateISO;
export const createCreatedAt = (date: string): CreatedAt => date as CreatedAt;
export const createUpdatedAt = (date: string): UpdatedAt => date as UpdatedAt;
export const createDeletedAt = (date: string | null): DeletedAt => date as DeletedAt;

// Utility types for branded values
export type BrandedId = 
  | ProductId
  | VariantId
  | CartId
  | LineItemId
  | UserId
  | CustomerId
  | OrderId
  | CategoryId
  | CollectionId
  | AddressId
  | PaymentId
  | RegionId;

// Type guards for branded types
export const isProductId = (value: unknown): value is ProductId => 
  typeof value === 'string';

export const isVariantId = (value: unknown): value is VariantId => 
  typeof value === 'string';

export const isCartId = (value: unknown): value is CartId => 
  typeof value === 'string';

export const isEmail = (value: unknown): value is Email => 
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isPrice = (value: unknown): value is Price => 
  typeof value === 'number' && value >= 0;

export const isQuantity = (value: unknown): value is Quantity => 
  typeof value === 'number' && value >= 0 && Number.isInteger(value);

// Unbrand utility to get the underlying value
export type Unbrand<T> = T extends Brand<infer U, any> ? U : T;

export const unbrand = <T>(value: T): Unbrand<T> => value as Unbrand<T>;