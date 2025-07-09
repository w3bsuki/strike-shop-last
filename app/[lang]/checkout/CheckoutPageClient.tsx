'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { useCart } from '@/lib/stores';
import { SupabaseAuthProvider } from '@/lib/supabase/auth-provider';
import { formatCurrency, type Currency } from '@/lib/shopify/payment-config';
import type { CartItem as CheckoutCartItem } from '@/types/cart';
import type { CartItem as StoreCartItem } from '@/types/store';

interface CheckoutPageClientProps {
  locale: string;
}

// Convert store cart items to checkout cart items
function convertCartItems(storeItems: StoreCartItem[]): CheckoutCartItem[] {
  return storeItems.map((item) => ({
    id: item.lineItemId,
    quantity: item.quantity,
    merchandise: {
      id: item.variantId,
      title: item.name,
      price: {
        amount: item.pricing.unitPrice.toString(),
        currencyCode: 'EUR'
      },
      product: {
        id: item.id,
        title: item.name,
        handle: item.slug,
        images: {
          nodes: item.image ? [{
            url: item.image,
            altText: item.name
          }] : []
        }
      }
    }
  }));
}

export default function CheckoutPageClient({ locale }: CheckoutPageClientProps) {
  const cart = useCart();
  const router = useRouter();
  
  // Get user's preferred currency from localStorage or default to EUR
  const currency = (typeof window !== 'undefined' ? localStorage.getItem('preferredCurrency') : null) || 'EUR';
  
  // Convert cart items to checkout format
  const checkoutItems = convertCartItems(cart.items || []);

  // Redirect to cart if empty
  useEffect(() => {
    if (cart.items && cart.items.length === 0) {
      router.push(`/${locale}/cart`);
    }
  }, [cart.items, locale, router]);

  // Don't render anything if cart is empty (will redirect)
  if (!cart.items || cart.items.length === 0) {
    return null;
  }

  const subtotal = cart.items.reduce((sum: number, item: any) => {
    const price = typeof item.pricing.totalPrice === 'number' 
      ? item.pricing.totalPrice 
      : Number(item.pricing.totalPrice) || 0;
    return sum + price;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-typewriter uppercase">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-7">
            <SupabaseAuthProvider>
              <CheckoutForm cartItems={checkoutItems} />
            </SupabaseAuthProvider>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-8">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cart.items.map((item: any) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">
                          {item.name}
                        </h3>
                        {item.size && item.size !== 'One Size' && (
                          <p className="text-sm text-gray-500">
                            Size: {item.size}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-500">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-medium">
                            {item.pricing.displayTotalPrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span id="checkout-subtotal">
                      {formatCurrency(subtotal / 100, currency as Currency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span id="checkout-shipping">Free</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span id="checkout-tax">Calculated at next step</span>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span id="checkout-total">
                        {formatCurrency(subtotal / 100, currency as Currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security badges */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span>SSL Secured</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Shopify Checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}