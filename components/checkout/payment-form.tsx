'use client'

import { useState } from 'react';
import { 
  PaymentElement, 
  useStripe, 
  useElements,
  ExpressCheckoutElement
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';
import type { CheckoutFormData } from '@/lib/stripe/types';

interface PaymentFormProps {
  paymentIntentId: string;
  formData: Partial<CheckoutFormData>;
  onComplete: (result: { success: boolean; error?: string }) => void;
  onBack: () => void;
}

export function PaymentForm({ 
  paymentIntentId, 
  formData, 
  onComplete, 
  onBack 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [expressPaymentType, setExpressPaymentType] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Update payment intent with form data
      await fetch('/api/payments/create-intent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          checkoutData: formData,
        }),
      });

      // Confirm payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        onComplete({ success: false, error: confirmError.message });
      } else {
        onComplete({ success: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
      onComplete({ success: false, error: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExpressPayment = async (event: any) => {
    setExpressPaymentType(event.expressPaymentType);
    
    if (!stripe) {
      return;
    }

    try {
      if (!elements) {
        throw new Error('Elements not initialized');
      }
      
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setError(error.message || 'Express payment failed');
      } else {
        onComplete({ success: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Express payment failed';
      setError(errorMessage);
    }
  };

  const expressCheckoutOptions = {
    buttonHeight: 48,
  };

  return (
    <div className="space-y-6">
      {/* Express Checkout Options */}
      <div>
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground mb-4">Express checkout</p>
        </div>
        
        <ExpressCheckoutElement 
          options={expressCheckoutOptions}
          onConfirm={handleExpressPayment}
        />
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">Or pay with card</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex items-center mb-3">
            <CreditCard className="w-5 h-5 mr-2 text-muted-foreground" />
            <h3 className="text-lg font-medium">Payment Details</h3>
          </div>
          
          <PaymentElement 
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
              fields: {
                billingDetails: 'never', // We already collected this
              },
              terms: {
                card: 'never',
              },
            }}
          />
        </div>

        {/* Order Summary Info */}
        <div className="bg-muted p-4 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Billing Address:</span>
            <span className="font-medium">
              {formData.address?.line1}, {formData.address?.city}, {formData.address?.state}
            </span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-start space-x-2 p-3 bg-info/10 rounded-md">
          <Lock className="w-4 h-4 text-info mt-0.5" />
          <div className="text-sm text-info-foreground">
            <p className="font-medium">Your payment is secure</p>
            <p className="text-info">
              We use industry-standard SSL encryption to protect your payment information.
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            disabled={isProcessing}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Address
          </Button>
          
          <Button 
            type="submit" 
            size="lg"
            disabled={!stripe || isProcessing}
            className="min-w-[160px]"
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                Processing...
              </div>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Complete Order
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Payment Method Logos */}
      <div className="pt-6 border-t">
        <p className="text-xs text-muted-foreground text-center mb-3">We accept</p>
        <div className="flex justify-center space-x-4 opacity-60">
          {/* Visa */}
          <div className="w-10 h-6 bg-muted rounded flex items-center justify-center">
            <span className="text-xs font-bold">VISA</span>
          </div>
          {/* Mastercard */}
          <div className="w-10 h-6 bg-muted rounded flex items-center justify-center">
            <span className="text-xs font-bold">MC</span>
          </div>
          {/* American Express */}
          <div className="w-10 h-6 bg-muted rounded flex items-center justify-center">
            <span className="text-xs font-bold">AMEX</span>
          </div>
          {/* Apple Pay */}
          <div className="w-10 h-6 bg-muted rounded flex items-center justify-center">
            <span className="text-xs font-bold">🍎</span>
          </div>
          {/* Google Pay */}
          <div className="w-10 h-6 bg-muted rounded flex items-center justify-center">
            <span className="text-xs font-bold">G</span>
          </div>
        </div>
      </div>
    </div>
  );
}