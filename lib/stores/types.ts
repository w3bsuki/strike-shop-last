// Import types from unified types for use in this file
import type { CartItem, User, Address, Order, OrderStatus } from '../../types/store';
// WishlistItem type defined inline to avoid circular dependency
export interface WishlistItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  image?: string;
  price: number;
  compareAtPrice?: number;
  addedAt: number;
}
// Enhanced cart types defined here to avoid circular dependency
export interface BulkCartItem {
  productId: string;
  variantId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
}

export interface BulkOperation {
  id: string;
  type: 'add' | 'update' | 'remove';
  items: BulkCartItem[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
}

export interface SavedCart {
  id: string;
  name: string;
  items: SavedCartItem[];
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
}

export interface SavedCartItem {
  productId: string;
  variantId: string;
  quantity: number;
  productData?: any;
  savedAt: number;
}

export interface CartRecommendation {
  id: string;
  productId: string;
  variantId: string;
  reason: 'frequently_bought' | 'similar_product' | 'price_drop' | 'back_in_stock';
  confidence: number;
  metadata?: Record<string, any>;
}

export interface InventoryStatus {
  productId: string;
  variantId: string;
  available: number;
  reserved: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  restockDate?: string;
}

export interface TaxEstimate {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  breakdown: Array<{
    name: string;
    amount: number;
    rate: number;
  }>;
}

export interface EnhancedCartActions {
  // Bulk operations
  processBulkOperation: (operation: BulkOperation) => Promise<void>;
  getBulkOperationStatus: (operationId: string) => BulkOperation | null;
  
  // Saved carts
  saveCurrentCart: (name: string) => Promise<void>;
  loadSavedCart: (cartId: string) => Promise<void>;
  deleteSavedCart: (cartId: string) => Promise<void>;
  getSavedCarts: () => SavedCart[];
  
  // Recommendations
  refreshRecommendations: () => Promise<void>;
  dismissRecommendation: (recommendationId: string) => void;
  
  // Cart sharing
  generateShareToken: () => Promise<string>;
  loadSharedCart: (token: string) => Promise<void>;
  
  // Save for later
  saveForLater: (itemId: string) => Promise<void>;
  moveToCart: (itemId: string) => Promise<void>;
  
  // Inventory tracking
  refreshInventoryStatus: () => Promise<void>;
  subscribeToInventoryUpdates: (productIds: string[]) => void;
  
  // Tax estimation
  estimateTax: (shippingAddress?: any) => Promise<void>;
  
  // Abandonment tracking
  startAbandonmentTracking: () => void;
  stopAbandonmentTracking: () => void;
  trackAbandonmentEvent: (event: string, data?: Record<string, unknown>) => void;
}

// Re-export types from existing stores for backward compatibility
export type { CartItem, User, Address, Order, OrderStatus };

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
