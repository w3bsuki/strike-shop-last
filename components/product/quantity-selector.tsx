// Step 7: Simple quantity selector - KISS principle (under 40 lines)
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantitySelector({ 
  quantity, 
  onQuantityChange,
  min = 1,
  max = 10,
  className = ''
}: QuantitySelectorProps) {
  const increment = () => {
    if (quantity < max) onQuantityChange(quantity + 1);
  };

  const decrement = () => {
    if (quantity > min) onQuantityChange(quantity - 1);
  };

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">Quantity</label>
      <div className="flex items-center space-x-4">
        <button
          onClick={decrement}
          className="w-10 h-10 flex items-center justify-center border border-gray-300 hover:border-gray-400 transition-colors"
          disabled={quantity <= min}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-12 text-center">{quantity}</span>
        <button
          onClick={increment}
          className="w-10 h-10 flex items-center justify-center border border-gray-300 hover:border-gray-400 transition-colors"
          disabled={quantity >= max}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}