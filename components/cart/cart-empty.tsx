import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartEmptyProps {
  onCloseCart: () => void;
}

export function CartEmpty({ onCloseCart }: CartEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-bold mb-2">Your cart is empty</h3>
      <p className="text-sm text-[var(--subtle-text-color)] mb-6">
        Add some items to get started
      </p>
      <Button onClick={onCloseCart} className="button-primary">
        Continue Shopping
      </Button>
    </div>
  );
}