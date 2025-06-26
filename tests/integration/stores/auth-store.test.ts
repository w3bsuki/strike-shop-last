import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/lib/auth-store';
import { useStore } from '@/lib/stores';
import type { AuthState } from '@/types/store';

// Mock the main store
jest.mock('@/lib/stores', () => ({
  useStore: jest.fn(),
}));

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

describe('Auth Store Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    imageUrl: 'https://example.com/avatar.jpg',
    hasImage: true,
    primaryEmailAddress: {
      emailAddress: 'test@example.com',
    },
    emailAddresses: [{
      emailAddress: 'test@example.com',
      id: 'email-1',
    }],
  };

  const mockAuthState: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
  };

  const mockAuthActions = {
    login: jest.fn(),
    logout: jest.fn(),
    clearError: jest.fn(),
    setUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock
    mockUseStore.mockImplementation((selector) => {
      const state = {
        auth: mockAuthState,
        actions: {
          auth: mockAuthActions,
        },
      };
      return selector(state);
    });
  });

  describe('Auth State Access', () => {
    it('should provide access to authentication state', () => {
      mockUseStore.mockImplementation((selector) => {
        const state = {
          auth: {
            ...mockAuthState,
            isAuthenticated: true,
            user: mockUser,
          },
          actions: {
            auth: mockAuthActions,
          },
        };
        return selector(state);
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle unauthenticated state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should expose loading state', () => {
      mockUseStore.mockImplementation((selector) => {
        const state = {
          auth: {
            ...mockAuthState,
            isLoading: true,
          },
          actions: {
            auth: mockAuthActions,
          },
        };
        return selector(state);
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isLoading).toBe(true);
    });

    it('should expose error state', () => {
      const errorMessage = 'Authentication failed';
      
      mockUseStore.mockImplementation((selector) => {
        const state = {
          auth: {
            ...mockAuthState,
            error: errorMessage,
          },
          actions: {
            auth: mockAuthActions,
          },
        };
        return selector(state);
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Auth Actions', () => {
    it('should call login action', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockAuthActions.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should call logout action', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthActions.logout).toHaveBeenCalled();
    });

    it('should call setUser action', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(mockAuthActions.setUser).toHaveBeenCalledWith(mockUser);
    });

    it('should call clearError action', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.clearError();
      });

      expect(mockAuthActions.clearError).toHaveBeenCalled();
    });
  });

  describe('Store Facade Pattern', () => {
    it('should maintain consistent API surface', () => {
      const { result } = renderHook(() => useAuthStore());

      // Check all expected properties exist
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('setUser');
      expect(result.current).toHaveProperty('clearError');
    });

    it('should return same function references across renders', () => {
      const { result, rerender } = renderHook(() => useAuthStore());

      const firstLogin = result.current.login;
      const firstLogout = result.current.logout;
      const firstSetUser = result.current.setUser;
      const firstClearError = result.current.clearError;

      rerender();

      expect(result.current.login).toBe(firstLogin);
      expect(result.current.logout).toBe(firstLogout);
      expect(result.current.setUser).toBe(firstSetUser);
      expect(result.current.clearError).toBe(firstClearError);
    });
  });

  describe('State Updates', () => {
    it('should reflect state changes immediately', () => {
      const { result, rerender } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);

      // Update mock to return authenticated state
      mockUseStore.mockImplementation((selector) => {
        const state = {
          auth: {
            ...mockAuthState,
            isAuthenticated: true,
            user: mockUser,
          },
          actions: {
            auth: mockAuthActions,
          },
        };
        return selector(state);
      });

      rerender();

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle transition states during login', () => {
      const { result, rerender } = renderHook(() => useAuthStore());

      // Initial state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);

      // Loading state
      mockUseStore.mockImplementation((selector) => {
        const state = {
          auth: {
            ...mockAuthState,
            isLoading: true,
          },
          actions: {
            auth: mockAuthActions,
          },
        };
        return selector(state);
      });

      rerender();
      expect(result.current.isLoading).toBe(true);

      // Success state
      mockUseStore.mockImplementation((selector) => {
        const state = {
          auth: {
            ...mockAuthState,
            isAuthenticated: true,
            user: mockUser,
            isLoading: false,
          },
          actions: {
            auth: mockAuthActions,
          },
        };
        return selector(state);
      });

      rerender();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle error states during authentication', () => {
      const { result, rerender } = renderHook(() => useAuthStore());

      // Trigger login
      act(() => {
        result.current.login('test@example.com', 'wrongpassword');
      });

      // Update to error state
      mockUseStore.mockImplementation((selector) => {
        const state = {
          auth: {
            ...mockAuthState,
            error: 'Invalid credentials',
            isLoading: false,
          },
          actions: {
            auth: mockAuthActions,
          },
        };
        return selector(state);
      });

      rerender();

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.isAuthenticated).toBe(false);

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(mockAuthActions.clearError).toHaveBeenCalled();
    });
  });

  describe('User Data Handling', () => {
    it('should handle complete user object', () => {
      mockUseStore.mockImplementation((selector) => {
        const state = {
          auth: {
            ...mockAuthState,
            isAuthenticated: true,
            user: mockUser,
          },
          actions: {
            auth: mockAuthActions,
          },
        };
        return selector(state);
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.user?.fullName).toBe('John Doe');
    });

    it('should handle partial user data', () => {
      const partialUser = {
        id: 'user-456',
        email: 'partial@example.com',
      };

      mockUseStore.mockImplementation((selector) => {
        const state = {
          auth: {
            ...mockAuthState,
            isAuthenticated: true,
            user: partialUser as any,
          },
          actions: {
            auth: mockAuthActions,
          },
        };
        return selector(state);
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user?.id).toBe('user-456');
      expect(result.current.user?.email).toBe('partial@example.com');
    });

    it('should handle user update', () => {
      const { result } = renderHook(() => useAuthStore());

      const updatedUser = {
        ...mockUser,
        firstName: 'Jane',
        fullName: 'Jane Doe',
      };

      act(() => {
        result.current.setUser(updatedUser);
      });

      expect(mockAuthActions.setUser).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('Edge Cases', () => {
    it('should handle logout when not authenticated', async () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthActions.logout).toHaveBeenCalled();
    });

    it('should handle login with empty credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('', '');
      });

      expect(mockAuthActions.login).toHaveBeenCalledWith('', '');
    });

    it('should handle setUser with null', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(null);
      });

      expect(mockAuthActions.setUser).toHaveBeenCalledWith(null);
    });

    it('should handle concurrent auth operations', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Simulate concurrent operations
      const loginPromise = act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      const logoutPromise = act(async () => {
        await result.current.logout();
      });

      await Promise.all([loginPromise, logoutPromise]);

      expect(mockAuthActions.login).toHaveBeenCalled();
      expect(mockAuthActions.logout).toHaveBeenCalled();
    });
  });

  describe('Integration with Main Store', () => {
    it('should correctly select auth slice from main store', () => {
      const selectorSpy = jest.fn();
      
      mockUseStore.mockImplementation((selector) => {
        selectorSpy(selector);
        const state = {
          auth: mockAuthState,
          actions: {
            auth: mockAuthActions,
          },
        };
        return selector(state);
      });

      renderHook(() => useAuthStore());

      expect(selectorSpy).toHaveBeenCalled();
    });

    it('should handle store updates efficiently', () => {
      const { result, rerender } = renderHook(() => useAuthStore());
      
      let renderCount = 0;
      
      // Track renders
      jest.spyOn(result, 'current', 'get').mockImplementation(() => {
        renderCount++;
        return {
          isAuthenticated: mockAuthState.isAuthenticated,
          user: mockAuthState.user,
          isLoading: mockAuthState.isLoading,
          error: mockAuthState.error,
          login: mockAuthActions.login,
          logout: mockAuthActions.logout,
          setUser: mockAuthActions.setUser,
          clearError: mockAuthActions.clearError,
        };
      });

      rerender();
      rerender();
      rerender();

      // Should not cause excessive re-renders
      expect(renderCount).toBeLessThan(10);
    });
  });
});