'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Truck } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState('DEMO-' + Date.now());
  const [isDemo, setIsDemo] = useState(false);
  const { clearCart } = useCartStore();

  // Initialize search params on client side only
  useEffect(() => {
    if (searchParams) {
      setOrderId(searchParams.get('order_id') || 'DEMO-' + Date.now());
      setIsDemo(searchParams.get('demo') === 'true');
    }
  }, [searchParams]);

  // Clear cart on order confirmation
  useEffect(() => {
    if (isDemo) {
      clearCart();
    }
  }, [isDemo, clearCart]);

  return (
    <main className="bg-white min-h-screen">
      <SiteHeader />
      <div className="section-padding">
        <div className="strike-container">
          <div className="max-w-2xl mx-auto text-center py-16">
            {/* Success Icon */}
            <div className="mb-8">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            </div>

            {/* Heading */}
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4">
              Order Confirmed!
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Thank you for your order. We've received your purchase and will process it shortly.
            </p>

            {/* Order Details */}
            <div className="bg-gray-50 p-6 mb-8 text-left">
              <h2 className="font-bold uppercase tracking-wider mb-4">
                Order Details
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Order Number:</span>
                  <span className="font-mono">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                {isDemo && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200">
                    <p className="text-blue-800 text-xs">
                      <strong>Demo Mode:</strong> This is a demonstration order. 
                      No payment was processed.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="text-center p-6 border border-gray-200">
                <Package className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                <h3 className="font-bold mb-2">Processing</h3>
                <p className="text-sm text-gray-600">
                  We'll prepare your order within 1-2 business days
                </p>
              </div>
              <div className="text-center p-6 border border-gray-200">
                <Truck className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                <h3 className="font-bold mb-2">Shipping</h3>
                <p className="text-sm text-gray-600">
                  You'll receive tracking information via email
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Button asChild className="w-full md:w-auto">
                <Link href="/">
                  Continue Shopping
                </Link>
              </Button>
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/account/orders')}
                  className="w-full md:w-auto"
                >
                  View Order Status
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}