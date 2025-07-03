'use client';

import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { EnhancedCheckoutForm } from '@/components/checkout/enhanced-checkout-form';
import { MobileOptimizedForm } from '@/components/checkout/mobile-optimized-form';
import { useMobile } from '@/hooks/use-mobile';

export default function SimpleCheckoutPage() {
  const isMobile = useMobile();

  const handleSubmit = (data: any) => {
    console.log('Checkout form submitted:', data);
    // Handle checkout logic here
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    console.log('Payment successful:', paymentIntent);
    // Handle successful payment - redirect to success page
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment failed:', error);
    // Handle payment error - show error message
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-typewriter uppercase">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order securely</p>
        </div>

        {/* Use mobile optimized form on mobile devices */}
        {isMobile ? (
          <MobileOptimizedForm onSubmit={handleSubmit} />
        ) : (
          <EnhancedCheckoutForm
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}