import { Metadata } from 'next';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { redirect } from 'next/navigation';
import { getCartItems } from '@/lib/cart/server';
// import Link from 'next/link';
// import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Checkout - STRIKE™',
  description: 'Complete your order securely',
  robots: 'noindex, nofollow',
};

export default async function CheckoutPage() {
  // Get cart items server-side
  const cartItems = await getCartItems();

  // Redirect to cart if empty
  if (!cartItems || cartItems.length === 0) {
    redirect('/cart');
  }

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
            <CheckoutForm cartItems={cartItems} />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-8">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                        {item.merchandise.product.images.nodes[0] && (
                          <img
                            src={item.merchandise.product.images.nodes[0].url}
                            alt={item.merchandise.product.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">
                          {item.merchandise.product.title}
                        </h3>
                        {item.merchandise.title !== 'Default Title' && (
                          <p className="text-sm text-gray-500">
                            {item.merchandise.title}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-500">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-medium">
                            ${(parseFloat(item.merchandise.price.amount) * item.quantity).toFixed(2)}
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
                      ${cartItems.reduce((sum, item) => 
                        sum + (parseFloat(item.merchandise.price.amount) * item.quantity), 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span id="checkout-shipping">Calculated at next step</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span id="checkout-tax">Calculated at next step</span>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span id="checkout-total">
                        ${cartItems.reduce((sum, item) => 
                          sum + (parseFloat(item.merchandise.price.amount) * item.quantity), 0
                        ).toFixed(2)}
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
                      <span>Stripe Verified</span>
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