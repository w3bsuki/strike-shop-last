'use client'

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from './payment-form';
import { AddressForm } from './address-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { CartItem } from '@/types/cart';
import type { CheckoutFormData } from '@/lib/stripe/types';

interface CheckoutFormProps {
  cartItems: CartItem[];
}

type CheckoutStep = 'address' | 'payment' | 'confirmation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function CheckoutForm({ cartItems }: CheckoutFormProps) {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [formData, setFormData] = useState<Partial<CheckoutFormData>>({});
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Create payment intent when we have address data
  useEffect(() => {
    if (currentStep === 'payment' && formData.address) {
      createPaymentIntent();
    }
  }, [currentStep, formData.address]);

  const createPaymentIntent = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems,
          shippingAddress: formData.address,
          customerId: formData.email, // You might want to get actual customer ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);

      // Update totals in the UI
      updateOrderSummary(data.totals);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment setup failed');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderSummary = (totals: any) => {
    // Update the order summary with calculated totals
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const taxEl = document.getElementById('checkout-tax');
    const totalEl = document.getElementById('checkout-total');

    if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `$${totals.shipping.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${totals.tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${totals.total.toFixed(2)}`;
  };

  const handleAddressComplete = (addressData: any) => {
    setFormData(prev => ({ ...prev, ...addressData }));
    setCurrentStep('payment');
  };

  const handlePaymentComplete = (result: any) => {
    if (result.success) {
      setCurrentStep('confirmation');
    } else {
      setError(result.error || 'Payment failed');
    }
  };

  const goBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('address');
    }
  };

  const getStepClassName = (step: CheckoutStep) => {
    if (currentStep === step) {
      return 'bg-primary text-primary-foreground';
    }
    if (
      (step === 'address' && ['payment', 'confirmation'].includes(currentStep)) ||
      (step === 'payment' && currentStep === 'confirmation')
    ) {
      return 'bg-success text-success-foreground';
    }
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStepClassName('address')}`}>
            {['payment', 'confirmation'].includes(currentStep) ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <span className="ml-2 text-sm font-medium">Address</span>
        </div>
        
        <div className="w-12 h-px bg-border" />
        
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStepClassName('payment')}`}>
            {currentStep === 'confirmation' ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <span className="ml-2 text-sm font-medium">Payment</span>
        </div>
        
        <div className="w-12 h-px bg-border" />
        
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStepClassName('confirmation')}`}>
            3
          </div>
          <span className="ml-2 text-sm font-medium">Confirmation</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 'address' && 'Shipping Address'}
            {currentStep === 'payment' && 'Payment Information'}
            {currentStep === 'confirmation' && 'Order Confirmation'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 'address' && (
            <AddressForm 
              onComplete={handleAddressComplete}
              loading={loading}
            />
          )}
          
          {currentStep === 'payment' && clientSecret && (
            <Elements 
              stripe={stripePromise} 
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: 'var(--color-primary)',
                    colorBackground: 'var(--color-background)',
                    colorText: 'var(--color-foreground)',
                    colorDanger: 'var(--color-destructive)',
                    fontFamily: 'system-ui, sans-serif',
                    borderRadius: '6px',
                  },
                },
              }}
            >
              <PaymentForm
                paymentIntentId={paymentIntentId}
                formData={formData}
                onComplete={handlePaymentComplete}
                onBack={goBack}
              />
            </Elements>
          )}
          
          {currentStep === 'payment' && !clientSecret && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-border border-t-primary rounded-full" />
              <span className="ml-3 text-muted-foreground">Setting up payment...</span>
            </div>
          )}
          
          {currentStep === 'confirmation' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Order Confirmed!</h3>
              <p className="text-muted-foreground mb-6">
                Thank you for your order. You'll receive a confirmation email shortly.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Continue Shopping
                </Button>
                <Button onClick={() => window.location.href = '/account'}>
                  View Orders
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep === 'payment' && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={goBack} disabled={loading}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Address
          </Button>
        </div>
      )}
    </div>
  );
}