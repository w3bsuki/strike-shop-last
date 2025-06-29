'use client';

import { useState, useEffect } from 'react';
import { Elements, PaymentElement, AddressElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Smartphone, Globe } from 'lucide-react';
import { getStripe, stripeConfig } from '@/lib/stripe-client';
import { useCart } from '@/hooks/use-cart';
import { useUser } from '@/lib/supabase/hooks';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface CheckoutFormProps {
  clientSecret: string;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: any) => void;
}

function CheckoutForm({ clientSecret: _clientSecret, onPaymentSuccess, onPaymentError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'klarna' | 'auto'>('auto');
  const { user } = useUser();
  const { cart, totalPrice } = useCart();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment system is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm payment with Stripe
      const confirmParams: any = {
        return_url: `${window.location.origin}/order-confirmation`,
      };
      
      if (user?.email) {
        confirmParams.receipt_email = user.email;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams,
        redirect: 'if_required',
      });

      if (error) {

        onPaymentError(error);
        toast({
          title: "Payment Failed",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } else if (paymentIntent?.status === 'succeeded') {
        onPaymentSuccess(paymentIntent);
        toast({
          title: "Payment Successful",
          description: "Your order has been confirmed!",
        });
      }
    } catch (err) {

      onPaymentError(err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-4">
          Payment Method
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setPaymentMethod('auto')}
            className={`p-4 border text-left transition-all min-h-touch ${
              paymentMethod === 'auto'
                ? 'border-black bg-gray-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <CreditCard className="h-5 w-5 mb-2" />
            <div className="font-mono text-xs font-bold uppercase">All Methods</div>
            <div className="font-mono text-[10px] text-gray-500">Card, Klarna, etc.</div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-4 border text-left transition-all min-h-touch ${
              paymentMethod === 'card'
                ? 'border-black bg-gray-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <CreditCard className="h-5 w-5 mb-2" />
            <div className="font-mono text-xs font-bold uppercase">Card Only</div>
            <div className="font-mono text-[10px] text-gray-500">Credit/Debit</div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('klarna')}
            className={`p-4 border text-left transition-all min-h-touch ${
              paymentMethod === 'klarna'
                ? 'border-black bg-gray-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Smartphone className="h-5 w-5 mb-2" />
            <div className="font-mono text-xs font-bold uppercase">Buy Now, Pay Later</div>
            <div className="font-mono text-[10px] text-gray-500">Klarna</div>
          </button>
        </div>
      </div>

      {/* Address Element */}
      <div>
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-4">
          Shipping Address
        </h3>
        <div className="border border-gray-300 p-4">
          <AddressElement
            options={{
              mode: 'shipping',
              allowedCountries: ['GB', 'US', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES'],
              blockPoBox: true,
              fields: {
                phone: 'always',
              },
              validation: {
                phone: {
                  required: 'always',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Payment Element */}
      <div>
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-4">
          Payment Details
        </h3>
        <div className="border border-gray-300 p-4">
          <PaymentElement
            options={{
              layout: 'tabs',
              paymentMethodOrder: paymentMethod === 'card' 
                ? ['card'] 
                : paymentMethod === 'klarna'
                ? ['klarna']
                : ['card', 'klarna', 'paypal'],
              business: {
                name: 'STRIKE™',
              },
              fields: {
                billingDetails: {
                  name: 'auto',
                  email: 'auto',
                  phone: 'auto',
                  address: {
                    country: 'auto',
                    line1: 'auto',
                    line2: 'auto',
                    city: 'auto',
                    state: 'auto',
                    postalCode: 'auto',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 p-4 border">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-3">
          Order Summary
        </h3>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span>Subtotal ({cart?.items?.length || 0} items)</span>
            <span>£{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-green-600">FREE</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>£{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-4 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 font-mono text-sm font-bold uppercase tracking-wider min-h-touch-lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            PROCESSING...
          </>
        ) : (
          <>
            <Globe className="h-4 w-4 mr-2" />
            COMPLETE ORDER - £{totalPrice.toFixed(2)}
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500 font-mono">
          🔒 Your payment information is secure and encrypted
        </p>
      </div>
    </form>
  );
}

interface EnhancedCheckoutFormProps {
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: any) => void;
}

export function EnhancedCheckoutForm({ onPaymentSuccess, onPaymentError }: EnhancedCheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { cart, totalPrice } = useCart();
  const { user } = useUser();

  useEffect(() => {
    if (!cart?.items?.length || !user) return;

    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: totalPrice,
            currency: 'gbp',
            items: cart.items.map((item: any) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              size: item.size,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (error) {

        toast({
          title: "Setup Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [cart, totalPrice, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 font-mono text-sm">Initializing payment...</span>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center p-8">
        <p className="font-mono text-sm text-red-600">
          Failed to initialize payment. Please refresh and try again.
        </p>
      </div>
    );
  }

  const stripePromise = getStripe();

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: stripeConfig.appearance,
      }}
    >
      <CheckoutForm
        clientSecret={clientSecret}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
}