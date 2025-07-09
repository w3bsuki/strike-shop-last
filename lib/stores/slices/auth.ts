import type { StateCreator } from 'zustand';
import { createUserId } from '@/types/branded';
import type {
  StoreState,
  AuthSlice,
  AuthActions,
  User,
  Address,
  Order,
  OrderStatus,
} from '../types';

// Mock authentication service - replace with actual implementation
const authService = {
  login: async (email: string, _password: string): Promise<User> => {
    // This would typically make an API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      id: createUserId('user_123'),
      email,
      firstName: 'John',
      lastName: 'Doe',
      addresses: [],
      orders: [],
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
  },

  updateProfile: async (
    userId: string,
    updates: Partial<User>
  ): Promise<User> => {
    // This would typically make an API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      id: createUserId(userId),
      email: updates.email || 'user@example.com',
      ...updates,
      addresses: updates.addresses || [],
      orders: updates.orders || [],
      createdAt: updates.createdAt || new Date(),
      lastLoginAt: new Date(),
    };
  },
};

export const createAuthSlice: StateCreator<
  StoreState,
  [],
  [],
  AuthSlice & { actions: { auth: AuthActions } }
> = (set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  actions: {
    auth: {
      // Basic setters
      setUser: (user: User | null) =>
        set((state) => ({
          auth: { ...state.auth, user, error: null, isAuthenticated: !!user },
        })),
      setLoading: (isLoading: boolean) =>
        set((state) => ({
          auth: { ...state.auth, isLoading },
        })),
      setError: (error: string | null) =>
        set((state) => ({
          auth: { ...state.auth, error },
        })),
      
      clearError: () =>
        set((state) => ({
          auth: { ...state.auth, error: null },
        })),

      // Address management
      addAddress: (address: Address) => {
        const { auth } = get();
        if (!auth.user) return;

        const updatedAddresses = [...auth.user.addresses, address];
        set((state) => ({
          auth: {
            ...state.auth,
            user: state.auth.user
              ? {
                  ...state.auth.user,
                  addresses: updatedAddresses,
                }
              : null,
          },
        }));
      },

      updateAddress: (addressId: string, updates: Partial<Address>) => {
        const { auth } = get();
        if (!auth.user) return;

        const updatedAddresses = auth.user.addresses.map((addr: Address) =>
          addr.id === addressId ? { ...addr, ...updates } : addr
        );

        set((state) => ({
          auth: {
            ...state.auth,
            user: state.auth.user
              ? {
                  ...state.auth.user,
                  addresses: updatedAddresses,
                }
              : null,
          },
        }));
      },

      deleteAddress: (addressId: string) => {
        const { auth } = get();
        if (!auth.user) return;

        const updatedAddresses = auth.user.addresses.filter(
          (addr: Address) => addr.id !== addressId
        );
        set((state) => ({
          auth: {
            ...state.auth,
            user: state.auth.user
              ? {
                  ...state.auth.user,
                  addresses: updatedAddresses,
                }
              : null,
          },
        }));
      },

      setDefaultAddress: (addressId: string, type: 'shipping' | 'billing') => {
        const { auth } = get();
        if (!auth.user) return;

        const updatedAddresses = auth.user.addresses.map((addr: Address) => ({
          ...addr,
          isDefault:
            addr.id === addressId && addr.type === type
              ? true
              : addr.type === type
                ? false
                : addr.isDefault,
        }));

        set((state) => ({
          auth: {
            ...state.auth,
            user: state.auth.user
              ? {
                  ...state.auth.user,
                  addresses: updatedAddresses,
                }
              : null,
          },
        }));
      },

      // Order management
      addOrder: (order: Order) => {
        const { auth } = get();
        if (!auth.user) return;

        const updatedOrders = [order, ...auth.user.orders];
        set((state) => ({
          auth: {
            ...state.auth,
            user: state.auth.user
              ? {
                  ...state.auth.user,
                  orders: updatedOrders,
                }
              : null,
          },
        }));
      },

      updateOrderStatus: (orderId: string, status: OrderStatus) => {
        const { auth } = get();
        if (!auth.user) return;

        const updatedOrders = auth.user.orders.map((order: Order) =>
          order.id === orderId ? { ...order, status } : order
        );

        set((state) => ({
          auth: {
            ...state.auth,
            user: state.auth.user
              ? {
                  ...state.auth.user,
                  orders: updatedOrders,
                }
              : null,
          },
        }));
      },

      // Auth actions
      login: async (email: string, password: string) => {
        set((state) => ({
          auth: { ...state.auth, isLoading: true, error: null },
        }));

        try {
          const user = await authService.login(email, password);
          set((state) => ({
            auth: {
              ...state.auth,
              user,
              isLoading: false,
              isAuthenticated: true,
            },
          }));
          return true;
        } catch (error) {
          set((state) => ({
            auth: {
              ...state.auth,
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false,
              isAuthenticated: false,
            },
          }));
          return false;
        }
      },

      register: async (data: {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
        phone?: string;
      }) => {
        set((state) => ({
          auth: { ...state.auth, isLoading: true, error: null },
        }));

        try {
          // In production, this would call a real registration API
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const user: User = {
            id: createUserId('user_' + Date.now()),
            email: data.email,
            firstName: data.first_name,
            lastName: data.last_name,
            ...(data.phone && { phone: data.phone }),
            addresses: [],
            orders: [],
            createdAt: new Date(),
            lastLoginAt: new Date(),
          };
          set((state) => ({
            auth: {
              ...state.auth,
              user,
              isLoading: false,
              isAuthenticated: true,
            },
          }));
          return true;
        } catch (error) {
          set((state) => ({
            auth: {
              ...state.auth,
              error: error instanceof Error ? error.message : 'Registration failed',
              isLoading: false,
              isAuthenticated: false,
            },
          }));
          return false;
        }
      },

      socialLogin: async (provider: 'google' | 'apple' | 'facebook') => {
        set((state) => ({
          auth: { ...state.auth, isLoading: true, error: null },
        }));

        try {
          // In production, this would initiate OAuth flow
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const user: User = {
            id: createUserId('user_' + provider + '_' + Date.now()),
            email: `user@${provider}.com`,
            firstName: provider.charAt(0).toUpperCase() + provider.slice(1),
            lastName: 'User',
            addresses: [],
            orders: [],
            createdAt: new Date(),
            lastLoginAt: new Date(),
          };
          set((state) => ({
            auth: {
              ...state.auth,
              user,
              isLoading: false,
              isAuthenticated: true,
            },
          }));
          return true;
        } catch (error) {
          set((state) => ({
            auth: {
              ...state.auth,
              error: error instanceof Error ? error.message : `${provider} login failed`,
              isLoading: false,
              isAuthenticated: false,
            },
          }));
          return false;
        }
      },

      logout: () => {
        set((state) => ({
          auth: {
            ...state.auth,
            user: null,
            error: null,
            isAuthenticated: false,
          },
        }));
      },

      updateProfile: async (updates: Partial<User>) => {
        const { auth } = get();
        if (!auth.user) throw new Error('No user logged in');

        set((state) => ({
          auth: { ...state.auth, isLoading: true, error: null },
        }));

        try {
          const updatedUser = await authService.updateProfile(
            auth.user.id,
            updates
          );
          set((state) => ({
            auth: { ...state.auth, user: updatedUser, isLoading: false },
          }));
        } catch (error) {
          set((state) => ({
            auth: {
              ...state.auth,
              error: error instanceof Error ? error.message : 'Update failed',
              isLoading: false,
            },
          }));
          throw error;
        }
      },

      // Getters
      getDefaultAddress: (type: 'shipping' | 'billing') => {
        const { auth } = get();
        if (!auth.user) return null;

        return (
          auth.user.addresses.find(
            (addr: Address) => addr.type === type && addr.isDefault
          ) || null
        );
      },

      getRecentOrders: (limit: number = 5) => {
        const { auth } = get();
        if (!auth.user) return [];

        return auth.user.orders
          .sort((a: Order, b: Order) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit);
      },

      hasCompletedProfile: () => {
        const { auth } = get();
        if (!auth.user) return false;

        return !!(
          auth.user.firstName &&
          auth.user.lastName &&
          auth.user.phone &&
          auth.user.addresses.length > 0
        );
      },
    },
  },
});
