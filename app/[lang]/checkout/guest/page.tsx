'use client';

import { useCart, useCartTotalPrice } from '@/lib/stores';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { OrderSummary } from '@/components/checkout/order-summary';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { CartItem as CheckoutCartItem } from '@/types/cart';
import type { CartItem as StoreCartItem } from '@/types/store';

// Transform store cart items to checkout format
function transformCartItemsForCheckout(storeItems: StoreCartItem[]): CheckoutCartItem[] {
  return storeItems.map(item => ({
    id: String(item.lineItemId),
    quantity: Number(item.quantity),
    merchandise: {
      id: String(item.variantId),
      title: item.size,
      price: {
        amount: String(item.pricing.unitPrice / 100),
        currencyCode: 'EUR'
      },
      product: {
        id: String(item.id),
        title: item.name,
        handle: String(item.slug),
        images: {
          nodes: item.image ? [{
            url: String(item.image),
            altText: item.name
          }] : []
        }
      }
    }
  }));
}

export default function GuestCheckoutPage() {
  const { items } = useCart();
  const totalPrice = useCartTotalPrice();
  const checkoutItems = transformCartItemsForCheckout(items);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-typewriter mb-4">Your cart is empty</h1>
          <Link href="/">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-black mb-4 inline-block">
            ← Back to shop
          </Link>
          <h1 className="text-3xl font-typewriter font-bold">CHECKOUT</h1>
          <p className="text-gray-600 mt-2">Complete your order as a guest</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Checkout Form */}
          <div>
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
              <p className="text-sm">
                Already have an account?{' '}
                <Link href="/auth/login?redirect=/checkout" className="underline font-semibold">
                  Sign in
                </Link>
                {' '}for faster checkout
              </p>
            </div>
            
            <CheckoutForm
              cartItems={checkoutItems}
            />
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="sticky top-8">
              <OrderSummary 
                items={items}
                subtotal={totalPrice}
                shipping={0} // Free shipping
                tax={0} // Calculated after address
                showEditCart={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}