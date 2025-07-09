import { cookies } from 'next/headers';
import { shopifyClient, createCustomerService } from '@/lib/shopify';
import type { 
  CustomerAccessToken, 
  CustomerCreateInput,
  Customer 
} from '@/lib/shopify/types/customer';

/**
 * Shopify-Only Authentication
 * Alternative to Supabase + Shopify hybrid approach
 */

const TOKEN_COOKIE = 'shopify-customer-token';
const CUSTOMER_COOKIE = 'shopify-customer-id';

export class ShopifyAuthService {
  private customerService = shopifyClient ? createCustomerService(shopifyClient) : null;

  /**
   * Register new customer
   */
  async register(input: CustomerCreateInput): Promise<{
    success: boolean;
    customer?: Customer;
    token?: CustomerAccessToken;
    error?: string;
  }> {
    try {
      if (!this.customerService) {
        throw new Error('Shopify not configured');
      }

      const result = await this.customerService.createCustomer(input);

      if (result.customerUserErrors.length > 0) {
        return {
          success: false,
          error: result.customerUserErrors[0]?.message || 'Failed to create customer',
        };
      }

      if (result.customer && result.customerAccessToken) {
        // Store auth token in secure cookie
        await this.setAuthCookie(result.customerAccessToken);
        
        return {
          success: true,
          customer: result.customer,
          token: result.customerAccessToken,
        };
      }

      return {
        success: false,
        error: 'Failed to create customer',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Login customer
   */
  async login(email: string, password: string): Promise<{
    success: boolean;
    customer?: Customer;
    token?: CustomerAccessToken;
    error?: string;
  }> {
    try {
      if (!this.customerService) {
        throw new Error('Shopify not configured');
      }

      const result = await this.customerService.login({ email, password });

      if (result.customerUserErrors.length > 0) {
        return {
          success: false,
          error: result.customerUserErrors[0]?.message || 'Failed to create customer',
        };
      }

      if (result.customerAccessToken) {
        // Get customer details
        const customer = await this.customerService.getCustomer(
          result.customerAccessToken.accessToken
        );

        if (customer) {
          // Store auth token in secure cookie
          await this.setAuthCookie(result.customerAccessToken);
          
          return {
            success: true,
            customer,
            token: result.customerAccessToken,
          };
        }
      }

      return {
        success: false,
        error: 'Login failed',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Logout customer
   */
  async logout(): Promise<void> {
    const token = await this.getAuthToken();
    
    if (token && this.customerService) {
      try {
        await this.customerService.logout(token);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Clear cookies
    const cookieStore = await cookies();
    cookieStore.delete(TOKEN_COOKIE);
    cookieStore.delete(CUSTOMER_COOKIE);
  }

  /**
   * Get current customer
   */
  async getCurrentCustomer(): Promise<Customer | null> {
    try {
      const token = await this.getAuthToken();
      
      if (!token || !this.customerService) {
        return null;
      }

      return await this.customerService.getCustomer(token);
    } catch (error) {
      console.error('Get customer error:', error);
      return null;
    }
  }

  /**
   * Check if customer is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      
      if (!token || !this.customerService) {
        return false;
      }

      const newToken = await this.customerService.renewAccessToken(token);
      
      if (newToken) {
        await this.setAuthCookie(newToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Set auth cookie
   */
  private async setAuthCookie(token: CustomerAccessToken): Promise<void> {
    const cookieStore = await cookies();
    
    // Set secure httpOnly cookie
    cookieStore.set(TOKEN_COOKIE, token.accessToken, {
      expires: new Date(token.expiresAt),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  /**
   * Get auth token from cookie
   */
  private async getAuthToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE);
    return token?.value || null;
  }
}

// Singleton instance
export const shopifyAuth = new ShopifyAuthService();

// React hooks for client components
export function useShopifyAuth() {
  return {
    login: async (email: string, password: string) => {
      const response = await fetch('/api/auth/shopify/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return response.json();
    },
    
    logout: async () => {
      await fetch('/api/auth/shopify/logout', { method: 'POST' });
    },
    
    register: async (input: CustomerCreateInput) => {
      const response = await fetch('/api/auth/shopify/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return response.json();
    },
  };
}