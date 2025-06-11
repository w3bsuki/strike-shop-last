"use client"

import type React from "react"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useCartStore } from "@/lib/cart-store"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Lock, CreditCard, Truck, Shield } from "lucide-react"

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(price)
  }

  const subtotal = getTotalPrice()
  const shipping = subtotal > 100 ? 0 : 10
  const tax = subtotal * 0.2 // 20% VAT
  const total = subtotal + shipping + tax

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsProcessing(false)
    setOrderComplete(true)
    clearCart()
  }

  if (orderComplete) {
    return (
      <main className="bg-white min-h-screen">
        <Header />
        <div className="section-padding">
          <div className="strike-container max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-[var(--subtle-text-color)]">
                Thank you for your purchase. You'll receive a confirmation email shortly.
              </p>
            </div>
            <div className="space-y-4">
              <Link href="/">
                <Button className="button-primary">Continue Shopping</Button>
              </Link>
              <Link href="/account/orders">
                <Button className="button-secondary">View Order Status</Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="bg-white min-h-screen">
        <Header />
        <div className="section-padding">
          <div className="strike-container max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-[var(--subtle-text-color)] mb-8">Add some items to your cart before checking out.</p>
            <Link href="/">
              <Button className="button-primary">Continue Shopping</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
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
              <h1 className="text-2xl font-bold uppercase tracking-wider">Checkout</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Checkout Form */}
              <div className="space-y-8">
                <form onSubmit={handleSubmitOrder} className="space-y-8">
                  {/* Contact Information */}
                  <div>
                    <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">Contact Information</h2>
                    <div className="space-y-4">
                      <Input placeholder="Email address" type="email" required className="input-field" />
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="newsletter" className="h-4 w-4" />
                        <label htmlFor="newsletter" className="text-sm text-[var(--subtle-text-color)]">
                          Email me with news and offers
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">Shipping Address</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="First name" required className="input-field" />
                      <Input placeholder="Last name" required className="input-field" />
                      <Input placeholder="Address" required className="input-field md:col-span-2" />
                      <Input placeholder="Apartment, suite, etc. (optional)" className="input-field md:col-span-2" />
                      <Input placeholder="City" required className="input-field" />
                      <Input placeholder="Postal code" required className="input-field" />
                      <select required className="input-field md:col-span-2">
                        <option value="">Select country</option>
                        <option value="GB">United Kingdom</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                  </div>

                  {/* Shipping Method */}
                  <div>
                    <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">Shipping Method</h2>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 border border-subtle cursor-pointer hover:border-black">
                        <div className="flex items-center">
                          <input type="radio" name="shipping" value="standard" defaultChecked className="mr-3" />
                          <div>
                            <div className="font-medium">Standard Shipping</div>
                            <div className="text-sm text-[var(--subtle-text-color)]">5-7 business days</div>
                          </div>
                        </div>
                        <span className="font-bold">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                      </label>
                      <label className="flex items-center justify-between p-4 border border-subtle cursor-pointer hover:border-black">
                        <div className="flex items-center">
                          <input type="radio" name="shipping" value="express" className="mr-3" />
                          <div>
                            <div className="font-medium">Express Shipping</div>
                            <div className="text-sm text-[var(--subtle-text-color)]">2-3 business days</div>
                          </div>
                        </div>
                        <span className="font-bold">£15.00</span>
                      </label>
                    </div>
                  </div>

                  {/* Payment */}
                  <div>
                    <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">Payment</h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-sm text-[var(--subtle-text-color)]">
                        <Lock className="h-4 w-4" />
                        <span>Your payment information is secure and encrypted</span>
                      </div>
                      <Input placeholder="Card number" required className="input-field" />
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="MM / YY" required className="input-field" />
                        <Input placeholder="CVV" required className="input-field" />
                      </div>
                      <Input placeholder="Name on card" required className="input-field" />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={isProcessing} className="button-primary w-full !py-4 text-base">
                    {isProcessing ? "Processing..." : `Complete Order - ${formatPrice(total)}`}
                  </Button>
                </form>
              </div>

              {/* Order Summary */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="bg-gray-50 p-6 space-y-6">
                  <h2 className="text-lg font-bold uppercase tracking-wider">Order Summary</h2>

                  {/* Items */}
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="flex space-x-4">
                        <div className="relative w-16 h-20 bg-white flex-shrink-0">
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                          <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium mb-1">"{item.name}"</h3>
                          <p className="text-xs text-[var(--subtle-text-color)]">Size: {item.size}</p>
                          <p className="text-sm font-bold">{item.price}</p>
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
                      <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
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
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-subtle">
                    <div className="text-center">
                      <Truck className="h-6 w-6 mx-auto mb-1 text-[var(--subtle-text-color)]" />
                      <div className="text-xs text-[var(--subtle-text-color)]">Free Shipping</div>
                    </div>
                    <div className="text-center">
                      <Shield className="h-6 w-6 mx-auto mb-1 text-[var(--subtle-text-color)]" />
                      <div className="text-xs text-[var(--subtle-text-color)]">Secure Payment</div>
                    </div>
                    <div className="text-center">
                      <CreditCard className="h-6 w-6 mx-auto mb-1 text-[var(--subtle-text-color)]" />
                      <div className="text-xs text-[var(--subtle-text-color)]">Easy Returns</div>
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
  )
}
