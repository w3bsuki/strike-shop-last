"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { medusaClient } from "@/lib/medusa"

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
}

type Address = {
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

type AuthStore = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  addresses: Address[]
  orders: MedusaOrder[]
  lastActivity: number
  loginAttempts: number
  isLocked: boolean
  lockoutEnd: number
  
  // Core auth methods
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>
  logout: () => void
  updateProfile: (userData: Partial<User>) => Promise<void>
  addAddress: (address: Omit<Address, "id">) => Promise<void>
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>
  deleteAddress: (id: string) => Promise<void>
  fetchOrders: () => Promise<void>
  socialLogin: (provider: "google" | "apple" | "facebook") => Promise<boolean>
  adminLogin: (email: string, password: string) => Promise<boolean>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      addresses: [],
      orders: [],
      lastActivity: Date.now(),
      loginAttempts: 0,
      isLocked: false,
      lockoutEnd: 0,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          // Use direct API call since medusa-js v6 doesn't have auth.login
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
            },
            body: JSON.stringify({ email, password }),
          })

          if (response.ok) {
            const { token } = await response.json()
            
            // Get customer data
            const customerResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
              },
            })

            if (customerResponse.ok) {
              const { customer } = await customerResponse.json()
              set({
                user: customer,
                token,
                isAuthenticated: true,
                isLoading: false,
                lastActivity: Date.now(),
                loginAttempts: 0,
              })
              return true
            }
          }
          
          // Login failed
          const { loginAttempts } = get()
          const newAttempts = loginAttempts + 1
          const isLocked = newAttempts >= 5
          
          set({
            isLoading: false,
            loginAttempts: newAttempts,
            isLocked,
            lockoutEnd: isLocked ? Date.now() + (15 * 60 * 1000) : 0,
          })
          
          return false
        } catch (error) {
          console.error('Login error:', error)
          set({ isLoading: false })
          return false
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
            },
            body: JSON.stringify(userData),
          })

          if (response.ok) {
            // Auto login after registration
            const loginSuccess = await get().login(userData.email!, userData.password)
            return loginSuccess
          }
          
          set({ isLoading: false })
          return false
        } catch (error) {
          console.error('Registration error:', error)
          set({ isLoading: false })
          return false
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          addresses: [],
          orders: [],
          loginAttempts: 0,
          isLocked: false,
          lockoutEnd: 0,
        })
      },

      updateProfile: async (userData: Partial<User>) => {
        const { token } = get()
        if (!token) return

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
            },
            body: JSON.stringify(userData),
          })

          if (response.ok) {
            const { customer } = await response.json()
            set({ user: customer })
          }
        } catch (error) {
          console.error('Profile update error:', error)
        }
      },

      addAddress: async (address: Omit<Address, "id">) => {
        const { token } = get()
        if (!token) return

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me/addresses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
            },
            body: JSON.stringify(address),
          })

          if (response.ok) {
            // Refresh addresses
            const addressesResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
              },
            })
            
            if (addressesResponse.ok) {
              const { customer } = await addressesResponse.json()
              set({ addresses: customer.shipping_addresses || [] })
            }
          }
        } catch (error) {
          console.error('Add address error:', error)
        }
      },

      updateAddress: async (id: string, address: Partial<Address>) => {
        const { token } = get()
        if (!token) return

        try {
          await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me/addresses/${id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
            },
            body: JSON.stringify(address),
          })
        } catch (error) {
          console.error('Update address error:', error)
        }
      },

      deleteAddress: async (id: string) => {
        const { token } = get()
        if (!token) return

        try {
          await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me/addresses/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
            },
          })

          // Remove from local state
          const { addresses } = get()
          set({ addresses: addresses.filter(addr => addr.id !== id) })
        } catch (error) {
          console.error('Delete address error:', error)
        }
      },

      fetchOrders: async () => {
        const { token } = get()
        if (!token) return

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me/orders`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
            },
          })

          if (response.ok) {
            const { orders } = await response.json()
            set({ orders })
          }
        } catch (error) {
          console.error('Fetch orders error:', error)
        }
      },

      socialLogin: async (provider: "google" | "apple" | "facebook") => {
        // Placeholder for social login implementation
        console.log(`Social login with ${provider} not implemented yet`)
        return false
      },

      adminLogin: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          if (response.ok) {
            const { token } = await response.json()
            
            // Get user data
            const userResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/admin/users/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })

            if (userResponse.ok) {
              const { user } = await userResponse.json()
              set({
                user: { ...user, has_account: true },
                token,
                isAuthenticated: true,
                isLoading: false,
                lastActivity: Date.now(),
                loginAttempts: 0,
              })
              return true
            }
          }
          
          set({ isLoading: false })
          return false
        } catch (error) {
          console.error('Admin login error:', error)
          set({ isLoading: false })
          return false
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        addresses: state.addresses,
        lastActivity: state.lastActivity,
      }),
    }
  )
)