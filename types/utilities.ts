/**
 * Advanced TypeScript Utility Types
 * Comprehensive collection of utility types for perfect type safety
 */

// Deep utility types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? DeepReadonlyArray<U>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

export type DeepReadonlyArray<T> = readonly DeepReadonly<T>[];

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartialArray<U>
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

export type DeepPartialArray<T> = Array<DeepPartial<T>>;

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends (infer U)[]
    ? DeepRequiredArray<U>
    : T[P] extends object | undefined
    ? DeepRequired<NonNullable<T[P]>>
    : T[P];
};

export type DeepRequiredArray<T> = Array<DeepRequired<T>>;

// Strict utility types
export type StrictPick<T, K extends keyof T> = Pick<T, K> & {
  [P in Exclude<keyof T, K>]?: never;
};

export type StrictOmit<T, K extends keyof T> = Omit<T, K>;

export type StrictPartial<T> = {
  [P in keyof T]?: T[P] | undefined;
};

export type StrictRequired<T> = {
  [P in keyof T]-?: T[P];
};

// Conditional utility types
export type NonEmptyArray<T> = [T, ...T[]];

export type NonNullable<T> = T extends null | undefined ? never : T;

export type NonEmpty<T> = T extends '' | null | undefined ? never : T;

export type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T;

export type Falsy = false | '' | 0 | null | undefined;

// Object manipulation types
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type ValuesOfType<T, U> = T[KeysOfType<T, U>];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Function utility types
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;

export type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

export type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;

// Result/Error types (discriminated unions)
export type Result<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export type Maybe<T> = T | null | undefined;

export type Either<L, R> =
  | { type: 'left'; value: L }
  | { type: 'right'; value: R };

// API Response types
export type ApiResponse<T> =
  | { status: 'success'; data: T; message?: string }
  | { status: 'error'; data?: never; message: string; code?: string };

export type PaginatedResponse<T> = {
  status: 'success';
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// Validation types
export type ValidationError = {
  field: string;
  message: string;
  code?: string;
};

export type ValidationResult<T> =
  | { valid: true; data: T; errors?: never }
  | { valid: false; data?: never; errors: ValidationError[] };

// State machine types
export type StateValue<T extends Record<string, any>> = keyof T;

export type StateDefinition<T extends Record<string, any>> = {
  [K in keyof T]: {
    on?: Record<string, keyof T>;
    entry?: () => void;
    exit?: () => void;
  };
};

// Brand checking utility
export type IsBranded<T> = T extends { readonly [Symbol.species]: any } ? true : false;

// JSON serialization types
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type ToJson<T> = T extends JsonValue
  ? T
  : T extends { toJSON(): infer U }
  ? U
  : T extends object
  ? { [K in keyof T]: ToJson<T[K]> }
  : never;

// Database/ORM utility types
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

export type WithTimestamps<T> = T & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type WithId<T> = T & { id: string };

// Event types
export type EventPayload<T = unknown> = {
  type: string;
  payload: T;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

// Type-safe environment variables
export type EnvVar<T extends string = string> = T;

// Recursive object paths
export type Path<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? `${K}` | `${K}.${Path<T[K]>}`
    : `${K}`
  : never;

export type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

// Array utilities
export type Head<T extends readonly unknown[]> = T extends readonly [
  infer H,
  ...unknown[]
]
  ? H
  : never;

export type Tail<T extends readonly unknown[]> = T extends readonly [
  unknown,
  ...infer Rest
]
  ? Rest
  : [];

export type Last<T extends readonly unknown[]> = T extends readonly [
  ...unknown[],
  infer L
]
  ? L
  : never;

export type Length<T extends readonly unknown[]> = T['length'];

// String utilities
export type Capitalize<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : S;

export type Uncapitalize<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${Lowercase<First>}${Rest}`
  : S;

// Type predicate utilities
export const isNotNull = <T>(value: T | null): value is T => value !== null;
export const isNotUndefined = <T>(value: T | undefined): value is T => value !== undefined;
export const isNotNullish = <T>(value: T | null | undefined): value is T =>
  value != null;

export const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

export const hasProperty = <T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> => key in obj;

// Assert utility for exhaustive checking
export const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${value}`);
};

// Safe array access
export const safeArrayAccess = <T>(array: T[], index: number): T | undefined =>
  index >= 0 && index < array.length ? array[index] : undefined;

// Type-safe object keys
export const typedKeys = <T extends Record<string, unknown>>(obj: T): Array<keyof T> =>
  Object.keys(obj) as Array<keyof T>;

// Type-safe object entries
export const typedEntries = <T extends Record<string, unknown>>(
  obj: T
): Array<[keyof T, T[keyof T]]> => Object.entries(obj) as Array<[keyof T, T[keyof T]]>;