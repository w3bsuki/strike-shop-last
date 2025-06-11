"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { medusaClient } from "@/lib/medusa" // Import the Medusa client

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

type MedusaCustomer = {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  shipping_addresses?: MedusaAddress[]
}

type MedusaOrderItem = {
  id: string
  title: string
  unit_price: number
  quantity: number
  thumbnail?: string
  variant: {
    id: string
    title: string
    sku?: string
  }
}

type MedusaOrder = {
  id: string
  display_id?: number
  status: string
  items?: MedusaOrderItem[]
  total?: number
  subtotal?: number
  shipping_total?: number
  tax_total?: number
  created_at?: string
  updated_at?: string
  fulfillments?: any[]
  shipping_address?: {
    id?: string
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    country_code?: string
    province?: string
    postal_code?: string
    phone?: string
  }
}

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  phone?: string
  dateOfBirth?: string
  isAdmin?: boolean // This will be managed separately for Medusa Admin
  preferences: {
    newsletter: boolean
    sms: boolean
    womenswear: boolean
    menswear: boolean
    kids: boolean
  }
  addresses: Address[]
  createdAt: string
}

export type Address = {
  id: string
  type: "shipping" | "billing"
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
}

export type Order = {
  id: string
  orderNumber: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  items: Array<{
    id: string
    name: string
    price: string
    image: string
    size: string
    quantity: number
    sku: string
  }>
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: Address
  trackingNumber?: string
  estimatedDelivery?: string
  createdAt: string
  updatedAt: string
}

type AuthStore = {
  user: User | null
  orders: Order[]
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>
  logout: () => void
  updateProfile: (userData: Partial<User>) => Promise<void>
  addAddress: (address: Omit<Address, "id">) => Promise<void>
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>
  deleteAddress: (id: string) => Promise<void>
  fetchOrders: () => Promise<void>
  socialLogin: (provider: "google" | "apple" | "facebook") => Promise<boolean>
  adminLogin: (email: string, password: string) => Promise<boolean> // This will use Medusa Admin API
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      orders: [],
      isAuthenticated: false,
      isLoading: false,

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
            
            // Store the token for subsequent requests
            localStorage.setItem('medusa_auth_token', token)
            
            // Get customer info using the token
            const customerResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
              },
            })

            if (customerResponse.ok) {
              const { customer } = await customerResponse.json()
              const mappedUser: User = {
                id: customer.id,
                email: customer.email,
                firstName: customer.first_name || "",
                lastName: customer.last_name || "",
                phone: customer.phone || undefined,
                preferences: {
                  newsletter: customer.has_account || false,
                  sms: false,
                  womenswear: false,
                  menswear: true,
                  kids: false,
                },
                addresses:
                  customer.shipping_addresses?.map((addr: MedusaAddress) => ({
                    id: addr.id,
                    type: "shipping",
                    firstName: addr.first_name || "",
                    lastName: addr.last_name || "",
                    company: addr.company || undefined,
                    address1: addr.address_1 || "",
                    address2: addr.address_2 || undefined,
                    city: addr.city || "",
                    state: addr.province || "",
                    postalCode: addr.postal_code || "",
                    country: addr.country_code || "",
                    phone: addr.phone || undefined,
                    isDefault: false,
                  })) || [],
                createdAt: customer.created_at,
              }

              set({ user: mappedUser, isAuthenticated: true })
              await get().fetchOrders()
              return true
            }
          }
          return false
        } catch (error) {
          console.error("Login failed:", error)
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      adminLogin: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          // For demo purposes, use regular customer login
          // In production, you'd have separate admin authentication
          const success = await get().login(email, password)
          if (success) {
            // Mark user as admin in local state
            const currentUser = get().user
            if (currentUser) {
              set({ user: { ...currentUser, isAdmin: true } })
              return true
            }
          }
          return false
        } catch (error) {
          console.error("Admin login failed:", error)
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          // Use direct API call for registration
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
            },
            body: JSON.stringify({
              email: userData.email!,
              password: userData.password!,
            }),
          })

          if (response.ok) {
            // Automatically log in after registration
            const success = await get().login(userData.email!, userData.password!)
            return success
          }
          return false
        } catch (error) {
          console.error("Registration failed:", error)
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          // Clear local storage token
          localStorage.removeItem('medusa_auth_token')
          set({ user: null, isAuthenticated: false, orders: [] })
        } catch (error) {
          console.error("Logout failed:", error)
          // Clear state even if logout fails
          set({ user: null, isAuthenticated: false, orders: [] })
        } finally {
          set({ isLoading: false })
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true })
        const { user } = get()
        if (!user) {
          set({ isLoading: false })
          return
        }

        try {
          const { customer } = await medusaClient.customers.update(user.id, {
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            phone: userData.phone,
            // Medusa doesn't have direct 'preferences' fields, you might need custom metadata
          })

          if (customer) {
            const updatedUser: User = {
              ...user,
              email: customer.email,
              firstName: customer.first_name || "",
              lastName: customer.last_name || "",
              phone: customer.phone || undefined,
            }
            set({ user: updatedUser })
          }
        } catch (error) {
          console.error("Profile update failed:", error)
        } finally {
          set({ isLoading: false })
        }
      },

      addAddress: async (address) => {
        set({ isLoading: true })
        const { user } = get()
        if (!user) {
          set({ isLoading: false })
          return
        }

        try {
          const { customer } = await medusaClient.customers.addresses.addAddress(user.id, {
            first_name: address.firstName,
            last_name: address.lastName,
            company: address.company,
            address_1: address.address1,
            address_2: address.address2,
            city: address.city,
            province: address.state,
            postal_code: address.postalCode,
            country_code: address.country,
            phone: address.phone,
          })

          if (customer) {
            const updatedAddresses: Address[] =
              customer.shipping_addresses?.map((addr: MedusaAddress) => ({
                id: addr.id,
                type: "shipping",
                firstName: addr.first_name || "",
                lastName: addr.last_name || "",
                company: addr.company || undefined,
                address1: addr.address_1 || "",
                address2: addr.address_2 || undefined,
                city: addr.city || "",
                state: addr.province || "",
                postalCode: addr.postal_code || "",
                country: addr.country_code || "",
                phone: addr.phone || undefined,
                isDefault: false, // Medusa doesn't have a direct default flag
              })) || []
            set({ user: { ...user, addresses: updatedAddresses } })
          }
        } catch (error) {
          console.error("Add address failed:", error)
        } finally {
          set({ isLoading: false })
        }
      },

      updateAddress: async (id, addressData) => {
        set({ isLoading: true })
        const { user } = get()
        if (!user) {
          set({ isLoading: false })
          return
        }

        try {
          const { customer } = await medusaClient.customers.addresses.updateAddress(user.id, id, {
            first_name: addressData.firstName,
            last_name: addressData.lastName,
            company: addressData.company,
            address_1: addressData.address1,
            address_2: addressData.address2,
            city: addressData.city,
            province: addressData.state,
            postal_code: addressData.postalCode,
            country_code: addressData.country,
            phone: addressData.phone,
          })

          if (customer) {
            const updatedAddresses: Address[] =
              customer.shipping_addresses?.map((addr: MedusaAddress) => ({
                id: addr.id,
                type: "shipping",
                firstName: addr.first_name || "",
                lastName: addr.last_name || "",
                company: addr.company || undefined,
                address1: addr.address_1 || "",
                address2: addr.address_2 || undefined,
                city: addr.city || "",
                state: addr.province || "",
                postalCode: addr.postal_code || "",
                country: addr.country_code || "",
                phone: addr.phone || undefined,
                isDefault: false,
              })) || []
            set({ user: { ...user, addresses: updatedAddresses } })
          }
        } catch (error) {
          console.error("Update address failed:", error)
        } finally {
          set({ isLoading: false })
        }
      },

      deleteAddress: async (id) => {
        set({ isLoading: true })
        const { user } = get()
        if (!user) {
          set({ isLoading: false })
          return
        }

        try {
          const { customer } = await medusaClient.customers.addresses.deleteAddress(user.id, { address_id: id })

          if (customer) {
            const updatedAddresses: Address[] =
              customer.shipping_addresses?.map((addr: MedusaAddress) => ({
                id: addr.id,
                type: "shipping",
                firstName: addr.first_name || "",
                lastName: addr.last_name || "",
                company: addr.company || undefined,
                address1: addr.address_1 || "",
                address2: addr.address_2 || undefined,
                city: addr.city || "",
                state: addr.province || "",
                postalCode: addr.postal_code || "",
                country: addr.country_code || "",
                phone: addr.phone || undefined,
                isDefault: false,
              })) || []
            set({ user: { ...user, addresses: updatedAddresses } })
          }
        } catch (error) {
          console.error("Delete address failed:", error)
        } finally {
          set({ isLoading: false })
        }
      },

      fetchOrders: async () => {
        set({ isLoading: true })
        try {
          const response = await medusaClient.customers.listOrders()

          const mappedOrders: Order[] =
            response.orders?.map((order: MedusaOrder) => ({
              id: order.id,
              orderNumber: order.display_id?.toString() || order.id,
              status: order.status as Order["status"],
              items:
                order.items?.map((item: MedusaOrderItem) => ({
                  id: item.variant.id,
                  name: item.title,
                  price: `£${(item.unit_price / 100).toFixed(2)}`,
                  image: item.thumbnail || "/placeholder.svg",
                  size: item.variant.title,
                  quantity: item.quantity,
                  sku: item.variant.sku || '',
                })) || [],
              subtotal: (order.subtotal || 0) / 100,
              shipping: (order.shipping_total || 0) / 100,
              tax: (order.tax_total || 0) / 100,
              total: (order.total || 0) / 100,
              shippingAddress: {
                id: order.shipping_address?.id || "",
                type: "shipping",
                firstName: order.shipping_address?.first_name || "",
                lastName: order.shipping_address?.last_name || "",
                address1: order.shipping_address?.address_1 || "",
                city: order.shipping_address?.city || "",
                state: order.shipping_address?.province || "",
                postalCode: order.shipping_address?.postal_code || "",
                country: order.shipping_address?.country_code || "",
                isDefault: false,
              },
              trackingNumber: order.fulfillments?.[0]?.tracking_numbers?.[0] || undefined,
              estimatedDelivery: order.fulfillments?.[0]?.shipped_at?.split("T")[0] || undefined,
              createdAt: order.created_at,
              updatedAt: order.updated_at,
            })) || []

          set({ orders: mappedOrders })
        } catch (error) {
          console.error("Failed to fetch orders:", error)
          set({ orders: [] })
        } finally {
          set({ isLoading: false })
        }
      },

      socialLogin: async (provider) => {
        // Medusa doesn't have built-in social login for the storefront by default.
        // This would require a custom plugin on the Medusa backend.
        console.warn(`Social login with ${provider} is not implemented with Medusa.js out-of-the-box.`)
        return false
      },
    }),
    {
      name: "strike-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Orders are fetched dynamically, no need to persist
      }),
    },
  ),
)
