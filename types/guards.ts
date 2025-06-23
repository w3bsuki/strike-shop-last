/**
 * Type Guards for Runtime Type Safety
 * Comprehensive type checking utilities with perfect TypeScript integration
 */

import type {
  ProductId, VariantId, CartId, LineItemId, UserId, CustomerId, 
  OrderId, CategoryId, Email, Price, Quantity, CurrencyCode
} from './branded';
import type { ApiResponse, Result, ValidationResult } from './utilities';

// Basic type guards
export const isString = (value: unknown): value is string => 
  typeof value === 'string';

export const isNumber = (value: unknown): value is number => 
  typeof value === 'number' && !Number.isNaN(value);

export const isBoolean = (value: unknown): value is boolean => 
  typeof value === 'boolean';

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isArray = <T>(value: unknown, guard?: (item: unknown) => item is T): value is T[] => {
  if (!Array.isArray(value)) return false;
  if (!guard) return true;
  return value.every(guard);
};

export const isNull = (value: unknown): value is null => value === null;

export const isUndefined = (value: unknown): value is undefined => value === undefined;

export const isNullish = (value: unknown): value is null | undefined => 
  value == null;

export const isNonNullish = <T>(value: T | null | undefined): value is T => 
  value != null;

// Date guards
export const isDate = (value: unknown): value is Date => 
  value instanceof Date && !Number.isNaN(value.getTime());

export const isDateString = (value: unknown): value is string =>
  isString(value) && !Number.isNaN(Date.parse(value));

// Email validation guard
export const isValidEmail = (value: unknown): value is Email => {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

// URL validation guard
export const isValidUrl = (value: unknown): value is string => {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// ID validation guards (for branded types)
export const isValidId = (value: unknown): value is string =>
  isString(value) && value.length > 0;

export const isProductId = (value: unknown): value is ProductId =>
  isValidId(value);

export const isVariantId = (value: unknown): value is VariantId =>
  isValidId(value);

export const isCartId = (value: unknown): value is CartId =>
  isValidId(value);

export const isLineItemId = (value: unknown): value is LineItemId =>
  isValidId(value);

export const isUserId = (value: unknown): value is UserId =>
  isValidId(value);

export const isCustomerId = (value: unknown): value is CustomerId =>
  isValidId(value);

export const isOrderId = (value: unknown): value is OrderId =>
  isValidId(value);

export const isCategoryId = (value: unknown): value is CategoryId =>
  isValidId(value);

// Numeric validation guards
export const isPositiveNumber = (value: unknown): value is number =>
  isNumber(value) && value > 0;

export const isNonNegativeNumber = (value: unknown): value is number =>
  isNumber(value) && value >= 0;

export const isInteger = (value: unknown): value is number =>
  isNumber(value) && Number.isInteger(value);

export const isPositiveInteger = (value: unknown): value is number =>
  isInteger(value) && value > 0;

export const isPrice = (value: unknown): value is Price =>
  isNonNegativeNumber(value);

export const isQuantity = (value: unknown): value is Quantity =>
  isPositiveInteger(value);

// Currency code validation
export const isCurrencyCode = (value: unknown): value is CurrencyCode => {
  if (!isString(value)) return false;
  // ISO 4217 currency codes are 3 uppercase letters
  return /^[A-Z]{3}$/.test(value);
};

// Object structure guards
export const hasProperty = <T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> => 
  key in obj;

export const hasStringProperty = <T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, string> =>
  hasProperty(obj, key) && isString(obj[key]);

export const hasNumberProperty = <T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, number> =>
  hasProperty(obj, key) && isNumber(obj[key]);

export const hasBooleanProperty = <T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, boolean> =>
  hasProperty(obj, key) && isBoolean(obj[key]);

// API Response guards
export const isApiSuccessResponse = <T>(
  response: unknown
): response is ApiResponse<T> & { status: 'success' } =>
  isObject(response) &&
  hasStringProperty(response, 'status') &&
  response.status === 'success' &&
  hasProperty(response, 'data');

export const isApiErrorResponse = (
  response: unknown
): response is ApiResponse<never> & { status: 'error' } =>
  isObject(response) &&
  hasStringProperty(response, 'status') &&
  response.status === 'error' &&
  hasStringProperty(response, 'message');

// Result type guards
export const isSuccess = <T, E>(result: Result<T, E>): result is { success: true; data: T } =>
  isObject(result) && 
  hasBooleanProperty(result, 'success') && 
  result.success === true &&
  hasProperty(result, 'data');

export const isFailure = <T, E>(result: Result<T, E>): result is { success: false; error: E } =>
  isObject(result) && 
  hasBooleanProperty(result, 'success') && 
  result.success === false &&
  hasProperty(result, 'error');

// Validation result guards
export const isValidationSuccess = <T>(
  result: ValidationResult<T>
): result is { valid: true; data: T } =>
  isObject(result) &&
  hasBooleanProperty(result, 'valid') &&
  result.valid === true &&
  hasProperty(result, 'data');

export const isValidationFailure = <T>(
  result: ValidationResult<T>
): result is { valid: false; errors: Array<{ field: string; message: string }> } =>
  isObject(result) &&
  hasBooleanProperty(result, 'valid') &&
  result.valid === false &&
  hasProperty(result, 'errors') &&
  isArray(result.errors);

// Complex object guards for business domain
export const isCartItem = (value: unknown): value is {
  id: string;
  lineItemId: string;
  variantId: string;
  name: string;
  quantity: number;
  image: string | null;
} =>
  isObject(value) &&
  hasStringProperty(value, 'id') &&
  hasStringProperty(value, 'lineItemId') &&
  hasStringProperty(value, 'variantId') &&
  hasStringProperty(value, 'name') &&
  hasNumberProperty(value, 'quantity') &&
  hasProperty(value, 'image') &&
  (isString(value.image) || isNull(value.image));

export const isUser = (value: unknown): value is {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
} =>
  isObject(value) &&
  hasStringProperty(value, 'id') &&
  hasStringProperty(value, 'email') &&
  isValidEmail(value.email);

export const isProduct = (value: unknown): value is {
  id: string;
  title: string;
  handle: string | null;
  description: string | null;
  images: Array<{ url: string }>;
} =>
  isObject(value) &&
  hasStringProperty(value, 'id') &&
  hasStringProperty(value, 'title') &&
  hasProperty(value, 'handle') &&
  (isString(value.handle) || isNull(value.handle)) &&
  hasProperty(value, 'description') &&
  (isString(value.description) || isNull(value.description)) &&
  hasProperty(value, 'images') &&
  isArray(value.images, (item): item is { url: string } =>
    isObject(item) && hasStringProperty(item, 'url')
  );

// Environment variable guards
export const isEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!isString(value) || value.length === 0) {
    throw new Error(`Environment variable ${key} is not set or empty`);
  }
  return value;
};

export const isOptionalEnvVar = (key: string): string | undefined => {
  const value = process.env[key];
  return isString(value) && value.length > 0 ? value : undefined;
};

// Form data validation guards
export const isFormData = (value: unknown): value is FormData =>
  value instanceof FormData;

export const isFile = (value: unknown): value is File =>
  value instanceof File;

export const isBlob = (value: unknown): value is Blob =>
  value instanceof Blob;

// Status guards for business logic
export const isOrderStatus = (value: unknown): value is 
  'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' =>
  isString(value) && 
  ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    .includes(value);

export const isPaymentStatus = (value: unknown): value is 
  'not_paid' | 'awaiting' | 'captured' | 'partially_refunded' | 'refunded' | 'canceled' =>
  isString(value) && 
  ['not_paid', 'awaiting', 'captured', 'partially_refunded', 'refunded', 'canceled']
    .includes(value);

// Error guards for error handling
export const isError = (value: unknown): value is Error =>
  value instanceof Error;

export const isErrorWithMessage = (value: unknown): value is { message: string } =>
  isObject(value) && hasStringProperty(value, 'message');

export const isErrorWithCode = (value: unknown): value is { code: string; message: string } =>
  isErrorWithMessage(value) && hasStringProperty(value, 'code');

// Network response guards
export const isResponse = (value: unknown): value is Response =>
  value instanceof Response;

export const isOkResponse = (response: Response): boolean =>
  response.ok && response.status >= 200 && response.status < 300;

// Promise guards
export const isPromise = <T>(value: unknown): value is Promise<T> =>
  value instanceof Promise;

// Function guards
export const isFunction = (value: unknown): value is Function =>
  typeof value === 'function';

export const isAsyncFunction = (value: unknown): value is (...args: any[]) => Promise<any> =>
  isFunction(value) && value.constructor.name === 'AsyncFunction';

// Advanced guards for nested structures
export const isArrayOfStrings = (value: unknown): value is string[] =>
  isArray(value, isString);

export const isArrayOfNumbers = (value: unknown): value is number[] =>
  isArray(value, isNumber);

export const isArrayOfObjects = (value: unknown): value is Record<string, unknown>[] =>
  isArray(value, isObject);

// Type assertion helpers (use with caution)
export const assertIsString = (value: unknown): asserts value is string => {
  if (!isString(value)) {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }
};

export const assertIsNumber = (value: unknown): asserts value is number => {
  if (!isNumber(value)) {
    throw new TypeError(`Expected number, got ${typeof value}`);
  }
};

export const assertIsObject = (value: unknown): asserts value is Record<string, unknown> => {
  if (!isObject(value)) {
    throw new TypeError(`Expected object, got ${typeof value}`);
  }
};

// Discriminated union guards
export const isLoadingState = (value: { status: string }): value is { status: 'loading' } =>
  value.status === 'loading';

export const isSuccessState = <T>(value: { status: string; data?: T }): value is { status: 'success'; data: T } =>
  value.status === 'success' && hasProperty(value, 'data');

export const isErrorState = (value: { status: string; error?: unknown }): value is { status: 'error'; error: unknown } =>
  value.status === 'error' && hasProperty(value, 'error');