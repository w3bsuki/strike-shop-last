import { Suspense } from 'react';
import { Metadata } from 'next';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { CheckoutSuccess } from '@/components/checkout/checkout-success';

export const metadata: Metadata = {
  title: 'Order Confirmed - STRIKE™',
  description: 'Your order has been confirmed',
  robots: 'noindex, nofollow',
};

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-black rounded-full" />
          </div>
        }>
          <CheckoutSuccess />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}