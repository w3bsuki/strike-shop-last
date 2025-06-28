'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Mail, Printer } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { medusaClient } from '@/lib/medusa-service-refactored';
import { useUser } from '@/lib/supabase/hooks';

interface OrderItem {
  id: string;
  title?: string;
  thumbnail?: string;
  quantity?: number;
  unit_price?: number;
  total?: number;
  variant?: {
    title?: string;
  };
}

interface ShippingAddress {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  postal_code?: string;
  country_code?: string;
  phone?: string;
}

interface ShippingMethod {
  shipping_option?: {
    name?: string;
  };
}

interface Order {
  id: string;
  display_id?: string;
  email?: string;
  total?: number;
  subtotal?: number;
  shipping_total?: number;
  tax_total?: number;
  currency_code?: string;
  created_at?: string;
  shipping_address?: ShippingAddress;
  items?: OrderItem[];
  shipping_methods?: ShippingMethod[];
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        // First check if it's a fallback order (starts with order_)
        if (orderId.startsWith('order_')) {
          // This is a fallback order, create a mock display
          setOrder({
            id: orderId,
            display_id: orderId.split('_')[1] || orderId,
            email: user?.email || 'customer@example.com',
            total: 0,
            subtotal: 0,
            shipping_total: 0,
            tax_total: 0,
            currency_code: 'GBP',
            created_at: new Date().toISOString(),
            items: [],
            shipping_methods: [{
              shipping_option: {
                name: 'Econt Express'
              }
            }]
          });
        } else {
          // Try to fetch from Medusa
          const orderResponse = await medusaClient.store.order.retrieve(orderId);
          const medusaOrder = orderResponse.order;
          // Convert Medusa order to our Order interface
          const convertedOrder = {
            id: medusaOrder.id,
            display_id: medusaOrder.display_id?.toString(),
            email: medusaOrder.email || undefined,
            total: medusaOrder.total,
            subtotal: medusaOrder.subtotal,
            shipping_total: medusaOrder.shipping_total,
            tax_total: medusaOrder.tax_total,
            currency_code: medusaOrder.currency_code,
            created_at: medusaOrder.created_at instanceof Date ? medusaOrder.created_at.toISOString() : medusaOrder.created_at,
            shipping_address: medusaOrder.shipping_address || undefined,
            items: medusaOrder.items as OrderItem[] | undefined,
            shipping_methods: medusaOrder.shipping_methods as ShippingMethod[] | undefined,
          };
          setOrder(convertedOrder as Order);
        }
      } catch (_error) {
        // Error fetching order - create a basic fallback
        setOrder({
          id: orderId,
          display_id: orderId,
          email: user?.email || 'customer@example.com',
          total: 0,
          subtotal: 0,
          shipping_total: 0,
          tax_total: 0,
          currency_code: 'GBP',
          created_at: new Date().toISOString(),
          items: [],
          shipping_methods: [{
            shipping_option: {
              name: 'Speedy Express'
            }
          }]
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const formatPrice = (amount: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };


  if (isLoading) {
    return (
      <main className="bg-white min-h-screen">
        <SiteHeader />
        <div className="section-padding">
          <div className="strike-container max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">
              Loading order details...
            </p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen">
      <SiteHeader />
      <div className="section-padding">
        <div className="strike-container max-w-4xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <CheckCircle className="h-20 w-20 text-green-600" />
                <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2">
              Thank You for Your Order!
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Your order has been successfully placed and is being processed.
            </p>
            <p className="text-sm text-gray-500">
              Order number:{' '}
              <span className="font-mono font-bold text-black">
                #{order?.display_id || orderId?.slice(-8).toUpperCase()}
              </span>
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-gray-50 rounded-lg p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Delivery Information
                  </h3>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {order?.shipping_address?.first_name}{' '}
                      {order?.shipping_address?.last_name}
                    </p>
                    <p>{order?.shipping_address?.address_1}</p>
                    {order?.shipping_address?.address_2 && (
                      <p>{order?.shipping_address?.address_2}</p>
                    )}
                    <p>
                      {order?.shipping_address?.city},{' '}
                      {order?.shipping_address?.postal_code}
                    </p>
                    <p>{order?.shipping_address?.country_code}</p>
                    {order?.shipping_address?.phone && (
                      <p className="mt-2">
                        Tel: {order?.shipping_address?.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Shipping Method
                  </h3>
                  <p className="text-sm">
                    {order?.shipping_methods?.[0]?.shipping_option?.name ||
                      'Standard Shipping'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated delivery: 3-5 business days
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Payment Information
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>Payment Method: Card ending in ****</p>
                    <p>
                      Status:{' '}
                      <span className="text-green-600 font-medium">Paid</span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Order Summary
                  </h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(order?.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatPrice(order?.shipping_total || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice(order?.tax_total || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                      <span>Total</span>
                      <span>{formatPrice(order?.total || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          {order?.items && order.items.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 bg-white p-4 rounded-lg border"
                  >
                    <div className="relative w-20 h-24 bg-gray-100 flex-shrink-0">
                      <Image
                        src={item.thumbnail || '/placeholder.svg'}
                        alt={item.title || 'Product image'}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-500">
                        Size: {item.variant?.title || 'N/A'} | Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-bold mt-1">
                        {formatPrice(item.total || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="font-bold mb-3 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              What Happens Next?
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>You&rsquo;ll receive an order confirmation email shortly</li>
              <li>We&rsquo;ll send you shipping updates via email</li>
              <li>Your order will be carefully packed and dispatched</li>
              <li>Track your order status in your account</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="button-primary">Continue Shopping</Button>
            </Link>

            {user && (
              <Link href="/account?tab=orders">
                <Button className="button-secondary">View My Orders</Button>
              </Link>
            )}

            <Button className="button-secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </div>

          {/* Customer Support */}
          <div className="text-center mt-12 text-sm text-gray-600">
            <p>
              Have questions about your order? Contact our support team at{' '}
              <a
                href="mailto:support@strike.com"
                className="font-medium text-black hover:underline"
              >
                support@strike.com
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
