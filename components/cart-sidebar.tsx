"use client"

import { useCartStore } from "@/lib/cart-store"
import Image from "next/image"
import Link from "next/link"
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CartSidebar() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotalItems, getTotalPrice } = useCartStore()

  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(price)
  }

  const subtotal = getTotalPrice()
  const shipping = subtotal > 100 ? 0 : 10
  const total = subtotal + shipping

  return (
    <div className="fixed inset-0 z-[300] lg:z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCart} />

      {/* Cart Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Cart ({getTotalItems()})</h2>
          </div>
          <button onClick={closeCart} aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold mb-2">Your cart is empty</h3>
              <p className="text-sm text-[var(--subtle-text-color)] mb-6">Add some items to get started</p>
              <Button onClick={closeCart} className="button-primary">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex space-x-4">
                  <div className="relative w-20 h-24 bg-gray-100 flex-shrink-0">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="block hover:text-[var(--subtle-text-color)]"
                    >
                      <h3 className="text-sm font-medium mb-1 line-clamp-2">"{item.name}"</h3>
                    </Link>
                    <p className="text-xs text-[var(--subtle-text-color)] mb-2">Size: {item.size}</p>
                    {item.sku && <p className="text-xs text-[var(--subtle-text-color)] font-mono mb-2">{item.sku}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          className="p-1 border border-subtle hover:border-black"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          className="p-1 border border-subtle hover:border-black"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.size)}
                        className="p-1 text-[var(--subtle-text-color)] hover:text-red-600"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold">{item.price}</span>
                      {item.originalPrice && (
                        <span className="text-xs text-[var(--subtle-text-color)] line-through">
                          {item.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-subtle p-6 space-y-4">
            {/* Shipping Notice */}
            {subtotal < 100 && (
              <div className="text-xs text-[var(--subtle-text-color)] text-center p-2 bg-gray-50">
                Add {formatPrice(100 - subtotal)} more for free shipping
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-subtle pt-2">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/checkout" onClick={closeCart}>
                <Button className="button-primary w-full !py-3">Checkout</Button>
              </Link>
              <Button onClick={closeCart} className="button-secondary w-full !py-2">
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
