import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { shopifyClient, createCustomerService } from '@/lib/shopify';
import type { User } from '@supabase/supabase-js';
import type { Customer, CustomerAddress, CustomerOrder } from '@/lib/shopify/types/customer';
import { toast } from '@/hooks/use-toast';

/**
 * Enhanced customer hook for Shopify customer data management
 * Provides unified interface for customer operations with automatic sync
 */
export function useCustomer() {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShopifyConnected, setIsShopifyConnected] = useState(false);

  const supabase = createClient();

  // Initialize user and customer data
  useEffect(() => {
    let mounted = true;

    const initializeUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (mounted) {
          setUser(currentUser);
          if (currentUser) {
            await loadCustomerData(currentUser);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        if (mounted) {
          setError('Failed to load user data');
          setIsLoading(false);
        }
      }
    };

    initializeUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          const currentUser = session?.user || null;
          setUser(currentUser);
          
          if (currentUser && event === 'SIGNED_IN') {
            await loadCustomerData(currentUser);
          } else {
            setCustomer(null);
            setIsShopifyConnected(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load Shopify customer data
  const loadCustomerData = async (user: User) => {
    try {
      const shopifyCustomerId = user.user_metadata?.shopify_customer_id;
      const accessToken = user.app_metadata?.shopify_access_token;

      if (shopifyCustomerId && accessToken && shopifyClient) {
        const customerService = createCustomerService(shopifyClient);
        const customerData = await customerService.getCustomer(accessToken);
        
        if (customerData) {
          setCustomer(customerData);
          setIsShopifyConnected(true);
        }
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
      setIsShopifyConnected(false);
    }
  };

  // Connect to Shopify (for existing users)
  const connectToShopify = useCallback(async (password: string) => {
    if (!user) {
      setError('No user logged in');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/shopify/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (result.success) {
        await loadCustomerData(user);
        toast({
          title: 'Connected to Shopify',
          description: 'Your account is now connected to Shopify customer data.',
        });
        return true;
      } else {
        setError(result.error || 'Connection failed');
        return false;
      }
    } catch (error) {
      setError('Network error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update customer profile
  const updateProfile = useCallback(async (updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    acceptsMarketing?: boolean;
  }) => {
    if (!user || !isShopifyConnected) {
      setError('Not connected to Shopify');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (result.success) {
        await loadCustomerData(user);
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully.',
        });
        return true;
      } else {
        setError(result.error || 'Update failed');
        return false;
      }
    } catch (error) {
      setError('Network error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isShopifyConnected]);

  // Add address
  const addAddress = useCallback(async (address: Omit<CustomerAddress, 'id' | 'formatted'>) => {
    if (!user || !isShopifyConnected) {
      setError('Not connected to Shopify');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      const result = await response.json();

      if (result.success) {
        await loadCustomerData(user);
        toast({
          title: 'Address added',
          description: 'Your address has been added successfully.',
        });
        return true;
      } else {
        setError(result.error || 'Failed to add address');
        return false;
      }
    } catch (error) {
      setError('Network error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isShopifyConnected]);

  // Get orders
  const getOrders = useCallback(async (): Promise<CustomerOrder[]> => {
    if (!user || !isShopifyConnected) {
      return [];
    }

    try {
      const response = await fetch('/api/account/orders');
      const result = await response.json();

      if (result.success) {
        return result.orders || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }, [user, isShopifyConnected]);

  // Get customer addresses
  const getAddresses = useCallback((): CustomerAddress[] => {
    if (!customer?.addresses?.edges) return [];
    return customer.addresses.edges.map(edge => edge.node);
  }, [customer]);

  // Check if profile is complete
  const isProfileComplete = useCallback((): boolean => {
    if (!customer) return false;
    return !!(customer.firstName && customer.lastName && customer.phone);
  }, [customer]);

  return {
    // State
    user,
    customer,
    isLoading,
    error,
    isShopifyConnected,
    isAuthenticated: !!user,
    isProfileComplete: isProfileComplete(),

    // Data getters
    addresses: getAddresses(),
    displayName: customer?.displayName || user?.email || '',
    email: customer?.email || user?.email || '',

    // Actions
    connectToShopify,
    updateProfile,
    addAddress,
    getOrders,
    
    // Utilities
    clearError: () => setError(null),
    refresh: () => user && loadCustomerData(user),
  };
}

export type UseCustomerReturn = ReturnType<typeof useCustomer>;