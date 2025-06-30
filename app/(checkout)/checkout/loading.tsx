import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { CheckoutFormSkeleton, OrderSummarySkeleton } from '@/components/ui/loading-skeleton';

export default function CheckoutLoading() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white min-h-screen">
        <div className="section-padding">
          <div className="strike-container">
            <div className="max-w-6xl mx-auto">
              {/* Header skeleton */}
              <div className="mb-8">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Progress steps skeleton */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                      <div className="ml-2 h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      {step < 3 && <div className="w-16 h-px bg-gray-300 ml-4" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Column - Form skeleton */}
                <div>
                  <CheckoutFormSkeleton />
                </div>

                {/* Right Column - Order Summary skeleton */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <OrderSummarySkeleton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}