'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { memo } from 'react';

interface CartFooterProps {
  totals: {
    subtotal: number;
    formattedSubtotal: string;
  };
  onCloseCart: () => void;
}

export const CartFooter = memo(function CartFooter({ totals, onCloseCart }: CartFooterProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  const shipping = totals.subtotal > 10000 ? 0 : 1000; // 10000 = £100 in pence
  const total = totals.subtotal + shipping;

  return (
    <div className="border-t border-border p-6 space-y-4">
      {/* Shipping Notice */}
      {totals.subtotal < 10000 && (
        <div className="text-xs text-muted-foreground text-center p-2 bg-muted">
          Add {formatPrice(10000 - totals.subtotal)} more for free shipping
        </div>
      )}

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{totals.formattedSubtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link href="/checkout/simple" onClick={onCloseCart}>
          <Button className="button-primary w-full !py-3">
            Checkout
          </Button>
        </Link>
        <Button
          onClick={onCloseCart}
          className="button-secondary w-full !py-2"
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
});