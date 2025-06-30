'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCart, useCartActions } from '@/hooks/use-cart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface MiniCartProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MiniCart({ trigger, isOpen, onOpenChange }: MiniCartProps) {
  const { cart } = useCart();
  const { updateItemQuantity, removeItem } = useCartActions();
  
  // Calculate totals from cart
  const totalItems = cart?.items?.reduce((total, item) => total + (item.quantity as any), 0) || 0;
  const totalPrice = cart?.items?.reduce((total, item) => {
    const price = item.pricing?.totalPrice as any as number || 0;
    return total + price;
  }, 0) || 0;
  
  const isUpdatingItem = false; // TODO: Add loading state
  const isRemovingItem = false; // TODO: Add loading state
  const [localOpen, setLocalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Use external control if provided, otherwise use local state
  const open = isOpen !== undefined ? isOpen : localOpen;
  const setOpen = onOpenChange || setLocalOpen;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't auto-open cart - let user control when to open

  const defaultTrigger = (
    <button className="relative p-2 touch-manipulation" aria-label={`Shopping cart with ${totalItems} items`}>
      <ShoppingBag className="h-6 w-6" />
      <span suppressHydrationWarning>
        {isClient && totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-mono">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </span>
    </button>
  );

  const formatPrice = (price: number | string) => {
    // If it's already a formatted string, return it
    if (typeof price === 'string') {
      return price;
    }
    // Otherwise format the number
    return `£${price.toFixed(2)}`;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center justify-between font-mono text-sm font-bold uppercase tracking-wider">
            <span>Shopping Bag ({totalItems})</span>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        {cart?.items?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider mb-2">
              Your bag is empty
            </h3>
            <p className="text-xs text-gray-500 text-center mb-6 font-mono">
              Start shopping to add items to your bag
            </p>
            <Button asChild className="w-full">
              <Link href="/" onClick={() => setOpen(false)}>
                CONTINUE SHOPPING
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {cart?.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <div className="relative w-20 h-24 bg-gray-100 flex-shrink-0">
                      <Image
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-mono text-xs font-bold uppercase tracking-wider truncate">
                        {item.name}
                      </h4>
                      {item.size && (
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          Size: {item.size}
                        </p>
                      )}
                      <p className="font-mono text-sm font-bold mt-2">
                        {item.pricing?.displayTotalPrice || formatPrice(0)}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <button
                            className="border border-gray-300 hover:border-black min-h-touch min-w-touch flex items-center justify-center touch-manipulation transition-colors"
                            onClick={() => updateItemQuantity(item.id as any, Math.max(1, (item.quantity as any) - 1))}
                            disabled={isUpdatingItem || (item.quantity as any) <= 1}
                          >
                            <Minus className="h-5 w-5" />
                          </button>
                          <span className="text-xs font-mono w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            className="border border-gray-300 hover:border-black min-h-touch min-w-touch flex items-center justify-center touch-manipulation transition-colors"
                            onClick={() => updateItemQuantity(item.id as any, (item.quantity as any) + 1)}
                            disabled={isUpdatingItem}
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <button
                          className="text-gray-400 hover:text-red-500 p-1 touch-manipulation transition-colors"
                          onClick={() => removeItem(item.id as any)}
                          disabled={isRemovingItem}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Footer */}
            <div className="border-t p-6 space-y-4">
              <div className="flex justify-between items-center font-mono">
                <span className="text-sm font-bold uppercase tracking-wider">
                  Subtotal
                </span>
                <span className="text-lg font-bold">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              
              <p className="text-xs text-gray-500 font-mono text-center">
                Shipping and taxes calculated at checkout
              </p>
              
              <div className="space-y-2">
                <Button asChild className="w-full" size="lg">
                  <Link href="/checkout" onClick={() => setOpen(false)}>
                    CHECKOUT
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full" size="lg">
                  <Link href="/cart" onClick={() => setOpen(false)}>
                    VIEW BAG
                  </Link>
                </Button>
              </div>
              
              <div className="text-center">
                <button
                  className="text-xs text-gray-500 hover:text-gray-700 font-mono underline transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}