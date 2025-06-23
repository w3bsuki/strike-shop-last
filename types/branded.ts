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
export const ProductId = (id: string): ProductId => id as ProductId;
export const VariantId = (id: string): VariantId => id as VariantId;
export const CartId = (id: string): CartId => id as CartId;
export const LineItemId = (id: string): LineItemId => id as LineItemId;
export const UserId = (id: string): UserId => id as UserId;
export const CustomerId = (id: string): CustomerId => id as CustomerId;
export const OrderId = (id: string): OrderId => id as OrderId;
export const CategoryId = (id: string): CategoryId => id as CategoryId;
export const CollectionId = (id: string): CollectionId => id as CollectionId;
export const AddressId = (id: string): AddressId => id as AddressId;
export const PaymentId = (id: string): PaymentId => id as PaymentId;
export const RegionId = (id: string): RegionId => id as RegionId;
export const CurrencyCode = (code: string): CurrencyCode => code as CurrencyCode;
export const CountryCode = (code: string): CountryCode => code as CountryCode;
export const SKU = (sku: string): SKU => sku as SKU;
export const Handle = (handle: string): Handle => handle as Handle;
export const Slug = (slug: string): Slug => slug as Slug;
export const Email = (email: string): Email => email as Email;
export const PhoneNumber = (phone: string): PhoneNumber => phone as PhoneNumber;
export const URL = (url: string): URL => url as URL;
export const ImageURL = (url: string): ImageURL => url as ImageURL;
export const Price = (price: number): Price => price as Price;
export const Quantity = (quantity: number): Quantity => quantity as Quantity;
export const Weight = (weight: number): Weight => weight as Weight;
export const Percentage = (percentage: number): Percentage => percentage as Percentage;
export const Timestamp = (timestamp: number): Timestamp => timestamp as Timestamp;
export const DateISO = (date: string): DateISO => date as DateISO;
export const CreatedAt = (date: string): CreatedAt => date as CreatedAt;
export const UpdatedAt = (date: string): UpdatedAt => date as UpdatedAt;
export const DeletedAt = (date: string | null): DeletedAt => date as DeletedAt;

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