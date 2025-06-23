'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useCartStore } from '@/lib/cart-store';
import { useUser } from '@/lib/clerk-mock';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Truck, Shield } from 'lucide-react';
import { EnhancedCheckoutForm } from '@/components/checkout/enhanced-checkout-form';
// TODO: Implement dynamic import after resolving TypeScript configuration issues
// The dynamic import pattern is ready but requires tsconfig adjustments
import { medusaClient } from '@/lib/medusa';
import { toast } from '@/hooks/use-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, cartId } = useCartStore();
  const { user, isSignedIn } = useUser();
  const [step, setStep] = useState<'information' | 'shipping' | 'payment'>(
    'information'
  );
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);

  // Form data
  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    first_name: '',
    last_name: '',
    address_1: '',
    address_2: '',
    city: '',
    postal_code: '',
    country_code: 'GB',
    phone: '',
  });
  const [shippingMethod, setShippingMethod] = useState<string | null>(null);
  const [availableShippingOptions, setAvailableShippingOptions] = useState<
    Array<{ id: string; name: string; amount: number; metadata?: { delivery_time?: string } }>
  >([]);

  // Initialize with user data if signed in
  useEffect(() => {
    if (isSignedIn && user) {
      setEmail('user@example.com');
      setShippingAddress((prev) => ({
        ...prev,
        first_name: 'John',
        last_name: 'Doe',
        phone: '',
      }));
    }
  }, [isSignedIn, user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !cartId) {
      router.push('/');
    }
  }, [items, cartId, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price / 100);
  };

  const subtotal = getTotalPrice() * 100; // Convert to cents for formatPrice
  const shipping = shippingMethod
    ? availableShippingOptions.find((opt) => opt.id === shippingMethod)
        ?.amount || 0
    : 0;
  const tax = Math.round(subtotal * 0.2); // 20% VAT
  const total = subtotal + shipping + tax;

  const handleInformationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cartId) return;

    setIsUpdatingCart(true);
    try {
      // Update cart with email and shipping address
      await medusaClient.store.cart.update(cartId, {
        email,
        shipping_address: shippingAddress,
        billing_address: shippingAddress, // Use same for billing
      });

      // Add shipping methods to cart
      await medusaClient.store.cart.addShippingMethod(cartId, {
          option_id: shippingMethod!,
        });
      // const updatedCart = updatedCartResponse.cart;

      // TODO: Fetch available shipping options when Medusa v2 API is available
      // For now, use default shipping options
      setAvailableShippingOptions([]);

      setStep('shipping');
    } catch (error) {
      // Error updating cart
      toast({
        title: 'Error',
        description: 'Failed to update shipping information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingCart(false);
    }
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cartId || !shippingMethod) return;

    setIsUpdatingCart(true);
    try {
      // Add selected shipping method to cart
      await medusaClient.store.cart.addShippingMethod(cartId, {
        option_id: shippingMethod,
      });

      setStep('payment');
    } catch (error) {
      // Error setting shipping method
      toast({
        title: 'Error',
        description: 'Failed to set shipping method. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingCart(false);
    }
  };

  const handleOrderSuccess = (order: { id: string }) => {
    // Redirect to order confirmation page
    router.push(`/order-confirmation?order_id=${order.id}`);
  };

  if (items.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="bg-white min-h-screen">
      <Header />
      <div className="section-padding">
        <div className="strike-container">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-[var(--subtle-text-color)] hover:text-black mb-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Continue Shopping
              </Link>
              <h1 className="text-2xl font-bold uppercase tracking-wider">
                Checkout
              </h1>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center ${step === 'information' ? 'text-black' : 'text-gray-400'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step === 'information'
                        ? 'bg-black text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">Information</span>
                </div>
                <div className="w-16 h-px bg-gray-300" />
                <div
                  className={`flex items-center ${step === 'shipping' ? 'text-black' : 'text-gray-400'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step === 'shipping'
                        ? 'bg-black text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Shipping</span>
                </div>
                <div className="w-16 h-px bg-gray-300" />
                <div
                  className={`flex items-center ${step === 'payment' ? 'text-black' : 'text-gray-400'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step === 'payment' ? 'bg-black text-white' : 'bg-gray-200'
                    }`}
                  >
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium">Payment</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column - Forms */}
              <div className="space-y-8">
                {step === 'information' && (
                  <form
                    onSubmit={handleInformationSubmit}
                    className="space-y-8"
                  >
                    {/* Contact Information */}
                    <div>
                      <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">
                        Contact Information
                      </h2>
                      <div className="space-y-4">
                        <Input
                          placeholder="Email address"
                          type="email"
                          required
                          className="input-field"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">
                        Shipping Address
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          placeholder="First name"
                          required
                          className="input-field"
                          value={shippingAddress.first_name}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              first_name: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="Last name"
                          required
                          className="input-field"
                          value={shippingAddress.last_name}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              last_name: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="Address"
                          required
                          className="input-field md:col-span-2"
                          value={shippingAddress.address_1}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              address_1: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="Apartment, suite, etc. (optional)"
                          className="input-field md:col-span-2"
                          value={shippingAddress.address_2}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              address_2: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="City"
                          required
                          className="input-field"
                          value={shippingAddress.city}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              city: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="Postal code"
                          required
                          className="input-field"
                          value={shippingAddress.postal_code}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              postal_code: e.target.value,
                            })
                          }
                        />
                        <select
                          required
                          className="input-field md:col-span-2"
                          value={shippingAddress.country_code}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              country_code: e.target.value,
                            })
                          }
                        >
                          <option value="GB">United Kingdom</option>
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="AU">Australia</option>
                        </select>
                        <Input
                          placeholder="Phone (optional)"
                          type="tel"
                          className="input-field md:col-span-2"
                          value={shippingAddress.phone}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isUpdatingCart}
                      className="button-primary w-full !py-4 text-base"
                    >
                      Continue to Shipping
                    </Button>
                  </form>
                )}

                {step === 'shipping' && (
                  <form onSubmit={handleShippingSubmit} className="space-y-8">
                    <div>
                      <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">
                        Shipping Method
                      </h2>
                      <div className="space-y-3">
                        {availableShippingOptions.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            Loading shipping options...
                          </div>
                        ) : (
                          availableShippingOptions.map((option) => (
                            <label
                              key={option.id}
                              className="flex items-center justify-between p-4 border border-subtle cursor-pointer hover:border-black"
                            >
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name="shipping"
                                  value={option.id}
                                  checked={shippingMethod === option.id}
                                  onChange={(e) =>
                                    setShippingMethod(e.target.value)
                                  }
                                  className="mr-3"
                                />
                                <div>
                                  <div className="font-medium">
                                    {option.name}
                                  </div>
                                  {option.metadata?.delivery_time && (
                                    <div className="text-sm text-[var(--subtle-text-color)]">
                                      {option.metadata.delivery_time}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="font-bold">
                                {option.amount === 0
                                  ? 'Free'
                                  : formatPrice(option.amount)}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        onClick={() => setStep('information')}
                        className="button-secondary flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={!shippingMethod || isUpdatingCart}
                        className="button-primary flex-1"
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </form>
                )}

                {step === 'payment' && (
                  <div className="space-y-8">
                    <EnhancedCheckoutForm
                      onPaymentSuccess={handleOrderSuccess}
                      onPaymentError={(error) => {
                        // Payment error occurred
                        toast({
                          title: 'Payment Failed',
                          description: error.message || 'An error occurred during payment.',
                          variant: 'destructive',
                        });
                      }}
                    />

                    <Button
                      type="button"
                      onClick={() => setStep('shipping')}
                      className="button-secondary w-full"
                    >
                      Back to Shipping
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="bg-gray-50 p-6 space-y-6">
                  <h2 className="text-lg font-bold uppercase tracking-wider">
                    Order Summary
                  </h2>

                  {/* Items */}
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.lineItemId} className="flex space-x-4">
                        <div className="relative w-16 h-20 bg-white flex-shrink-0">
                          <Image
                            src={item.image || '/placeholder.svg'}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                          <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium mb-1 line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-xs text-[var(--subtle-text-color)]">
                            Size: {item.size}
                          </p>
                          <p className="text-sm font-bold">
                            {item.pricing.displayTotalPrice}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 pt-4 border-t border-subtle">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>
                        {shipping === 0 ? 'Free' : formatPrice(shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (VAT)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-subtle pt-2">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-subtle">
                    <div className="text-center">
                      <Truck className="h-6 w-6 mx-auto mb-1 text-[var(--subtle-text-color)]" />
                      <div className="text-xs text-[var(--subtle-text-color)]">
                        Fast Delivery
                      </div>
                    </div>
                    <div className="text-center">
                      <Shield className="h-6 w-6 mx-auto mb-1 text-[var(--subtle-text-color)]" />
                      <div className="text-xs text-[var(--subtle-text-color)]">
                        Secure Checkout
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
