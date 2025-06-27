'use client'

import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/supabase/auth-provider'
import { medusa } from '@/lib/medusa/client'

export function useMedusaCustomer() {
  const { user } = useAuth()

  // Get current customer
  const { data: customer, refetch: refetchCustomer } = useQuery({
    queryKey: ['medusa-customer', user?.id],
    queryFn: async () => {
      if (!user?.email) return null
      
      try {
        // First try to get customer by email
        const { customers } = await medusa.customers.list({
          email: user.email,
        })
        
        if (customers && customers.length > 0) {
          return customers[0]
        }
        
        return null
      } catch (error) {
        console.error('Error fetching customer:', error)
        return null
      }
    },
    enabled: !!user,
  })

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error('No user email')
      
      return await medusa.customers.create({
        email: user.email,
        first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
        last_name: user.user_metadata?.full_name?.split(' ')[1] || '',
        phone: user.user_metadata?.phone || undefined,
        metadata: {
          supabase_id: user.id,
        },
      })
    },
    onSuccess: () => {
      refetchCustomer()
    },
  })

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!customer?.id) throw new Error('No customer ID')
      
      return await medusa.customers.update(customer.id, updates)
    },
    onSuccess: () => {
      refetchCustomer()
    },
  })

  // Auto-create customer if user exists but customer doesn't
  useEffect(() => {
    if (user && !customer && !createCustomerMutation.isPending) {
      createCustomerMutation.mutate()
    }
  }, [user, customer])

  return {
    customer,
    isLoading: !user || createCustomerMutation.isPending,
    createCustomer: createCustomerMutation.mutate,
    updateCustomer: updateCustomerMutation.mutate,
    isCreating: createCustomerMutation.isPending,
    isUpdating: updateCustomerMutation.isPending,
    error: createCustomerMutation.error || updateCustomerMutation.error,
  }
}