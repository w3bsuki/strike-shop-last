/**
 * Central Types Export
 * Perfect TypeScript Architecture - All types accessible from one place
 */

// Core branded types
export type {
  ProductId, VariantId, CartId, LineItemId, UserId, CustomerId,
  OrderId, CategoryId, Email, Price, Quantity, CurrencyCode
} from './branded';

// Branded type constructors (only from branded.ts)
export {
  createProductId, createVariantId, createCartId, createLineItemId,
  createUserId, createCustomerId, createOrderId, createCategoryId,
  createEmail, createPrice, createQuantity, createCurrencyCode,
  createImageURL, createSlug, createSKU
} from './branded';

// Advanced utility types
export type {
  DeepReadonly, DeepPartial, DeepRequired,
  StrictPick, StrictOmit, StrictPartial, StrictRequired,
  Prettify, UnionToIntersection, NonEmptyArray,
  ApiResponse, Result, ValidationResult
} from './utilities';

// Runtime type guards (only from guards.ts)
export {
  isString, isNumber, isBoolean, isObject, isArray,
  isNull, isUndefined, isNullish, isNonNullish,
  isDate, isDateString, isValidEmail, isValidUrl,
  isValidId, isPositiveNumber, isNonNegativeNumber,
  isInteger, isPositiveInteger,
  isApiSuccessResponse, isApiErrorResponse,
  isSuccess, isFailure, isValidationSuccess, isValidationFailure,
  isCartItem, isUser, isProduct, isError, isErrorWithMessage
} from './guards';

// Business domain types
export * from './store';
export * from './medusa';
export * from './sanity';
export * from './integrated';
export * from './home-page';
export * from './medusa-api';

// Built-in utility types are available globally, no need to re-export

// Type-only imports for complex dependencies
export type { NextRequest, NextResponse } from 'next/server';
export type { Metadata } from 'next';

// Common type aliases for consistency
export type AnyObject = Record<string, unknown>;
export type AnyFunction = (...args: any[]) => any;
export type AnyAsyncFunction = (...args: any[]) => Promise<any>;
export type AnyArray = unknown[];
export type EmptyObject = Record<string, never>;

// Common generic constraints
export type StringKeyed<T = unknown> = Record<string, T>;
export type NumberKeyed<T = unknown> = Record<number, T>;
export type SymbolKeyed<T = unknown> = Record<symbol, T>;

// Commonly used intersection types
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type WithReadonly<T, K extends keyof T> = Omit<T, K> & Readonly<Pick<T, K>>;

// Event and callback types
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;

// Promise and async utilities
export type PromiseType<T> = T extends Promise<infer U> ? U : T;
export type MaybePromise<T> = T | Promise<T>;

// Common HTTP types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
export type HttpStatus = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503;

// Common component prop patterns
export type WithChildren<T = {}> = T & { children?: React.ReactNode };
export type WithClassName<T = {}> = T & { className?: string };
export type WithStyle<T = {}> = T & { style?: React.CSSProperties };
export type WithTestId<T = {}> = T & { 'data-testid'?: string };

// Form and input types
export type FormValue = string | number | boolean | File | null | undefined;
export type FormData = Record<string, FormValue>;
export type FormErrors = Record<string, string>;
export type FormSubmitHandler<T = FormData> = (data: T) => void | Promise<void>;

// Loading and error states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type AsyncState<T, E = Error> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

// Pagination types
export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedData<T> = {
  items: T[];
  pagination: PaginationInfo;
};

// Sort and filter types
export type SortDirection = 'asc' | 'desc';
export type SortOption<T extends string = string> = {
  field: T;
  direction: SortDirection;
};

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
export type FilterCondition<T = unknown> = {
  field: string;
  operator: FilterOperator;
  value: T;
};

export type QueryOptions<T extends string = string> = {
  page?: number;
  limit?: number;
  sort?: SortOption<T>[];
  filters?: FilterCondition[];
  search?: string;
};

// Cache types
export type CacheKey = string | number | symbol;
export type CacheValue<T = unknown> = {
  data: T;
  timestamp: number;
  ttl?: number;
};

export type CacheStore<T = unknown> = Map<CacheKey, CacheValue<T>>;

// Feature flag types
export type FeatureFlag = {
  key: string;
  enabled: boolean;
  variants?: Record<string, unknown>;
};

export type FeatureFlags = Record<string, FeatureFlag>;

// Metrics and analytics types
export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
};

export type MetricValue = number | string | boolean;
export type Metrics = Record<string, MetricValue>;

// Configuration types
export type EnvironmentConfig = {
  NODE_ENV: 'development' | 'staging' | 'production';
  API_URL: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  JWT_SECRET?: string;
  [key: string]: string | undefined;
};

// Database types
export type DatabaseRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type DatabaseQuery<T = unknown> = {
  where?: Partial<T>;
  orderBy?: Array<{ field: keyof T; direction: SortDirection }>;
  limit?: number;
  offset?: number;
  include?: string[];
};

// API types
export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiSuccess<T> = {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
};

export type ApiResult<T> = ApiSuccess<T> | { error: ApiError };

// Webhook types
export type WebhookEvent<T = unknown> = {
  id: string;
  type: string;
  data: T;
  timestamp: string;
  source: string;
};

export type WebhookHandler<T = unknown> = (event: WebhookEvent<T>) => Promise<void>;

// Job/Queue types
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type Job<T = unknown> = {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
};

// Search types
export type SearchResult<T = unknown> = {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
};

export type SearchResponse<T = unknown> = {
  results: SearchResult<T>[];
  total: number;
  query: string;
  took: number;
};

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
};

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
};

export type Theme = {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: Record<string, React.CSSProperties>;
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
};

// Internationalization types
export type Locale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';
export type TranslationKey = string;
export type Translations = Record<TranslationKey, string>;
export type LocaleTranslations = Record<Locale, Translations>;

// Media types
export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif' | 'svg';
export type VideoFormat = 'mp4' | 'webm' | 'ogg';
export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'aac';

export type MediaFile = {
  url: string;
  format: ImageFormat | VideoFormat | AudioFormat;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  alt?: string;
};

// Geolocation types
export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Address = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: Coordinates;
};

// Currency and pricing types
export type Currency = {
  code: string;
  symbol: string;
  name: string;
  decimalDigits: number;
};

export type Money = {
  amount: number;
  currency: Currency;
};

export type PriceRange = {
  min: Money;
  max: Money;
};

// Time and date utilities
export type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
export type Duration = {
  value: number;
  unit: TimeUnit;
};

export type DateRange = {
  start: Date;
  end: Date;
};

// Performance types
export type PerformanceMetric = {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
};

export type PerformanceReport = {
  metrics: PerformanceMetric[];
  summary: Record<string, number>;
  recommendations?: string[];
};