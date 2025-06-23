import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useCart } from './use-cart';
import { useUser } from '@/lib/clerk-mock';

interface CreatePaymentIntentData {
  amount: number;
  currency?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
  }>;
  shipping?: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      postal_code: string;
      country: string;
    };
  };
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

// API functions
const paymentAPI = {
  createPaymentIntent: async (data: CreatePaymentIntentData): Promise<PaymentIntentResponse> => {
    const response = await fetch('/api/payments/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }

    return response.json();
  },

  getPaymentIntent: async (paymentIntentId: string) => {
    const response = await fetch(`/api/payments/create-payment-intent?payment_intent_id=${paymentIntentId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to retrieve payment intent');
    }

    return response.json();
  },
};

export function useStripePayment() {
  const [clientSecret, setClientSecret] = useState<string>('');
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useUser();

  const createPaymentIntentMutation = useMutation({
    mutationFn: paymentAPI.createPaymentIntent,
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      console.error('Failed to create payment intent:', error);
    },
  });

  const getPaymentIntentMutation = useMutation({
    mutationFn: paymentAPI.getPaymentIntent,
  });

  const initializePayment = async (shippingDetails?: CreatePaymentIntentData['shipping']) => {
    if (!cart?.items?.length || !user) {
      throw new Error('Cart is empty or user is not authenticated');
    }

    const paymentData: CreatePaymentIntentData = {
      amount: totalPrice,
      currency: 'gbp',
      items: cart.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
      })),
      shipping: shippingDetails,
    };

    return createPaymentIntentMutation.mutateAsync(paymentData);
  };

  const confirmPayment = async (paymentIntentId: string) => {
    return getPaymentIntentMutation.mutateAsync(paymentIntentId);
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    // Clear cart after successful payment
    clearCart();
    
    // You can add additional success handling here
    console.log('Payment successful:', paymentIntent.id);
  };

  return {
    // State
    clientSecret,
    
    // Actions
    initializePayment,
    confirmPayment,
    handlePaymentSuccess,
    
    // Loading states
    isCreatingPaymentIntent: createPaymentIntentMutation.isPending,
    isRetrievingPaymentIntent: getPaymentIntentMutation.isPending,
    
    // Error states
    createPaymentError: createPaymentIntentMutation.error,
    retrievePaymentError: getPaymentIntentMutation.error,
    
    // Success states
    paymentIntentData: createPaymentIntentMutation.data,
    paymentStatusData: getPaymentIntentMutation.data,
    
    // Helper
    isReady: Boolean(clientSecret && cart?.items?.length && user),
  };
}