'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, Heart, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useWishlistActions, useIsWishlisted } from '@/lib/stores';
import { SizeGuideModal } from '@/components/size-guide-modal';
import { toast } from '@/hooks/use-toast';

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    price: string;
    image: string;
    sizes?: string[];
    variants?: any[];
    inventory?: number;
  };
  slug: string;
}

export function EnhancedProductActions({ product, slug }: ProductActionsProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const { addItem, isAddingItem } = useCart();
  const { addToWishlist, removeFromWishlist } = useWishlistActions();
  const isWishlisted = useIsWishlisted(product.id);
  const maxQuantity = product.inventory || 10; // Default max if no inventory data

  // Reset size selection when product changes
  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
  }, [product.id]);

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast({
        title: "Size Required",
        description: "Please select a size before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    // Create cart item matching the expected format
    addItem({
      productId: product.id,
      variantId: `${product.id}-${selectedSize || 'onesize'}`,
      quantity,
    });
    
    toast({
      title: "Added to Cart",
      description: `${product.name} ${selectedSize ? `(${selectedSize})` : ''} has been added to your cart.`,
    });
  };

  const handleWishlistToggle = () => {
    const wishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug,
    };

    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from Wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist(wishlistItem);
      toast({
        title: "Added to Wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  const incrementQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Size Selection */}
      {product.sizes && product.sizes.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
              SIZE
            </h3>
            <SizeGuideModal>
              <button className="text-[10px] underline hover:no-underline text-gray-500 font-mono transition-colors hover:text-gray-700">
                SIZE GUIDE
              </button>
            </SizeGuideModal>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                className={`border p-3 text-xs font-medium transition-all min-h-[44px] touch-manipulation
                  ${selectedSize === size 
                    ? 'bg-black text-white border-black' 
                    : 'border-gray-300 hover:border-black hover:bg-gray-50'
                  }`}
                onClick={() => setSelectedSize(size)}
                aria-pressed={selectedSize === size}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selection */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 font-mono">
          QUANTITY
        </h3>
        <div className="flex items-center space-x-3">
          <button
            className="border border-gray-300 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed min-h-touch min-w-touch flex items-center justify-center touch-manipulation transition-colors"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium w-12 text-center font-mono">
            {quantity}
          </span>
          <button
            className="border border-gray-300 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed min-h-touch min-w-touch flex items-center justify-center touch-manipulation transition-colors"
            onClick={incrementQuantity}
            disabled={quantity >= maxQuantity}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {maxQuantity <= 5 && (
          <p className="text-xs text-orange-600 mt-1 font-mono">
            Only {maxQuantity} left in stock
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleAddToCart}
          disabled={isAddingItem || (!selectedSize && product.sizes && product.sizes.length > 0)}
          className="w-full py-3 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-mono text-xs font-bold uppercase tracking-wider transition-colors min-h-[48px]"
        >
          {isAddingItem ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ADDING...
            </>
          ) : !selectedSize && product.sizes && product.sizes.length > 0 ? (
            'SELECT A SIZE'
          ) : (
            <>
              <ShoppingBag className="h-4 w-4 mr-2" />
              ADD TO BAG
            </>
          )}
        </Button>
        
        <Button
          onClick={handleWishlistToggle}
          variant="outline"
          className="w-full py-3 border-black text-black hover:bg-black hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors min-h-[48px]"
        >
          <Heart
            className={`h-4 w-4 mr-2 transition-colors ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-current'
            }`}
          />
          {isWishlisted ? 'REMOVE FROM WISHLIST' : 'ADD TO WISHLIST'}
        </Button>
      </div>

      {/* Stock Status */}
      <div className="text-xs font-mono text-gray-500">
        {maxQuantity > 0 ? (
          <span className="text-green-600">✓ IN STOCK</span>
        ) : (
          <span className="text-red-600">✗ OUT OF STOCK</span>
        )}
      </div>
    </div>
  );
}