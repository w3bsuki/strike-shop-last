import { CartItem } from '@/types/store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping?: number;
  tax?: number;
  showEditCart?: boolean;
}

export function OrderSummary({ 
  items, 
  subtotal, 
  shipping = 0, 
  tax = 0,
  showEditCart = false 
}: OrderSummaryProps) {
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-muted p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-typewriter font-bold">ORDER SUMMARY</h2>
        {showEditCart && (
          <Link href="/cart">
            <Button variant="ghost" size="sm">Edit</Button>
          </Link>
        )}
      </div>

      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={`${item.id}-${item.size}`} className="flex gap-4">
            <div className="w-16 h-20 bg-muted rounded overflow-hidden">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-typewriter text-sm font-medium">{item.name}</h3>
              <p className="text-xs text-muted-foreground">
                Size: {item.size} | Qty: {item.quantity}
              </p>
              <p className="text-sm font-medium mt-1">
                ${(item.pricing.unitPrice * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
        </div>
        
        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
        )}
        
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between font-typewriter font-bold text-lg">
            <span>TOTAL</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>Secure checkout</span>
      </div>
    </div>
  );
}