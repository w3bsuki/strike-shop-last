import { useStore } from './stores';

// Re-export interfaces for backward compatibility
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
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
  first_name: string;
  last_name: string;
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
  id: string;
  displayId: string;
  status: OrderStatus;
  total: number;
  currency: string;
  createdAt: Date;
  items: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

interface AuthStore {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Address management
  addAddress: (address: Address) => void;
  updateAddress: (addressId: string, updates: Partial<Address>) => void;
  deleteAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string, type: 'shipping' | 'billing') => void;

  // Order management
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Auth actions
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

  // Getters
  getDefaultAddress: (type: 'shipping' | 'billing') => Address | null;
  getRecentOrders: (limit?: number) => Order[];
  hasCompletedProfile: () => boolean;
}

// Create a facade that maintains the exact same API as the original store
export const useAuthStore = (): AuthStore => {
  const auth = useStore((state) => state.auth);
  const actions = useStore((state) => state.actions.auth);

  return {
    // State
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,

    // Actions - all delegated to the unified store
    setUser: actions.setUser,
    setLoading: actions.setLoading,
    setError: actions.setError,
    clearError: actions.clearError,
    addAddress: actions.addAddress,
    updateAddress: actions.updateAddress,
    deleteAddress: actions.deleteAddress,
    setDefaultAddress: actions.setDefaultAddress,
    addOrder: actions.addOrder,
    updateOrderStatus: actions.updateOrderStatus,
    login: actions.login,
    register: actions.register,
    socialLogin: actions.socialLogin,
    logout: actions.logout,
    updateProfile: actions.updateProfile,
    getDefaultAddress: actions.getDefaultAddress,
    getRecentOrders: actions.getRecentOrders,
    hasCompletedProfile: actions.hasCompletedProfile,
  };
};
