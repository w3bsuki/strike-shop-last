// Step 7: Simple size selector component - KISS principle (under 50 lines)
import { Button } from '@/components/ui/button';

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
  className?: string;
}

export function SizeSelector({ 
  sizes, 
  selectedSize, 
  onSizeSelect, 
  className = '' 
}: SizeSelectorProps) {
  if (!sizes || sizes.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-sm font-medium mb-4">Size</h3>
      <div className="grid grid-cols-5 gap-2">
        {sizes.map((size) => (
          <Button
            key={size}
            variant={selectedSize === size ? 'default' : 'outline'}
            onClick={() => onSizeSelect(size)}
            className={`
              ${selectedSize === size 
                ? 'bg-black text-white hover:bg-gray-800' 
                : 'bg-white text-black hover:bg-gray-100'
              }
            `}
          >
            {size}
          </Button>
        ))}
      </div>
    </div>
  );
}