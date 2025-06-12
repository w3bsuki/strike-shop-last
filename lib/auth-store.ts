"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { medusaClient } from "@/lib/medusa"
import { toast } from "@/hooks/use-toast"

// Type definitions for Medusa API responses
type MedusaAddress = {
  id: string
  first_name?: string
  last_name?: string
  company?: string
  address_1?: string
  address_2?: string
  city?: string
  country_code?: string
  province?: string
  postal_code?: string
  phone?: string
}

type MedusaOrder = {
  id: string
  display_id: number
  status: string
  email: string
  total: number
  currency_code: string
  created_at: string
  items: Array<{
    id: string
    title: string
    quantity: number
    unit_price: number
  }>
}

type User = {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  has_account: boolean
  billing_address?: MedusaAddress
  shipping_addresses?: MedusaAddress[]
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

type RegisterData = {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}

type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  addresses: MedusaAddress[]
  orders: MedusaOrder[]
  
  // Security features
  lastActivity: number
  loginAttempts: number
  isLocked: boolean
  lockoutEnd: number
  sessionExpiry: number
}

type AuthActions = {
  // Core authentication
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  initializeAuth: () => Promise<void>
  
  // Profile management
  updateProfile: (userData: Partial<User>) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  deleteAccount: () => Promise<boolean>
  
  // Address management
  addAddress: (address: Omit<MedusaAddress, "id">) => Promise<boolean>
  updateAddress: (id: string, address: Partial<MedusaAddress>) => Promise<boolean>
  deleteAddress: (id: string) => Promise<boolean>
  
  // Order management
  fetchOrders: () => Promise<void>
  
  // Password reset
  requestPasswordReset: (email: string) => Promise<boolean>
  resetPassword: (token: string, password: string) => Promise<boolean>
  
  // Security
  updateActivity: () => void
  checkSession: () => boolean
  clearError: () => void
  
  // Social login
  socialLogin: (provider: "google" | "apple" | "facebook") => Promise<boolean>
}

type AuthStore = AuthState & AuthActions

// Security constants
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      addresses: [],
      orders: [],
      lastActivity: Date.now(),
      loginAttempts: 0,
      isLocked: false,
      lockoutEnd: 0,
      sessionExpiry: 0,

      // Initialize authentication on app start
      initializeAuth: async () => {
        const state = get()
        
        // Check if session is valid
        if (!state.checkSession()) {
          await state.logout()
          return
        }

        // Refresh user data if we have a token
        if (state.token && state.user) {
          try {
            await state.refreshToken()
          } catch (error) {
            console.error("Failed to refresh auth on init:", error)
            await state.logout()
          }
        }
      },

      // Login with email and password
      login: async (email: string, password: string) => {
        const state = get()
        
        // Check if account is locked
        if (state.isLocked && Date.now() < state.lockoutEnd) {
          const remainingTime = Math.ceil((state.lockoutEnd - Date.now()) / 60000)
          set({ error: `Account locked. Try again in ${remainingTime} minutes.` })
          return false
        }

        set({ isLoading: true, error: null })

        try {
          // Use Medusa auth API
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Login failed')
          }

          const { customer, token } = await response.json()
          
          set({
            user: customer,
            token,
            isAuthenticated: true,
            isLoading: false,
            lastActivity: Date.now(),
            sessionExpiry: Date.now() + SESSION_DURATION,
            loginAttempts: 0,
            isLocked: false,
            lockoutEnd: 0,
          })

          // Fetch user's addresses and orders
          await Promise.all([
            get().fetchOrders()
          ])

          toast({
            title: "Welcome back!",
            description: `Logged in as ${customer.email}`,
          })

          return true

        } catch (error: any) {
          console.error('Login error:', error)
          
          // Increment login attempts
          const newAttempts = state.loginAttempts + 1
          const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS
          
          set({
            isLoading: false,
            error: error.message,
            loginAttempts: newAttempts,
            isLocked: shouldLock,
            lockoutEnd: shouldLock ? Date.now() + LOCKOUT_DURATION : 0,
          })

          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          })

          return false
        }
      },

      // Register new customer
      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
            credentials: 'include'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Registration failed')
          }

          const { customer, token } = await response.json()
          
          set({
            user: customer,
            token,
            isAuthenticated: true,
            isLoading: false,
            lastActivity: Date.now(),
            sessionExpiry: Date.now() + SESSION_DURATION,
          })

          toast({
            title: "Account created!",
            description: "Welcome to Strike™",
          })

          return true

        } catch (error: any) {
          console.error('Registration error:', error)
          
          set({
            isLoading: false,
            error: error.message,
          })

          toast({
            title: "Registration failed",
            description: error.message,
            variant: "destructive",
          })

          return false
        }
      },

      // Logout and clear session
      logout: async () => {
        set({ isLoading: true })

        try {
          // Call logout endpoint if we have a token
          const state = get()
          if (state.token) {
            await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${state.token}`,
              },
              credentials: 'include'
            })
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Clear all auth state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            addresses: [],
            orders: [],
            lastActivity: Date.now(),
            loginAttempts: 0,
            isLocked: false,
            lockoutEnd: 0,
            sessionExpiry: 0,
          })

          toast({
            title: "Logged out",
            description: "You have been successfully logged out",
          })
        }
      },

      // Refresh authentication token
      refreshToken: async () => {
        const state = get()
        if (!state.token) return false

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${state.token}`,
            },
            credentials: 'include'
          })

          if (!response.ok) {
            throw new Error('Token refresh failed')
          }

          const { customer, token } = await response.json()
          
          set({
            user: customer,
            token,
            lastActivity: Date.now(),
            sessionExpiry: Date.now() + SESSION_DURATION,
          })

          return true

        } catch (error) {
          console.error('Token refresh error:', error)
          await get().logout()
          return false
        }
      },

      // Update user profile
      updateProfile: async (userData: Partial<User>) => {
        const state = get()
        if (!state.token || !state.user) return false

        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.token}`,
            },
            body: JSON.stringify(userData),
            credentials: 'include'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Profile update failed')
          }

          const { customer } = await response.json()
          
          set({
            user: customer,
            isLoading: false,
            lastActivity: Date.now(),
          })

          toast({
            title: "Profile updated",
            description: "Your profile has been successfully updated",
          })

          return true

        } catch (error: any) {
          console.error('Profile update error:', error)
          
          set({
            isLoading: false,
            error: error.message,
          })

          toast({
            title: "Update failed",
            description: error.message,
            variant: "destructive",
          })

          return false
        }
      },

      // Change password
      changePassword: async (currentPassword: string, newPassword: string) => {
        const state = get()
        if (!state.token) return false

        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.token}`,
            },
            body: JSON.stringify({
              old_password: currentPassword,
              new_password: newPassword,
            }),
            credentials: 'include'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Password change failed')
          }

          set({ isLoading: false })

          toast({
            title: "Password changed",
            description: "Your password has been successfully updated",
          })

          return true

        } catch (error: any) {
          console.error('Password change error:', error)
          
          set({
            isLoading: false,
            error: error.message,
          })

          toast({
            title: "Password change failed",
            description: error.message,
            variant: "destructive",
          })

          return false
        }
      },

      // Delete account
      deleteAccount: async () => {
        const state = get()
        if (!state.token) return false

        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${state.token}`,
            },
            credentials: 'include'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Account deletion failed')
          }

          await get().logout()

          toast({
            title: "Account deleted",
            description: "Your account has been permanently deleted",
          })

          return true

        } catch (error: any) {
          console.error('Account deletion error:', error)
          
          set({
            isLoading: false,
            error: error.message,
          })

          toast({
            title: "Deletion failed",
            description: error.message,
            variant: "destructive",
          })

          return false
        }
      },

      // Add shipping address
      addAddress: async (address: Omit<MedusaAddress, "id">) => {
        const state = get()
        if (!state.token) return false

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me/addresses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.token}`,
            },
            body: JSON.stringify(address),
            credentials: 'include'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Address creation failed')
          }

          const { customer } = await response.json()
          
          set({
            user: customer,
            addresses: customer.shipping_addresses || [],
          })

          toast({
            title: "Address added",
            description: "New address has been saved",
          })

          return true

        } catch (error: any) {
          console.error('Add address error:', error)
          
          toast({
            title: "Failed to add address",
            description: error.message,
            variant: "destructive",
          })

          return false
        }
      },

      // Update shipping address
      updateAddress: async (id: string, address: Partial<MedusaAddress>) => {
        const state = get()
        if (!state.token) return false

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me/addresses/${id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.token}`,
            },
            body: JSON.stringify(address),
            credentials: 'include'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Address update failed')
          }

          const { customer } = await response.json()
          
          set({
            user: customer,
            addresses: customer.shipping_addresses || [],
          })

          toast({
            title: "Address updated",
            description: "Address has been successfully updated",
          })

          return true

        } catch (error: any) {
          console.error('Update address error:', error)
          
          toast({
            title: "Failed to update address",
            description: error.message,
            variant: "destructive",
          })

          return false
        }
      },

      // Delete shipping address
      deleteAddress: async (id: string) => {
        const state = get()
        if (!state.token) return false

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me/addresses/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${state.token}`,
            },
            credentials: 'include'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Address deletion failed')
          }

          const { customer } = await response.json()
          
          set({
            user: customer,
            addresses: customer.shipping_addresses || [],
          })

          toast({
            title: "Address deleted",
            description: "Address has been removed",
          })

          return true

        } catch (error: any) {
          console.error('Delete address error:', error)
          
          toast({
            title: "Failed to delete address",
            description: error.message,
            variant: "destructive",
          })

          return false
        }
      },

      // Fetch customer orders
      fetchOrders: async () => {
        const state = get()
        if (!state.token) return

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me/orders`, {
            headers: {
              'Authorization': `Bearer ${state.token}`,
            },
            credentials: 'include'
          })

          if (!response.ok) {
            throw new Error('Failed to fetch orders')
          }

          const { orders } = await response.json()
          
          set({ orders })

        } catch (error) {
          console.error('Fetch orders error:', error)
        }
      },

      // Request password reset
      requestPasswordReset: async (email: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/password-reset`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Password reset request failed')
          }

          set({ isLoading: false })

          toast({
            title: "Reset email sent",
            description: "Check your email for password reset instructions",
          })

          return true

        } catch (error: any) {
          console.error('Password reset request error:', error)
          
          set({
            isLoading: false,
            error: error.message,
          })

          toast({
            title: "Reset request failed",
            description: error.message,
            variant: "destructive",
          })

          return false
        }
      },

      // Reset password with token
      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/password-reset/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, password }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Password reset failed')
          }

          set({ isLoading: false })

          toast({
            title: "Password reset successful",
            description: "You can now log in with your new password",
          })

          return true

        } catch (error: any) {
          console.error('Password reset error:', error)
          
          set({
            isLoading: false,
            error: error.message,
          })

          toast({
            title: "Password reset failed",
            description: error.message,
            variant: "destructive",
          })

          return false
        }
      },

      // Update user activity timestamp
      updateActivity: () => {
        set({ lastActivity: Date.now() })
      },

      // Check if session is still valid
      checkSession: () => {
        const state = get()
        
        if (!state.token || !state.sessionExpiry) {
          return false
        }

        // Check if session has expired
        if (Date.now() > state.sessionExpiry) {
          return false
        }

        // Check if user has been inactive too long
        const inactiveTime = Date.now() - state.lastActivity
        if (inactiveTime > ACTIVITY_CHECK_INTERVAL) {
          // Auto-refresh if we're close to expiry
          if (Date.now() > state.sessionExpiry - (30 * 60 * 1000)) {
            get().refreshToken()
          }
        }

        return true
      },

      // Clear error state
      clearError: () => {
        set({ error: null })
      },

      // Social login - placeholder implementation
      socialLogin: async (provider: "google" | "apple" | "facebook") => {
        set({ isLoading: true, error: null })
        
        try {
          // TODO: Implement social login with Clerk or other provider
          toast({
            title: "Social login",
            description: `${provider} login is not yet implemented`,
            variant: "default",
          })
          
          return false
        } catch (error) {
          const message = error instanceof Error ? error.message : "Social login failed"
          set({ error: message })
          toast({
            title: "Social login failed",
            description: message,
            variant: "destructive",
          })
          return false
        } finally {
          set({ isLoading: false })
        }
      },

    }),
    {
      name: "strike-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        addresses: state.addresses,
        lastActivity: state.lastActivity,
        sessionExpiry: state.sessionExpiry,
        loginAttempts: state.loginAttempts,
        isLocked: state.isLocked,
        lockoutEnd: state.lockoutEnd,
      }),
    }
  )
)

// Auto-initialize auth on app load
if (typeof window !== "undefined") {
  // Initialize auth after a short delay to ensure environment is ready
  setTimeout(() => {
    useAuthStore.getState().initializeAuth()
  }, 100)

  // Set up periodic session checks
  setInterval(() => {
    const state = useAuthStore.getState()
    if (state.isAuthenticated && !state.checkSession()) {
      state.logout()
    }
  }, ACTIVITY_CHECK_INTERVAL)

  // Update activity on user interactions
  const updateActivity = () => useAuthStore.getState().updateActivity()
  
  document.addEventListener('click', updateActivity)
  document.addEventListener('keypress', updateActivity)
  document.addEventListener('scroll', updateActivity)
}

// Export types for use in components
export type { User, RegisterData, MedusaAddress, MedusaOrder }