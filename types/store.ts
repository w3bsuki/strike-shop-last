// Store type definitions for Strike Shop
import type { 
  CartId, LineItemId, VariantId, ProductId, UserId, 
  Price, Quantity, ImageURL, Slug, SKU, OrderId 
} from './branded';

// Cart types with branded IDs
export interface CartState {
  cartId: CartId | null;
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface CartItem {
  id: ProductId;
  lineItemId: LineItemId;
  variantId: VariantId;
  name: string;
  slug: Slug;
  size: string;
  sku?: SKU;
  quantity: Quantity;
  image: ImageURL | null;
  pricing: CartItemPricing;
}

export interface CartItemPricing {
  unitPrice: Price;
  unitSalePrice?: Price;
  totalPrice: Price;
  displayUnitPrice: string;
  displayUnitSalePrice?: string;
  displayTotalPrice: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface User {
  id: UserId;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  addresses: Address[];
  orders: Order[];
  isAdmin?: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Address {
  id: string;
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
  isDefault: boolean;
}

export interface Order {
  id: OrderId;
  displayId: string;
  status: OrderStatus;
  total: Price;
  currency: string;
  createdAt: Date;
  items: Quantity;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

// Wishlist types
export interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
}

export interface WishlistItem {
  id: ProductId;
  productId: ProductId;
  variantId: VariantId;
  name: string;
  slug: Slug;
  image: ImageURL | null;
  price: Price;
  displayPrice: string;
  addedAt: Date;
}

// UI State types
export interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  quickViewProduct: string | null;
  activeModal: ModalType | null;
}

export type ModalType =
  | 'auth'
  | 'size-guide'
  | 'quick-view'
  | 'newsletter'
  | 'location'
  | null;

// Notification types
export interface NotificationState {
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: NotificationAction;
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

// Filter types
export interface FilterState {
  category?: string;
  size?: string[];
  color?: string[];
  priceRange?: [number, number];
  sortBy?: SortOption;
  inStock?: boolean;
}

export type SortOption =
  | 'relevance'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'best-selling';

// Search types
export interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  suggestions: string[];
}

export interface SearchResult {
  id: string;
  type: 'product' | 'category' | 'collection';
  title: string;
  subtitle?: string;
  url: string;
  image?: ImageURL;
  price?: string;
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties: Record<string, unknown>;
  timestamp: Date;
}

// Error types
export interface StoreError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
}

// Pagination types
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Currency types
export interface CurrencyState {
  current: Currency;
  available: Currency[];
  rates: Record<string, number>;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimal_digits: number;
}
