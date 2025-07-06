// Import types from unified types for use in this file
import type { CartItem, User, Address, Order, OrderStatus } from '../../types/store';
import type { WishlistItem } from '../wishlist-store';
import type { 
  BulkCartItem, 
  BulkOperation, 
  SavedCart,
  SavedCartItem,
  CartRecommendation, 
  InventoryStatus, 
  TaxEstimate,
  EnhancedCartActions 
} from './slices/enhanced-cart';

// Re-export types from existing stores for backward compatibility
export type { CartItem, WishlistItem, User, Address, Order, OrderStatus };

// Cart slice types (including enhanced features)
export interface CartSlice {
  // Basic cart state
  cartId: string | null;
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  checkoutUrl?: string;
  
  // Enhanced cart state
  bulkOperations: BulkOperation[];
  savedCarts: SavedCart[];
  recommendations: CartRecommendation[];
  inventoryStatus: InventoryStatus[];
  taxEstimate: TaxEstimate | null;
  shareToken: string | null;
  shareExpiry: number | null;
  savedForLater: SavedCartItem[];
  abandonmentTracking: {
    startTime: number | null;
    events: Array<{
      event: string;
      timestamp: number;
      data?: Record<string, unknown>;
    }>;
  };
}

export interface CartActions {
  initializeCart: () => Promise<void>;
  addItem: (
    productId: string,
    variantId: string,
    quantity: number,
    productData?: any
  ) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  setCartOpen: (isOpen: boolean) => void;
  clearCart: () => Promise<void>;
  getTotals: () => {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    formattedSubtotal: string;
    formattedTax: string;
    formattedShipping: string;
    formattedTotal: string;
  };
  getItemCount: () => number;
}

// Wishlist slice types
export interface WishlistSlice {
  items: WishlistItem[];
  isLoading: boolean;
}

export interface WishlistActions {
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getWishlistCount: () => number;
}

// Auth slice types
export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  addAddress: (address: Address) => void;
  updateAddress: (addressId: string, updates: Partial<Address>) => void;
  deleteAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string, type: 'shipping' | 'billing') => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => Promise<boolean>;
  socialLogin: (provider: 'google' | 'apple' | 'facebook') => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  getDefaultAddress: (type: 'shipping' | 'billing') => Address | null;
  getRecentOrders: (limit?: number) => Order[];
  hasCompletedProfile: () => boolean;
}

// Unified store state
export interface StoreState {
  // Domain slices
  cart: CartSlice;
  wishlist: WishlistSlice;
  auth: AuthSlice;

  // Actions organized by domain
  actions: {
    cart: CartActions;
    enhancedCart: EnhancedCartActions;
    wishlist: WishlistActions;
    auth: AuthActions;
  };
}

// Store slices for composition
export type CartStoreSlice = CartSlice & { actions: { cart: CartActions } };
export type WishlistStoreSlice = WishlistSlice & {
  actions: { wishlist: WishlistActions };
};
export type AuthStoreSlice = AuthSlice & { actions: { auth: AuthActions } };

// Persisted state type
export interface PersistedState {
  cart: {
    cartId: string | null;
  };
  wishlist: {
    items: WishlistItem[];
  };
  auth: {
    user: User | null;
  };
}
