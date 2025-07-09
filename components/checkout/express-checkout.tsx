'use client';

import { useEffect, useState } from 'react';
import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';
import type { PaymentRequest } from '@stripe/stripe-js';
import { useCart, useCartActions } from '@/hooks/use-cart';
import { Separator } from '@/components/ui/separator';

interface ExpressCheckoutProps {
  onSuccess: () => void;
  className?: string;
}

export function ExpressCheckout({ onSuccess, className = '' }: ExpressCheckoutProps) {
  const stripe = useStripe();
  const { cart } = useCart();
  const { getTotals } = useCartActions();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  const totals = getTotals();

  useEffect(() => {
    if (!stripe || !cart?.items?.length) return;

    const pr = stripe.paymentRequest({
      country: 'GB',
      currency: 'gbp',
      total: {
        label: 'STRIKE™ Total',
        amount: Math.round(totals.total * 100), // Convert to pence
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: true,
      shippingOptions: [
        {
          id: 'standard',
          label: 'Standard Shipping (3-5 days)',
          detail: 'Free shipping',
          amount: 0,
        },
        {
          id: 'express',
          label: 'Express Shipping (1-2 days)',
          detail: 'Fast delivery',
          amount: 995, // £9.95
        },
      ],
    });

    // Check if Apple Pay or Google Pay is available
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });

    // Handle payment method selection
    pr.on('paymentmethod', async (event) => {
      try {
        // Create payment intent
        const response = await fetch('/api/payments/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totals.total,
            currency: 'gbp',
            items: cart.items,
            paymentMethodId: event.paymentMethod.id,
            shipping: event.shippingAddress,
          }),
        });

        const { clientSecret, error } = await response.json();

        if (error) {
          event.complete('fail');
          return;
        }

        // Confirm the payment
        const { error: confirmError } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: event.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          event.complete('fail');
        } else {
          event.complete('success');
          onSuccess();
        }
      } catch (err) {
        event.complete('fail');
      }
    });

  }, [stripe, cart, totals.total, onSuccess]);

  if (!canMakePayment || !paymentRequest) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <PaymentRequestButtonElement
          options={{
            paymentRequest: paymentRequest,
            style: {
              paymentRequestButton: {
                type: 'default',
                theme: 'dark',
                height: '48px',
              },
            },
          }}
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          <span>or continue with form</span>
          <Separator className="flex-1" />
        </div>
      </div>
    </div>
  );
}