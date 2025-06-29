'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/supabase/auth-provider'

// TODO: Medusa customer management disabled - customer API not available in current medusa service
// This hook provides stub functionality to prevent build errors
// Implement proper Medusa customer integration when customer API is available

export function useMedusaCustomer() {
  const { user } = useAuth()

  // Stub customer query - returns mock customer data based on Supabase user
  const { data: customer, refetch: refetchCustomer } = useQuery({
    queryKey: ['medusa-customer', user?.id],
    queryFn: async () => {
      if (!user?.email) return null
      
      // Return mock customer data based on Supabase user
      return {
        id: `cust_${user.id}`,
        email: user.email,
        first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
        last_name: user.user_metadata?.full_name?.split(' ')[1] || '',
        phone: user.user_metadata?.phone || undefined,
        metadata: {
          supabase_id: user.id,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    },
    enabled: !!user,
  })

  // Stub create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error('No user email')
      
      // Simulate customer creation with mock data
      console.log('Medusa customer creation stubbed - implement proper API integration')
      return {
        id: `cust_${user.id}`,
        email: user.email,
        first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
        last_name: user.user_metadata?.full_name?.split(' ')[1] || '',
        phone: user.user_metadata?.phone || undefined,
        metadata: {
          supabase_id: user.id,
        },
      }
    },
    onSuccess: () => {
      refetchCustomer()
    },
  })

  // Stub update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (_updates: any) => {
      if (!customer?.id) throw new Error('No customer ID')
      
      // Simulate customer update
      console.log('Medusa customer update stubbed - implement proper API integration')
      return { ...customer, updated_at: new Date().toISOString() }
    },
    onSuccess: () => {
      refetchCustomer()
    },
  })

  return {
    customer,
    isLoading: false, // No real loading since it's stubbed
    createCustomer: createCustomerMutation.mutate,
    updateCustomer: updateCustomerMutation.mutate,
    isCreating: createCustomerMutation.isPending,
    isUpdating: updateCustomerMutation.isPending,
    error: createCustomerMutation.error || updateCustomerMutation.error,
  }
}